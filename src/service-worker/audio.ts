import { AUDIO_VERSION } from '../lib/audio/version';

export const AUDIO_CACHE = `audio-${AUDIO_VERSION}`;

type Store = Pick<Cache, 'match' | 'put'>;
type Fetcher = (input: string | Request, init?: RequestInit) => Promise<Response>;

export function isAudio(url: URL, base: string, origin: string): boolean {
	const root = new URL(base, origin);
	return (
		url.origin === root.origin &&
		url.pathname.startsWith(root.pathname.replace(/\/$/, '') + '/') &&
		url.pathname.endsWith('.mp3')
	);
}

export function range(buf: ArrayBuffer, header: string | null): Response {
	const headers = { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' };
	const m = header?.match(/^bytes=(\d+)-(\d*)$/);
	if (!m) return new Response(buf, { headers });
	const start = Number(m[1]);
	const end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
	if (end < start && start < buf.byteLength) return new Response(buf, { headers });
	if (start >= buf.byteLength) {
		return new Response(null, {
			status: 416,
			headers: { 'Content-Range': 'bytes */' + buf.byteLength }
		});
	}
	return new Response(buf.slice(start, end + 1), {
		status: 206,
		headers: {
			...headers,
			'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
			'Content-Length': String(end - start + 1)
		}
	});
}

async function load(url: string, cache: Store, fetchFn: Fetcher): Promise<Response | undefined> {
	const hit = await cache.match(url, { ignoreVary: true });
	if (hit) return hit;
	const res = await fetchFn(url, { mode: 'cors' });
	if (res.status !== 200) return undefined;
	await cache.put(url, res.clone());
	return res;
}

export async function serveAudio(
	request: Request,
	cache: Store,
	fetchFn: Fetcher
): Promise<Response> {
	let res: Response | undefined;
	try {
		res = await load(request.url, cache, fetchFn);
	} catch {
		return fetchFn(request);
	}
	if (!res) return Response.error();
	return range(await res.arrayBuffer(), request.headers.get('range'));
}

export async function precacheAudio(urls: string[], cache: Store, fetchFn: Fetcher) {
	const outcomes = await Promise.all(
		urls.map((url) =>
			load(url, cache, fetchFn).then(
				(res) => Boolean(res),
				() => false
			)
		)
	);
	const ok = outcomes.filter(Boolean).length;
	return { ok, failed: outcomes.length - ok };
}

export async function audioMessage(
	data: unknown,
	base: string,
	origin: string,
	cache: Store,
	fetchFn: Fetcher
) {
	const { type, urls } = (data ?? {}) as { type?: unknown; urls?: unknown };
	if (type !== 'audio-precache' || !Array.isArray(urls)) return undefined;
	const allowed = urls.filter(
		(u): u is string =>
			typeof u === 'string' && URL.canParse(u) && isAudio(new URL(u), base, origin)
	);
	const result = await precacheAudio(allowed, cache, fetchFn);
	return {
		type: 'audio-precached',
		ok: result.ok,
		failed: result.failed + urls.length - allowed.length
	};
}
