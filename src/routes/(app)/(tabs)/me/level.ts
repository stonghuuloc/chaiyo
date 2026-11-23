import { LEVELS } from '#lib/curriculum/index.js';
import { outlineNumbers } from '#lib/curriculum/numbers.js';
import { currentLevel, localDate, type State } from '#lib/study/index.js';
import { outlineIds } from '../roadmap/roadmap';

export type MeLevel = {
	level: number;
	pct: number;
	cur: number | null;
	band: 1 | 2 | 3 | 4;
	last: number;
	next: number | null;
};

const NUMS = outlineNumbers(LEVELS);

export function meLevel(state: State): MeLevel {
	const level = currentLevel(state);
	const ids = outlineIds(level);
	const done = ids.filter((id) => state.lessons[id]?.passed).length;
	const count = ids.length;
	const gap = ids.find((id) => !state.lessons[id]?.passed);
	return {
		level,
		pct: count ? Math.floor((done / count) * 100) : 0,
		cur: gap ? (NUMS.get(gap) ?? null) : null,
		band: done === 0 ? 1 : done < count / 2 ? 2 : done < count ? 3 : 4,
		last: NUMS.get(ids.at(-1) ?? '') ?? 0,
		next: LEVELS.some((o) => o.level === level + 1) ? level + 1 : null
	};
}

export const joinedMonth = (createdAt: string, tz: string) => {
	const [y, m] = localDate(new Date(createdAt), tz).split('-');
	return { month: Number(m), year: Number(y) };
};
