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

function bars(card?: Card): MyWordRow['bars'] {
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
	void now;
	return Object.entries(state.lexicon).map(([hanzi, entry]) => {
		const m = meta(hanzi);
		return {
			hanzi,
			pinyin: m?.pinyin ?? '',
			hanViet: m?.hanViet ?? '',
			nghia: m?.nghia ?? '',
			bars: bars(entry.cards.the),
			dueNote: null,
			source: entry.saved === true ? 'self' : 'lesson'
		};
	});
}
