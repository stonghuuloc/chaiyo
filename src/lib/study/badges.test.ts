import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	rollover,
	type Attempt,
	type State,
	type StudyEvent,
	type WordSaved
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';
import { T, feed, gateRun } from '#lib/study/fixtures/runs.js';

const earned = (events: StudyEvent[]) => events.filter((e) => e.type === 'BadgeEarned');
const fresh = () => initialState({ curriculum: CURRICULUM });

const attempt = (n: number, over: Partial<Attempt>): Attempt => ({
	id: `a:b:${n}`,
	at: new Date(T.getTime() + n * 1000).toISOString(),
	questionId: `q-b-${n}`,
	contentSha: 'fixture',
	correct: true,
	ms: 1000,
	...over
});
const write = (n: number, word: string, correct: boolean) =>
	attempt(n, { correct, card: { word, skill: 'viet' } });
const mock = (level: number, mode: 'exam' | 'practice', correct: boolean) =>
	attempt(0, { correct, questionId: `mock-${level}`, step: { kind: 'mock', level, mode } });
const save = (n: number): WordSaved => ({ kind: 'saved', word: `w${n}`, at: T.toISOString() });
const saved = (from: number, to: number) => {
	let s = fresh();
	for (let n = from; n <= to; n++) s = apply(s, save(n), T).state;
	return s;
};
const prior = (day: string) => new Date(Date.parse(day) - 86_400_000).toISOString().slice(0, 10);
const streakTo = (day: string) => {
	const s = countDays(fresh(), '2026-08-01', prior(day));
	const a = practice('last', ['你'], new Date(`${day}T05:00:00Z`))[0];
	return { before: s, call: a };
};

function expectFires(
	before: State,
	input: Attempt | WordSaved,
	at: Date,
	badge: string,
	title: string
) {
	expect(before.badges[badge as keyof State['badges']]).toBeUndefined();
	const r = apply(before, input, at);
	expect(earned(r.events)).toEqual([{ type: 'BadgeEarned', badge, title }]);
	expect(r.state.badges[badge as keyof State['badges']]).toBe(at.toISOString());
}

describe('badges', () => {
	it('reaching a milestone earns its badge', () => {
		const gate = gateRun('h0-00', 'g0', 8, T);
		expectFires(
			feed(fresh(), gate.slice(0, 9)),
			gate[9],
			new Date(gate[9].at),
			'first',
			'Bước đầu tiên'
		);
		for (const [day, badge, title] of [
			['2026-08-07', 'streak7', 'Chuỗi 7 ngày'],
			['2026-08-30', 'streak30', 'Chuỗi 30 ngày'],
			['2026-11-08', 'streak100', 'Chuỗi 100 ngày']
		]) {
			const { before, call } = streakTo(day);
			expectFires(before, call, new Date(call.at), badge, title);
		}
		expectFires(saved(1, 99), save(100), T, 'words100', '100 từ');
		expectFires(saved(1, 299), save(300), T, 'words300', '300 từ');

		let w = fresh();
		w = feed(
			w,
			Array.from({ length: 24 }, (_, i) => write(i, '你好', true))
		);
		w = feed(w, [write(30, '你', false), write(31, '你', true)]);
		expect(w.written).toBe(49);
		const last = write(32, '你', true);
		expectFires(w, last, new Date(last.at), 'write50', 'Viết chữ đẹp');
		const failed = apply(feed(fresh(), [write(0, '你好', false)]), write(1, '你好', false), T);
		expect(failed.state.written).toBe(0);

		expectFires(
			fresh(),
			mock(1, 'exam', true),
			new Date(mock(1, 'exam', true).at),
			'hsk1',
			'Đỗ HSK 1'
		);
		expectFires(
			fresh(),
			mock(2, 'exam', true),
			new Date(mock(2, 'exam', true).at),
			'hsk2',
			'Đỗ HSK 2'
		);
	});

	it('each badge fires once', () => {
		let s = countDays(fresh(), '2026-11-01', '2026-11-07');
		expect(s.badges.streak7).toBe('2026-11-07T05:00:00.000Z');
		s = rollover(s, '2026-11-08').state;
		s = rollover(s, '2026-11-09').state;
		s = countDays(s, '2026-11-10', '2026-11-15');
		const call = practice('last', ['你'], new Date('2026-11-16T05:00:00Z'))[0];
		const r = apply(s, call, new Date(call.at));
		expect(r.state.streak.count).toBe(7);
		expect(earned(r.events)).toEqual([]);
		expect(r.state.badges.streak7).toBe('2026-11-07T05:00:00.000Z');
		const w = apply(saved(1, 300), save(301), T);
		expect(earned(w.events)).toEqual([]);
	});

	it('replay does not fire again', () => {
		const gate = gateRun('h0-00', 'g0', 8, T);
		const run = (seed?: State['badges']) => {
			let s = initialState({ curriculum: CURRICULUM, badges: seed });
			return gate.map((a) => {
				const r = apply(s, a, new Date(a.at));
				s = r.state;
				return { events: earned(r.events), badges: s.badges };
			});
		};
		const original = run();
		const badges = original[9].badges;
		expect(Object.keys(badges)).toEqual(['first']);
		const replay = run(badges);
		expect(replay.flatMap((r) => r.events)).toEqual([]);
		expect(replay[9].badges).toEqual(badges);
		expect(run().flatMap((r) => r.events)).toHaveLength(1);
	});

	it('badges survive a reset', () => {
		let s = countDays(fresh(), '2026-11-01', '2026-11-07');
		s = rollover(s, '2026-11-08').state;
		s = countDays(s, '2026-11-09', '2026-11-10');
		expect(s.streak.count).toBe(9);
		expect(s.streak.freezes).toBe(0);
		expect(s.badges.streak7).toBeDefined();
		const before = structuredClone(s.badges);
		const r = rollover(s, '2026-11-11');
		expect(r.events).toEqual([{ type: 'StreakReset', day: '2026-11-11' }]);
		expect(r.state.streak.count).toBe(0);
		expect(r.state.badges).toEqual(before);
	});

	it('Practice mode earns nothing', () => {
		const start = fresh();
		const practiceMode = apply(start, mock(1, 'practice', true), T);
		expect(earned(practiceMode.events)).toEqual([]);
		expect(practiceMode.state.badges).toEqual({});
		expect(practiceMode.state).toEqual(start);
		expect(earned(apply(start, mock(1, 'exam', true), T).events).map((e) => e.badge)).toEqual([
			'hsk1'
		]);
		expect(earned(apply(start, mock(1, 'exam', false), T).events)).toEqual([]);
	});
});
