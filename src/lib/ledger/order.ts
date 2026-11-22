import type { Input } from './types';

export const key = (i: Input) => ('kind' in i ? `s:${i.word}` : `a:${i.id}`);

export const order = (a: Input, b: Input) =>
	Date.parse(a.at) - Date.parse(b.at) ||
	('kind' in b ? 1 : 0) - ('kind' in a ? 1 : 0) ||
	(key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
