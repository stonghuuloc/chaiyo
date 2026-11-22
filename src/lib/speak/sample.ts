import { splitSyllables } from '../content/derive/pinyin';

const CJK = /[㐀-鿿]/;

export type Tile = { hanzi: string; syl: string; weak: boolean };

export function sampleTiles(hanzi: string, pinyin: string) {
	const chars = [...hanzi].filter((c) => CJK.test(c));
	if (!chars.length) return null;
	const { clauses, aligned } = splitSyllables(pinyin, chars.length);
	if (!aligned) return null;
	const syls = clauses.flat();
	const tiles: Tile[] = syls.map((s, i) => ({
		hanzi: chars.slice(s.charIndex, syls[i + 1]?.charIndex ?? chars.length).join(''),
		syl: s.syl,
		weak: i === syls.length - 1
	}));
	return { tiles, ok: tiles.length - 1, total: tiles.length };
}
