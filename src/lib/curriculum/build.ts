import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Curriculum } from '#lib/study/index.js';

type Lesson = {
	kind?: string;
	id: string;
	level: number;
	order: number;
	title: string;
	titleHanzi: string;
	sections: Record<string, { ids?: string[] }>;
};

export type CurriculumLesson = Curriculum['lessons'][number] & {
	n: number;
	title: string;
	titleHanzi: string;
};

export function buildCurriculum(contentDir: string): CurriculumLesson[] {
	const dir = join(contentDir, 'lessons');
	const lessons = readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((f) => f.endsWith('.yaml'))
		.map((f) => parse(readFileSync(join(dir, f), 'utf8')) as Lesson)
		.sort((a, b) => a.level - b.level || a.order - b.order);
	return lessons.map((l, n) => ({
		id: l.id,
		level: l.level,
		n,
		title: l.title,
		titleHanzi: l.titleHanzi,
		sections: Object.keys(l.sections).filter((k) => k !== 'warmup'),
		words: l.sections.words?.ids ?? [],
		...(l.kind === 'primer' ? { testOut: true as const } : {})
	}));
}
