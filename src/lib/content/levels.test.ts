import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { loadRefs } from './lint/refs';

type Planned = { id: string; title: string; titleHanzi: string; std: number[] };
type Outline = { level: number; topics: { title: string; lessons: Planned[] }[] };

const content = resolve(process.cwd(), 'content');
const read = <T>(path: string): T => YAML.parse(readFileSync(path, 'utf8')) as T;
const outline = read<Outline>(resolve(content, 'levels/hsk1.yaml'));
const lessons = outline.topics.flatMap((t) => t.lessons);
const { syllabus } = loadRefs().refs;
const levelItems = (level: number) => [...syllabus].filter(([, l]) => l === level).map(([n]) => n);

const written = lessons
	.map((p) => ({ p, file: resolve(content, `lessons/hsk1/${p.id}.yaml`) }))
	.filter(({ file }) => existsSync(file));

describe('HSK1 outline (content/levels/hsk1.yaml)', () => {
	it('lists 40 lessons h1-01 to h1-40 in order', () => {
		expect(lessons.map((l) => l.id)).toEqual(
			Array.from({ length: 40 }, (_, i) => `h1-${String(i + 1).padStart(2, '0')}`)
		);
	});

	it('teaches every level-1 grammar item and nothing above level 1', () => {
		const planned = new Set(lessons.flatMap((l) => l.std));
		expect(levelItems(1).filter((n) => !planned.has(n))).toEqual([]);
		expect([...planned].filter((n) => syllabus.get(n) !== 1)).toEqual([]);
	});

	it('gives every lesson at least one grammar item', () => {
		expect(lessons.filter((l) => !l.std.length).map((l) => l.id)).toEqual([]);
	});

	it.each(written.map(({ p, file }) => [p.id, p, file] as const))(
		'%s matches its outline row',
		(_, p, file) => {
			const lesson = read<{
				title: string;
				titleHanzi: string;
				sections: { grammar: { ids: string[] } };
			}>(file);
			const taught = lesson.sections.grammar.ids.flatMap(
				(id) => read<{ std: number[] }>(resolve(content, `grammar/${id}.yaml`)).std
			);
			expect([lesson.title, lesson.titleHanzi]).toEqual([p.title, p.titleHanzi]);
			expect(p.std.filter((n) => !taught.includes(n))).toEqual([]);
		}
	);
});
