import type { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LOC = '11111111-1111-1111-1111-111111111111';
const LAN = '22222222-2222-2222-2222-222222222222';
const MINH = '33333333-3333-3333-3333-333333333333';
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const NOW = Date.parse('2026-11-24T10:00:00Z');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const SEED: [
	number,
	string,
	string | null,
	string | null,
	string | null,
	string | null,
	string,
	number
][] = [
	[1, 'pinyin', '你好', 'h1-01', 'w03', 'Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.', LAN, 12 * MIN],
	[2, 'audio', '谢谢', null, null, null, MINH, HOUR],
	[3, 'meaning', '您', 'h1-01', 'w05', 'Nghĩa hơi dài.', LAN, 3 * HOUR],
	[4, 'other', null, 'h1-01', 'd02', 'Câu thứ 3 bị lặp.', LAN, 5 * HOUR],
	[5, 'pinyin', '没关系', null, null, null, MINH, 26 * HOUR],
	[6, 'audio', '不客气', null, null, 'Audio bị cụt chữ cuối.', LAN, 30 * HOUR],
	[7, 'meaning', '你们', null, null, null, MINH, 2 * DAY],
	[8, 'hanviet', null, 'h1-01', 'q4', 'Hai đáp án giống hệt nhau.', LAN, 3 * DAY],
	[9, 'meaning', '再见', null, null, null, MINH, 4 * DAY],
	[10, 'audio', '对不起', null, null, 'Giọng nhỏ hơn.', LAN, 5 * DAY]
];

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LOC}'), ('${LAN}'), ('${MINH}')`);
	await db.query('insert into profiles (learner_id, display_name) values ($1, $2)', [LAN, 'Lan']);
	await db.query('insert into admins (user_id) values ($1)', [LOC]);
	for (const [n, category, word, lesson, step, note, by, ago] of SEED)
		await db.query(
			`insert into error_reports (id, learner_id, lesson_id, step_id, word_id, content_sha, category, note, created_at)
			 values ($1, $2, $3, $4, $5, 'sha', $6, $7, $8)`,
			[id(n), by, lesson, step, word, category, note, new Date(NOW - ago).toISOString()]
		);
});
afterEach(() => db.close());

const asAnon = () => db.exec('set role anon');
const statusOf = async (n: number) => {
	await asOwner(db);
	return (
		await db.query<{ status: string; resolved_at: Date | null }>(
			'select status, resolved_at from error_reports where id = $1',
			[id(n)]
		)
	).rows[0];
};

describe('admin reports', () => {
	it('Given_AdminRow_Then_IsAdminTrue', async () => {
		await asLearner(db, LOC);
		const { rows } = await db.query<{ v: boolean }>('select public.is_admin() as v');
		expect(rows[0].v).toBe(true);
	});

	it('Given_Learner_Then_IsAdminFalse', async () => {
		await asLearner(db, LAN);
		const { rows } = await db.query<{ v: boolean }>('select public.is_admin() as v');
		expect(rows[0].v).toBe(false);
	});

	it('Given_Anon_Then_IsAdmin42501', async () => {
		await asAnon();
		await expect(db.query('select public.is_admin()')).rejects.toMatchObject({ code: '42501' });
	});

	it('Given_Learner_Then_AdminsClosedEveryVerb', async () => {
		for (const who of [LAN, MINH]) {
			await asLearner(db, who);
			await expect(db.query('select * from admins')).rejects.toMatchObject({ code: '42501' });
			await expect(
				db.query('insert into admins (user_id) values ($1)', [who])
			).rejects.toMatchObject({ code: '42501' });
			await expect(db.query('update admins set user_id = user_id')).rejects.toMatchObject({
				code: '42501'
			});
			await expect(db.query('delete from admins')).rejects.toMatchObject({ code: '42501' });
		}
		await asOwner(db);
		const { rows } = await db.query<{ user_id: string }>('select user_id from admins');
		expect(rows).toEqual([{ user_id: LOC }]);
	});

	it('Given_Learner_When_SelectReports_Then_ZeroRows', async () => {
		await asLearner(db, LAN);
		const { rows } = await db.query('select * from error_reports');
		expect(rows).toEqual([]);
	});

	it('Given_Admin_When_SelectReports_Then_Ten', async () => {
		await asLearner(db, LOC);
		const { rows } = await db.query('select * from error_reports');
		expect(rows).toHaveLength(10);
	});

	it('Given_Learner_When_List_Then_42501', async () => {
		await asLearner(db, LAN);
		await expect(db.query('select * from public.list_error_reports()')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it('Given_Admin_When_List_Then_TenNewestFirstReporterOrNull', async () => {
		await db.query("insert into profiles (learner_id, display_name) values ($1, '')", [LOC]);
		await db.query(
			`insert into error_reports (id, learner_id, content_sha, category, created_at)
			 values ($1, $2, 'sha', 'other', $3)`,
			[id(11), LOC, new Date(NOW - 6 * DAY).toISOString()]
		);
		await asLearner(db, LOC);

		const { rows } = await db.query<Record<string, unknown>>(
			'select * from public.list_error_reports()'
		);

		expect(rows.map((r) => r.id)).toEqual([...SEED.map(([n]) => id(n)), id(11)]);
		expect(Object.keys(rows[0])).toEqual([
			'id',
			'lesson_id',
			'step_id',
			'word_id',
			'category',
			'note',
			'status',
			'created_at',
			'resolved_at',
			'reporter'
		]);
		expect(rows.map((r) => r.reporter)).toEqual([
			...SEED.map(([, , , , , , by]) => (by === LAN ? 'Lan' : null)),
			null
		]);
		expect(rows[0]).toMatchObject({
			lesson_id: 'h1-01',
			step_id: 'w03',
			word_id: '你好',
			category: 'pinyin',
			note: 'Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.',
			status: 'new',
			resolved_at: null
		});
		expect((rows[0].created_at as Date).toISOString()).toBe(new Date(NOW - 12 * MIN).toISOString());
	});

	it('Given_Learner_When_SetStatus_Then_42501AndRowUnchanged', async () => {
		await asLearner(db, LAN);
		await expect(
			db.query("select public.set_error_report_status($1, 'resolved')", [id(1)])
		).rejects.toMatchObject({ code: '42501' });
		await expect(db.query("update error_reports set status = 'resolved'")).rejects.toMatchObject({
			code: '42501'
		});
		expect(await statusOf(1)).toEqual({ status: 'new', resolved_at: null });
	});

	it('Given_Admin_When_ResolveThenReopen_Then_StampsAndClears', async () => {
		await asLearner(db, LOC);
		await db.query("select public.set_error_report_status($1, 'resolved')", [id(1)]);
		const resolved = await statusOf(1);
		expect(resolved.status).toBe('resolved');
		expect(resolved.resolved_at).toBeInstanceOf(Date);
		expect(await statusOf(2)).toEqual({ status: 'new', resolved_at: null });

		await asLearner(db, LOC);
		await expect(db.query("update error_reports set status = 'new'")).rejects.toMatchObject({
			code: '42501'
		});
		await db.query("select public.set_error_report_status($1, 'new')", [id(1)]);
		expect(await statusOf(1)).toEqual({ status: 'new', resolved_at: null });
	});

	it('Given_BadStatus_Then_22023', async () => {
		await asLearner(db, LOC);
		await expect(
			db.query("select public.set_error_report_status($1, 'done')", [id(1)])
		).rejects.toMatchObject({ code: '22023' });
		expect(await statusOf(1)).toEqual({ status: 'new', resolved_at: null });
	});

	it('Given_UnknownId_Then_P0002', async () => {
		await asLearner(db, LOC);
		await expect(
			db.query("select public.set_error_report_status($1, 'resolved')", [id(99)])
		).rejects.toMatchObject({ code: 'P0002' });
	});

	it('Given_Anon_Then_BothRpcs42501', async () => {
		await asAnon();
		await expect(db.query('select * from public.list_error_reports()')).rejects.toMatchObject({
			code: '42501'
		});
		await expect(
			db.query("select public.set_error_report_status($1, 'resolved')", [id(1)])
		).rejects.toMatchObject({ code: '42501' });
		expect(await statusOf(1)).toEqual({ status: 'new', resolved_at: null });
	});

	it('Given_ResolvedInsert_Then_StillRejected', async () => {
		await asLearner(db, LAN);
		await expect(
			db.query(
				`insert into error_reports (id, content_sha, category, status, created_at)
				 values ($1, 'sha', 'other', 'resolved', now())`,
				[id(12)]
			)
		).rejects.toMatchObject({ code: '42501' });
		await db.query(
			`insert into error_reports (id, content_sha, category, created_at) values ($1, 'sha', 'other', now())`,
			[id(13)]
		);
		await asOwner(db);
		await expect(
			db.query(
				`insert into error_reports (id, learner_id, content_sha, category, status, created_at)
				 values ($1, $2, 'sha', 'other', 'done', now())`,
				[id(14), LAN]
			)
		).rejects.toMatchObject({ code: '23514' });
	});
});
