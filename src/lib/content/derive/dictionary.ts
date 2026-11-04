import { z } from 'zod';
import type { ContentError } from '../parse';

export type ThinEntry = { hanzi: string; pinyin: string; hanviet: string; meaning: string };

const row = z.tuple([
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.number(),
	z.array(z.string()),
	z.array(z.unknown())
]);

const formatPath = (path: PropertyKey[]) =>
	path.map((k, i) => (typeof k === 'number' ? `[${k}]` : (i ? '.' : '') + String(k))).join('');

export function parseDictionary(
	file: string,
	rows: unknown
): { ok: true; value: Map<string, ThinEntry> } | { ok: false; errors: ContentError[] } {
	const result = z.array(row).safeParse(rows);
	if (!result.success) {
		return {
			ok: false,
			errors: result.error.issues.map((i) => ({
				file,
				path: formatPath(i.path),
				message: i.message
			}))
		};
	}
	const value = new Map<string, ThinEntry>();
	for (const [hanzi, pinyin, , hanviet, meaning] of result.data) {
		value.set(hanzi, { hanzi, pinyin, hanviet, meaning });
	}
	return { ok: true, value };
}
