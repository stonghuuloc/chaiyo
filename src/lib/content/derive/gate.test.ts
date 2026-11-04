import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../parse';
import type { Lesson } from '../schemas';
import { gateCoverage } from './gate';

const q = (id: string, words?: string[]) => ({ id, tests: { words } });

const lessonOf = (ids: string[], pool: ReturnType<typeof q>[]) =>
	({ sections: { words: { ids } }, gate: { pool, draw: 10 } }) as unknown as Lesson;

describe('gateCoverage', () => {
	it('maps each lesson word to the pool questions that test it', () => {
		const lesson = {
			sections: { words: { ids: ['你好', '好', '再见'] } },
			gate: { pool: [q('q1', ['你好']), q('q2', ['你好', '好', '不在课']), q('q3')], draw: 10 }
		} as unknown as Lesson;
		expect(gateCoverage(lesson)).toEqual({ 你好: ['q1', 'q2'], 好: ['q2'], 再见: [] });
	});

	it('adds a question once per word and survives prototype-named ids', () => {
		const cov = gateCoverage(
			lessonOf(['你好', 'constructor', '__proto__'], [q('q1', ['你好', '你好', 'constructor'])])
		);
		expect(cov['你好']).toEqual(['q1']);
		expect(cov['constructor']).toEqual(['q1']);
		expect(cov['__proto__']).toEqual([]);
	});

	it('has a key per word of the real h1-01 lesson', () => {
		const text = readFileSync(resolve(process.cwd(), 'content/lessons/hsk1/h1-01.yaml'), 'utf8');
		const parsed = parseContent('Lesson', 'lessons/hsk1/h1-01.yaml', text);
		if (!parsed.ok) throw new Error('h1-01 does not parse');
		const lesson = parsed.value as Lesson;
		expect(Object.keys(gateCoverage(lesson)).sort()).toEqual([...lesson.sections.words.ids].sort());
		expect(lesson.sections.words.ids).toHaveLength(10);
	});
});
