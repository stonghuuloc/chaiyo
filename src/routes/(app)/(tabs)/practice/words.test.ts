import { initialState, myWords, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { wordsPreview } from './words';

const past = '2026-11-01T00:00:00.000Z';
const future = '2027-01-01T00:00:00.000Z';
const now = new Date('2026-11-23T08:00:00.000Z');
const card = (due: string) => ({ due, first: past, fsrs: {} });
const build = (hanzi: string[], dueFrom = hanzi.length): State => {
	const state = initialState({ curriculum: { lessons: [] } });
	hanzi.forEach((h, i) => {
		state.lexicon[h] = { saved: false, cards: { the: card(i >= dueFrom ? past : future) } };
	});
	return state;
};
const words = (n: number) => Array.from({ length: n }, (_, i) => `字${i}`);

describe('wordsPreview', () => {
	it('Given_30Entries_When_WordsPreview_Then_Count30First8EqualMyWordsTop8', () => {
		// Arrange
		const state = build(words(30), 28);
		// Act
		const view = wordsPreview(state, now);
		// Assert
		expect(view.count).toBe(30);
		expect(view.hanzi).toHaveLength(8);
		expect(view.hanzi).toEqual(
			myWords(state, () => undefined, now)
				.slice(0, 8)
				.map((r) => r.hanzi)
		);
		expect(view.hanzi.slice(0, 2)).toEqual(['字28', '字29']);
	});

	it('Given_3Entries_When_WordsPreview_Then_3Hanzi', () => {
		// Arrange
		const state = build(words(3));
		// Act
		const view = wordsPreview(state, now);
		// Assert
		expect(view.hanzi).toHaveLength(3);
	});

	it('Given_Empty_When_WordsPreview_Then_0AndNoHanzi', () => {
		// Arrange
		const state = build([]);
		// Act
		const view = wordsPreview(state, now);
		// Assert
		expect(view).toEqual({ count: 0, hanzi: [] });
	});

	it('Given_SavedAndLearned_When_WordsPreview_Then_BothCount', () => {
		// Arrange
		const state = build(['学']);
		state.lexicon['爱'] = { saved: true, cards: {} };
		// Act
		const view = wordsPreview(state, now);
		// Assert
		expect(view.count).toBe(2);
		expect(view.hanzi).toContain('爱');
	});
});
