import type { Attempt, Step } from '#lib/study/index.js';
import type { Answer } from './types';

type Ctx = { lesson: string; section: string; contentSha: string; run: string; of: number };

export const toAttempt = (
	answer: Answer | undefined,
	stepId: string,
	ctx: Ctx,
	ids: { id: string; at: string }
): Attempt => {
	const step: Step =
		ctx.section === 'gate'
			? { kind: 'gate', lesson: ctx.lesson, run: ctx.run, of: ctx.of }
			: { kind: 'section', lesson: ctx.lesson, section: ctx.section, run: ctx.run, of: ctx.of };
	return {
		id: ids.id,
		at: ids.at,
		questionId: stepId,
		contentSha: ctx.contentSha,
		correct: answer?.correct ?? null,
		ms: answer?.ms ?? 0,
		...(answer?.pick == null ? {} : { answer: answer.pick }),
		...(answer?.card ? { card: answer.card } : {}),
		step
	};
};
