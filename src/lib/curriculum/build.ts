import { loadContentDir } from '#lib/content/lint/load.js';
import type { Curriculum } from '#lib/study/index.js';

export type CurriculumLesson = Curriculum['lessons'][number] & {
	n: number;
	title: string;
	titleHanzi: string;
};

const ORDER = [
	'tones',
	'finals',
	'initials',
	'spelling',
	'sandhi',
	'words',
	'grammar',
	'dialogue',
	'reading',
	'listenSpeak',
	'writing'
];

export function buildCurriculum(contentDir: string): CurriculumLesson[] {
	const { set, errors } = loadContentDir(contentDir, { only: ['lessons'] });
	if (errors.length > 0)
		throw new Error(`curriculum: ${errors.map((e) => `${e.file} ${e.message}`).join('; ')}`);
	return set.lessons
		.map((l) => l.value)
		.sort((a, b) => a.level - b.level || a.order - b.order)
		.map((l, n) => ({
			id: l.id,
			level: l.level,
			n,
			title: l.title,
			titleHanzi: l.titleHanzi,
			sections: ORDER.filter((k) => k in l.sections),
			words: 'words' in l.sections ? l.sections.words.ids : [],
			...('kind' in l ? { testOut: true as const } : {})
		}));
}
