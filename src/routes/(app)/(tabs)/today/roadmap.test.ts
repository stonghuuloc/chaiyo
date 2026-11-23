import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { roadmapSlice } from './roadmap';

const ids = CURRICULUM.lessons.map((l) => l.id);

const build = (passed: number, unlocked: number[] = []): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (const [i, id] of ids.entries()) {
		state.lessons[id].passed = i < passed;
		state.lessons[id].unlocked = i < passed || unlocked.includes(i);
	}
	return state;
};

describe('roadmapSlice', () => {
	it('Given_Bai0PassedBai1Open_When_Slice_Then_DoneNowLockedLocked', () => {
		// Arrange
		const state = build(1, [1]);

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h0-00', 'h1-01', 'h1-02', 'h1-03']);
		expect(rows.map((r) => r.status)).toEqual(['done', 'now', 'locked', 'locked']);
		expect(rows.map((r) => r.after)).toEqual([undefined, undefined, 1, 2]);
		expect(rows[1].title).toBe('Xin chào');
		expect(rows[1].hanzi).toBe('你好');
	});

	it('Given_FreshLearner_When_Slice_Then_NowThenThreeLocked', () => {
		// Arrange
		const state = initialState({ curriculum: CURRICULUM });

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h0-00', 'h1-01', 'h1-02', 'h1-03']);
		expect(rows.map((r) => r.status)).toEqual(['now', 'locked', 'locked', 'locked']);
		expect(rows.map((r) => r.after)).toEqual([undefined, 0, 1, 2]);
	});

	it('Given_AllPassed_When_Slice_Then_LastFourDone', () => {
		// Arrange
		const state = build(ids.length);

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h2-01', 'h3-01', 'h4-01', 'h5-01']);
		expect(rows.every((r) => r.status === 'done')).toBe(true);
	});

	it('Given_NothingUnlocked_When_Slice_Then_FirstFourLocked', () => {
		// Arrange
		const state = initialState({ curriculum: CURRICULUM });
		state.lessons['h0-00'].unlocked = false;

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h0-00', 'h1-01', 'h1-02', 'h1-03']);
		expect(rows.every((r) => r.status === 'locked')).toBe(true);
	});

	it('Given_Bai3PassedBai4Open_When_Slice_Then_WindowAroundAnchor', () => {
		// Arrange
		const state = build(4, [4]);

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h1-03', 'h1-04', 'h1-05', 'h2-01']);
		expect(rows.map((r) => r.status)).toEqual(['done', 'now', 'locked', 'locked']);
	});

	it('Given_Bai8Open_When_Slice_Then_ShiftLeftToFitEnd', () => {
		// Arrange
		const state = build(8, [8]);

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['h2-01', 'h3-01', 'h4-01', 'h5-01']);
		expect(rows.map((r) => r.status)).toEqual(['done', 'done', 'now', 'locked']);
		expect(rows[3].after).toBe(94);
	});

	it('Given_PlacementUnlockedTwo_When_Slice_Then_SecondIsOpen', () => {
		// Arrange
		const state = build(1, [1, 2]);

		// Act
		const rows = roadmapSlice(state);

		// Assert
		expect(rows.map((r) => r.status)).toEqual(['done', 'now', 'open', 'locked']);
	});
});
