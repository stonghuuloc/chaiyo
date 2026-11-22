import { CURRICULUM } from '#lib/curriculum/index.js';
import { apply, initialState, type State, type StudyEvent } from '#lib/study/index.js';
import { countDays, practice } from '#lib/study/fixtures/streak.js';

const finish = (state: State, at: string) => {
	const a = practice(`p-${at}`, ['你'], new Date(at))[0];
	return apply(state, a, new Date(a.at));
};

const before = () =>
	countDays(initialState({ curriculum: CURRICULUM }), '2026-11-01', '2026-11-12');

export const SCENARIOS = {
	record13: (): StudyEvent[] => finish(before(), '2026-11-13T05:00:00Z').events,
	gift14: (): StudyEvent[] =>
		finish(finish(before(), '2026-11-13T05:00:00Z').state, '2026-11-14T05:00:00Z').events,
	full6: (): StudyEvent[] => [
		{ type: 'DayCounted', day: '2026-11-13', streak: 6, record: false, freezes: 2 }
	],
	sameDay: (): StudyEvent[] =>
		finish(finish(before(), '2026-11-13T05:00:00Z').state, '2026-11-13T09:00:00Z').events
};
