import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentDir } from '../lint';
import type { Question } from '../schemas';

// The roots the production build ships (scripts/build-content.sh and the CI import step).
export const PRODUCTION_ROOTS = ['lessons/hsk1'];

export function scopeFor(dir: string, roots: string[]): string[] {
	const only = roots.map((r) => r.replace(/\/$/, ''));
	const { set } = loadContentDir(dir, { only });
	const words = new Set<string>();
	const grammar = new Set<string>();
	const fromQuestion = (q: Question) => {
		for (const id of q.tests.words ?? []) words.add(id);
		for (const id of q.tests.grammar ?? []) grammar.add(id);
		if (!('prompt' in q) || q.prompt.kind === 'vi' || q.prompt.kind === 'syllable') return;
		if (existsSync(join(dir, 'words', `${q.prompt.ref}.yaml`))) words.add(q.prompt.ref);
	};
	for (const { value: lesson } of set.lessons) {
		if ('kind' in lesson) {
			for (const section of Object.values(lesson.sections)) section.drills.forEach(fromQuestion);
		} else {
			for (const id of lesson.sections.words.ids) words.add(id);
			for (const id of lesson.sections.grammar.ids) grammar.add(id);
			lesson.sections.grammar.drills.forEach(fromQuestion);
			lesson.sections.dialogue.questions.forEach(fromQuestion);
			lesson.sections.listenSpeak.items.forEach(fromQuestion);
		}
		lesson.gate.pool.forEach(fromQuestion);
	}
	const sorted = (ids: Set<string>) => [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	return [
		...only,
		'chars',
		'sentences',
		'syllables.yaml',
		...sorted(words).map((id) => `words/${id}.yaml`),
		...sorted(grammar).map((id) => `grammar/${id}.yaml`)
	];
}
