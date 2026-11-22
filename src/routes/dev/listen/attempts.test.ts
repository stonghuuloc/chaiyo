import { describe, expect, it } from 'vitest';
import type { Row } from '#lib/ledger/idb.js';
import { attemptLines } from './attempts';

const attempt = (id: string, at: string, questionId: string, answer: string, correct: boolean) => ({
	key: `a:${id}`,
	synced: false,
	input: { id, at, questionId, contentSha: 'sha', correct, ms: 10, answer }
});

describe('attemptLines', () => {
	it('Given_StoredRows_When_AttemptLines_Then_AttemptsInTimeOrderWithoutSavedWords', () => {
		// Arrange
		const rows: Row[] = [
			attempt('b', '2026-11-22T10:00:02Z', 'q-h1-01-l02', '你好', true),
			{
				key: 's:好',
				synced: false,
				input: { kind: 'saved', word: '好', at: '2026-11-22T10:00:00Z' }
			},
			attempt('a', '2026-11-22T10:00:01Z', 'q-h1-01-l01', '2', false)
		];

		// Act
		const lines = attemptLines(rows);

		// Assert
		expect(lines).toEqual([
			{ id: 'a', step: 'q-h1-01-l01', pick: '2', correct: false },
			{ id: 'b', step: 'q-h1-01-l02', pick: '你好', correct: true }
		]);
	});
});
