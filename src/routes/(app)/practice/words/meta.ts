import type { Catalog } from '#lib/catalog/index.js';
import type { WordMeta } from '#lib/study/index.js';

export async function loadMeta(
	catalog: Pick<Catalog, 'find' | 'thin'>,
	hanzi: string[],
	known: ReadonlyMap<string, WordMeta>
): Promise<Map<string, WordMeta>> {
	const out = new Map<string, WordMeta>();
	for (const h of hanzi) {
		if (known.has(h)) continue;
		const { word } = await catalog.find(h);
		if (word) {
			const sense = word.senses.find((s) => !s.rare) ?? word.senses[0];
			out.set(h, { pinyin: word.pinyin, hanViet: word.hanviet ?? '', nghia: sense?.vi ?? '' });
			continue;
		}
		const t = await catalog.thin(h);
		if (t) out.set(h, { pinyin: t.pinyin, hanViet: t.hanviet, nghia: t.meaning });
	}
	return out;
}
