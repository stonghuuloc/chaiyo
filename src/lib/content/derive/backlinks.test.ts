import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../parse';
import type { Lesson, Primer } from '../schemas';
import { deriveBacklinks } from './backlinks';

const lesson = (id: string, level: number, order: number, words: string[]) =>
	({ id, level, order, sections: { words: { ids: words } } }) as unknown as Lesson;
const primer = { kind: 'primer', id: 'p-00', level: 1, order: 0 } as unknown as Primer;

describe('deriveBacklinks', () => {
	const h101 = lesson('h1-01', 1, 1, ['你好']);
	const h102 = lesson('h1-02', 1, 2, ['你好', '再见']);
	const expected = {
		taughtIn: { 你好: 'h1-01', 再见: 'h1-02' },
		listedIn: { 你好: ['h1-01', 'h1-02'], 再见: ['h1-02'] }
	};

	it('lists lessons in order and taughtIn is the first', () => {
		expect(deriveBacklinks([h101, h102])).toEqual(expected);
	});

	it('is independent of input order', () => {
		expect(deriveBacklinks([h102, h101])).toEqual(expected);
	});

	it('sorts level 2 after level 1', () => {
		const h201 = lesson('h2-01', 2, 1, ['再见']);
		expect(deriveBacklinks([h201, h102, h101]).listedIn['再见']).toEqual(['h1-02', 'h2-01']);
	});

	it('skips primers and unlisted words', () => {
		const r = deriveBacklinks([primer, h101]);
		expect(r.listedIn).toEqual({ 你好: ['h1-01'] });
		expect(r.taughtIn['再见']).toBeUndefined();
	});

	it('handles prototype-named word ids', () => {
		const r = deriveBacklinks([lesson('h1-01', 1, 1, ['constructor', '__proto__'])]);
		expect(r.taughtIn['constructor']).toBe('h1-01');
		expect(r.listedIn['__proto__']).toEqual(['h1-01']);
	});

	it('lists a lesson once per word', () => {
		expect(deriveBacklinks([lesson('h1-01', 1, 1, ['你好', '你好'])]).listedIn['你好']).toEqual([
			'h1-01'
		]);
	});

	it('teaches 你好 in h1-01 for the real content', () => {
		const text = readFileSync(resolve(process.cwd(), 'content/lessons/hsk1/h1-01.yaml'), 'utf8');
		const parsed = parseContent('Lesson', 'lessons/hsk1/h1-01.yaml', text);
		if (!parsed.ok) throw new Error('h1-01 does not parse');
		expect(deriveBacklinks([parsed.value as Lesson]).taughtIn['你好']).toBe('h1-01');
	});
});
