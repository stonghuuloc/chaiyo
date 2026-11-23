import { describe, expect, it } from 'vitest';
import {
	initialState,
	roadAnchor,
	roadRows,
	type Curriculum,
	type State
} from '#lib/study/index.js';

const lesson = (id: string) => ({ id, level: 1, sections: [], words: [] });
const curriculum: Curriculum = { lessons: ['a', 'b', 'c', 'd'].map(lesson) };
const items = [
	{ id: 'a', n: 0 },
	{ id: 'b', n: 1 },
	{ id: 'c', n: 2 },
	{ id: 'x', n: 7 }
];

const build = (set: (s: State) => void): State => {
	const state = initialState({ curriculum });
	set(state);
	return state;
};

describe('roadRows', () => {
	it('Given_PassedAnchorUnlockedMissing_When_RoadRows_Then_DoneNowOpenLocked', () => {
		// Arrange
		const state = build((s) => {
			s.lessons.a.passed = true;
			s.lessons.b.unlocked = true;
			s.lessons.c.unlocked = true;
		});

		// Act
		const rows = roadRows(state, items);

		// Assert
		expect(rows.map((r) => r.status)).toEqual(['done', 'now', 'open', 'locked']);
		expect(rows.map((r) => r.after)).toEqual([undefined, undefined, undefined, 2]);
		expect(rows[1]).toMatchObject({ id: 'b', n: 1 });
	});

	it('Given_LockedFirstItem_When_RoadRows_Then_NoAfter', () => {
		// Arrange
		const state = build((s) => {
			s.lessons.a.unlocked = false;
		});

		// Act
		const rows = roadRows(state, items);

		// Assert
		expect(rows[0].status).toBe('locked');
		expect(rows[0]).not.toHaveProperty('after');
	});

	it('Given_LockedLaterItem_When_RoadRows_Then_AfterIsPreviousN', () => {
		// Arrange
		const state = initialState({ curriculum });

		// Act
		const rows = roadRows(state, items);

		// Assert
		expect(rows.map((r) => r.status)).toEqual(['now', 'locked', 'locked', 'locked']);
		expect(rows.map((r) => r.after)).toEqual([undefined, 0, 1, 2]);
	});
});

describe('roadAnchor', () => {
	it('Given_NothingUnlocked_When_RoadAnchor_Then_Undefined', () => {
		// Arrange
		const state = build((s) => {
			s.lessons.a.unlocked = false;
		});

		// Act
		const anchor = roadAnchor(state);

		// Assert
		expect(anchor).toBeUndefined();
	});

	it('Given_FirstUnlockedNotPassed_When_RoadAnchor_Then_ItsId', () => {
		// Arrange
		const state = build((s) => {
			s.lessons.a.passed = true;
			s.lessons.c.unlocked = true;
		});

		// Act
		const anchor = roadAnchor(state);

		// Assert
		expect(anchor).toBe('c');
	});
});
