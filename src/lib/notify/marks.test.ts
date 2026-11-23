import { describe, expect, it } from 'vitest';
import { memoryMarks } from './marks';

describe('memoryMarks', () => {
	it('Given_SameLearnerDay_When_ClaimTwice_Then_TrueThenFalse', async () => {
		const marks = memoryMarks();

		expect(await marks.claim('minh', '2026-11-23')).toBe(true);
		expect(await marks.claim('minh', '2026-11-23')).toBe(false);
	});

	it('Given_NextDay_When_Claim_Then_True', async () => {
		const marks = memoryMarks();
		await marks.claim('minh', '2026-11-23');

		expect(await marks.claim('minh', '2026-11-24')).toBe(true);
		expect(marks.keys.size).toBe(2);
	});
});
