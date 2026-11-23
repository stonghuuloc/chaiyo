import { localDate } from './dates';
import type { Card, State } from './types';

export type WordMeta = { pinyin: string; hanViet: string; nghia: string };

export type MyWordRow = {
	hanzi: string;
	pinyin: string;
	hanViet: string;
	nghia: string;
	bars: 0 | 1 | 2 | 3;
	dueNote: 'due' | 'never' | null;
	source: 'lesson' | 'self';
};

const BAR_DAYS = [7, 21];

export function bars(card?: Card): MyWordRow['bars'] {
	if (!card) return 0;
	const s = card.fsrs.stability;
	if (typeof s !== 'number') return 1;
	return s >= BAR_DAYS[1] ? 3 : s >= BAR_DAYS[0] ? 2 : 1;
}

export function myWords(
	state: State,
	meta: (hanzi: string) => WordMeta | undefined,
	now: Date
): MyWordRow[] {
	const today = localDate(now, state.tz);
	return Object.entries(state.lexicon)
		.map(([hanzi, entry], index) => {
			const m = meta(hanzi);
			const cards = Object.values(entry.cards);
			const dues = cards
				.filter((c) => localDate(new Date(c.due), state.tz) <= today)
				.map((c) => Date.parse(c.due));
			const due = dues.length ? Math.min(...dues) : undefined;
			const row: MyWordRow = {
				hanzi,
				pinyin: m?.pinyin ?? '',
				hanViet: m?.hanViet ?? '',
				nghia: m?.nghia ?? '',
				bars: bars(entry.cards.the),
				dueNote: due !== undefined ? 'due' : cards.length ? null : 'never',
				source: entry.saved === true ? 'self' : 'lesson'
			};
			return { row, due, index };
		})
		.sort((a, b) =>
			a.due !== undefined && b.due !== undefined
				? a.due - b.due || a.index - b.index
				: a.due !== undefined
					? -1
					: b.due !== undefined
						? 1
						: a.row.bars - b.row.bars || a.index - b.index
		)
		.map((x) => x.row);
}

const fold = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/đ/g, 'd');

export function searchWords(rows: MyWordRow[], q: string): MyWordRow[] {
	const f = fold(q.trim());
	if (!f) return rows;
	return rows.filter((r) =>
		[r.hanzi, r.pinyin, r.hanViet, r.nghia].some((x) => fold(x).includes(f))
	);
}
