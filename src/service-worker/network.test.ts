import { describe, expect, it, vi } from 'vitest';
import { networkFirst } from './network';

const request = new Request('https://example.test/api/data');
const bundle = new Request('https://example.test/content/' + 'a'.repeat(64) + '/h1-01.json');
const noWait = () => {};

describe('networkFirst', () => {
	it('caches a bundle response before resolving', async () => {
		let written = false;
		const cache = {
			put: vi.fn(async () => {
				await new Promise((r) => setTimeout(r, 10));
				written = true;
			}),
			match: vi.fn()
		};
		const waitUntil = vi.fn();
		const res = await networkFirst(bundle, cache, async () => new Response('ok'), waitUntil);
		expect(written).toBe(true);
		expect(waitUntil).not.toHaveBeenCalled();
		expect(cache.put).toHaveBeenCalledWith(bundle, expect.any(Response));
		expect(await res.text()).toBe('ok');
	});

	it('hands a non-bundle cache write to waitUntil without awaiting it', async () => {
		let written = false;
		const cache = {
			put: vi.fn(async () => {
				await new Promise((r) => setTimeout(r, 10));
				written = true;
			}),
			match: vi.fn()
		};
		const waitUntil = vi.fn();
		const res = await networkFirst(request, cache, async () => new Response('ok'), waitUntil);
		expect(written).toBe(false);
		expect(waitUntil).toHaveBeenCalledTimes(1);
		await waitUntil.mock.calls[0][0];
		expect(written).toBe(true);
		expect(await res.text()).toBe('ok');
	});

	it('gives waitUntil a promise that resolves when a non-bundle put rejects', async () => {
		const cache = { put: vi.fn().mockRejectedValue(new Error('quota')), match: vi.fn() };
		const waitUntil = vi.fn();
		const res = await networkFirst(request, cache, async () => new Response('ok'), waitUntil);
		await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
		expect(await res.text()).toBe('ok');
	});

	it.each([
		'https://example.test/content/current.json',
		'https://example.test/content/abc/h1-01.json'
	])('treats %s as a non-bundle', async (url) => {
		const cache = { put: vi.fn().mockResolvedValue(undefined), match: vi.fn() };
		const waitUntil = vi.fn();
		await networkFirst(new Request(url), cache, async () => new Response('ok'), waitUntil);
		expect(waitUntil).toHaveBeenCalledTimes(1);
	});

	it('returns a bundle response when the cache write fails', async () => {
		const cache = { put: vi.fn().mockRejectedValue(new Error('quota')), match: vi.fn() };
		const res = await networkFirst(bundle, cache, async () => new Response('ok'), noWait);
		expect(await res.text()).toBe('ok');
		expect(cache.match).not.toHaveBeenCalled();
	});

	it('returns the response when the cache write fails', async () => {
		const cache = { put: vi.fn().mockRejectedValue(new Error('quota')), match: vi.fn() };
		const res = await networkFirst(request, cache, async () => new Response('ok'), noWait);
		expect(await res.text()).toBe('ok');
		expect(cache.match).not.toHaveBeenCalled();
	});

	it('does not cache a non-ok response', async () => {
		const cache = { put: vi.fn(), match: vi.fn() };
		const waitUntil = vi.fn();
		const res = await networkFirst(
			request,
			cache,
			async () => new Response('no', { status: 404 }),
			waitUntil
		);
		expect(res.status).toBe(404);
		expect(cache.put).not.toHaveBeenCalled();
		expect(waitUntil).not.toHaveBeenCalled();
	});

	it('falls back to the cache when the network fails', async () => {
		const cached = new Response('cached');
		const cache = { put: vi.fn(), match: vi.fn().mockResolvedValue(cached) };
		const res = await networkFirst(
			request,
			cache,
			async () => {
				throw new TypeError('offline');
			},
			noWait
		);
		expect(res).toBe(cached);
	});

	it('rejects on network failure with no cached copy', async () => {
		const cache = { put: vi.fn(), match: vi.fn().mockResolvedValue(undefined) };
		await expect(
			networkFirst(
				request,
				cache,
				async () => {
					throw new TypeError('offline');
				},
				noWait
			)
		).rejects.toThrow('offline');
	});
});
