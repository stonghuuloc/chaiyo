import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const MINH = '22222222-2222-2222-2222-222222222222';
const LAN = '33333333-3333-3333-3333-333333333333';
const HUY = '44444444-4444-4444-4444-444444444444';
const NAM = '55555555-5555-5555-5555-555555555555';
const QUAN = '66666666-6666-6666-6666-666666666666';
const PEOPLE: [string, string][] = [
	[LINH, 'Linh'],
	[MINH, 'Minh'],
	[LAN, 'Lan'],
	[HUY, 'Huy'],
	[NAM, 'Nam'],
	[QUAN, 'Quân']
];

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

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
	for (const id of [MINH, LAN, HUY, NAM])
		await db.query('insert into follows (followee_id) values ($1)', [id]);
	await asOwner(db);
	await db.query('update profiles set hidden = true where learner_id = $1', [NAM]);
});
afterEach(() => db.close());

const profile = async (id: string) => {
	await asOwner(db);
	return (
		await db.query<Record<string, unknown>>('select * from profiles where learner_id = $1', [id])
	).rows[0];
};

describe('stat columns and evidence stamps', () => {
	it('Given_Linh_When_UpdateStreak_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(await code(db.query('update profiles set streak = 99'))).toBe('42501');
	});

	it('Given_Linh_When_InsertWithStreak_Then_42501', async () => {
		await asOwner(db);
		await db.query('delete from profiles where learner_id = $1', [LINH]);
		await asLearner(db, LINH);
		expect(
			await code(db.query("insert into profiles (display_name, streak) values ('Linh', 99)"))
		).toBe('42501');
	});

	it('Given_Linh_When_UpsertNamePhotoHidden_Then_Saved', async () => {
		await asLearner(db, LINH);
		await db.query(
			`insert into profiles (learner_id, display_name, photo_url, hidden) values ($1, 'Mai', null, true)
			on conflict (learner_id) do update set learner_id = excluded.learner_id,
			display_name = excluded.display_name, photo_url = excluded.photo_url, hidden = excluded.hidden`,
			[LINH]
		);
		expect(await profile(LINH)).toMatchObject({ display_name: 'Mai', hidden: true, streak: 0 });
	});

	it('Given_Linh_When_InsertAttemptWithReceivedAt_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(
			await code(
				db.query(
					"insert into attempts (id, question_id, content_sha, ms, at, received_at) values ('a1', 'q', 's', 1, now(), now())"
				)
			)
		).toBe('42501');
	});

	it('Given_Linh_When_InsertSaveWithReceivedAt_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(
			await code(
				db.query(
					"insert into lexicon_saves (word, saved_at, received_at) values ('你', now(), now())"
				)
			)
		).toBe('42501');
	});

	it('Given_Linh_When_PushColsOnConflictDoNothing_Then_Saved', async () => {
		await asLearner(db, LINH);
		await db.query(
			`insert into attempts (learner_id, id, at, question_id, content_sha, word, skill, correct, ms, answer, step, tone)
			values ($1, 'a1', now(), 'q', 's', '你', 'the', true, 1, null, null, null)
			on conflict (learner_id, id) do nothing`,
			[LINH]
		);
		await db.query(
			`insert into lexicon_saves (learner_id, word, saved_at) values ($1, '你', now())
			on conflict (learner_id, word) do nothing`,
			[LINH]
		);
		const r = await db.query<{ n: number }>(
			'select (select count(*) from attempts where received_at is not null)::int + (select count(*) from lexicon_saves where received_at is not null)::int as n'
		);
		expect(r.rows[0].n).toBe(2);
	});
});

const TZ = 'Asia/Ho_Chi_Minh';
const TODAY = `(now() at time zone '${TZ}')::date`;
const MONDAY = `date_trunc('week', ${TODAY})::date`;
const localNoon = (day: string) => `((${day}) + time '12:00') at time zone '${TZ}'`;

const content = async () => {
	await asOwner(db);
	await db.exec(`
		insert into lessons (id, kind, level, "order", title, title_hanzi, sections) values
			('fb-l1', 'lesson', 1, 901, 'a', 'a', '{}'), ('fb-l2', 'lesson', 1, 902, 'b', 'b', '{}'),
			('fb-l3', 'lesson', 3, 903, 'c', 'c', '{}');
		insert into questions (id, lesson_id, role, body) values
			('fb-q1', 'fb-l1', 'drill', '{}'), ('fb-q2', 'fb-l2', 'drill', '{}'), ('fb-q3', 'fb-l3', 'drill', '{}');
		insert into words (id, hanzi, pinyin, spoken, hanviet, level, data)
			select w, w, 'x', 'x', 'x', 1, '{}' from unnest(array['我', '是', '他', '你', '好', '她']) w
			on conflict do nothing;
		insert into settings (learner_id, tz) values ('${LINH}', '${TZ}');
	`);
};

let seq = 0;
const attempt = async (word: string, at: string, received = at, question = 'fb-q0') => {
	await asOwner(db);
	await db.query(
		`insert into attempts (learner_id, id, question_id, content_sha, skill, word, ms, at, received_at)
		values ($1, $2, $3, 's', 'the', $4, 1, ${at}, ${received})`,
		[LINH, `fb-${seq++}`, question, word]
	);
};

const caps = async () => {
	await content();
	const d1 = localNoon(`${MONDAY} - 4`);
	const d2 = localNoon(`${MONDAY} - 3`);
	await attempt('我', d1);
	await attempt('他', d1);
	await attempt('是', d2);
	await attempt('你', 'now()');
	await attempt('好', 'now()');
	await attempt('zz', 'now()');
	await attempt('我', "now() - interval '10 days'", 'now()');
	await asOwner(db);
	await db.query(
		"insert into lexicon_saves (learner_id, word, saved_at) values ($1, '她', now())",
		[LINH]
	);
};

type Stats = [number, string, number, number, number, number, string[]];
const publish = async (s: Stats, as = LINH) => {
	await asLearner(db, as);
	const r = await db.query<{ ok: boolean }>(
		`select public.publish_stats($1, (${TODAY} + $2::int), $3, $4, $5, $6, $7) as ok`,
		[s[0], Number(s[1]), s[2], s[3], s[4], s[5], s[6]]
	);
	return r.rows[0].ok;
};
const stored = async (id = LINH) => {
	await asOwner(db);
	return (
		await db.query<Record<string, unknown>>(
			`select streak, words_week, words_known, hsk, lesson, badges,
			(streak_until - ${TODAY})::int as until, (week_of = ${MONDAY}) as monday, week_of
			from profiles where learner_id = $1`,
			[id]
		)
	).rows[0];
};

describe('publish_stats', () => {
	const honest: Stats = [2, '1', 1, 4, 1, 0, ['first']];

	it.each([
		['NegativeStreak', [-1, '1', 0, 0, 1, 0, []]],
		['Hsk6', [0, '1', 0, 0, 6, 0, []]],
		['FakeBadge', [0, '1', 0, 0, 1, 0, ['fake']]],
		['NegativeWords', [0, '1', -1, 0, 1, 0, []]]
	] as [string, Stats][])('Given_%s_When_Publish_Then_22023', async (_, s) => {
		expect(await code(publish(s))).toBe('22023');
		expect(await stored()).toMatchObject({ streak: 0, until: null, week_of: null });
	});

	it('Given_NullStreak_When_Publish_Then_22023', async () => {
		await asLearner(db, LINH);
		expect(
			await code(db.query(`select public.publish_stats(null, ${TODAY}, 0, 0, 1, 0, '{}'::text[])`))
		).toBe('22023');
	});

	it('Given_EveryBadgeId_When_Publish_Then_Accepted', async () => {
		const { BADGES } = await import('#lib/study/badges.js');
		expect(await publish([0, '0', 0, 0, 1, 0, BADGES.map(([id]) => id)])).toBe(true);
	});

	it('Given_NoProfileRow_When_Publish_Then_False', async () => {
		await asOwner(db);
		await db.query('delete from profiles where learner_id = $1', [LINH]);
		expect(await publish(honest)).toBe(false);
	});

	it('Given_3Days5Words1Saved_When_PublishInflated_Then_Clamped', async () => {
		await caps();
		expect(await publish([10, '1', 9, 50, 1, 0, []])).toBe(true);
		expect(await stored()).toMatchObject({ streak: 3, words_known: 6, words_week: 2 });
	});

	it('Given_Backdated10Days_When_Publish_Then_DayNotCounted', async () => {
		await caps();
		await attempt('他', "now() - interval '10 days'", "now() - interval '10 days'");
		await publish([10, '1', 9, 50, 1, 0, []]);
		expect(await stored()).toMatchObject({ streak: 4 });
	});

	it('Given_JunkWordZz_When_Publish_Then_NotKnown', async () => {
		await content();
		await attempt('zz', 'now()');
		await publish([1, '1', 5, 5, 1, 0, []]);
		expect(await stored()).toMatchObject({ streak: 1, words_known: 0, words_week: 0 });
	});

	it('Given_2LessonsLevel1_When_PublishHsk3Lesson136_Then_Hsk1Lesson3', async () => {
		await content();
		await attempt('你', 'now()', 'now()', 'fb-q1');
		await attempt('好', 'now()', 'now()', 'fb-q2');
		await publish([1, '1', 0, 0, 3, 136, []]);
		expect(await stored()).toMatchObject({ hsk: 1, lesson: 3 });
	});

	it('Given_LevelThreeLessonAttempted_When_PublishHsk3_Then_Hsk3', async () => {
		await content();
		await attempt('你', 'now()', 'now()', 'fb-q3');
		await publish([1, '1', 0, 0, 3, 2, []]);
		expect(await stored()).toMatchObject({ hsk: 3, lesson: 2 });
	});

	it('Given_NoAttempts_When_Publish_Then_Hsk1Lesson0', async () => {
		await publish([0, '0', 0, 0, 4, 12, []]);
		expect(await stored()).toMatchObject({ streak: 0, hsk: 1, lesson: 0 });
	});

	it('Given_HonestValues_When_Publish_Then_StoredAsSent', async () => {
		await caps();
		await attempt('你', 'now()', 'now()', 'fb-q1');
		await publish(honest);
		expect(await stored()).toMatchObject({
			streak: 2,
			until: 1,
			words_week: 1,
			words_known: 4,
			hsk: 1,
			lesson: 0,
			badges: ['first']
		});
	});

	it('Given_UntilFarAhead_When_Publish_Then_TodayPlus3', async () => {
		await publish([0, '30', 0, 0, 1, 0, []]);
		expect(await stored()).toMatchObject({ until: 3 });
	});

	it('Given_Publish_When_Read_Then_WeekOfIsLocalMonday', async () => {
		await content();
		await publish([0, '0', 0, 0, 1, 0, []]);
		expect(await stored()).toMatchObject({ monday: true });
	});

	it('Given_Publish_Then_OtherRowsUntouched', async () => {
		await caps();
		await publish([10, '1', 9, 50, 1, 0, []]);
		expect(await stored(MINH)).toMatchObject({ streak: 0, words_known: 0, until: null });
	});

	it('Given_Anon_When_Publish_Then_42501', async () => {
		await asOwner(db);
		await db.exec('set role anon');
		expect(
			await code(db.query(`select public.publish_stats(0, ${TODAY}, 0, 0, 1, 0, '{}'::text[])`))
		).toBe('42501');
	});
});

describe('friends_board', () => {
	type Row = { handle: string; streak: number; words_week: number; lesson: number; me: boolean };
	const seedStats = async () => {
		await asOwner(db);
		for (const [id, streak, week] of [
			[LINH, 12, 9],
			[MINH, 30, 14],
			[LAN, 4, 25],
			[HUY, 9, 17],
			[NAM, 50, 50],
			[QUAN, 40, 40]
		] as [string, number, number][])
			await db.query(
				`update profiles set streak = $2, words_week = $3, lesson = 7,
				streak_until = ${TODAY} + 1, week_of = ${MONDAY} where learner_id = $1`,
				[id, streak, week]
			);
	};
	const board = async (as = LINH) => {
		await asLearner(db, as);
		return (
			await db.query<Row>(
				'select handle, streak, words_week, lesson, me from public.friends_board() order by handle'
			)
		).rows;
	};

	it('Given_LinhFollows4_When_Board_Then_LinhMinhLanHuy', async () => {
		await seedStats();
		expect(await board()).toEqual([
			{ handle: 'huy', streak: 9, words_week: 17, lesson: 7, me: false },
			{ handle: 'lan', streak: 4, words_week: 25, lesson: 7, me: false },
			{ handle: 'linh', streak: 12, words_week: 9, lesson: 7, me: true },
			{ handle: 'minh', streak: 30, words_week: 14, lesson: 7, me: false }
		]);
	});

	it('Given_LinhHidden_When_Board_Then_OwnRowStays', async () => {
		await seedStats();
		await db.query('update profiles set hidden = true where learner_id = $1', [LINH]);
		expect((await board()).filter((r) => r.me).map((r) => r.handle)).toEqual(['linh']);
	});

	it('Given_StaleStreakUntil_When_Board_Then_Streak0', async () => {
		await seedStats();
		await db.query(`update profiles set streak_until = ${TODAY} - 1 where learner_id = $1`, [MINH]);
		expect((await board()).find((r) => r.handle === 'minh')).toMatchObject({
			streak: 0,
			words_week: 14
		});
	});

	it('Given_NeverPublished_When_Board_Then_Zeros', async () => {
		await seedStats();
		await db.query(
			'update profiles set streak_until = null, week_of = null where learner_id = $1',
			[HUY]
		);
		expect((await board()).find((r) => r.handle === 'huy')).toMatchObject({
			streak: 0,
			words_week: 0
		});
	});

	it('Given_LastWeekWeekOf_When_Board_Then_Words0', async () => {
		await seedStats();
		await db.query(`update profiles set week_of = ${MONDAY} - 7 where learner_id = $1`, [LAN]);
		expect((await board()).find((r) => r.handle === 'lan')).toMatchObject({
			streak: 4,
			words_week: 0
		});
	});

	it('Given_NoFollows_When_Board_Then_OnlyMe', async () => {
		await seedStats();
		expect(await board(QUAN)).toEqual([
			{ handle: 'quan', streak: 40, words_week: 40, lesson: 7, me: true }
		]);
	});

	it('Given_Anon_When_Board_Then_42501', async () => {
		await asOwner(db);
		await db.exec('set role anon');
		expect(await code(db.query('select * from public.friends_board()'))).toBe('42501');
	});
});
