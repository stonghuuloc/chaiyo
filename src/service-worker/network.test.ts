import { describe, expect, it, vi } from 'vitest';
import { networkFirst } from './network';

const request = new Request('https://example.test/api/data');

describe('networkFirst', () => {
	it('caches the response before resolving', async () => {
		let written = false;
		const cache = {
			put: vi.fn(async () => {
				await new Promise((r) => setTimeout(r, 10));
				written = true;
			}),
			match: vi.fn()
		};
		const res = await networkFirst(request, cache, async () => new Response('ok'));
		expect(written).toBe(true);
		expect(await res.text()).toBe('ok');
	});

	it('returns the response when the cache write fails', async () => {
		const cache = { put: vi.fn().mockRejectedValue(new Error('quota')), match: vi.fn() };
		const res = await networkFirst(request, cache, async () => new Response('ok'));
		expect(await res.text()).toBe('ok');
		expect(cache.match).not.toHaveBeenCalled();
	});

	it('does not cache a non-ok response', async () => {
		const cache = { put: vi.fn(), match: vi.fn() };
		const res = await networkFirst(request, cache, async () => new Response('no', { status: 500 }));
		expect(res.status).toBe(500);
		expect(cache.put).not.toHaveBeenCalled();
	});

	it('falls back to the cache when the network fails', async () => {
		const cached = new Response('cached');
		const cache = { put: vi.fn(), match: vi.fn().mockResolvedValue(cached) };
		const res = await networkFirst(request, cache, async () => {
			throw new TypeError('offline');
		});
		expect(res).toBe(cached);
	});

	it('rejects on network failure with no cached copy', async () => {
		const cache = { put: vi.fn(), match: vi.fn().mockResolvedValue(undefined) };
		await expect(
			networkFirst(request, cache, async () => {
				throw new TypeError('offline');
			})
		).rejects.toThrow('offline');
	});
});
