import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	rollover,
	type Attempt,
	type State,
	type StudyEvent
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';
import { gateRun, sectionRun } from '#lib/study/fixtures/runs.js';

const days = (events: StudyEvent[]) =>
	events.flatMap((e) => (e.type === 'DayCounted' ? [{ day: e.day, streak: e.streak }] : []));

function fold(state: State, list: Attempt[]) {
	let s = state;
	const events: StudyEvent[] = [];
	for (const a of list) {
		const r = apply(s, a, new Date(a.at));
		s = r.state;
		events.push(...r.events);
	}
	return { state: s, events };
}

const bg = () => countDays(initialState({ curriculum: CURRICULUM }), '2026-11-01', '2026-11-12');
const closing = (iso: string) => new Date(Date.parse(iso) - 9000);

describe('streak counting', () => {
	it('has the background streak', () => {
		expect(bg().streak).toEqual({ count: 12, last: '2026-11-12' });
	});

	it('finishing a section counts today', () => {
		const r = fold(bg(), sectionRun('h1-01', 'words', 'w1', closing('2026-11-13T14:00:09Z')));
		expect(days(r.events)).toEqual([{ day: '2026-11-13', streak: 13 }]);
		const roll = rollover(r.state, '2026-11-13');
		expect(roll.events).toEqual([]);
		expect(roll.state.streak.count).toBe(13);
	});

	it('a Gate run counts even when failed', () => {
		const r = fold(bg(), gateRun('h0-00', 'g0', 3, closing('2026-11-14T05:00:09Z')));
		expect(days(r.events)).toEqual([{ day: '2026-11-14', streak: 13 }]);
	});

	it('an unfinished run does not count', () => {
		const r = fold(bg(), sectionRun('h1-01', 'words', 'w1', closing('2026-11-13T14:00:09Z'), 9));
		expect(days(r.events)).toEqual([]);
		expect(r.state.streak.count).toBe(12);
	});

	it('two sections count once', () => {
		const a = fold(bg(), sectionRun('h1-01', 'words', 'w1', closing('2026-11-13T12:00:09Z')));
		const b = fold(a.state, sectionRun('h1-01', 'grammar', 'w2', closing('2026-11-13T14:00:09Z')));
		const c = rollover(b.state, '2026-11-13');
		expect(days([...a.events, ...b.events, ...c.events])).toEqual([
			{ day: '2026-11-13', streak: 13 }
		]);
		expect(c.state.streak.count).toBe(13);
	});

	it('a practice session also counts', () => {
		const list = practice('s1', ['你', '好', '您'], new Date('2026-11-13T13:00:00Z'));
		const r = fold(bg(), list.slice(0, 2));
		expect(days(r.events)).toEqual([]);
		const last = apply(r.state, list[2], new Date(list[2].at));
		expect(days(last.events)).toEqual([{ day: '2026-11-13', streak: 13 }]);
		expect(rollover(last.state, '2026-11-13').events).toEqual([]);
	});

	it("day boundary uses the learner's timezone", () => {
		const at = closing('2026-10-23T17:30:09Z');
		const list = sectionRun('h1-01', 'words', 'w1', at);
		const hcm = fold(initialState({ curriculum: CURRICULUM }), list);
		expect(days(hcm.events)).toEqual([{ day: '2026-10-24', streak: 1 }]);
		const utc = fold(initialState({ curriculum: CURRICULUM, tz: 'UTC' }), list);
		expect(days(utc.events)).toEqual([{ day: '2026-10-23', streak: 1 }]);
	});
});
