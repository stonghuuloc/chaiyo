import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type Skill, type State } from '#lib/study/index.js';
import type { Friend } from '../../(app)/(tabs)/today/FriendsStrip.svelte';

type Scenario = { state: State; now: Date; friends: Friend[] };

const NOW = new Date('2026-11-20T03:00:00Z');
const PAST = '2026-11-01T00:00:00.000Z';

const due = (n: Partial<Record<Skill, number>>): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (n[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: PAST, first: PAST, fsrs: {} };
		}
	}
	return state;
};

const bai1 = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'].passed = true;
	state.lessons['h1-01'].unlocked = true;
	return state;
};

const allPassed = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (const lesson of Object.values(state.lessons)) {
		lesson.unlocked = true;
		lesson.passed = true;
	}
	return state;
};

const FRIENDS: Friend[] = [
	{ id: 'minh', name: 'Minh', streak: 30, lesson: 14 },
	{ id: 'lan', name: 'Lan', streak: 4, lesson: 6 },
	{ id: 'huy', name: 'Huy', streak: 9, lesson: 9 }
];

export const SCENARIOS = {
	ac3: (): Scenario => ({ state: due({ the: 6, nghe: 4, viet: 2 }), now: NOW, friends: [] }),
	empty: (): Scenario => ({ state: bai1(), now: NOW, friends: [] }),
	start: (): Scenario => ({
		state: initialState({ curriculum: CURRICULUM }),
		now: NOW,
		friends: []
	}),
	ac6: (): Scenario => ({ state: bai1(), now: NOW, friends: [] }),
	end: (): Scenario => ({ state: allPassed(), now: NOW, friends: [] }),
	friends3: (): Scenario => ({ state: bai1(), now: NOW, friends: FRIENDS }),
	friends0: (): Scenario => ({ state: bai1(), now: NOW, friends: [] })
};

export type ScenarioKey = keyof typeof SCENARIOS;
