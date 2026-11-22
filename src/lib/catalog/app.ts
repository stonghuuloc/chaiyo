import { LESSONS } from '#lib/curriculum/index.js';
import { httpSource } from './http';
import { createCatalog } from './index';

const teaches = (hanzi: string) =>
	(
		LESSONS.find((l) => l.words.includes(hanzi)) ??
		([...hanzi].length === 1
			? LESSONS.find((l) => l.words.some((w) => w.includes(hanzi)))
			: undefined)
	)?.id;

/** One app-wide catalog; its per-session bundle cache lives here. Importing makes no request. */
export const catalog = createCatalog(httpSource(), teaches);
