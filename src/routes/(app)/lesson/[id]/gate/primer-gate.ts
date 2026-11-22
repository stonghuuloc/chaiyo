import type { LessonContent } from '#lib/catalog/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { shuffle } from '#lib/placement/shuffle.js';
import { drillStep } from '../[section]/primer';

const SECTIONS = ['tones', 'finals', 'initials', 'spelling', 'sandhi'] as const;

export function primerGate(c: LessonContent, random: () => number): LessonStep[] {
	if (!('kind' in c.lesson)) return [];
	const { pool, draw } = c.lesson.gate;
	const per = draw / SECTIONS.length;
	const picked = SECTIONS.flatMap((s) =>
		shuffle(
			pool.filter((q) => q.section === s),
			random
		).slice(0, per)
	);
	return shuffle(
		picked.map((q) => drillStep(c, q)),
		random
	);
}
