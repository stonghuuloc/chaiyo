import { m } from '#lib/paraglide/messages.js';
import type { Answer, Mode } from './types';
import type { Step } from './steps/Choice.svelte';

export const grade = (step: Step, pick: string) => {
	const correct = pick === step.answer;
	const marks: Record<string, 'right' | 'wrong'> = { [step.answer]: 'right' };
	if (!correct) marks[pick] = 'wrong';
	return {
		correct,
		marks,
		verdict: correct ? m.lesson_right() : m.lesson_wrong()
	};
};

export const toAnswer = (step: Step, pick: string, ms: number): Answer => ({
	questionId: step.id,
	pick,
	correct: pick === step.answer,
	ms,
	...(step.card ? { card: step.card } : {})
});

type CtaState = {
	mode: Mode;
	last: boolean;
	phase: 'picking' | 'graded';
	picked: boolean;
	correct: boolean;
	missHint?: string;
};

export const choiceCta = (s: CtaState) => {
	if (s.mode === 'test')
		return {
			label: s.last ? m.lesson_submit() : m.lesson_next_question(),
			disabled: !s.picked,
			caret: true,
			hint: ''
		};
	if (s.phase === 'graded')
		return {
			label: m.lesson_continue(),
			disabled: false,
			caret: true,
			hint: s.correct ? '' : (s.missHint ?? m.lesson_review_hint())
		};
	return {
		label: m.lesson_check(),
		disabled: !s.picked,
		caret: false,
		hint: s.picked ? '' : m.lesson_pick_hint()
	};
};
