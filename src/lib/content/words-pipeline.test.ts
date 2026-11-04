import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from './parse';

const fixtures = resolve(process.cwd(), 'scripts/tests/fixtures/out');
const read = (path: string) => readFileSync(resolve(fixtures, path), 'utf8');

describe('gen-entries output', () => {
	it.each([
		['Word', 'words/打.yaml'],
		['Word', 'words/打-da2.yaml'],
		['Sentences', 'sentences/hsk1.yaml']
	] as const)('%s fixture %s parses under the content schemas', (type, path) => {
		expect(parseContent(type, path, read(path))).toMatchObject({ ok: true });
	});

	it('rejects rare: false on a sense', () => {
		const text = read('words/打.yaml').replace('rare: true', 'rare: false');
		const result = parseContent('Word', 'words/打.yaml', text);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.map((e) => e.path)).toContain('senses[1].rare');
	});
});
