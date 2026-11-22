import { describe, expect, it } from 'vitest';
import { vietVerdict, wrongTotal } from './viet';

const clean = { total: 0, peeked: false, unsure: false, loadFailed: false };

describe('vietVerdict', () => {
	it('Given_ThreeWrong_When_Verdict_Then_Hit', () => {
		// Arrange / Act
		const v = vietVerdict({ ...clean, total: 3 });

		// Assert
		expect(v).toBe('hit');
		expect(vietVerdict(clean)).toBe('hit');
	});

	it('Given_FourWrong_When_Verdict_Then_Miss', () => {
		// Arrange / Act
		const v = vietVerdict({ ...clean, total: 4 });

		// Assert
		expect(v).toBe('miss');
	});

	it('Given_ZeroWrongAndPeek_When_Verdict_Then_Miss', () => {
		// Arrange / Act
		const v = vietVerdict({ ...clean, peeked: true });

		// Assert
		expect(v).toBe('miss');
	});

	it('Given_Unsure_When_Verdict_Then_Miss', () => {
		// Arrange / Act
		const v = vietVerdict({ ...clean, unsure: true });

		// Assert
		expect(v).toBe('miss');
	});

	it('Given_LoadFailed_When_Verdict_Then_Skip', () => {
		// Arrange / Act
		const v = vietVerdict({ ...clean, loadFailed: true, unsure: true, peeked: true, total: 9 });

		// Assert
		expect(v).toBe('skip');
	});

	it('Given_NiHaoTwoPlusTwo_When_Total_Then_Miss', () => {
		// Arrange
		const total = wrongTotal([2, 2]);

		// Act
		const v = vietVerdict({ ...clean, total });

		// Assert
		expect(total).toBe(4);
		expect(v).toBe('miss');
	});
});
