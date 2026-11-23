import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { countDays } from '#lib/study/fixtures/streak.js';

type Scenario = { state: State; now: Date };

const THU = new Date('2026-11-20T03:00:00Z');

const run = (count: number, last: string, freezes: number): State => ({
	...initialState({ curriculum: CURRICULUM }),
	streak: { count, last, through: last, freezes, best: count }
});

const ac4 = () => countDays(run(11, '2026-11-17', 2), '2026-11-19', '2026-11-19');

export const SCENARIOS = {
	ac4: (): Scenario => ({ state: ac4(), now: THU }),
	ac5: (): Scenario => ({
		state: countDays(ac4(), '2026-11-20', '2026-11-20'),
		now: new Date('2026-11-20T08:00:00Z')
	}),
	overnight: (): Scenario => ({ state: run(5, '2026-11-18', 1), now: THU }),
	reset: (): Scenario => ({ state: run(5, '2026-11-17', 1), now: THU }),
	fresh: (): Scenario => ({ state: initialState({ curriculum: CURRICULUM }), now: THU }),
	monday: (): Scenario => ({
		state: initialState({ curriculum: CURRICULUM }),
		now: new Date('2026-11-16T03:00:00Z')
	})
};

export type ScenarioKey = keyof typeof SCENARIOS;
