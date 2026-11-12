import { splitSyllables } from '../../derive/pinyin';
import { issue, pathOf, stripTones } from '../util';
import type { ContentSet } from '../types';

const toneless = (s: string) => stripTones(s).toLowerCase();
const blank = (h: string) => h.trim() === '' || h.trim() === '—';

export const hanviet = (set: ContentSet) => {
	const empty = set.chars.flatMap(({ file, value }) =>
		value.readings.flatMap((r, i) =>
			blank(r.hanviet)
				? [
						issue(
							1,
							file,
							pathOf(['readings', i, 'hanviet']),
							`Char ${value.hanzi} reading ${r.pinyin} has no Hán Việt`
						)
					]
				: []
		)
	);

	// word Hán Việt must use the char file's Hán Việt for the same reading
	const readings = new Map(set.chars.map(({ value }) => [value.hanzi, value.readings]));
	const mismatch = set.words.flatMap(({ file, value }) => {
		const chars = [...value.hanzi];
		const parts = value.hanviet?.split(/\s+/) ?? [];
		if (parts.length !== chars.length) return [];
		const { clauses, aligned } = splitSyllables(value.pinyin, chars.length);
		if (!aligned) return [];
		const syls = clauses.flat();
		return chars.flatMap((c, i) => {
			const s = syls.find((x) => x.charIndex === i);
			// erhua: zhèr covers 这 (zhè) and the trailing 儿 (ér)
			const erhuaTail = !s && syls.some((x) => x.erhua && x.charIndex === i - 1);
			if (!s && !erhuaTail) return [];
			const tone = s ? s.tone : 2;
			const syl = !s ? 'ér' : s.erhua ? s.syl.replace(/r$/i, '') : s.syl;
			const key = (p: string) => (tone === 0 ? toneless(p) : p.normalize('NFC').toLowerCase());
			const same = readings.get(c)?.filter((r) => key(r.pinyin) === key(syl));
			if (!same?.length || same.some((r) => r.hanviet === parts[i] || blank(r.hanviet))) return [];
			return [
				issue(
					1,
					file,
					'hanviet',
					`${value.hanzi}: ${c} is "${parts[i]}" here but "${same.map((r) => r.hanviet).join(' / ')}" in chars/${c}.yaml`
				)
			];
		});
	});
	return [...empty, ...mismatch];
};
