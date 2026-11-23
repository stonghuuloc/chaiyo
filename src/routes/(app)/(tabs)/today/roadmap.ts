import { LESSONS } from '#lib/curriculum/index.js';
import { roadRows, type Road, type State } from '#lib/study/index.js';

export type RoadRow = Road<{ id: string; n: number; title: string; hanzi: string }>;

const SIZE = 4;

export function roadmapSlice(state: State): RoadRow[] {
	const rows = roadRows(
		state,
		state.curriculum.lessons.map((l, i) => {
			const info = LESSONS.find((x) => x.id === l.id);
			return { id: l.id, n: info?.n ?? i, title: info?.title ?? '', hanzi: info?.titleHanzi ?? '' };
		})
	);
	const anchor = rows.findIndex((r) => r.status === 'now');
	const last = Math.max(0, rows.length - SIZE);
	const start =
		anchor >= 0
			? Math.min(Math.max(anchor - 1, 0), last)
			: rows.length > 0 && rows.every((r) => r.status === 'done')
				? last
				: 0;
	return rows.slice(start, start + SIZE);
}
