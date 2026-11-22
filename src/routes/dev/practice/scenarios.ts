import { initialState, type Skill, type State } from '#lib/study/index.js';

const due = (state: State, skill: Skill, n: number, now: Date) => {
	const at = new Date(now.getTime() - 86_400_000).toISOString();
	for (let i = 0; i < n; i++) {
		const word = `${skill}${i}`;
		state.lexicon[word] ??= { saved: false, cards: {} };
		state.lexicon[word].cards[skill] = { due: at, first: at, fsrs: {} };
	}
};

const fresh = () => initialState({ curriculum: { lessons: [] } });

export const SCENARIOS = {
	mix: (now: Date) => {
		const state = fresh();
		due(state, 'the', 6, now);
		due(state, 'nghe', 4, now);
		due(state, 'viet', 2, now);
		return state;
	},
	clear: () => fresh(),
	onlyNew: () => {
		const state = fresh();
		state.lexicon.moi = { saved: true, cards: {} };
		return state;
	}
} satisfies Record<string, (now: Date) => State>;

export type ScenarioKey = keyof typeof SCENARIOS;
