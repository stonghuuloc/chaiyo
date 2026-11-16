import { describe, expect, it } from 'vitest';
import { toAttempt } from './attempt';

const ctx = { lesson: 'h1-01', section: 'words', contentSha: 'sha1', run: 'r1', of: 6 };
const ids = { id: 'a1', at: '2026-11-16T03:00:00.000Z' };

describe('toAttempt', () => {
	it('Given_ChoiceAnswer_When_ToAttempt_Then_SectionStepAndCard', () => {
		// Arrange
		const answer = {
			questionId: 'q1',
			pick: '你',
			correct: false,
			ms: 1200,
			card: { word: '你', skill: 'the' as const }
		};

		// Act
		const attempt = toAttempt(answer, 'q1', ctx, ids);

		// Assert
		expect(attempt).toEqual({
			id: 'a1',
			at: '2026-11-16T03:00:00.000Z',
			questionId: 'q1',
			contentSha: 'sha1',
			correct: false,
			ms: 1200,
			answer: '你',
			card: { word: '你', skill: 'the' },
			step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 6 }
		});
	});

	it('Given_GateSection_When_ToAttempt_Then_GateStep', () => {
		// Act
		const attempt = toAttempt(undefined, 'g1', { ...ctx, section: 'gate' }, ids);

		// Assert
		expect(attempt.step).toEqual({ kind: 'gate', lesson: 'h1-01', run: 'r1', of: 6 });
	});

	it('Given_NoAnswer_When_ToAttempt_Then_NullCorrectOnStepId', () => {
		// Act
		const attempt = toAttempt(undefined, 's3', ctx, ids);

		// Assert
		expect(attempt).toEqual({
			id: 'a1',
			at: '2026-11-16T03:00:00.000Z',
			questionId: 's3',
			contentSha: 'sha1',
			correct: null,
			ms: 0,
			step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 6 }
		});
		expect(Object.hasOwn(attempt, 'answer')).toBe(false);
		expect(Object.hasOwn(attempt, 'card')).toBe(false);
	});

	it('Given_AnswerWithOtherQuestionId_When_ToAttempt_Then_StepId', () => {
		// Arrange
		const answer = { questionId: 'other', pick: null, correct: null, ms: 40 };

		// Act
		const attempt = toAttempt(answer, 'q1', ctx, ids);

		// Assert
		expect(attempt.questionId).toBe('q1');
		expect(Object.hasOwn(attempt, 'answer')).toBe(false);
	});
});
