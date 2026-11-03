import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from './parse';

const content = (p: string) => resolve(process.cwd(), 'content', p);

describe('content layout', () => {
	it('content tree has every path from content-schema Files', () => {
		const paths = [
			'cast.yaml',
			'chars',
			'words',
			'grammar',
			'levels',
			'lessons/hsk1',
			'syllables.yaml',
			'mock/hsk1'
		];
		expect(paths.filter((p) => !existsSync(content(p)))).toEqual([]);
	});

	it('syllables.yaml parses as Syllables with 400-420 rows', () => {
		const result = parseContent(
			'Syllables',
			'syllables.yaml',
			readFileSync(content('syllables.yaml'), 'utf8')
		);
		expect(result.ok).toBe(true);
		const rows = (result.ok ? result.value : []) as unknown[];
		expect(rows.length).toBeGreaterThanOrEqual(400);
		expect(rows.length).toBeLessThanOrEqual(420);
	});
});
