import { LEVELS } from '#lib/curriculum/index.js';
import { addDays } from '#lib/lesson/streak-popup.js';
import {
	bars,
	currentLevel,
	localDate,
	rollover,
	type Skill,
	type State
} from '#lib/study/index.js';
import { outlineIds } from '../roadmap/roadmap';

export type HaveNeed = { have: number; need: number };
export type SkillMem = { skill: Skill; firm: number; shaky: number; unseen: number; size: number };
export type MeStats = {
	level: number;
	lessons: HaveNeed;
	words: HaveNeed;
	streak: { count: number; freezes: number; best: number };
	skills: SkillMem[];
};

const SKILLS: Skill[] = ['the', 'nghe', 'viet'];

export function meStats(state: State, now: Date): MeStats {
	const level = currentLevel(state);
	const ids = outlineIds(level);
	const entries = Object.values(state.lexicon);
	const today = localDate(now, state.tz);
	const k =
		state.streak.last === today ? state.streak : rollover(state, addDays(today, -1)).state.streak;
	return {
		level,
		lessons: { have: ids.filter((id) => state.lessons[id]?.passed).length, need: ids.length },
		words: { have: entries.length, need: LEVELS.find((o) => o.level === level)?.words ?? 0 },
		streak: { count: k.count, freezes: k.freezes, best: k.best ?? k.count },
		skills: SKILLS.map((skill) => {
			const grades = entries.map((e) => bars(e.cards[skill]));
			const firm = grades.filter((b) => b >= 2).length;
			const shaky = grades.filter((b) => b === 1).length;
			return { skill, firm, shaky, unseen: grades.length - firm - shaky, size: grades.length };
		})
	};
}
