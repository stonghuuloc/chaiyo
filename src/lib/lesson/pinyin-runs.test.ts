import { describe, expect, it } from 'vitest';
import { pinyinRuns } from './pinyin-runs';

describe('pinyinRuns', () => {
	it('Given_ExplainWithNiHao_When_Split_Then_TwoPinyinRuns', () => {
		// Arrange
		const text = 'viết nǐ hǎo, không';

		// Act
		const runs = pinyinRuns(text);

		// Assert
		expect(runs).toEqual([
			{ text: 'viết ', pinyin: false },
			{ text: 'nǐ', pinyin: true },
			{ text: ' ', pinyin: false },
			{ text: 'hǎo', pinyin: true },
			{ text: ', không', pinyin: false }
		]);
	});

	it('Given_VietnameseOnly_When_Split_Then_OneProseRun', () => {
		// Arrange
		const text = 'Hai thanh ba đi liền, thanh 2 đọc là mà má';

		// Act
		const runs = pinyinRuns(text);

		// Assert
		expect(runs).toEqual([{ text, pinyin: false }]);
	});

	it('Given_Empty_When_Split_Then_NoRuns', () => {
		// Arrange / Act
		const runs = pinyinRuns('');

		// Assert
		expect(runs).toEqual([]);
	});

	it('Given_MacronUmlautWord_When_Split_Then_OneRunWithoutNormalize', () => {
		// Arrange
		const text = 'lǜ nǚ';

		// Act
		const runs = pinyinRuns(text);

		// Assert
		expect(runs.map((r) => r.text).join('')).toBe(text);
		expect(runs.filter((r) => r.pinyin).map((r) => r.text)).toEqual(['lǜ', 'nǚ']);
	});
});
