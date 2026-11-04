import type { Lesson } from '../schemas';

export function gateCoverage(lesson: Lesson): Record<string, string[]> {
	const coverage: Record<string, string[]> = Object.fromEntries(
		lesson.sections.words.ids.map((id) => [id, []])
	);
	for (const q of lesson.gate.pool) for (const id of q.tests.words ?? []) coverage[id]?.push(q.id);
	return coverage;
}
