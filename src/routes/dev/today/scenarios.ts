import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, localDate, type State } from '#lib/study/index.js';

const PAST = '2026-11-01T00:00:00.000Z';
const IDS = CURRICULUM.lessons.map((l) => l.id);

const daysAgo = (now: Date, n: number, tz: string) => {
	const [y, m, d] = localDate(now, tz).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
};

const base = (o: { due?: number; open?: boolean } = {}): State => {
	const state = initialState({ curriculum: CURRICULUM });
	if (o.open) {
		state.lessons['h0-00'].passed = true;
		state.lessons['h1-01'].unlocked = true;
	}
	for (let i = 0; i < (o.due ?? 0); i++) {
		state.lexicon[`w${i}`] = { saved: false, cards: { the: { due: PAST, first: PAST, fsrs: {} } } };
	}
	return state;
};

const streak = (state: State, now: Date, ago: number, freezes: number): State => ({
	...state,
	streak: { count: 5, last: daysAgo(now, ago, state.tz), freezes }
});

export const SCENARIOS = {
	reviews: (): State => base({ due: 12 }),
	lesson: (): State => base({ open: true }),
	thi: (): State => {
		const state = base();
		for (const id of IDS) state.lessons[id] = { unlocked: true, passed: true, done: [] };
		return state;
	},
	xong: (): State => {
		const state = base();
		state.lessons['h0-00'].unlocked = false;
		return state;
	},
	freezeUsed: (now: Date): State => {
		const state = base({ open: true });
		return streak(state, now, 2, 1);
	},
	atRisk: (now: Date): State => streak(base({ due: 12 }), now, 1, 0),
	dayDone: (now: Date): State => streak(base({ due: 12 }), now, 0, 0)
} satisfies Record<string, (now: Date) => State>;

export type ScenarioKey = keyof typeof SCENARIOS;
