import { review } from './fsrs';
import type { Attempt, State, StudyEvent, WordSaved } from './types';

export const initialState = (): State => ({ lexicon: {} });

export function apply(
	state: State,
	input: Attempt | WordSaved,
	now: Date
): { state: State; events: StudyEvent[] } {
	if ('kind' in input) {
		if (Object.hasOwn(state.lexicon, input.word)) return { state, events: [] };
		return {
			state: { ...state, lexicon: { ...state.lexicon, [input.word]: { saved: true, cards: {} } } },
			events: []
		};
	}
	if (!input.card || input.correct === null) return { state, events: [] };
	const { word, skill } = input.card;
	const entry = Object.hasOwn(state.lexicon, word)
		? state.lexicon[word]
		: { saved: false, cards: {} };
	if (skill === 'nghe' && entry.saved) return { state, events: [] };
	const card = review(entry.cards[skill]?.fsrs, `${word}:${skill}`, input.correct, now);
	const lexicon = {
		...state.lexicon,
		[word]: { ...entry, cards: { ...entry.cards, [skill]: card } }
	};
	return {
		state: { ...state, lexicon },
		events: [{ type: 'CardScheduled', word, skill, due: card.due }]
	};
}
