import { localDate } from './dates';
import type { State, StudyEvent } from './types';

export function countDay(s: State, now: Date): { state: State; events: StudyEvent[] } {
	const day = localDate(now, s.tz);
	if (s.streak.last && day <= s.streak.last) return { state: s, events: [] };
	const count = s.streak.count + 1;
	return {
		state: { ...s, streak: { count, last: day } },
		events: [{ type: 'DayCounted', day, streak: count }]
	};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const rollover = (state: State, _day: string): { state: State; events: StudyEvent[] } => ({
	state,
	events: []
});
