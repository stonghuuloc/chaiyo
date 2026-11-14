import type { Attempt } from '#lib/study/index.js';
import { items, PASS, PLACEMENT_SHA } from './bank';

const MAX_MISS = 10 - PASS + 1;

export type Run = {
	level: number;
	index: number;
	miss: number;
	cleared: number;
	runId: string;
	attempts: Attempt[];
	done: boolean;
};

export const startRun = (uuid: () => string): Run => ({
	level: 1,
	index: 0,
	miss: 0,
	cleared: 0,
	runId: uuid(),
	attempts: [],
	done: false
});

export function answer(
	r: Run,
	a: { ok: boolean; pick?: string; ms: number; at: string },
	uuid: () => string
): Run {
	if (r.done) return { ...r };
	const item = items(r.level)[r.index];
	const attempt: Attempt = {
		id: uuid(),
		at: a.at,
		questionId: item.id,
		contentSha: PLACEMENT_SHA,
		correct: a.ok,
		ms: a.ms,
		...(a.pick === undefined ? {} : { answer: a.pick }),
		step: { kind: 'placement', level: r.level, run: r.runId, of: 10 }
	};
	const attempts = [...r.attempts, attempt];
	const miss = r.miss + (a.ok ? 0 : 1);
	if (miss >= MAX_MISS) return { ...r, attempts, miss, done: true };
	if (r.index + 1 < 10) return { ...r, attempts, miss, index: r.index + 1 };
	if (r.level === 5) return { ...r, attempts, miss, cleared: 5, done: true };
	return {
		...r,
		attempts,
		miss: 0,
		cleared: r.level,
		level: r.level + 1,
		index: 0,
		runId: uuid()
	};
}

export const isLast = (r: Run) => r.level === 5 && r.index === 9;
