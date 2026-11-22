import { myWords, type State } from '#lib/study/index.js';

export function wordsPreview(state: State, now: Date): { count: number; hanzi: string[] } {
	const rows = myWords(state, () => undefined, now);
	return { count: rows.length, hanzi: rows.slice(0, 8).map((r) => r.hanzi) };
}
