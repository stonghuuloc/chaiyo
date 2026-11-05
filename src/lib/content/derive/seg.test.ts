import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../parse';
import type { Lesson } from '../schemas';
import { parseDictionary, type ThinEntry } from './dictionary';
import { deriveSeg, segment } from './seg';

const dictOf = (...words: string[]): ReadonlyMap<string, ThinEntry> =>
	new Map(words.map((w) => [w, { hanzi: w, pinyin: '', hanviet: '', meaning: '' }]));
const none: ReadonlySet<string> = new Set();

describe('segment', () => {
	it('uses the longest dictionary words and keeps punctuation as its own token', () => {
		expect(segment('你们好！', none, dictOf('你们', '好'))).toEqual(['你们', '好', '！']);
		expect(segment('你们好！', none, dictOf('你', '们', '好'))).toEqual(['你', '们', '好', '！']);
	});

	it('lets a longer dictionary word beat shorter lesson words', () => {
		expect(segment('你好吗', new Set(['你', '好']), dictOf('你好吗'))).toEqual(['你好吗']);
	});

	it('never cuts a lesson word with a same-length dictionary word', () => {
		const dict = dictOf('二', '十', '十分', '分钟');
		expect(segment('二十分钟', new Set(['分钟']), dict)).toEqual(['二', '十', '分钟']);
	});

	it('breaks a remaining tie toward the longer first token', () => {
		const dict = dictOf('二', '十', '十分', '分钟');
		expect(segment('二十分钟', none, dict)).toEqual(['二', '十分', '钟']);
	});

	it('prefers more lesson-covered chars at equal token count', () => {
		const dict = dictOf('AB', 'BC');
		expect(segment('ABC', new Set(['BC']), dict)).toEqual(['A', 'BC']);
		expect(segment('ABC', new Set(['AB']), dict)).toEqual(['AB', 'C']);
	});

	it('turns unknown hanzi into one-char tokens', () => {
		expect(segment('熊', none, dictOf('你'))).toEqual(['熊']);
	});

	it('keeps spaces, slash and plus as one-char tokens', () => {
		expect(segment('你 / 您 + 好', none, dictOf('你', '您', '好'))).toEqual([
			'你',
			' ',
			'/',
			' ',
			'您',
			' ',
			'+',
			' ',
			'好'
		]);
	});

	it('returns [] for empty text', () => {
		expect(segment('', none, dictOf('你'))).toEqual([]);
	});

	it('joins back to hanzi for every lesson sentence with the real dictionary', () => {
		const rows: unknown = JSON.parse(readFileSync('content/dictionary.json', 'utf8'));
		const parsed = parseDictionary('content/dictionary.json', rows);
		if (!parsed.ok) throw new Error('dictionary did not parse');
		const files = globSync('content/lessons/**/*.yaml');
		let sentences = 0;
		for (const file of files) {
			const text = readFileSync(file, 'utf8');
			if (/^kind: primer$/m.test(text)) continue;
			const result = parseContent('Lesson', file, text);
			if (!result.ok) throw new Error(`${file} did not parse`);
			for (const s of (result.value as Lesson).sentences ?? []) {
				sentences++;
				expect(segment(s.hanzi, none, parsed.value).join('')).toBe(s.hanzi);
			}
		}
		expect(sentences).toBeGreaterThan(0);
	});
});

describe('deriveSeg', () => {
	it('returns an authored seg untouched', () => {
		expect(deriveSeg({ hanzi: '你好', seg: ['你', '好'] }, none, dictOf('你好'))).toEqual([
			'你',
			'好'
		]);
	});

	it('segments hanzi when seg is absent', () => {
		expect(deriveSeg({ hanzi: '你好' }, none, dictOf('你好'))).toEqual(['你好']);
	});
});
