import { describe, expect, it } from 'vitest';
import { currentLevel, initialState, type State } from '#lib/study/index.js';

const curriculum = {
	lessons: [
		{ id: 'a', level: 1, sections: [], words: [] },
		{ id: 'b', level: 1, sections: [], words: [] },
		{ id: 'c', level: 2, sections: [], words: [] },
		{ id: 'd', level: 3, sections: [], words: [] }
	]
};

const fresh = (): State => initialState({ curriculum });

describe('currentLevel', () => {
	it('Given_FreshState_Then_1', () => {
		// Arrange
		const state = fresh();
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(1);
	});

	it('Given_Level2LessonUnlocked_Then_2', () => {
		// Arrange
		const state = fresh();
		state.lessons.c.unlocked = true;
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(2);
	});

	it('Given_Level3LessonLocked_Then_Ignored', () => {
		// Arrange
		const state = fresh();
		state.lessons.c.unlocked = true;
		state.lessons.d.unlocked = false;
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(2);
	});

	it('Given_EmptyCurriculum_Then_1', () => {
		// Arrange
		const state = initialState({ curriculum: { lessons: [] } });
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(1);
	});

	it('Given_Placed0_AllHsk1GatesPassed_Then_2', () => {
		// Arrange
		const state = fresh();
		state.placed = 0;
		state.lessons.a.passed = true;
		state.lessons.b.passed = true;
		state.lessons.c.unlocked = true;
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(2);
	});

	it('Given_Placed2_FirstHsk3Unlocked_Then_3', () => {
		// Arrange
		const state = fresh();
		state.placed = 2;
		state.lessons.d.unlocked = true;
		// Act
		const level = currentLevel(state);
		// Assert
		expect(level).toBe(3);
	});
});
