import type { Lesson, Primer } from '../schemas';

export function deriveBacklinks(lessons: (Lesson | Primer)[]): {
	taughtIn: Record<string, string>;
	listedIn: Record<string, string[]>;
} {
	const listedIn: Record<string, string[]> = Object.create(null);
	const ordered = lessons
		.filter((l): l is Lesson => !('kind' in l && l.kind === 'primer'))
		.sort((a, b) => a.level - b.level || a.order - b.order || a.id.localeCompare(b.id));
	for (const lesson of ordered)
		for (const id of new Set(lesson.sections.words.ids)) (listedIn[id] ??= []).push(lesson.id);
	const taughtIn = Object.fromEntries(Object.entries(listedIn).map(([id, ids]) => [id, ids[0]]));
	return { taughtIn, listedIn };
}
