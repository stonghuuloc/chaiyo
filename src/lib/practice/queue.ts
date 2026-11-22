import type { SessionCard } from '#lib/study/index.js';

export type QueueItem = SessionCard & { id: string; again: boolean };
export type Queue = { items: QueueItem[]; at: number };

export const itemId = (c: SessionCard, again: boolean) =>
	`practice:${c.skill}:${c.word}${again ? '#again' : ''}`;

export const startQueue = (cards: SessionCard[]): Queue => ({
	items: cards.map((c) => ({ ...c, id: itemId(c, false), again: false })),
	at: 0
});

export const answer = (q: Queue, correct: boolean | null): Queue => {
	const cur = q.items[q.at];
	const items =
		correct === false && !cur.again
			? [...q.items, { ...cur, id: itemId(cur, true), again: true }]
			: q.items;
	return { items, at: q.at + 1 };
};

export const current = (q: Queue): QueueItem => q.items[q.at];

export const finished = (q: Queue) => q.at >= q.items.length;
