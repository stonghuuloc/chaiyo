import { review } from './fsrs';
import { progress } from './progress';
import { countDay } from './streak';
import type { Attempt, Curriculum, State, StudyEvent, WordSaved } from './types';

export const initialState = (o: { curriculum?: Curriculum; tz?: string } = {}): State => {
	const curriculum = o.curriculum ?? { lessons: [] };
	return {
		lexicon: {},
		curriculum,
		lessons: Object.fromEntries(
			curriculum.lessons.map((l, i) => [l.id, { unlocked: i === 0, passed: false, done: [] }])
		),
		placed: 0,
		tz: o.tz ?? 'Asia/Ho_Chi_Minh',
		streak: { count: 0, freezes: 0 },
		runs: {}
	};
};

function schedule(state: State, input: Attempt, now: Date): { state: State; events: StudyEvent[] } {
	if (!input.card || input.correct === null) return { state, events: [] };
	const { word, skill } = input.card;
	const entry = Object.hasOwn(state.lexicon, word)
		? state.lexicon[word]
		: { saved: false, cards: {} };
	if (skill === 'nghe' && entry.saved) return { state, events: [] };
	const old = entry.cards[skill];
	const card = {
		...review(old?.fsrs, `${word}:${skill}`, input.correct, now),
		first: old?.first ?? now.toISOString()
	};
	const lexicon = {
		...state.lexicon,
		[word]: { ...entry, cards: { ...entry.cards, [skill]: card } }
	};
	return {
		state: { ...state, lexicon },
		events: [{ type: 'CardScheduled', word, skill, due: card.due }]
	};
}

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
	const scheduled = schedule(state, input, now);
	if (!input.step) return scheduled;
	const stepped = progress(scheduled.state, input.step, input);
	const counted = stepped.counts
		? countDay(stepped.state, now)
		: { state: stepped.state, events: [] };
	return {
		state: counted.state,
		events: [...scheduled.events, ...stepped.events, ...counted.events]
	};
}
