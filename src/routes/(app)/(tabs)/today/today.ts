import { LESSONS } from '#lib/curriculum/index.js';
import { currentLevel, localDate, rollover, type State } from '#lib/study/index.js';

export type Cta =
	| { kind: 'reviews' }
	| { kind: 'lesson'; id: string; n: number }
	| { kind: 'thi'; level: number }
	| { kind: 'done' };
export type Scene = 'reviews-due' | 'lesson-next' | 'day-done' | 'streak-at-risk' | 'freeze-used';
export type TodayState = { cta: Cta; scene: Scene };

const dayBefore = (day: string) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};

function cta(state: State, today: string): Cta {
	const due = Object.values(state.lexicon).some((e) =>
		Object.values(e.cards).some((c) => c && localDate(new Date(c.due), state.tz) <= today)
	);
	if (due) return { kind: 'reviews' };
	const open = state.curriculum.lessons.find(
		(l) => state.lessons[l.id]?.unlocked && !state.lessons[l.id]?.passed
	);
	if (open)
		return { kind: 'lesson', id: open.id, n: LESSONS.find((l) => l.id === open.id)?.n ?? 0 };
	const level = currentLevel(state);
	const own = state.curriculum.lessons.filter((l) => l.level === level);
	if (own.length && own.every((l) => state.lessons[l.id]?.passed)) return { kind: 'thi', level };
	return { kind: 'done' };
}

export function todayState(state: State, now: Date): TodayState {
	const today = localDate(now, state.tz);
	const next = cta(state, today);
	const counted = state.streak.last === today;
	if (!counted) {
		const yesterday = dayBefore(today);
		const r = rollover(state, yesterday);
		if (r.events.some((e) => e.type === 'FreezeSpent' && e.day === yesterday))
			return { cta: next, scene: 'freeze-used' };
		if (r.state.streak.count > 0 && r.state.streak.freezes === 0)
			return { cta: next, scene: 'streak-at-risk' };
	}
	if (counted || next.kind === 'done') return { cta: next, scene: 'day-done' };
	return { cta: next, scene: next.kind === 'reviews' ? 'reviews-due' : 'lesson-next' };
}
