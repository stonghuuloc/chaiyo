import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	type Attempt,
	type State,
	type StudyEvent,
	type WordSaved
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { T, bai0, feed, gateRun, ready, sectionRun, SECTIONS_1 } from '#lib/study/fixtures/runs.js';

const H = 3_600_000;
const OWN = new Set(['SectionDone', 'GatePassed', 'LessonUnlocked']);
const own = (events: StudyEvent[]) => events.filter((e) => OWN.has(e.type));

function run(state: State, list: Attempt[]) {
	let s = state;
	const out: StudyEvent[][] = [];
	for (const a of list) {
		const before = JSON.stringify(s);
		const r = apply(s, a, new Date(a.at));
		expect(JSON.stringify(s)).toBe(before);
		s = r.state;
		out.push(own(r.events));
	}
	return { state: s, events: out, last: out[out.length - 1] };
}

describe('section runs', () => {
	it('last question emits SectionDone', () => {
		const list = sectionRun('h1-01', 'words', 'w1', T);
		let r = run(bai0(), list.slice(0, 9));
		expect(r.events.flat()).toEqual([]);
		r = run(r.state, [{ ...list[2], id: 'again' }]);
		expect(r.last).toEqual([]);
		r = run(r.state, [list[9]]);
		expect(r.last).toEqual([{ type: 'SectionDone', lesson: 'h1-01', section: 'words' }]);
		r = run(r.state, [{ ...list[2], id: 'late' }]);
		expect(r.last).toEqual([]);
	});

	it('Gate stays locked until every section is done', () => {
		let s = bai0();
		for (const [i, section] of SECTIONS_1.slice(0, 4).entries())
			s = feed(s, sectionRun('h1-01', section, `s${i}`, new Date(T.getTime() + i * 60_000)));
		let r = run(s, gateRun('h1-01', 'gEarly', 10, new Date(T.getTime() + 5 * H)));
		expect(r.events.flat()).toEqual([]);
		expect(r.state.lessons['h1-01'].best).toBeUndefined();
		expect(r.state.lessons['h1-02'].unlocked).toBe(false);
		r = run(r.state, sectionRun('h1-01', 'writing', 's4', new Date(T.getTime() + 6 * H)));
		expect(r.last).toEqual([{ type: 'SectionDone', lesson: 'h1-01', section: 'writing' }]);
		expect(r.state.lessons['h1-01'].done).toEqual(SECTIONS_1);
		r = run(r.state, gateRun('h1-01', 'gOk', 10, new Date(T.getTime() + 7 * H)));
		expect(r.events.flat()).toContainEqual({ type: 'GatePassed', lesson: 'h1-01', score: 100 });
		expect(bai0().lessons['h0-00'].passed).toBe(true);
	});

	it('ignores a lesson outside the curriculum', () => {
		const r = run(bai0(), sectionRun('nope', 'words', 'x', T));
		expect(r.events.flat()).toEqual([]);
		expect(r.state.runs).toEqual(bai0().runs);
	});

	it('emits SectionDone again when another run of the section closes', () => {
		const r = run(ready(), sectionRun('h1-01', 'words', 'again', new Date(T.getTime() + 9 * H)));
		expect(r.last).toEqual([{ type: 'SectionDone', lesson: 'h1-01', section: 'words' }]);
		expect(r.state.lessons['h1-01'].done).toEqual(SECTIONS_1);
	});
});

describe('Gate Test', () => {
	const gate = (n: string, right: number, h: number, answered = 10, of = 10) =>
		gateRun('h1-01', n, right, new Date(T.getTime() + h * H), answered, of);
	const unlocked = { type: 'LessonUnlocked', lesson: 'h1-02' } as const;
	const done = { type: 'SectionDone', lesson: 'h1-01', section: 'gate' } as const;

	it('pass line is 80 %', () => {
		let r = run(ready(), gate('a', 7, 10));
		expect(r.last).toEqual([done]);
		expect(r.state.lessons['h1-01'].best).toBe(70);
		expect(r.state.lessons['h1-02'].unlocked).toBe(false);
		r = run(ready(), gate('b', 8, 10));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 80 }, unlocked]);
		expect(r.state.lessons['h1-01'].best).toBe(80);
		r = run(ready(), gate('c', 10, 10));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 100 }, unlocked]);
		expect(r.state.lessons['h1-01'].best).toBe(100);
	});

	it('compares integers: 9/12 fails, 10/12 passes', () => {
		let r = run(ready(), gate('e1', 9, 7, 12, 12));
		expect(r.last).toEqual([done]);
		expect(r.state.lessons['h1-01'].best).toBe(75);
		r = run(ready(), gate('e2', 10, 7, 12, 12));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 83 }, unlocked]);
	});

	it('fail, retry, pass unlocks once', () => {
		let r = run(ready(), gate('r1', 6, 10));
		expect(r.last).toEqual([done]);
		const all = [r.events.flat()];
		r = run(r.state, gate('r2', 9, 11));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 90 }, unlocked]);
		all.push(r.events.flat());
		r = run(r.state, gate('r3', 10, 12));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 100 }]);
		expect(all.flat().filter((e) => e.type === 'GatePassed')).toHaveLength(1);
		expect(all.flat().filter((e) => e.type === 'LessonUnlocked')).toHaveLength(1);
	});

	it('best score is kept', () => {
		let r = run(ready(), gate('r1', 9, 10));
		r = run(r.state, gate('r2', 6, 11));
		expect(r.last).toEqual([done]);
		const L = r.state.lessons['h1-01'];
		expect([L.best, L.passed, r.state.lessons['h1-02'].unlocked]).toEqual([90, true, true]);
	});

	it('quitting saves no score', () => {
		let r = run(ready(), gate('q1', 0, 7, 4));
		expect(r.events.flat()).toEqual([]);
		expect(r.state.lessons['h1-01'].best).toBeUndefined();
		r = run(r.state, gate('q2', 8, 8));
		expect(r.last).toEqual([done, { type: 'GatePassed', lesson: 'h1-01', score: 80 }, unlocked]);
	});

	it('null counts as answered, not right', () => {
		const list = gate('n', 10, 10).map((a, i) => (i === 9 ? { ...a, correct: null } : a));
		expect(run(ready(), list).state.lessons['h1-01'].best).toBe(90);
	});
});

describe('step.of', () => {
	it('a run size below 1 is ignored', () => {
		const list = gateRun('h1-01', 'z', 0, new Date(T.getTime() + 10 * H), 1, 0);
		const r = run(ready(), list);
		expect(r.events.flat()).toEqual([]);
		expect(r.state.lessons['h1-01'].best).toBeUndefined();
	});
});

describe('Lexicon promotion', () => {
	it('a saved word is promoted when its lesson teaches it', () => {
		const saved: WordSaved = {
			kind: 'saved',
			word: '你们',
			at: new Date(T.getTime() - 2 * H).toISOString()
		};
		let s = apply(bai0(), saved, new Date(saved.at)).state;
		expect(s.lexicon['你们'].saved).toBe(true);
		s = feed(s, sectionRun('h1-01', 'words', 'w1', T));
		expect(s.lexicon['你们']).toMatchObject({ saved: false });
		const listen: Attempt = {
			id: 'l1',
			at: new Date(T.getTime() + H).toISOString(),
			questionId: 'q-l',
			contentSha: 'fixture',
			correct: true,
			ms: 1000,
			card: { word: '你们', skill: 'nghe' }
		};
		expect(apply(s, listen, new Date(listen.at)).events).toHaveLength(1);
	});
});

describe('purity', () => {
	it('State is plain JSON and apply never mutates its input', () => {
		const start = ready();
		const before = JSON.stringify(start);
		const list = gateRun('h1-01', 'j', 8, new Date(T.getTime() + 10 * H));
		const a = run(start, list);
		expect(JSON.stringify(start)).toBe(before);
		const b = run(JSON.parse(before) as State, list);
		expect(b.last).toEqual(a.last);
		expect(initialState().curriculum).toEqual({ lessons: [] });
		expect(Object.keys(initialState({ curriculum: CURRICULUM }).lessons)).toHaveLength(28);
	});
});
