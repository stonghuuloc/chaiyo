import type { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LOC = '11111111-1111-1111-1111-111111111111';
const LAN = '22222222-2222-2222-2222-222222222222';
const MINH = '33333333-3333-3333-3333-333333333333';
const KHOA = '44444444-4444-4444-4444-444444444444';
const HOA = '55555555-5555-5555-5555-555555555555';
const TUAN = '77777777-7777-7777-7777-777777777777';
const SEEDED = [LOC, LAN, MINH, KHOA, HOA, TUAN];
const SEND_IDS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `00000000-0000-4000-8000-00000000000${n}`);
const [S1, S2, S3, S4, S5, S6, S7, S8] = SEND_IDS;

const TZ = 'Asia/Ho_Chi_Minh';
const T = `(now() at time zone '${TZ}')::date`;
const ago = (n: number) => `(${T} - ${n})`;
const sentAt = (day: string) => `((${day}) + time '20:00') at time zone '${TZ}'`;

let db: PGlite;
let seq = 0;

const send = async (id: string, learner: string, day: string, channel: string, opened: boolean) => {
	await asOwner(db);
	await db.query(
		`insert into notify_sends (id, learner_id, day, channel, sent_at, opened_at)
		 values ($1, $2, ${day}, $3, ${sentAt(day)}, ${opened ? `${sentAt(day)} + interval '5 minutes'` : 'null'})`,
		[id, learner, channel]
	);
};

const attempt = async (learner: string, at: string) => {
	await asOwner(db);
	await db.query(
		`insert into attempts (learner_id, id, question_id, content_sha, correct, ms, step, at)
		 values ($1, $2, 'q', 'sha', true, 0, $3, ${at})`,
		[learner, `a${++seq}`, JSON.stringify({ kind: 'practice', run: 'p', of: 1 })]
	);
};

const reminders = async (days: number | null) => {
	await asLearner(db, LOC);
	const { rows } = await db.query<{ v: unknown }>('select public.admin_reminders($1) as v', [days]);
	return rows[0].v;
};

const asAnon = () => db.exec('set role anon');

beforeEach(async () => {
	seq = 0;
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ${SEEDED.map((u) => `('${u}')`).join(', ')}`);
	await db.query('insert into admins (user_id) values ($1)', [LOC]);
});
afterEach(() => db.close());

describe('notify_sends access', () => {
	const verbs = [
		'select * from notify_sends',
		`insert into notify_sends (id, learner_id, day, channel) values ('${S1}', '${LAN}', current_date, 'email')`,
		"update notify_sends set opened_at = now() where channel = 'email'",
		'delete from notify_sends'
	];

	it.each(verbs)('Given_Learner_When_%s_Then_42501', async (sql) => {
		await asLearner(db, LAN);
		await expect(db.query(sql)).rejects.toMatchObject({ code: '42501' });
	});

	it.each(verbs)('Given_Anon_When_%s_Then_42501', async (sql) => {
		await asAnon();
		await expect(db.query(sql)).rejects.toMatchObject({ code: '42501' });
	});

	it('Given_Admin_When_Select_Then_42501', async () => {
		await asLearner(db, LOC);
		await expect(db.query('select * from notify_sends')).rejects.toMatchObject({ code: '42501' });
	});

	it('Given_UnknownChannel_When_Insert_Then_CheckViolation', async () => {
		await asOwner(db);
		await expect(
			db.query(
				`insert into notify_sends (id, learner_id, day, channel) values ('${S1}', '${LAN}', current_date, 'sms')`
			)
		).rejects.toMatchObject({ code: '23514' });
	});

	it('Given_SameLearnerDayChannel_When_InsertTwice_Then_Unique', async () => {
		await send(S1, LAN, T, 'email', false);
		await expect(send(S2, LAN, T, 'email', false)).rejects.toMatchObject({ code: '23505' });
	});

	it('Given_Migration_Then_SentAtIndexExists', async () => {
		await asOwner(db);
		const { rows } = await db.query(
			`select 1 from pg_indexes where indexname = 'notify_sends_sent_at'`
		);
		expect(rows).toHaveLength(1);
	});
});

describe('admin_reminders access', () => {
	it('Given_Learner_When_AdminReminders_Then_42501', async () => {
		await asLearner(db, LAN);
		await expect(db.query('select public.admin_reminders(7)')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it('Given_Anon_When_AdminReminders_Then_42501', async () => {
		await asAnon();
		await expect(db.query('select public.admin_reminders(7)')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it.each([14, 0, null])('Given_Admin_When_Days%s_Then_22023', async (days) => {
		await asLearner(db, LOC);
		await expect(db.query('select public.admin_reminders($1)', [days])).rejects.toMatchObject({
			code: '22023'
		});
	});
});

describe('no sends', () => {
	it.each([7, 30])('Given_NoSends_When_Days%s_Then_ThreeZeroRows', async (days) => {
		expect(await reminders(days)).toEqual([
			{ channel: 'email', sent: 0, opened: 0, studied: 0 },
			{ channel: 'telegram', sent: 0, opened: 0, studied: 0 },
			{ channel: 'push', sent: 0, opened: 0, studied: 0 }
		]);
	});
});

describe('reference', () => {
	beforeEach(async () => {
		await send(S1, LAN, T, 'email', true);
		await send(S2, LAN, T, 'push', false);
		await attempt(LAN, `${sentAt(T)} + interval '30 minutes'`);
		await send(S3, MINH, ago(5), 'email', true);
		await send(S4, MINH, ago(6), 'telegram', false);
		await attempt(MINH, `${sentAt(ago(5))} - interval '1 hour'`);
		await send(S5, KHOA, ago(2), 'telegram', true);
		await attempt(KHOA, `${sentAt(ago(2))} + interval '25 hours'`);
		await send(S6, KHOA, `(${T} + 1)`, 'push', false);
		await send(S7, HOA, ago(10), 'email', true);
		await attempt(HOA, `${sentAt(ago(10))} + interval '1 hour'`);
		await send(S8, TUAN, ago(40), 'push', true);
		await attempt(TUAN, `${sentAt(ago(40))} + interval '1 hour'`);
	});

	it('Given_Admin_When_Days7_Then_EmailTelegramPush', async () => {
		expect(await reminders(7)).toEqual([
			{ channel: 'email', sent: 2, opened: 2, studied: 1 },
			{ channel: 'telegram', sent: 2, opened: 1, studied: 1 },
			{ channel: 'push', sent: 1, opened: 0, studied: 1 }
		]);
	});

	it('Given_Admin_When_Days30_Then_EmailTelegramPush', async () => {
		expect(await reminders(30)).toEqual([
			{ channel: 'email', sent: 3, opened: 3, studied: 2 },
			{ channel: 'telegram', sent: 2, opened: 1, studied: 1 },
			{ channel: 'push', sent: 1, opened: 0, studied: 1 }
		]);
	});

	it('Given_Payload_Then_NoUuid', async () => {
		const text = JSON.stringify(await reminders(30));
		for (const id of [...SEEDED, ...SEND_IDS]) expect(text).not.toContain(id);
	});

	const opened = async (id: string) => {
		await asOwner(db);
		const { rows } = await db.query<{ opened_at: Date | null }>(
			'select opened_at from notify_sends where id = $1',
			[id]
		);
		return rows[0].opened_at;
	};

	it('Given_OwnRow_When_MarkOpenedTwice_Then_FirstStampKept', async () => {
		await asOwner(db);
		await db.query('update notify_sends set opened_at = null where id = $1', [S2]);
		await asLearner(db, LAN);
		await db.query('select public.mark_reminder_opened($1)', [S2]);
		const first = await opened(S2);
		expect(first).not.toBeNull();
		await asOwner(db);
		await db.query('select pg_sleep(0.05)');
		await asLearner(db, LAN);
		await db.query('select public.mark_reminder_opened($1)', [S2]);
		expect((await opened(S2))?.getTime()).toBe(first?.getTime());
	});

	it('Given_OtherLearnerRow_Then_Unchanged', async () => {
		await asLearner(db, MINH);
		await db.query('select public.mark_reminder_opened($1)', [S2]);
		expect(await opened(S2)).toBeNull();
	});

	it('Given_UnknownId_Then_NoError', async () => {
		await asLearner(db, LAN);
		await expect(
			db.query('select public.mark_reminder_opened($1)', ['00000000-0000-4000-8000-0000000000ff'])
		).resolves.toBeDefined();
	});

	it('Given_Anon_When_MarkOpened_Then_42501', async () => {
		await asAnon();
		await expect(db.query('select public.mark_reminder_opened($1)', [S2])).rejects.toMatchObject({
			code: '42501'
		});
	});
});

describe('rpc sources', () => {
	it('Given_RpcSources_Then_OnlyAttemptsNotifySendsIsAdmin', async () => {
		await asOwner(db);
		const { rows } = await db.query<{ proname: string; prosrc: string }>(
			`select proname, prosrc from pg_proc where proname in ('admin_reminders', 'admin_usage')`
		);
		expect(rows.map((r) => r.proname).sort()).toEqual(['admin_reminders', 'admin_usage']);
		const used = new Set(
			rows.flatMap((r) => [...r.prosrc.matchAll(/public\.(\w+)/g)].map((m) => m[1]))
		);
		expect([...used].filter((n) => !['notify_sends', 'attempts', 'is_admin'].includes(n))).toEqual(
			[]
		);
		expect(used.has('notify_sends')).toBe(true);
	});
});
