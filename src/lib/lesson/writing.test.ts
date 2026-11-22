import { describe, expect, it } from 'vitest';
import { joinChars, practised, skippedFrom, writingSteps } from './writing';

describe('writing helpers', () => {
	it('Given_3Chars_When_WritingSteps_Then_6StableIdsInRoundOrder', () => {
		// Arrange
		const skipped = new Set<string>();

		// Act
		const steps = writingSteps(['你', '好', '们'], skipped);

		// Assert
		expect(steps.map((s) => s.id)).toEqual([
			'write-你-1',
			'write-你-2',
			'write-好-1',
			'write-好-2',
			'write-们-1',
			'write-们-2'
		]);
		expect(steps.map((s) => s.round)).toEqual([1, 2, 1, 2, 1, 2]);
		expect(steps.every((s) => s.kind === 'write' && s.skipped === skipped)).toBe(true);
	});

	it('Given_MarkerFalse_When_SkippedFrom_Then_ReturnsChar', () => {
		// Arrange
		const answers = { 'write-你-1': true, 'write-你-2': true, 'write-好-1': false };

		// Act
		const skipped = skippedFrom(answers, ['你', '好', '们']);

		// Assert
		expect([...skipped]).toEqual(['好']);
	});

	it('Given_NoAnswers_When_SkippedFrom_Then_Empty', () => {
		// Arrange
		// Act
		const skipped = skippedFrom({}, ['你']);

		// Assert
		expect(skipped.size).toBe(0);
	});

	it('Given_SkippedChar_When_Practised_Then_KeepsContentOrderWithoutIt', () => {
		// Arrange
		// Act
		const list = practised(['你', '好', '们'], new Set(['好']));

		// Assert
		expect(list).toEqual(['你', '们']);
	});

	it('Given_2Chars_When_JoinChars_Then_UsesVa', () => {
		// Arrange
		// Act
		const text = joinChars(['你', '们']);

		// Assert
		expect(text).toBe('你 và 们');
	});

	it('Given_3Chars_When_JoinChars_Then_CommaThenVa', () => {
		// Arrange
		// Act
		const text = joinChars(['你', '好', '们']);

		// Assert
		expect(text).toBe('你, 好 và 们');
	});

	it('Given_1Char_When_JoinChars_Then_CharOnly', () => {
		// Arrange
		// Act
		const text = joinChars(['你']);

		// Assert
		expect(text).toBe('你');
	});

	it('Given_NoChars_When_JoinChars_Then_Empty', () => {
		// Arrange
		// Act
		const text = joinChars([]);

		// Assert
		expect(text).toBe('');
	});
});
