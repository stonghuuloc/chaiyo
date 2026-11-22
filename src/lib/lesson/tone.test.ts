import { m } from '#lib/paraglide/messages.js';
import { describe, expect, it } from 'vitest';
import type { Step } from './steps/Tone.svelte';
import { gradeTone, toneAnswer } from './tone';

const step: Step = {
	kind: 'tone',
	id: 'q-h1-01-l01',
	ask: 'Nghe và chọn thanh điệu',
	audio: 'words/hao',
	answer: 3,
	syllable: 'hǎo'
};

describe('tone', () => {
	it('Given_RightTone_When_Grade_Then_CorrectWithRightVerdict', () => {
		// Arrange
		const pick = 3;

		// Act
		const g = gradeTone(step, pick);

		// Assert
		expect(g.correct).toBe(true);
		expect(g.marks).toEqual({ 3: 'right' });
		expect(g.verdict).toBe(m.lesson_right());
	});

	it('Given_WrongTone_When_Grade_Then_WrongVerdictNamesTheToneAndPinyin', () => {
		// Arrange
		const pick = 2;

		// Act
		const g = gradeTone(step, pick);

		// Assert
		expect(g.correct).toBe(false);
		expect(g.marks).toEqual({ 3: 'right', 2: 'wrong' });
		expect(g.verdict).toBe(m.lesson_wrong());
		expect(g.explain).toBe('thanh 3 (hǎo)');
	});

	it('Given_Pick_When_ToAnswer_Then_AnswerCarriesStepIdPickAndCorrect', () => {
		// Arrange
		const ms = 1200;

		// Act
		const a = toneAnswer(step, 2, ms);

		// Assert
		expect(a).toEqual({ questionId: 'q-h1-01-l01', pick: '2', correct: false, ms: 1200 });
	});
});
