import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	session,
	type Attempt,
	type State,
	type StudyEvent
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { bai1 } from '#lib/study/fixtures/bai1.js';
import {
	T,
	feed,
	gateRun,
	placed2,
	placementBlock,
	sectionRun,
	SECTIONS_1
} from '#lib/study/fixtures/runs.js';

const H = 3_600_000;
const tz = 'Asia/Ho_Chi_Minh';
const OWN = new Set(['SectionDone', 'GatePassed', 'LessonUnlocked']);
const own = (events: StudyEvent[]) => events.filter((e) => OWN.has(e.type));
const blank = () => initialState({ curriculum: CURRICULUM });

function run(state: State, list: Attempt[]) {
	let s = state;
	const events: StudyEvent[][] = [];
	for (const a of list) {
		const r = apply(s, a, new Date(a.at));
		s = r.state;
		events.push(own(r.events));
	}
	return { state: s, events, last: events[events.length - 1] };
}

describe('placement', () => {
	it('placement into HSK 2 passes HSK 1', () => {
		const a = run(blank(), placementBlock(1, 'p1', 9, T));
		expect(a.last).toEqual([{ type: 'LessonUnlocked', lesson: 'h2-01' }]);
		expect(a.events.slice(0, -1).flat()).toEqual([]);
		const b = run(a.state, placementBlock(2, 'p2', 5, new Date(T.getTime() + 600_000)));
		expect(b.events.flat()).toEqual([]);
		const s = b.state;
		const hsk1 = CURRICULUM.lessons.filter((l) => l.level === 1);
		expect(hsk1).toHaveLength(26);
		for (const l of hsk1) expect(s.lessons[l.id]).toMatchObject({ passed: true, unlocked: true });
		expect(s.lessons['h2-01']).toMatchObject({ unlocked: true, passed: false });
		expect(s.lessons['h2-02'].unlocked).toBe(false);
		expect(s.placed).toBe(1);
		const words = Object.keys(s.lexicon);
		expect(words).toHaveLength(250);
		expect(words[0]).toBe('你');
		expect(words.at(-1)).toBe('h1-25-w10');
		for (const w of words) expect(s.lexicon[w]).toEqual({ saved: false, cards: {} });
	});

	it('placement promotes a saved word, keeps a taught one', () => {
		let s = blank();
		const before = new Date(T.getTime() - H);
		s = apply(s, { kind: 'saved', word: '你们', at: before.toISOString() }, before).state;
		s = apply(
			s,
			{
				id: 'a:taught',
				at: before.toISOString(),
				questionId: 'q:taught',
				contentSha: 'fixture',
				correct: true,
				ms: 1000,
				card: { word: '你', skill: 'the' }
			},
			before
		).state;
		const card = s.lexicon['你'].cards.the;
		s = feed(s, placementBlock(1, 'p1', 9, T));
		expect(s.lexicon['你们'].saved).toBe(false);
		expect(s.lexicon['你'].cards.the).toEqual(card);
		expect(Object.keys(s.lexicon)).toHaveLength(250);
	});

	it('a weak block or an out-of-order block changes nothing', () => {
		const r = run(blank(), placementBlock(1, 'p1', 7, T));
		expect(r.state.placed).toBe(0);
		expect(r.state.lexicon).toEqual({});
		expect(r.events.flat()).toEqual([]);
		const r2 = run(blank(), placementBlock(2, 'p2', 10, T));
		expect(r2.state.placed).toBe(0);
		expect(r2.state.lexicon).toEqual({});
		expect(r2.events.flat()).toEqual([]);
	});

	it('never sent back down', () => {
		let s = placed2();
		SECTIONS_1.forEach((section, i) => {
			s = feed(
				s,
				sectionRun('h2-01', section, `t${i}`, new Date(T.getTime() + (i + 1) * 60_000 * 20))
			);
		});
		const g = run(s, gateRun('h2-01', 'h2g', 3, new Date(T.getTime() + 7 * H)));
		expect(g.last).toEqual([{ type: 'SectionDone', lesson: 'h2-01', section: 'gate' }]);
		const w = run(g.state, placementBlock(1, 'p3', 2, new Date(T.getTime() + 8 * H)));
		expect(w.last).toEqual([]);
		for (const l of CURRICULUM.lessons.filter((l) => l.level === 1))
			expect(w.state.lessons[l.id].passed).toBe(true);
		expect(w.state.placed).toBe(1);
		expect(w.state.lessons['h2-01'].best).toBe(30);
	});
});

describe('20 new cards a day', () => {
	it('caps new thẻ từ cards at 20 per local day', () => {
		let s = placed2();
		const all = CURRICULUM.lessons.filter((l) => l.level === 1).flatMap((l) => l.words);
		const plan: string[][] = [];
		for (let i = 0; i < all.length; i += 20) plan.push(all.slice(i, i + 20));
		plan.push([]);
		for (let day = 0; day < plan.length; day++) {
			const now = new Date(T.getTime() + day * 86_400_000 + 20 * 60_000);
			const fresh = session(s, { now, tz, only: ['the'] }).filter(
				(c) => !s.lexicon[c.word].cards.the
			);
			expect(fresh.map((c) => c.word)).toEqual(plan[day]);
			if (day === 0) {
				expect(session(s, { now, tz }).length).toBe(20);
				const later = new Date(now.getTime() + H);
				const batch = fresh.map((c, i) => ({
					id: `d${day}:${i}`,
					at: later.toISOString(),
					questionId: `q:${day}:${i}`,
					contentSha: 'fixture',
					correct: true,
					ms: 1,
					card: c
				}));
				s = feed(s, batch);
				const again = session(s, { now: new Date(later.getTime() + H), tz, only: ['the'] });
				expect(again.filter((c) => !s.lexicon[c.word].cards.the)).toEqual([]);
				continue;
			}
			s = feed(
				s,
				fresh.map((c, i) => ({
					id: `d${day}:${i}`,
					at: now.toISOString(),
					questionId: `q:${day}:${i}`,
					contentSha: 'fixture',
					correct: true,
					ms: 1,
					card: c
				}))
			);
		}
		expect(plan.length).toBe(14);
		expect(plan[12]).toHaveLength(10);
	});

	it('lesson cards share the cap', () => {
		const words = ['你', '好', '您', '你们', '你好'];
		const s = feed(
			placed2(),
			words.map((w, i) => ({
				id: `l:${i}`,
				at: T.toISOString(),
				questionId: `q:l:${i}`,
				contentSha: 'fixture',
				correct: true,
				ms: 1,
				card: { word: w, skill: 'the' as const }
			}))
		);
		const now = new Date(T.getTime() + 20 * 60_000);
		const fresh = session(s, { now, tz, only: ['the'] }).filter(
			(c) => !s.lexicon[c.word].cards.the
		);
		expect(fresh).toHaveLength(15);
		expect(fresh[0].word).toBe('对不起');
		expect(fresh.at(-1)!.word).toBe('h1-02-w10');
	});

	it('a word taught by another skill still gets a new thẻ từ card after placement', () => {
		let s = feed(blank(), [
			{
				id: 'v1',
				at: T.toISOString(),
				questionId: 'qv',
				contentSha: 'x',
				correct: true,
				ms: 1,
				card: { word: '你', skill: 'viet' }
			}
		]);
		const now = new Date(T.getTime() + 20 * 60_000);
		expect(session(s, { now, tz, only: ['the'] })).toEqual([]);
		s = feed(s, placementBlock(1, 'p1', 9, T));
		expect(session(s, { now, tz, only: ['the'] })[0]).toEqual({ word: '你', skill: 'the' });
	});

	it('keeps first on later reviews', () => {
		const s = feed(blank(), [
			{
				id: 'f1',
				at: T.toISOString(),
				questionId: 'q1',
				contentSha: 'x',
				correct: true,
				ms: 1,
				card: { word: '你', skill: 'the' }
			},
			{
				id: 'f2',
				at: new Date(T.getTime() + 5 * 86_400_000).toISOString(),
				questionId: 'q2',
				contentSha: 'x',
				correct: true,
				ms: 1,
				card: { word: '你', skill: 'the' }
			}
		]);
		expect(s.lexicon['你'].cards.the!.first).toBe(T.toISOString());
	});

	it("CHY-19's fixture still has one new card", () => {
		const s = bai1();
		const fresh = session(s, { now: T, tz, only: ['the'] }).filter(
			(c) => !s.lexicon[c.word].cards.the
		);
		expect(fresh.map((c) => c.word)).toEqual(['奶茶']);
	});
});
