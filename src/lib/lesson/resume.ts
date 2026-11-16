import type { State } from '#lib/study/index.js';

export function resume(
	state: State,
	o: { lesson: string; section: string; ids: string[] }
): { run: string | null; index: number } {
	const open = Object.entries(state.runs).filter(([, r]) => {
		const step = r.step;
		if (r.closed || step.kind === 'mock' || step.of !== o.ids.length) return false;
		if (step.kind === 'gate') return step.lesson === o.lesson;
		return step.kind === 'section' && step.lesson === o.lesson && step.section === o.section;
	});
	if (open.length === 0) return { run: null, index: 0 };
	const [run, entry] = open.reduce((best, cur) =>
		Object.keys(cur[1].answers).length > Object.keys(best[1].answers).length ? cur : best
	);
	const index = o.ids.findIndex((id) => !Object.hasOwn(entry.answers, id));
	return { run, index: index < 0 ? 0 : index };
}
