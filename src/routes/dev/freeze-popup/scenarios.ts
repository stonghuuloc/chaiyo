import { CURRICULUM } from '#lib/curriculum/index.js';
import { freezeUsedView } from '#lib/lesson/index.js';
import { countDays } from '#lib/study/fixtures/streak.js';
import { initialState, type State } from '#lib/study/index.js';
import { SCENARIOS as STREAK } from '../streak-popup/scenarios';

const base = () => initialState({ curriculum: CURRICULUM });

const ac3 = (): State => ({
	...base(),
	streak: { count: 12, last: '2026-11-10', through: '2026-11-10', freezes: 2, best: 12 }
});

const at = (day: string) => new Date(`${day}T02:00:00Z`);

export const SCENARIOS = {
	ac3: () => freezeUsedView(ac3(), at('2026-11-12'), null),
	noneLeft: () =>
		freezeUsedView(countDays(base(), '2026-11-01', '2026-11-08'), at('2026-11-10'), null),
	seen: () => freezeUsedView(ac3(), at('2026-11-12'), '2026-11-11'),
	dayCounted: () => STREAK.record13()
};
