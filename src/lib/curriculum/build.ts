import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadContentDir } from '#lib/content/lint/load.js';
import type { Lesson, Primer } from '#lib/content/schemas.js';
import type { Curriculum } from '#lib/study/index.js';
import { numberOf, outlineNumbers } from './numbers';

export type CurriculumLesson = Curriculum['lessons'][number] & {
	n: number;
	title: string;
	titleHanzi: string;
};

export type LevelLesson = { id: string; title: string; titleHanzi?: string };
export type LevelOutline = {
	level: number;
	words: number;
	topics: { title: string; lessons: LevelLesson[] }[];
};

const ORDER: (keyof Lesson['sections'] | keyof Primer['sections'])[] = [
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
		throw new Error(
			`curriculum: ${errors.map((e) => `${e.file} ${e.path}: ${e.message}`).join('; ')}`
		);
	if (set.lessons.length === 0) throw new Error(`curriculum: no lessons in ${contentDir}/lessons`);
	const nums = outlineNumbers(buildLevels(contentDir));
	return set.lessons
		.map((l) => l.value)
		.sort((a, b) => a.level - b.level || a.order - b.order)
		.map((l) => ({
			id: l.id,
			level: l.level,
			n: 'kind' in l ? 0 : numberOf(nums, l.id),
			title: l.title,
			titleHanzi: l.titleHanzi,
			sections: ORDER.filter((k) => k in l.sections),
			words: 'words' in l.sections ? l.sections.words.ids : [],
			...('kind' in l ? { testOut: true as const } : {})
		}));
}

export function buildLevels(contentDir: string): LevelOutline[] {
	const dir = join(contentDir, 'levels');
	return readdirSync(dir)
		.filter((f) => /^hsk\d+\.yaml$/.test(f))
		.map((f) => YAML.parse(readFileSync(join(dir, f), 'utf8')) as LevelOutline)
		.map((o) => ({
			level: o.level,
			words: o.words,
			topics: o.topics.map((t) => ({
				title: t.title,
				lessons: t.lessons.map((l) => ({
					id: l.id,
					title: l.title,
					...(l.titleHanzi ? { titleHanzi: l.titleHanzi } : {})
				}))
			}))
		}))
		.sort((a, b) => a.level - b.level);
}
