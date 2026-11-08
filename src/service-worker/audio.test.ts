import { describe, expect, it, vi } from 'vitest';
import { audioMessage, isAudio, precacheAudio, range, serveAudio } from './audio';

const BASE = 'https://clips.example.test';
const url = (k: string) => `${BASE}/${k}.mp3`;
const bytes = new Uint8Array(200).map((_, i) => i).buffer;

function fakeCache() {
	const map = new Map<string, Response>();
	return {
		map,
		match: vi.fn(async (u: string) => map.get(u)?.clone()),
		put: vi.fn(async (u: string, r: Response) => void map.set(u, r))
	};
}
const ok = () => vi.fn(async () => new Response(bytes.slice(0), { status: 200 }));
const req = (k: string, range?: string) =>
	new Request(url(k), range ? { headers: { range } } : undefined);

describe('isAudio', () => {
	it('matches mp3 files under the audio base only', () => {
		expect(isAudio(new URL(url('a')), BASE, 'https://app.test')).toBe(true);
		expect(isAudio(new URL('https://other.test/a.mp3'), BASE, 'https://app.test')).toBe(false);
		expect(isAudio(new URL(BASE + '/a.json'), BASE, 'https://app.test')).toBe(false);
		expect(isAudio(new URL('https://app.test/audio/a.mp3'), '/audio', 'https://app.test')).toBe(
			true
		);
		expect(isAudio(new URL('https://app.test/other/a.mp3'), '/audio', 'https://app.test')).toBe(
			false
		);
	});
});

describe('range', () => {
	it('answers 206 with the right slice and headers', async () => {
		const res = range(bytes, 'bytes=0-99');
		expect(res.status).toBe(206);
		expect((await res.arrayBuffer()).byteLength).toBe(100);
		expect(res.headers.get('Content-Range')).toBe('bytes 0-99/200');
		expect(res.headers.get('Accept-Ranges')).toBe('bytes');
	});
	it('answers an open-ended range with the rest', async () => {
		const res = range(bytes, 'bytes=10-');
		expect(res.headers.get('Content-Range')).toBe('bytes 10-199/200');
		expect((await res.arrayBuffer()).byteLength).toBe(190);
	});
	it('ignores a reversed range', () => {
		expect(range(bytes, 'bytes=50-10').status).toBe(200);
	});
	it('answers 416 past the end and 200 without a header', async () => {
		expect(range(bytes, 'bytes=500-').status).toBe(416);
		const full = range(bytes, null);
		expect(full.status).toBe(200);
		expect(full.headers.get('Content-Type')).toBe('audio/mpeg');
	});
});

describe('serveAudio', () => {
	it('fetches whole without Range on a miss, stores the 200, answers the range', async () => {
		const cache = fakeCache();
		const fetchFn = ok();
		const res = await serveAudio(req('a', 'bytes=0-9'), cache, fetchFn);
		expect(fetchFn).toHaveBeenCalledWith(url('a'), { mode: 'cors' });
		expect(cache.map.get(url('a'))?.status).toBe(200);
		expect(res.status).toBe(206);
	});
	it('does not fetch on a hit', async () => {
		const cache = fakeCache();
		const fetchFn = ok();
		await serveAudio(req('a'), cache, fetchFn);
		const res = await serveAudio(req('a'), cache, fetchFn);
		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
	});
	it('stores nothing for a 404 and answers a network error', async () => {
		const cache = fakeCache();
		const res = await serveAudio(req('x'), cache, async () => new Response('no', { status: 404 }));
		expect(cache.put).not.toHaveBeenCalled();
		expect(res.type).toBe('error');
	});
	it('falls back to a plain fetch when the cors fetch throws', async () => {
		const fetchFn = vi
			.fn()
			.mockRejectedValueOnce(new TypeError('cors'))
			.mockResolvedValueOnce(new Response(bytes.slice(0)));
		const res = await serveAudio(req('a'), fakeCache(), fetchFn);
		expect(res.status).toBe(200);
		expect(fetchFn).toHaveBeenCalledTimes(2);
		expect(fetchFn.mock.calls[1][0]).toBeInstanceOf(Request);
	});
	it('rejects when offline and uncached', async () => {
		const failing = vi.fn(async () => {
			throw new TypeError('offline');
		});
		await expect(serveAudio(req('x'), fakeCache(), failing)).rejects.toThrow('offline');
	});
});

describe('precache', () => {
	it('counts ok and failed and skips cached urls', async () => {
		const cache = fakeCache();
		const fetchFn = vi.fn(async (u: string) =>
			u.endsWith('bad.mp3') ? new Response('no', { status: 404 }) : new Response(bytes.slice(0))
		);
		await precacheAudio([url('a')], cache, fetchFn);
		const r = await precacheAudio([url('a'), url('b'), url('bad')], cache, fetchFn);
		expect(r).toEqual({ ok: 2, failed: 1 });
		expect(fetchFn).toHaveBeenCalledTimes(3);
	});
	it('audioMessage ignores other messages and counts foreign urls as failed', async () => {
		const cache = fakeCache();
		expect(
			await audioMessage({ type: 'x' }, BASE, 'https://app.test', cache, ok())
		).toBeUndefined();
		const r = await audioMessage(
			{ type: 'audio-precache', urls: [url('a'), 'https://evil.test/a.mp3', 5] },
			BASE,
			'https://app.test',
			cache,
			ok()
		);
		expect(r).toEqual({ type: 'audio-precached', ok: 1, failed: 2 });
	});
});
