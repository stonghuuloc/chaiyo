import { describe, expect, it } from 'vitest';
import { att, T } from './fixtures';
import { key, order } from './order';
import type { Input } from './types';

const save = (word: string, at: number): Input => ({
	kind: 'saved',
	word,
	at: new Date(at).toISOString()
});

describe('order', () => {
	it('Given_TwoInputs_When_Sorted_Then_EarlierAtFirst', () => {
		// Arrange
		const late = att('a-1', T + 1000, '你', 'the', true);
		const early = att('a-2', T, '你', 'the', true);
		// Act
		const sorted = [late, early].sort(order);
		// Assert
		expect(sorted).toEqual([early, late]);
	});

	it('Given_SameAt_When_Sorted_Then_SaveBeforeAttempt', () => {
		// Arrange
		const attempt = att('a-1', T, '你', 'the', true);
		const saved = save('你', T);
		// Act
		const sorted = [attempt, saved].sort(order);
		// Assert
		expect(sorted).toEqual([saved, attempt]);
	});

	it('Given_SameAtAndKind_When_Sorted_Then_KeyAscending', () => {
		// Arrange
		const b = att('a-b', T, '你', 'the', true);
		const a = att('a-a', T, '你', 'the', true);
		// Act
		const sorted = [b, a].sort(order);
		// Assert
		expect(sorted.map(key)).toEqual(['a:a-a', 'a:a-b']);
	});
});
