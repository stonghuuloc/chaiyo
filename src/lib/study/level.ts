import type { State } from './types';

export const currentLevel = (s: State): number =>
	s.curriculum.lessons.reduce(
		(top, l) => (s.lessons[l.id]?.unlocked ? Math.max(top, l.level) : top),
		1
	);
