import { describe, expect, it } from 'vitest';
import { gradePinyin, norm, toMarks, toneOf } from './pinyin';

describe('pinyin', () => {
	it.each([
		['zai4jian4', 'zàijiàn'],
		['xie4xie', 'xièxie'],
		['xie4xie5', 'xièxie'],
		['ni3hao3', 'nǐhǎo'],
		['lü4', 'lǜ'],
		['gou3', 'gǒu'],
		['gui4', 'guì'],
		['zàijiàn', 'zàijiàn'],
		['', '']
	])('Given_%s_When_ToMarks_Then_%s', (input, marked) => {
		// Arrange
		const typed = norm(input);

		// Act
		const got = toMarks(typed);

		// Assert
		expect(got).toBe(marked);
	});

	it.each([
		['Lv4', 'lü4'],
		['LU:4', 'lü4'],
		["xi'an1", 'xian1'],
		['Ni3 Hao3', 'ni3hao3']
	])('Given_%s_When_Norm_Then_%s', (input, normed) => {
		// Arrange
		const raw = input;

		// Act
		const got = norm(raw);

		// Assert
		expect(got).toBe(normed);
	});

	it.each([
		['zai4jian4', 'zàijiàn', true],
		['zàijiàn', 'zàijiàn', true],
		['zai4 jian4', 'zàijiàn', true],
		['ZAI4JIAN4', 'zàijiàn', true],
		['zaijian', 'zàijiàn', false],
		['zai3jian4', 'zàijiàn', false],
		['xie4xie', 'xièxie', true],
		['xie4xie5', 'xièxie', true],
		['ni3 hao3', 'nǐ hǎo', true],
		['bu4ke4qi', 'bù kèqi', true],
		['bu2 ke4qi', 'bù kèqi', false],
		['lv4', 'lǜ', true],
		['', 'zàijiàn', false],
		['xie xie4', 'xièxie', false],
		['zaijian4', 'zàijiàn', false],
		['m2', 'm', true]
	])('Given_%s_When_GradeAgainst_%s_Then_%s', (input, answer, right) => {
		// Arrange
		const typed = input;

		// Act
		const got = gradePinyin(typed, answer);

		// Assert
		expect(got).toBe(right);
	});
});

describe('toneOf', () => {
	it.each([
		['mā', 1],
		['má', 2],
		['mǎ', 3],
		['mà', 4],
		['ǚ', 3],
		['nǐ hǎo', 3]
	])('Given_MarkedSyllables_When_ToneOf_Then_OneToFour: %s', (input, tone) => {
		// Arrange
		const text = input;

		// Act
		const got = toneOf(text);

		// Assert
		expect(got).toBe(tone);
	});

	it.each(['an', 'ma', ''])('Given_Unmarked_When_ToneOf_Then_Null: "%s"', (input) => {
		// Arrange
		const text = input;

		// Act
		const got = toneOf(text);

		// Assert
		expect(got).toBeNull();
	});
});
