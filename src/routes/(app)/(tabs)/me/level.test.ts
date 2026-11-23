import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { joinedMonth, meLevel } from './level';
import { outlineIds } from '../roadmap/roadmap';

const learner = (level: number, passed: string[] = []): State => {
	const state = initialState({ curriculum: CURRICULUM });
	const first = outlineIds(level)[0];
	state.lessons[first] = { unlocked: true, passed: false, done: [] };
	for (const id of passed) state.lessons[id] = { unlocked: true, passed: true, done: [] };
	return state;
};
const hsk1 = (done: number) => outlineIds(1).slice(0, done);

describe('meLevel', () => {
	it('Given_ReferenceLearner_When_MeLevel_Then_Pct0Last40Next2Cur1', () => {
		// Arrange
		const state = learner(1);

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv).toEqual({ level: 1, pct: 0, cur: 1, band: 1, last: 40, next: 2 });
	});

	it('Given_ElevenPassed_When_MeLevel_Then_Pct27', () => {
		// Arrange
		const state = learner(1, hsk1(11));

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.pct).toBe(27);
	});

	it('Given_AllFortyPassed_When_MeLevel_Then_Pct100Band4CurNull', () => {
		// Arrange
		const state = learner(1, hsk1(40));

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.pct).toBe(100);
		expect(lv.band).toBe(4);
		expect(lv.cur).toBeNull();
	});

	it.each([
		[0, 1, 1],
		[10, 2, 11],
		[20, 3, 21],
		[30, 3, 31],
		[40, 4, null]
	])('Given_%iPassed_When_MeLevel_Then_BandAndCur', (done, band, cur) => {
		// Arrange
		const state = learner(1, hsk1(done));

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.band).toBe(band);
		expect(lv.cur).toBe(cur);
	});

	it('Given_PrimerUnpassed_When_MeLevel_Then_Cur1', () => {
		// Arrange
		const state = learner(1);
		state.lessons['h0-00'].unlocked = true;

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.cur).toBe(1);
	});

	it('Given_PassedOutOfOrder_When_MeLevel_Then_CurIsFirstGap', () => {
		// Arrange
		const ids = outlineIds(1);
		const state = learner(1, [...ids.slice(0, 5), ids[6]]);

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.cur).toBe(6);
	});

	it('Given_Hsk2Learner_When_MeLevel_Then_Cur41Last67Next3', () => {
		// Arrange
		const state = learner(2);

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv).toMatchObject({ level: 2, cur: 41, last: 67, next: 3 });
	});

	it('Given_Hsk5Learner_When_MeLevel_Then_Last136NextNull', () => {
		// Arrange
		const state = learner(5);

		// Act
		const lv = meLevel(state);

		// Assert
		expect(lv.last).toBe(136);
		expect(lv.next).toBeNull();
	});
});

describe('joinedMonth', () => {
	it('Given_Oct5Utc_When_JoinedMonth_Then_10of2026', () => {
		// Arrange
		const at = '2026-10-05T03:00:00Z';

		// Act
		const joined = joinedMonth(at, 'Asia/Ho_Chi_Minh');

		// Assert
		expect(joined).toEqual({ month: 10, year: 2026 });
	});

	it('Given_Oct31LateUtcInHcm_When_JoinedMonth_Then_11of2026', () => {
		// Arrange
		const at = '2026-10-31T18:30:00Z';

		// Act
		const joined = joinedMonth(at, 'Asia/Ho_Chi_Minh');

		// Assert
		expect(joined).toEqual({ month: 11, year: 2026 });
	});
});
