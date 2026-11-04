import type { Lesson } from '../schemas';

export function gateCoverage(lesson: Lesson): Record<string, string[]> {
	const coverage: Record<string, string[]> = Object.create(null);
	for (const id of lesson.sections.words.ids) coverage[id] = [];
	for (const q of lesson.gate.pool)
		for (const id of new Set(q.tests.words ?? [])) coverage[id]?.push(q.id);
	return coverage;
}
