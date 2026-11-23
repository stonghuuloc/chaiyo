import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	liveStreak,
	rollover,
	type Attempt,
	type State,
	type StudyEvent
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';
import { gateRun, placementBlock, sectionRun } from '#lib/study/fixtures/runs.js';

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
		expect(bg().streak).toEqual({
			count: 12,
			last: '2026-11-12',
			freezes: 1,
			through: '2026-11-12',
			best: 12
		});
	});

	it('finishing a section counts today', () => {
		const r = fold(bg(), sectionRun('h1-01', 'words', 'w1', closing('2026-11-13T14:00:09Z')));
		expect(days(r.events)).toEqual([{ day: '2026-11-13', streak: 13 }]);
		expect(r.events.slice(-2).map((e) => e.type)).toEqual(['SectionDone', 'DayCounted']);
		const roll = rollover(r.state, '2026-11-13');
		expect(roll.events).toEqual([]);
		expect(roll.state.streak.count).toBe(13);
	});

	it('a Gate run counts even when failed', () => {
		const r = fold(bg(), gateRun('h0-00', 'g0', 3, closing('2026-11-14T05:00:09Z')));
		expect(days(r.events)).toEqual([{ day: '2026-11-14', streak: 13 }]);
	});

	it('a closed placement block does not count', () => {
		const r = fold(bg(), placementBlock(1, 'p1', 9, new Date('2026-11-13T14:00:00Z')));
		expect(days(r.events)).toEqual([]);
		expect(r.state.streak.count).toBe(12);
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

describe('frozen days', () => {
	const start = () => initialState({ curriculum: CURRICULUM });
	const run17 = () => countDays(start(), '2026-11-01', '2026-11-17');

	it('Given_FreezeSpentOn18Nov_When_CountDay19Nov_Then_FrozenHas18Nov', () => {
		const s = countDays(run17(), '2026-11-19', '2026-11-19');
		expect(s.streak.frozen).toEqual(['2026-11-18']);
	});

	it('Given_FreezeSpentByRollover_When_Rollover_Then_FrozenHasDay', () => {
		const r = rollover(run17(), '2026-11-18');
		expect(r.state.streak.frozen).toEqual(['2026-11-18']);
	});

	it('Given_FreezeThenReset_When_Rollover_Then_FrozenCleared', () => {
		const r = rollover(run17(), '2026-11-20');
		expect(r.state.streak.count).toBe(0);
		expect('frozen' in r.state.streak).toBe(false);
	});

	it('Given_FreezeOn1NovThen16Nov_When_Spent_Then_Only16NovKept', () => {
		const hand: State = {
			...start(),
			streak: { count: 10, last: '2026-10-31', through: '2026-10-31', freezes: 2 }
		};
		const first = rollover(hand, '2026-11-01').state;
		expect(first.streak.frozen).toEqual(['2026-11-01']);
		const run = countDays(first, '2026-11-02', '2026-11-15');
		expect(run.streak.frozen).toEqual(['2026-11-01']);
		expect(rollover(run, '2026-11-16').state.streak.frozen).toEqual(['2026-11-16']);
	});

	it('Given_RunWithoutFreeze_When_Fold_Then_NoFrozenKey', () => {
		expect('frozen' in bg().streak).toBe(false);
	});
});

describe('liveStreak', () => {
	const noon = (day: string) => new Date(`${day}T05:00:00Z`);

	it('Given_CountedToday_When_Live_Then_Unchanged', () => {
		const s = bg();
		expect(liveStreak(s, noon('2026-11-12'))).toBe(s.streak);
	});

	it('Given_CountedYesterday_When_Live_Then_Unchanged', () => {
		expect(liveStreak(bg(), noon('2026-11-13'))).toMatchObject({ count: 12, freezes: 1 });
	});

	it('Given_GapNoFreeze_When_Live_Then_Count0', () => {
		const s = bg();
		const none = { ...s, streak: { ...s.streak, freezes: 0 } };
		expect(liveStreak(none, noon('2026-11-14'))).toMatchObject({ count: 0, last: '2026-11-12' });
	});

	it('Given_GapOneFreeze_When_Live_Then_KeptAndFreezeSpent', () => {
		expect(liveStreak(bg(), noon('2026-11-14'))).toMatchObject({
			count: 12,
			freezes: 0,
			through: '2026-11-13'
		});
	});
});
