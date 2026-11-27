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
const VY = '66666666-6666-6666-6666-666666666666';
const TUAN = '77777777-7777-7777-7777-777777777777';
const SEEDED = [LOC, LAN, MINH, KHOA, HOA, VY, TUAN];

const TZ = 'Asia/Ho_Chi_Minh';
const TODAY = `(now() at time zone '${TZ}')::date`;
const localNoon = (day: string) => `((${day}) + time '12:00') at time zone '${TZ}'`;
const T = TODAY;
const ago = (n: number) => `${TODAY} - ${n}`;

let db: PGlite;
let seq = 0;

const insert = async (
	learner: string,
	question: string,
	correct: boolean | null,
	step: object | null,
	at: string
) => {
	await asOwner(db);
	await db.query(
		`insert into attempts (learner_id, id, question_id, content_sha, correct, ms, step, at)
		 values ($1, $2, $3, 'sha', $4, 0, $5, ${at})`,
		[learner, `a${++seq}`, question, correct, step === null ? null : JSON.stringify(step)]
	);
};

const gateRun = async (
	learner: string,
	run: string,
	day: string,
	answers: (boolean | null)[],
	extra: { question: string; correct: boolean | null }[] = []
) => {
	const step = { kind: 'gate', lesson: 'h1-01', run, of: 10 };
	for (const [i, correct] of answers.entries())
		await insert(
			learner,
			`q${i + 1}`,
			correct,
			step,
			`${localNoon(day)} + interval '${i} seconds'`
		);
	for (const [i, e] of extra.entries())
		await insert(
			learner,
			e.question,
			e.correct,
			step,
			`${localNoon(day)} + interval '${100 + i} seconds'`
		);
};

const section = (learner: string, lesson: string, name: string, day: string) =>
	insert(
		learner,
		'qs',
		true,
		{ kind: 'section', lesson, section: name, run: `s-${name}-${lesson}`, of: 6 },
		localNoon(day)
	);

const right = (n: number, of = 10): (boolean | null)[] =>
	Array.from({ length: of }, (_, i) => i < n);

const usage = async (days: number | null) => {
	await asLearner(db, LOC);
	const { rows } = await db.query<{ v: Record<string, unknown> }>(
		'select public.admin_usage($1) as v',
		[days]
	);
	return rows[0].v;
};

beforeEach(async () => {
	seq = 0;
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ${SEEDED.map((u) => `('${u}')`).join(', ')}`);
	await db.query('insert into admins (user_id) values ($1)', [LOC]);
});
afterEach(() => db.close());

const asAnon = () => db.exec('set role anon');

describe('admin_usage access', () => {
	it('Given_Learner_When_AdminUsage_Then_42501', async () => {
		await asLearner(db, LAN);
		await expect(db.query('select public.admin_usage(7)')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it('Given_Anon_When_AdminUsage_Then_42501', async () => {
		await asAnon();
		await expect(db.query('select public.admin_usage(7)')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it.each([14, 0, null])('Given_Admin_When_Days%s_Then_22023', async (days) => {
		await asLearner(db, LOC);
		await expect(db.query('select public.admin_usage($1)', [days])).rejects.toMatchObject({
			code: '22023'
		});
	});

	it('Given_Migration_Then_AttemptsAtIndexExists', async () => {
		await asOwner(db);
		const { rows } = await db.query<{ indexdef: string }>(
			`select indexdef from pg_indexes where indexname = 'attempts_at'`
		);
		expect(rows).toHaveLength(1);
		expect(rows[0].indexdef).toContain('(at)');
		expect(rows[0].indexdef).toContain('step IS NOT NULL');
	});
});

describe('reference', () => {
	beforeEach(async () => {
		await section(LAN, 'h1-01', 'warmup', T);
		await section(LAN, 'h1-01', 'words', T);
		await section(LAN, 'h1-01', 'grammar', T);
		await gateRun(LAN, 'g1', T, right(10));
		await gateRun(LAN, 'g2', T, right(8));
		await gateRun(LAN, 'g3', T, right(9));
		await gateRun(LAN, 'g4', T, right(7));
		await gateRun(
			LAN,
			'g5',
			T,
			[false, false, false, ...right(7, 7)],
			[{ question: 'q1', correct: true }]
		);
		await gateRun(LAN, 'g6', T, right(5, 5));
		await insert(
			LAN,
			'q1',
			true,
			{ kind: 'gate', lesson: 'h1-01', run: 'gx', of: 'x' },
			localNoon(T)
		);
		await section(MINH, 'h1-01', 'warmup', ago(6));
		await section(MINH, 'h1-01', 'words', ago(6));
		await gateRun(MINH, 'm1', ago(6), right(9));
		await gateRun(MINH, 'm2', ago(6), right(8));
		await gateRun(MINH, 'm3', ago(6), right(0));
		await gateRun(MINH, 'm4', ago(6), [...right(6, 6), null, null, null, null]);
		await section(KHOA, 'h1-01', 'warmup', ago(2));
		await section(HOA, 'h1-01', 'warmup', ago(7));
		await gateRun(HOA, 'h1', ago(7), right(10));
		await section(HOA, 'h1-02', 'warmup', ago(20));
		await insert(VY, 'qp', true, { kind: 'practice', run: 'p1', of: 5 }, localNoon(T));
		await insert(VY, 'qn', true, null, localNoon(T));
		await section(TUAN, 'h1-01', 'warmup', ago(40));
	});

	it.each([7, 30])('Given_Admin_When_Days%s_Then_Active_1_3_4', async (days) => {
		expect((await usage(days)).active).toEqual({ today: 1, d7: 3, d30: 4 });
	});

	it('Given_Admin_When_Days7_Then_Gates_9Runs_4Fails', async () => {
		expect((await usage(7)).gates).toEqual([{ lesson: 'h1-01', runs: 9, fails: 4 }]);
	});

	it('Given_Admin_When_Days30_Then_Gates_10Runs_4Fails', async () => {
		expect((await usage(30)).gates).toEqual([{ lesson: 'h1-01', runs: 10, fails: 4 }]);
	});

	it('Given_Admin_When_Days7_Then_Dropoff', async () => {
		expect((await usage(7)).dropoff).toEqual([
			{ lesson: 'h1-01', started: 3, sections: { warmup: 3, words: 2, grammar: 1, gate: 2 } }
		]);
	});

	it('Given_Admin_When_Days30_Then_Dropoff', async () => {
		expect((await usage(30)).dropoff).toEqual([
			{ lesson: 'h1-01', started: 4, sections: { warmup: 4, words: 2, grammar: 1, gate: 3 } },
			{ lesson: 'h1-02', started: 1, sections: { warmup: 1 } }
		]);
	});

	it('Given_Payload_Then_NoLearnerUuid', async () => {
		for (const days of [7, 30]) {
			const text = JSON.stringify(await usage(days));
			for (const u of SEEDED) expect(text).not.toContain(u);
		}
	});
});

describe('gate edges', () => {
	it('Given_8of10_Then_Pass_And_7of10_Then_Fail', async () => {
		await gateRun(LAN, 'g2', T, right(8));
		await gateRun(LAN, 'g4', T, right(7));
		expect((await usage(7)).gates).toEqual([{ lesson: 'h1-01', runs: 2, fails: 1 }]);
	});

	it('Given_AttemptsDatedInFuture_Then_NotActiveAndNoGate', async () => {
		await gateRun(LAN, 'gf', `now() + interval '30 days'`, right(8));
		const v = await usage(30);
		expect(v.active).toEqual({ today: 0, d7: 0, d30: 0 });
		expect(v.gates).toEqual([]);
	});

	it('Given_ExtraAnswerAfterClose_Then_ScoredThroughClosingAnswerOnly', async () => {
		await gateRun(LAN, 'gx', T, [...right(7), false, false, false, true]);
		expect((await usage(7)).gates).toEqual([{ lesson: 'h1-01', runs: 1, fails: 1 }]);
	});

	it('Given_RepeatAnswer_Then_FirstAnswerWins', async () => {
		await gateRun(
			LAN,
			'g5',
			T,
			[false, false, false, ...right(7, 7)],
			[{ question: 'q1', correct: true }]
		);
		expect((await usage(7)).gates).toEqual([{ lesson: 'h1-01', runs: 1, fails: 1 }]);
	});

	it('Given_OpenRunAndBadOf_Then_IgnoredNoError', async () => {
		await gateRun(LAN, 'g6', T, right(5, 5));
		await insert(
			LAN,
			'q1',
			true,
			{ kind: 'gate', lesson: 'h1-01', run: 'gx', of: 'x' },
			localNoon(T)
		);
		expect((await usage(7)).gates).toEqual([]);
	});

	it('Given_RunSpansWindowStart_Then_CountsByLatestAt', async () => {
		const span = async (run: string, early: number, late: number) => {
			const days = [
				...Array.from({ length: 3 }, () => early),
				...Array.from({ length: 7 }, () => late)
			];
			for (const [i, d] of days.entries())
				await insert(
					LAN,
					`q${i + 1}`,
					true,
					{ kind: 'gate', lesson: 'h1-01', run, of: 10 },
					`${localNoon(ago(d))} + interval '${i} seconds'`
				);
		};
		await span('span7', 7, 6);
		expect((await usage(7)).gates).toEqual([{ lesson: 'h1-01', runs: 1, fails: 0 }]);
		await asOwner(db);
		await db.exec('delete from attempts');
		await span('span30', 30, 29);
		expect((await usage(30)).gates).toEqual([{ lesson: 'h1-01', runs: 1, fails: 0 }]);
	});
});
