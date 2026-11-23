import type { State } from './types';

export type RoadStatus = 'done' | 'now' | 'open' | 'locked';
export type Road<T extends { id: string; n: number }> = T & { status: RoadStatus; after?: number };

export const roadAnchor = (s: State): string | undefined =>
	s.curriculum.lessons.find((l) => s.lessons[l.id]?.unlocked && !s.lessons[l.id]?.passed)?.id;

export function roadRows<T extends { id: string; n: number }>(s: State, items: T[]): Road<T>[] {
	const anchor = roadAnchor(s);
	return items.map((item, i) => {
		const p = s.lessons[item.id];
		const status: RoadStatus = p?.passed
			? 'done'
			: item.id === anchor
				? 'now'
				: p?.unlocked
					? 'open'
					: 'locked';
		const row: Road<T> = { ...item, status };
		if (status === 'locked' && i > 0) row.after = items[i - 1].n;
		return row;
	});
}
