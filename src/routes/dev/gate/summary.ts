import type { State } from '#lib/study/index.js';

export function gateSummary(s: State, lesson: string) {
	const runs = Object.values(s.runs).filter(
		(r) => r.step.kind === 'gate' && r.step.lesson === lesson
	);
	const last = runs.at(-1);
	return {
		best: s.lessons[lesson]?.best ?? null,
		runs: runs.length,
		open: runs.filter((r) => !r.closed).length,
		answers: last ? Object.keys(last.answers).length : 0
	};
}
