import { describe, expect, it } from 'vitest';
import { apply, initialState, type State, type StudyEvent } from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';

const own = (events: StudyEvent[]) =>
	events.filter((e) => ['DayCounted', 'FreezeEarned'].includes(e.type));

const finish = (state: State, iso: string, run = `r-${iso}`) => {
	const a = practice(run, ['你'], new Date(iso))[0];
	return apply(state, a, new Date(a.at));
};

const start = () => initialState({ curriculum: CURRICULUM });
const noon = (day: string) => `${day}T05:00:00Z`;

describe('best streak', () => {
	it('Given_12DaysBest12_When_Count20261113_Then_Record13Freezes1Best13', () => {
		// Arrange
		const before = countDays(start(), '2026-11-01', '2026-11-12');

		// Act
		const r = finish(before, noon('2026-11-13'));

		// Assert
		expect(own(r.events)).toEqual([
			{ type: 'DayCounted', day: '2026-11-13', streak: 13, record: true, freezes: 1 }
		]);
		expect(r.state.streak.best).toBe(13);
	});

	it('Given_13Days_When_CountNextDay_Then_Record14Freezes2AndFreezeEarned', () => {
		// Arrange
		const before = countDays(start(), '2026-11-01', '2026-11-13');

		// Act
		const r = finish(before, noon('2026-11-14'));

		// Assert
		expect(own(r.events)).toEqual([
			{ type: 'DayCounted', day: '2026-11-14', streak: 14, record: true, freezes: 2 },
			{ type: 'FreezeEarned', freezes: 2 }
		]);
	});

	it('Given_20DaysResetThen6_When_Count_Then_NotRecordBest20', () => {
		// Arrange
		const run = countDays(start(), '2026-10-01', '2026-10-20');
		const reset = countDays(run, '2026-10-24', '2026-10-28');

		// Act
		const r = finish(reset, noon('2026-10-29'));

		// Assert
		expect(r.state.streak).toMatchObject({ count: 6, best: 20 });
		expect(own(r.events)).toEqual([
			{ type: 'DayCounted', day: '2026-10-29', streak: 6, record: false, freezes: 0 }
		]);
	});

	it('Given_EmptyState_When_Day1ThenDay2_Then_Day1NotRecord_Day2Record', () => {
		// Arrange
		const day1 = finish(start(), noon('2026-11-01'));

		// Act
		const day2 = finish(day1.state, noon('2026-11-02'));

		// Assert
		expect(own(day1.events)).toEqual([
			{ type: 'DayCounted', day: '2026-11-01', streak: 1, record: false, freezes: 0 }
		]);
		expect(own(day2.events)).toEqual([
			{ type: 'DayCounted', day: '2026-11-02', streak: 2, record: true, freezes: 0 }
		]);
	});

	it('Given_BestEqualsN_When_Count_Then_NotRecord', () => {
		// Arrange
		const first = countDays(start(), '2026-10-01', '2026-10-13');
		const second = countDays(first, '2026-10-17', '2026-10-28');

		// Act
		const r = finish(second, noon('2026-10-29'));

		// Assert
		expect(r.state.streak).toMatchObject({ count: 13, best: 13 });
		expect(own(r.events)).toEqual([
			expect.objectContaining({ type: 'DayCounted', streak: 13, record: false })
		]);
	});

	it('Given_DayCountedAlready_When_SecondFinishSameDay_Then_NoEvents_BestUnchanged', () => {
		// Arrange
		const first = finish(countDays(start(), '2026-11-01', '2026-11-12'), noon('2026-11-13'));

		// Act
		const second = finish(first.state, '2026-11-13T09:00:00Z', 'r-second');

		// Assert
		expect(own(second.events)).toEqual([]);
		expect(second.state.streak.best).toBe(13);
	});
});
