import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NGOC = '22222222-2222-2222-2222-222222222222';
const MINH = '33333333-3333-3333-3333-333333333333';
const LOC = '44444444-4444-4444-4444-444444444444';
const PEOPLE: [string, string][] = [
	[LINH, 'Linh'],
	[NGOC, 'Nguyễn Thị Ngọc'],
	[MINH, 'Đặng Minh'],
	[LOC, 'Tống Lộc']
];
const TODAY = "(now() at time zone 'Asia/Ho_Chi_Minh')::date";

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

type Row = Record<string, unknown>;

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(
		`insert into auth.users (id) values ${PEOPLE.map(([id]) => `('${id}')`).join(',')}`
	);
	for (const [id, name] of PEOPLE) {
		await asLearner(db, id);
		await db.query('insert into profiles (display_name) values ($1)', [name]);
	}
	await asLearner(db, LINH);
	await db.query('insert into follows (followee_id) values ($1)', [MINH]);
	await asOwner(db);
	await db.query(
		`update profiles set hsk = 2, lesson = 14, streak = 9, streak_until = ${TODAY},
		words_known = 120, badges = '{streak7,first}' where learner_id = $1`,
		[NGOC]
	);
	await db.query(
		`update profiles set streak = 30, streak_until = ${TODAY} - 2 where learner_id = $1`,
		[MINH]
	);
	await db.query('update profiles set hidden = true where learner_id = $1', [LOC]);
});
afterEach(() => db.close());

const view = async (as: string, handle: string) => {
	await asLearner(db, as);
	return (await db.query<Row>('select * from public.profile_view($1)', [handle])).rows;
};

describe('profile_view', () => {
	it('Given_Ngoc_Then_ExactKeysAndValues', async () => {
		const rows = await view(LINH, 'ngoc');
		expect(rows).toEqual([
			{
				status: 'visible',
				display_name: 'Nguyễn Thị Ngọc',
				photo_url: null,
				handle: 'ngoc',
				streak: 9,
				words_known: 120,
				hsk: 2,
				lesson: 14,
				badges: ['streak7', 'first'],
				following: false,
				me: false
			}
		]);
		expect(Object.keys(rows[0]).sort()).toEqual(
			[
				'badges',
				'display_name',
				'following',
				'handle',
				'hsk',
				'lesson',
				'me',
				'photo_url',
				'status',
				'streak',
				'words_known'
			].sort()
		);
	});

	it('Given_StaleMinh_Then_Streak0FollowingTrue', async () => {
		expect((await view(LINH, 'minh'))[0]).toMatchObject({
			status: 'visible',
			streak: 0,
			following: true,
			me: false
		});
	});

	it('Given_Linh_Then_MeTrue', async () => {
		expect((await view(LINH, 'linh'))[0]).toMatchObject({ status: 'visible', me: true });
	});

	it('Given_UpperHandle_Then_SameAsLower', async () => {
		expect(await view(LINH, 'NGOC')).toEqual(await view(LINH, 'ngoc'));
	});

	it('Given_HiddenLoc_Then_HiddenAllNull', async () => {
		const rows = await view(LINH, 'loc');
		expect(rows).toHaveLength(1);
		const { status, ...rest } = rows[0];
		expect(status).toBe('hidden');
		expect(Object.keys(rest)).toHaveLength(10);
		expect(Object.values(rest).every((v) => v === null)).toBe(true);
	});

	it('Given_Khongco_Then_MissingAllNull', async () => {
		const rows = await view(LINH, 'khongco');
		expect(rows).toHaveLength(1);
		const { status, ...rest } = rows[0];
		expect(status).toBe('missing');
		expect(Object.values(rest).every((v) => v === null)).toBe(true);
	});

	it('Given_LocOwnHidden_Then_VisibleMe', async () => {
		expect((await view(LOC, 'loc'))[0]).toMatchObject({
			status: 'visible',
			display_name: 'Tống Lộc',
			me: true
		});
	});

	it('Given_Anon_Then_42501', async () => {
		await db.exec('set role anon');
		expect(await code(db.query('select * from public.profile_view($1)', ['ngoc']))).toBe('42501');
	});

	it('Given_FollowViaSetFollow_Then_FollowingTrue', async () => {
		expect((await view(LINH, 'ngoc'))[0]).toMatchObject({ following: false });
		await asLearner(db, LINH);
		await db.query('select public.set_follow($1, true)', ['ngoc']);
		expect((await view(LINH, 'ngoc'))[0]).toMatchObject({ following: true });
		await asLearner(db, LINH);
		await db.query('select public.set_follow($1, false)', ['ngoc']);
		expect((await view(LINH, 'ngoc'))[0]).toMatchObject({ following: false });
	});
});
