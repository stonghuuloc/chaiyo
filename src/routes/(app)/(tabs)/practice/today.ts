import { minutes, session, type Skill, type State } from '#lib/study/index.js';

const ORDER: Skill[] = ['the', 'nghe', 'viet'];

export type TodayView = { chips: { skill: Skill; n: number }[]; minutes: number };

export function todayView(state: State, now: Date): TodayView | null {
	const cards = session(state, { now, tz: state.tz });
	if (!cards.length) return null;
	const chips = ORDER.map((skill) => ({ skill, n: cards.filter((c) => c.skill === skill).length }));
	return { chips: chips.filter((c) => c.n > 0), minutes: minutes(cards) };
}
