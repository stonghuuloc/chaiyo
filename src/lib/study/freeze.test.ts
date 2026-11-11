import { describe, expect, it } from 'vitest';
import { apply, initialState, rollover, type State, type StudyEvent } from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';

const own = (events: StudyEvent[]) =>
	events.filter((e) =>
		['DayCounted', 'FreezeEarned', 'FreezeSpent', 'StreakReset'].includes(e.type)
	);

const finish = (state: State, iso: string, run = `r-${iso}`) => {
	const a = practice(run, ['你'], new Date(iso))[0];
	return apply(state, a, new Date(a.at));
};

const start = (tz?: string) => initialState({ curriculum: CURRICULUM, tz });
const bg = () => countDays(start(), '2026-11-01', '2026-11-12');
const noon = (day: string) => `${day}T05:00:00Z`;

describe('streak freeze', () => {
	it('has the background freeze', () => {
		expect(bg().streak).toMatchObject({ count: 12, freezes: 1 });
	});

	it('missed day with a Freeze', () => {
		const before = countDays(start(), '2026-10-30', '2026-11-10');
		expect(before.streak).toMatchObject({ count: 12, freezes: 1 });
		const r = rollover(before, '2026-11-11');
		expect(own(r.events)).toEqual([{ type: 'FreezeSpent', day: '2026-11-11', freezes: 0 }]);
		expect(r.state.streak).toMatchObject({ count: 12, freezes: 0 });
		expect(rollover(r.state, '2026-11-11').events).toEqual([]);
		const next = finish(r.state, noon('2026-11-12'));
		expect(own(next.events)).toEqual([{ type: 'DayCounted', day: '2026-11-12', streak: 13 }]);
		expect(next.state.streak.freezes).toBe(0);
	});

	it('missed day without a Freeze', () => {
		const before = countDays(
			countDays(start(), '2026-10-29', '2026-11-04'),
			'2026-11-06',
			'2026-11-10'
		);
		expect(before.streak).toMatchObject({ count: 12, freezes: 0 });
		const r = rollover(before, '2026-11-11');
		expect(own(r.events)).toEqual([{ type: 'StreakReset', day: '2026-11-11' }]);
		expect(r.state.streak.count).toBe(0);
		expect({ ...r.state, streak: null }).toEqual({ ...before, streak: null });
		expect(rollover(r.state, '2026-11-12').events).toEqual([]);
	});

	it('seventh day earns a Freeze', () => {
		const r = finish(countDays(start(), '2026-11-04', '2026-11-09'), noon('2026-11-10'));
		expect(own(r.events)).toEqual([
			{ type: 'DayCounted', day: '2026-11-10', streak: 7 },
			{ type: 'FreezeEarned', freezes: 1 }
		]);
		expect(r.state.streak.freezes).toBe(1);
	});

	it('cap is 2', () => {
		const before = countDays(start(), '2026-10-21', '2026-11-09');
		expect(before.streak).toMatchObject({ count: 20, freezes: 2 });
		const r = finish(before, noon('2026-11-10'));
		expect(own(r.events)).toEqual([{ type: 'DayCounted', day: '2026-11-10', streak: 21 }]);
		expect(r.state.streak.freezes).toBe(2);
	});

	it('a fold closes gaps', () => {
		const r = finish(bg(), noon('2026-11-15'));
		expect(own(r.events)).toEqual([
			{ type: 'FreezeSpent', day: '2026-11-13', freezes: 0 },
			{ type: 'StreakReset', day: '2026-11-14' },
			{ type: 'DayCounted', day: '2026-11-15', streak: 1 }
		]);
		expect(r.state.streak).toMatchObject({ count: 1, freezes: 0 });
	});

	it('a closed date stays closed', () => {
		const r = rollover(bg(), '2026-11-14');
		expect(own(r.events)).toEqual([
			{ type: 'FreezeSpent', day: '2026-11-13', freezes: 0 },
			{ type: 'StreakReset', day: '2026-11-14' }
		]);
		const late = finish(r.state, '2026-11-13T14:00:00Z');
		expect(own(late.events)).toEqual([]);
		expect(late.state.streak).toEqual(r.state.streak);
		expect(rollover(late.state, '2026-11-14').events).toEqual([]);
	});

	it('a frozen day inside the run still earns at 14', () => {
		const a = finish(bg(), noon('2026-11-13'));
		expect(a.state.streak).toMatchObject({ count: 13, freezes: 1 });
		const r = finish(a.state, noon('2026-11-15'));
		expect(own(r.events)).toEqual([
			{ type: 'FreezeSpent', day: '2026-11-14', freezes: 0 },
			{ type: 'DayCounted', day: '2026-11-15', streak: 14 },
			{ type: 'FreezeEarned', freezes: 1 }
		]);
		expect(r.state.streak).toMatchObject({ count: 14, freezes: 1 });
	});
});

describe('streak across DST', () => {
	const run = (tz: string, rolls: string[], instants: string[]) => {
		let s = start(tz);
		const counted: { day: string; streak: number }[] = [];
		const all: StudyEvent[] = [];
		instants.forEach((iso, i) => {
			const r = finish(s, iso);
			s = r.state;
			all.push(...r.events);
			const roll = rollover(s, rolls[i]);
			all.push(...roll.events);
			expect(roll.events).toEqual([]);
		});
		for (const e of all)
			if (e.type === 'DayCounted') counted.push({ day: e.day, streak: e.streak });
		expect(all.some((e) => e.type === 'FreezeSpent' || e.type === 'StreakReset')).toBe(false);
		return counted;
	};

	it('does not lose or double a day (fall back)', () => {
		expect(
			run(
				'America/New_York',
				['2026-10-31', '2026-11-01', '2026-11-02'],
				['2026-11-01T03:30:00Z', '2026-11-02T04:30:00Z', '2026-11-02T05:30:00Z']
			)
		).toEqual([
			{ day: '2026-10-31', streak: 1 },
			{ day: '2026-11-01', streak: 2 },
			{ day: '2026-11-02', streak: 3 }
		]);
	});

	it('does not lose or double a day (spring forward)', () => {
		expect(
			run(
				'America/New_York',
				['2027-03-13', '2027-03-14', '2027-03-15'],
				['2027-03-13T05:30:00Z', '2027-03-15T03:30:00Z', '2027-03-15T04:30:00Z']
			)
		).toEqual([
			{ day: '2027-03-13', streak: 1 },
			{ day: '2027-03-14', streak: 2 },
			{ day: '2027-03-15', streak: 3 }
		]);
	});
});
