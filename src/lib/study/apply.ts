import { review } from './fsrs';
import type { Attempt, State, StudyEvent } from './types';

export const initialState = (): State => ({ lexicon: {} });

export function apply(
	state: State,
	input: Attempt,
	now: Date
): { state: State; events: StudyEvent[] } {
	if (!input.card || input.correct === null) return { state, events: [] };
	const { word, skill } = input.card;
	const entry = state.lexicon[word] ?? { cards: {} };
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
