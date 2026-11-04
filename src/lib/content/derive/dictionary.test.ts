import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDictionary } from './dictionary';

describe('parseDictionary', () => {
	const rows: unknown = JSON.parse(readFileSync('content/dictionary.json', 'utf8'));

	it('parses the real file into 4,233 entries', () => {
		const result = parseDictionary('content/dictionary.json', rows);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.size).toBe(4233);
		const entry = result.value.get('你们');
		expect(entry?.hanzi).toBe('你们');
		expect(entry?.pinyin).toBe('nǐ men');
		expect(entry?.hanviet).toBe('nhĩ môn');
		expect(entry?.meaning.startsWith('các bạn')).toBe(true);
	});

	it('reports a numeric hanviet as one error at [0][3]', () => {
		const result = parseDictionary('d.json', [['你', 'nǐ', 'ni', 5, 'x', 1, [], []]]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({ file: 'd.json', path: '[0][3]' });
	});

	it('reports a non-array input without throwing', () => {
		const result = parseDictionary('d.json', { a: 1 });
		expect(result.ok).toBe(false);
	});

	it('keeps content/dictionary.json byte-identical to the prototype file', () => {
		expect(
			readFileSync('content/dictionary.json').equals(readFileSync('prototype/data/dict.json'))
		).toBe(true);
	});
});
