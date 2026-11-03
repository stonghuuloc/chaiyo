import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { parseContent } from './parse';
import type { ContentType } from './schemas';

const cases: [ContentType, string, string][] = [
	['Lesson', 'lesson', 'level'],
	['Word', 'word', 'level'],
	['Char', 'char', 'strokes'],
	['Sentence', 'sentence', 'hanzi'],
	['GrammarPoint', 'grammar-point', 'std'],
	['Question', 'question', 'answer'],
	['Primer', 'primer', 'kind'],
	['Syllables', 'syllables', '[0].initial']
];

const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe.each(cases)('%s', (type, slug, wrongPath) => {
	it('parses the valid fixture and returns the typed object', () => {
		const text = read(`${slug}.valid.yaml`);
		const result = parseContent(type, `${slug}.valid.yaml`, text);
		expect(result).toEqual({ ok: true, value: YAML.parse(text) });
	});

	it('returns an error list with file and field path for the invalid fixture', () => {
		const file = `${slug}.invalid.yaml`;
		const result = parseContent(type, file, read(file));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].file).toBe(file);
		expect(result.errors[0].path).toBe(wrongPath);
	});
});
