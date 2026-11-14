import { describe, expect, it } from 'vitest';
import { progress } from './progress';

describe('progress', () => {
	it('Given_Index1Of6_When_Progress_Then_OneOnAndLabel2Of6', () => {
		// Arrange
		const index = 1;
		// Act
		const p = progress(index, 6);
		// Assert
		expect(p).toEqual({ on: 1, label: '2/6' });
	});

	it('Given_FirstStep_When_Progress_Then_NoneOnAndLabel1Of6', () => {
		expect(progress(0, 6)).toEqual({ on: 0, label: '1/6' });
	});

	it('Given_LastStep_When_Progress_Then_Label6Of6', () => {
		expect(progress(5, 6)).toEqual({ on: 5, label: '6/6' });
	});

	it('Given_IndexPastEnd_When_Progress_Then_LabelClampedToTotal', () => {
		expect(progress(6, 6).label).toBe('6/6');
	});
});
