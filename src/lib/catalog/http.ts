import type { Bundle } from '../content/import/bundle';
import { CatalogError, type CatalogSource } from './index';

type Fetch = (url: string) => Promise<Response>;

const field = (value: unknown, key: string): unknown =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;

const isBundle = (value: unknown): value is Bundle => {
	const lesson = field(value, 'lesson');
	const sections = field(lesson, 'sections');
	return (
		typeof field(value, 'sha') === 'string' &&
		typeof field(lesson, 'id') === 'string' &&
		typeof sections === 'object' &&
		sections !== null &&
		['words', 'chars', 'sentences', 'grammar', 'questions', 'thin'].every((k) =>
			Array.isArray(field(value, k))
		)
	);
};

/**
 * The CatalogSource served from `/content/<sha>/<id>.json` with `current.json`
 * naming the sha. Errors come from here, not from the catalog (S1 decision).
 */
export function httpSource(fetchFn?: Fetch, base = '/content'): CatalogSource {
	const get: Fetch = fetchFn ?? ((url) => globalThis.fetch(url));
	const read = async (url: string, id: string): Promise<unknown> => {
		let res: Response;
		try {
			res = await get(url);
		} catch {
			throw new CatalogError('offline', id);
		}
		if (res.status === 404) throw new CatalogError('not-found', id);
		if (!res.ok) throw new CatalogError('malformed', id);
		try {
			return await res.json();
		} catch {
			throw new CatalogError('malformed', id);
		}
	};
	return {
		async current() {
			const sha = ((await read(`${base}/current.json`, 'current')) as { sha?: unknown })?.sha;
			if (typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha))
				throw new CatalogError('malformed', 'current');
			return sha;
		},
		bundle: async (sha, id) => {
			const body = await read(`${base}/${sha}/${encodeURIComponent(id)}.json`, id);
			if (!isBundle(body)) throw new CatalogError('malformed', id);
			return body;
		}
	};
}
