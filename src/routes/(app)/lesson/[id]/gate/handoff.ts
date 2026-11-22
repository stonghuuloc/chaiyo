import type { Answer, LessonStep } from '#lib/lesson/index.js';
import type { StudyEvent } from '#lib/study/index.js';

export const GATE_RESULT = 'chaiyo.gate-result';

export type GateHandoff = {
	lesson: string;
	steps: LessonStep[];
	answers: Answer[];
	events: StudyEvent[];
	best: number;
};

export function writeGateResult(storage: Pick<Storage, 'setItem'>, h: GateHandoff) {
	storage.setItem(GATE_RESULT, JSON.stringify(h));
}

export function readGateResult(
	storage: Pick<Storage, 'getItem'>,
	lesson: string
): GateHandoff | null {
	try {
		const h = JSON.parse(storage.getItem(GATE_RESULT) ?? 'null');
		return h?.lesson === lesson &&
			Array.isArray(h.steps) &&
			Array.isArray(h.answers) &&
			h.answers.length > 0 &&
			Array.isArray(h.events) &&
			typeof h.best === 'number'
			? h
			: null;
	} catch {
		return null;
	}
}

export function clearGateResult(storage: Pick<Storage, 'removeItem'>) {
	storage.removeItem(GATE_RESULT);
}
