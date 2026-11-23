import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it, vi } from 'vitest';
import { roadmapLevel } from './roadmap';

vi.mock('#lib/curriculum/index.js', async (importActual) => {
	const actual = await importActual<typeof import('#lib/curriculum/index.js')>();
	return { ...actual, LEVELS: actual.LEVELS.filter((l) => l.level !== 2) };
});

const reference = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'] = { unlocked: true, passed: true, done: [], best: 90 };
	state.lessons['h1-01'].unlocked = true;
	return state;
};

describe('roadmapLevel without an outline', () => {
	it('Given_NoOutline_When_Level2_Then_EmptyNoCard', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 2);

		// Assert
		expect(view).toMatchObject({ level: 2, empty: true, groups: [] });
		expect(view.card).toBeUndefined();
		expect(view.header).toBeUndefined();
		expect(view.strip.map((c) => c.current)).toEqual([false, true, false, false, false]);
		expect(view.strip[1].progress).toBe(0);
	});
});
