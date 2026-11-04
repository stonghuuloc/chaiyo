import { describe, expect, it } from 'vitest';
import { badPinyin, ideographs, pathOf, stripTones } from './util';

describe('lint util', () => {
	it('stripTones drops tone marks and keeps ü', () => {
		expect(stripTones('nǐ hǎo')).toBe('ni hao');
		expect(stripTones('lǜ')).toBe('lü');
	});

	it('badPinyin flags digits and unmarked syllables outside the neutral list', () => {
		expect(badPinyin('nǐ hao3')).toBe('digit');
		expect(badPinyin('ni hao')).toBe('no tone mark');
		expect(badPinyin('ni')).toBe('no tone mark');
		expect(badPinyin('men')).toBeNull();
		expect(badPinyin('qi lai')).toBeNull();
	});

	it('badPinyin reads decomposed and capital marks', () => {
		expect(badPinyin('ni\u030c')).toBeNull();
		expect(badPinyin('Ā')).toBeNull();
	});

	it('ideographs keeps only CJK ideographs', () => {
		expect(ideographs('你好！ ab')).toEqual(['你', '好']);
	});

	it('pathOf matches the parse.ts path format', () => {
		expect(pathOf(['sections', 'words', 'ids', 3])).toBe('sections.words.ids[3]');
	});
});
