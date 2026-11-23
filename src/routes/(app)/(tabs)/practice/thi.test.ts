import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { thiChips } from './thi';

const curriculum = {
	lessons: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
		id,
		level: i + 1,
		sections: [],
		words: []
	}))
};
const build = (unlockedTo?: number, passed: string[] = []): State => {
	const state = initialState({ curriculum });
	for (const l of curriculum.lessons) {
		state.lessons[l.id].unlocked = unlockedTo !== undefined && l.level <= unlockedTo;
		state.lessons[l.id].passed = passed.includes(l.id);
	}
	return state;
};

describe('thiChips', () => {
	it('Given_Level1_When_ThiChips_Then_SixChipsLock2To6Next5', () => {
		// Arrange
		const state = build(1);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.chips.map((c) => c.level)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(view.chips.map((c) => c.lock)).toEqual([false, true, true, true, true, true]);
		expect(view.chips[0]).toEqual({ level: 1, lock: false, line: 'next', lesson: 5 });
		expect(view.chips.slice(1).every((c) => c.line === 'after')).toBe(true);
		expect(view.selected).toBe(1);
	});

	it('Given_Level3_When_ThiChips_Then_Passed1And2Next68After4To6', () => {
		// Arrange
		const state = build(3);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.chips.map((c) => c.line)).toEqual([
			'passed',
			'passed',
			'next',
			'after',
			'after',
			'after'
		]);
		expect(view.chips[2].lesson).toBe(68);
		expect(view.chips.map((c) => c.lock)).toEqual([false, false, false, true, true, true]);
		expect(view.selected).toBe(3);
	});

	it('Given_Level5AllPassed_When_ThiChips_Then_Ready5', () => {
		// Arrange
		const state = build(5, ['e']);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.chips[4]).toEqual({ level: 5, lock: false, line: 'ready' });
	});

	it('Given_Level5NotPassed_When_ThiChips_Then_Next116', () => {
		// Arrange
		const state = build(5);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.chips[4]).toEqual({ level: 5, lock: false, line: 'next', lesson: 116 });
	});

	it('Given_NoLessonUnlocked_When_ThiChips_Then_Selected1', () => {
		// Arrange
		const state = build();
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.selected).toBe(1);
		expect(view.chips[0].line).toBe('next');
	});

	it('Given_Level3ByUnlockOnly_When_ThiChips_Then_Passed1', () => {
		// Arrange
		const state = build(3);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.chips[0]).toEqual({ level: 1, lock: false, line: 'passed' });
	});
});
