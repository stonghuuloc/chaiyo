import { m } from '#lib/paraglide/messages.js';
import type { Answer } from './types';
import type { Step } from './steps/Tone.svelte';

export const gradeTone = (step: Step, pick: number) => {
	const correct = pick === step.answer;
	const marks: Record<number, 'right' | 'wrong'> = { [step.answer]: 'right' };
	if (!correct) marks[pick] = 'wrong';
	return {
		correct,
		marks,
		verdict: correct ? m.lesson_right() : m.lesson_wrong(),
		explain: m.listen_tone_answer({ n: step.answer, pinyin: step.syllable })
	};
};

export const toneAnswer = (step: Step, pick: number, ms: number): Answer => ({
	questionId: step.id,
	pick: String(pick),
	correct: pick === step.answer,
	ms
});
