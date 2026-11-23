import { LESSONS } from '#lib/curriculum/index.js';
import type { State } from '#lib/study/index.js';

export type RoadStatus = 'done' | 'now' | 'open' | 'locked';
export type RoadRow = {
	id: string;
	n: number;
	title: string;
	hanzi: string;
	status: RoadStatus;
	after?: number;
};

const SIZE = 4;

export function roadmapSlice(state: State): RoadRow[] {
	const list = state.curriculum.lessons;
	const progress = (id: string) => state.lessons[id];
	const meta = (id: string) => LESSONS.find((l) => l.id === id);
	const anchor = list.findIndex((l) => progress(l.id)?.unlocked && !progress(l.id)?.passed);
	const last = Math.max(0, list.length - SIZE);
	const start =
		anchor >= 0
			? Math.min(Math.max(anchor - 1, 0), last)
			: list.length > 0 && list.every((l) => progress(l.id)?.passed)
				? last
				: 0;
	return list.slice(start, start + SIZE).map((l, k) => {
		const i = start + k;
		const info = meta(l.id);
		const status: RoadStatus = progress(l.id)?.passed
			? 'done'
			: i === anchor
				? 'now'
				: progress(l.id)?.unlocked
					? 'open'
					: 'locked';
		const row: RoadRow = {
			id: l.id,
			n: info?.n ?? i,
			title: info?.title ?? '',
			hanzi: info?.titleHanzi ?? '',
			status
		};
		if (status === 'locked' && i > 0) row.after = meta(list[i - 1].id)?.n ?? i - 1;
		return row;
	});
}
