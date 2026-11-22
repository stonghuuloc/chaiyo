import { localDate } from './dates';
import type { State, StudyEvent } from './types';

export const MAX_FREEZES = 2;

const addDays = (day: string, n: number) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

function closeDays(streak: State['streak'], until: string, events: StudyEvent[]): State['streak'] {
	let k = streak;
	if (!k.last) return k;
	for (let d = addDays(k.through ?? k.last, 1); d <= until; d = addDays(d, 1)) {
		if (k.freezes > 0) {
			k = { ...k, freezes: k.freezes - 1 };
			events.push({ type: 'FreezeSpent', day: d, freezes: k.freezes });
		} else if (k.count > 0) {
			k = { ...k, count: 0 };
			events.push({ type: 'StreakReset', day: d });
		}
		k = { ...k, through: d };
	}
	return k;
}

export function countDay(s: State, now: Date): { state: State; events: StudyEvent[] } {
	const day = localDate(now, s.tz);
	if (s.streak.last && day <= (s.streak.through ?? s.streak.last)) return { state: s, events: [] };
	const events: StudyEvent[] = [];
	const closed = closeDays(s.streak, addDays(day, -1), events);
	const before = closed.best ?? 0;
	const count = closed.count + 1;
	let freezes = closed.freezes;
	const earned = count % 7 === 0 && freezes < MAX_FREEZES;
	if (earned) freezes += 1;
	events.push({
		type: 'DayCounted',
		day,
		streak: count,
		record: before >= 1 && count > before,
		freezes
	});
	if (earned) events.push({ type: 'FreezeEarned', freezes });
	return {
		state: {
			...s,
			streak: { count, last: day, freezes, through: day, best: Math.max(before, count) }
		},
		events
	};
}

/**
 * Closes every date up to `day`, spending a Freeze or resetting the count for each missed one.
 * `day` must be a date that has already ended in `state.tz`, normally yesterday: passing today
 * before the learner studies closes it as missed. Returns a view for the caller; later Attempts are
 * folded from the Attempts, never onto a rolled-over State.
 */
export function rollover(state: State, day: string): { state: State; events: StudyEvent[] } {
	const events: StudyEvent[] = [];
	const streak = closeDays(state.streak, day, events);
	return { state: streak === state.streak ? state : { ...state, streak }, events };
}
