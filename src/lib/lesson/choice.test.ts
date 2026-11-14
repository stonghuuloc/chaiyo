import { describe, expect, it } from 'vitest';
import { m } from '#lib/paraglide/messages.js';
import { choiceCta, grade, toAnswer } from './choice';
import type { Step } from './steps/Choice.svelte';

const step: Step = {
	kind: 'choice',
	id: 'q1',
	ask: 'Chọn nghĩa',
	title: 'Tốt',
	options: ['你', '好', '我'],
	answer: '好'
};

describe('grade', () => {
	it('Given_RightPick_When_Grade_Then_CorrectWithOneRightMark', () => {
		// Arrange
		const pick = '好';
		// Act
		const g = grade(step, pick);
		// Assert
		expect(g.correct).toBe(true);
		expect(g.marks).toEqual({ 好: 'right' });
		expect(g.verdict).toBe('Đúng rồi.');
	});

	it('Given_WrongPick_When_Grade_Then_AnswerRightAndPickWrong', () => {
		// Arrange
		const pick = '你';
		// Act
		const g = grade(step, pick);
		// Assert
		expect(g.correct).toBe(false);
		expect(g.marks).toEqual({ 好: 'right', 你: 'wrong' });
		expect(g.verdict).toBe('Chưa đúng. Đáp án là');
	});
});

describe('choiceCta', () => {
	it('Given_FeedbackNoPick_When_Cta_Then_KiemTraDisabledWithHint', () => {
		// Arrange
		const state = {
			mode: 'feedback',
			last: false,
			phase: 'picking',
			picked: false,
			correct: false
		} as const;
		// Act
		const c = choiceCta(state);
		// Assert
		expect(c).toMatchObject({
			label: 'Kiểm tra',
			disabled: true,
			caret: false,
			hint: 'Chọn một đáp án'
		});
	});

	it('Given_FeedbackPicked_When_Cta_Then_EnabledNoHint', () => {
		const c = choiceCta({
			mode: 'feedback',
			last: false,
			phase: 'picking',
			picked: true,
			correct: false
		});
		expect(c).toMatchObject({ label: 'Kiểm tra', disabled: false, hint: '' });
	});

	it('Given_FeedbackGradedRight_When_Cta_Then_TiepCaretNoHint', () => {
		const c = choiceCta({
			mode: 'feedback',
			last: false,
			phase: 'graded',
			picked: true,
			correct: true
		});
		expect(c).toMatchObject({ label: 'Tiếp', disabled: false, caret: true, hint: '' });
	});

	it('Given_FeedbackGradedWrong_When_Cta_Then_ReviewHint', () => {
		const c = choiceCta({
			mode: 'feedback',
			last: false,
			phase: 'graded',
			picked: true,
			correct: false
		});
		expect(c.hint).toBe(m.lesson_review_hint());
	});

	it('Given_FeedbackGradedWrongWithMissHint_When_Cta_Then_MissHintWins', () => {
		const c = choiceCta({
			mode: 'feedback',
			last: false,
			phase: 'graded',
			picked: true,
			correct: false,
			missHint: 'Xem lại'
		});
		expect(c.hint).toBe('Xem lại');
	});

	it('Given_TestNotLast_When_Cta_Then_CauTiepCaretDisabledUntilPick', () => {
		const idle = choiceCta({
			mode: 'test',
			last: false,
			phase: 'picking',
			picked: false,
			correct: false
		});
		const picked = choiceCta({
			mode: 'test',
			last: false,
			phase: 'picking',
			picked: true,
			correct: false
		});
		expect(idle).toMatchObject({ label: 'Câu tiếp', caret: true, disabled: true });
		expect(picked.disabled).toBe(false);
	});

	it('Given_TestLast_When_Cta_Then_NopBai', () => {
		const c = choiceCta({
			mode: 'test',
			last: true,
			phase: 'picking',
			picked: true,
			correct: false
		});
		expect(c.label).toBe('Nộp bài');
	});
});

describe('toAnswer', () => {
	it('Given_StepWithCard_When_ToAnswer_Then_CardCopied', () => {
		// Arrange
		const s: Step = { ...step, card: { word: '好', skill: 'the' } };
		// Act
		const a = toAnswer(s, '你', 1200);
		// Assert
		expect(a).toEqual({
			questionId: 'q1',
			pick: '你',
			correct: false,
			ms: 1200,
			card: { word: '好', skill: 'the' }
		});
	});

	it('Given_StepWithoutCard_When_ToAnswer_Then_NoCardKey', () => {
		const a = toAnswer(step, '好', 5);
		expect(a).toEqual({ questionId: 'q1', pick: '好', correct: true, ms: 5 });
		expect('card' in a).toBe(false);
	});
});
