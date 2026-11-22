import { LESSONS } from '#lib/curriculum/index.js';
import { currentLevel, type State } from '#lib/study/index.js';

export type ThiLine = 'passed' | 'next' | 'ready' | 'after';
export type ThiChip = { level: number; lock: boolean; line: ThiLine; lesson?: number };

const LEVELS = [1, 2, 3, 4, 5, 6];

export function thiChips(state: State): { chips: ThiChip[]; selected: number } {
	const mine = currentLevel(state);
	const own = state.curriculum.lessons.filter((l) => l.level === mine);
	const ready = own.length > 0 && own.every((l) => state.lessons[l.id]?.passed);
	const lesson = LESSONS.filter((l) => l.level === mine).at(-1)?.n;
	const chips = LEVELS.map((level): ThiChip => {
		if (level < mine) return { level, lock: false, line: 'passed' };
		if (level > mine) return { level, lock: true, line: 'after' };
		return ready
			? { level, lock: false, line: 'ready' }
			: { level, lock: false, line: 'next', lesson };
	});
	return { chips, selected: mine };
}
