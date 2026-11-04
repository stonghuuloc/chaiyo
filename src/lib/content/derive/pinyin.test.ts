import { describe, expect, it } from 'vitest';
import { splitSyllables, withTone } from './pinyin';

const syls = (p: string, n: number) => splitSyllables(p, n).clauses.map((c) => c.map((s) => s.syl));

describe('splitSyllables', () => {
	it('aligns erhua without throwing', () => {
		const r = splitSyllables('yǒudiǎnr', 3);
		expect(r.aligned).toBe(true);
		expect(r.clauses[0].map((s) => s.syl)).toEqual(['yǒu', 'diǎnr']);
		expect(r.clauses[0][1].erhua).toBe(true);
	});

	it.each([
		['jǐnguǎn', 2, ['jǐn', 'guǎn']],
		['huáiniàn', 2, ['huái', 'niàn']],
		['wūrǎn', 2, ['wū', 'rǎn']]
	])('splits %s by the spelling rule', (p, n, expected) => {
		expect(syls(p, n)).toEqual([expected]);
	});

	it('treats an apostrophe as a syllable boundary, not a clause break', () => {
		const r = splitSyllables("Xī'ān", 2);
		expect(r.clauses).toHaveLength(1);
		expect(r.clauses[0].map((s) => s.syl)).toEqual(['Xī', 'ān']);
	});

	it('groups syllables by clause', () => {
		expect(syls('nǐ yǐjīng yǒu hǎo', 5)).toEqual([['nǐ', 'yǐ', 'jīng', 'yǒu', 'hǎo']]);
		expect(syls('yǐhòu, nǐ', 3)).toEqual([['yǐ', 'hòu'], ['nǐ']]);
	});

	it('uses the char count to pick a split', () => {
		expect(syls('xiānsheng', 2)).toEqual([['xiān', 'sheng']]);
	});

	it('keeps capitals', () => {
		expect(syls('Xiǎo', 1)).toEqual([['Xiǎo']]);
	});

	it('reports a count mismatch', () => {
		expect(splitSyllables('yī gè', 1).aligned).toBe(false);
	});

	it('pairs 哪儿 as one erhua syllable', () => {
		const r = splitSyllables('nǎr', 2);
		expect(r.aligned).toBe(true);
		expect(r.clauses[0]).toHaveLength(1);
		expect(r.clauses[0][0]).toMatchObject({ syl: 'nǎr', charIndex: 0, erhua: true });
	});

	it('skips 儿 when computing charIndex after erhua', () => {
		const r = splitSyllables('yǒudiǎnr bùduì', 5);
		expect(r.aligned).toBe(true);
		expect(r.clauses[0].map((s) => s.charIndex)).toEqual([0, 1, 3, 4]);
		const j = splitSyllables('yǒudiǎnr jǐnzhāng', 5);
		expect(j.clauses[0].find((s) => s.syl === 'jǐn')?.charIndex).toBe(3);
	});

	it('never treats an er syllable as erhua', () => {
		const r = splitSyllables("nǚ'ér", 2);
		expect(r.aligned).toBe(true);
		expect(r.clauses[0].map((s) => s.erhua)).toEqual([undefined, undefined]);
	});
});

describe('withTone', () => {
	it('keeps toneless syllables', () => expect(withTone('m', 2)).toBe('m'));
	it('keeps capitals', () => expect(withTone('Ā', 2)).toBe('Á'));
	it('replaces the marked vowel', () => expect(withTone('hǎo', 2)).toBe('háo'));
});
