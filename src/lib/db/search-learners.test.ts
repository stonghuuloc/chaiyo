import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NGOC = '22222222-2222-2222-2222-222222222222';
const LAN = '33333333-3333-3333-3333-333333333333';
const NAM = '44444444-4444-4444-4444-444444444444';
const MINH = '55555555-5555-5555-5555-555555555555';
const PEOPLE: [string, string][] = [
	[LINH, 'Lê Ngọc Linh'],
	[NGOC, 'Nguyễn Thị Ngọc'],
	[LAN, 'Ngọc Lan'],
	[NAM, 'Trần Ngọc Nam'],
	[MINH, 'Đặng Minh']
];

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

type Found = {
	handle: string;
	display_name: string;
	photo_url: string | null;
	hsk: number;
	lesson: number;
	following: boolean;
};

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
	await db.query('update profiles set hidden = true where learner_id = $1', [NAM]);
	await db.query('update profiles set hsk = 2, lesson = 14 where learner_id = $1', [NGOC]);
	await db.query('update profiles set hsk = 1, lesson = 3 where learner_id = $1', [LAN]);
});
afterEach(() => db.close());

const search = async (q: string | null, as = LINH) => {
	await asLearner(db, as);
	return (await db.query<Found>('select * from search_learners($1)', [q])).rows;
};
const names = (rows: Found[]) => rows.map((r) => r.display_name);
const follow = async (handle: string, on: boolean, as = LINH) => {
	await asLearner(db, as);
	return (await db.query<{ set_follow: boolean }>('select set_follow($1, $2)', [handle, on]))
		.rows[0].set_follow;
};
const followRows = async () => {
	await asOwner(db);
	return (
		await db.query<{ followee_id: string }>(
			'select followee_id from follows where follower_id = $1 order by followee_id',
			[LINH]
		)
	).rows.map((r) => r.followee_id);
};

describe('search_learners', () => {
	it('Given_Ngoc_When_Search_Then_NgocLanThenNguyenThiNgoc', async () => {
		const rows = await search('ngoc');
		expect(names(rows)).toEqual(['Ngọc Lan', 'Nguyễn Thị Ngọc']);
		expect(rows[1]).toEqual({
			handle: 'ngoc',
			display_name: 'Nguyễn Thị Ngọc',
			photo_url: null,
			hsk: 2,
			lesson: 14,
			following: false
		});
		expect(rows[0]).toMatchObject({ handle: 'lan', hsk: 1, lesson: 3 });
	});

	it('Given_AccentCaseSpaceVariants_Then_SameTwoRows', async () => {
		for (const q of ['NGỌC', 'ngọc', '  ngoc ', 'NgOc']) {
			expect(names(await search(q))).toEqual(['Ngọc Lan', 'Nguyễn Thị Ngọc']);
		}
	});

	it('Given_Dang_Then_DangMinh', async () => {
		expect(names(await search('dang'))).toEqual(['Đặng Minh']);
		expect(names(await search('đặng'))).toEqual(['Đặng Minh']);
	});

	it('Given_HiddenNam_Then_NeverListed', async () => {
		expect(names(await search('nam'))).toEqual([]);
		expect(names(await search('ngoc'))).not.toContain('Trần Ngọc Nam');
	});

	it('Given_NamUnhides_Then_ThreeRows', async () => {
		await asLearner(db, NAM);
		await db.query('update profiles set hidden = false');
		expect(names(await search('ngoc'))).toEqual(['Ngọc Lan', 'Nguyễn Thị Ngọc', 'Trần Ngọc Nam']);
		await asLearner(db, NAM);
		await db.query('update profiles set hidden = true');
		expect(names(await search('ngoc'))).toEqual(['Ngọc Lan', 'Nguyễn Thị Ngọc']);
	});

	it('Given_MyOwnName_Then_NotListed', async () => {
		expect(names(await search('linh'))).toEqual([]);
		expect(names(await search('le ngoc'))).toEqual([]);
	});

	it('Given_PercentUnderscoreBlankOneChar_Then_NoRows', async () => {
		for (const q of ['%', '_', '', ' ', 'n', null]) expect(await search(q)).toEqual([]);
	});

	it('Given_NPercentOrDoublePercent_Then_NoRows', async () => {
		for (const q of ['n%', '%%', 'ng_c']) expect(await search(q)).toEqual([]);
	});

	it('Given_NoMatch_Then_NoRows', async () => {
		expect(await search('zzz')).toEqual([]);
	});

	it('Given_21Matches_Then_20Rows', async () => {
		await asOwner(db);
		const ids = Array.from(
			{ length: 21 },
			(_, i) => `a0000000-0000-0000-0000-${String(i).padStart(12, '0')}`
		);
		await db.exec(`insert into auth.users (id) values ${ids.map((id) => `('${id}')`).join(',')}`);
		for (const [i, id] of ids.entries()) {
			await db.query('insert into profiles (learner_id, display_name) values ($1, $2)', [
				id,
				`Bạn Kiwi ${String(i).padStart(2, '0')}`
			]);
		}
		const rows = await search('kiwi');
		expect(rows).toHaveLength(20);
		expect(rows[0].display_name).toBe('Bạn Kiwi 00');
		expect(rows[19].display_name).toBe('Bạn Kiwi 19');
	});

	it('Given_FollowedMinh_Then_FollowingTrue', async () => {
		const rows = await search('minh');
		expect(rows).toHaveLength(1);
		expect(rows[0].following).toBe(true);
	});

	it('Given_Anon_When_Search_Then_42501', async () => {
		await db.exec('set role anon');
		expect(await code(db.query("select * from search_learners('ngoc')"))).toBe('42501');
	});
});

describe('set_follow', () => {
	it('Given_Ngoc_When_Follow_Then_RowAndTrue', async () => {
		expect(await follow('ngoc', true)).toBe(true);
		expect(await followRows()).toEqual([NGOC, MINH].sort());
	});

	it('Given_Followed_When_FollowAgain_Then_OneRow', async () => {
		expect(await follow('ngoc', true)).toBe(true);
		expect(await follow('ngoc', true)).toBe(true);
		expect((await followRows()).filter((id) => id === NGOC)).toHaveLength(1);
	});

	it('Given_HiddenMissingSelf_When_Follow_Then_FalseNoRow', async () => {
		for (const h of ['nam', 'khongco', 'linh']) expect(await follow(h, true)).toBe(false);
		expect(await followRows()).toEqual([MINH]);
	});

	it('Given_Followed_When_Unfollow_Then_NoRowTrue', async () => {
		await follow('ngoc', true);
		expect(await follow('ngoc', false)).toBe(true);
		expect(await followRows()).toEqual([MINH]);
	});

	it('Given_NotFollowed_When_Unfollow_Then_True', async () => {
		expect(await follow('ngoc', false)).toBe(true);
		expect(await follow('ngoc', false)).toBe(true);
		expect(await follow('khongco', false)).toBe(true);
		expect(await followRows()).toEqual([MINH]);
	});

	it('Given_UpperHandle_Then_SameAsLower', async () => {
		expect(await follow('NGOC', true)).toBe(true);
		expect(await followRows()).toContain(NGOC);
		expect(await follow('NGOC', false)).toBe(true);
		expect(await followRows()).not.toContain(NGOC);
	});

	it('Given_Anon_When_SetFollow_Then_42501', async () => {
		await db.exec('set role anon');
		expect(await code(db.query("select set_follow('ngoc', true)"))).toBe('42501');
	});

	it('Given_Follow_Then_FriendsBoardListsHer', async () => {
		await follow('ngoc', true);
		await asLearner(db, LINH);
		const rows = (await db.query<{ handle: string }>('select handle from friends_board()')).rows;
		expect(rows.map((r) => r.handle)).toContain('ngoc');
	});

	it('Given_Unfollow_Then_FriendsBoardDropsHer', async () => {
		await follow('ngoc', true);
		await follow('ngoc', false);
		await asLearner(db, LINH);
		const rows = (await db.query<{ handle: string }>('select handle from friends_board()')).rows;
		expect(rows.map((r) => r.handle)).not.toContain('ngoc');
	});

	it('Given_Follow_When_NewSession_Then_SearchFollowingTrue', async () => {
		await follow('ngoc', true);
		await asOwner(db);
		const rows = await search('ngoc');
		expect(rows.find((r) => r.handle === 'ngoc')?.following).toBe(true);
		expect(rows.find((r) => r.handle === 'lan')?.following).toBe(false);
	});
});
