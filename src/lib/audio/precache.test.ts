import { afterEach, describe, expect, it, vi } from 'vitest';
import { precache } from './precache';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('precache', () => {
	it('reports every key failed without a service worker', async () => {
		vi.stubGlobal('navigator', {});
		expect(await precache(['a', 'b'])).toEqual({ ok: 0, failed: 2 });
	});

	it('reports every key failed when no worker is registered', async () => {
		vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
		expect(await precache(['a'])).toEqual({ ok: 0, failed: 1 });
	});

	it('treats a malformed reply as all failed', async () => {
		const post = vi.fn((_msg: unknown, ports: MessagePort[]) => ports[0].postMessage({ nope: 1 }));
		vi.stubGlobal('navigator', {
			serviceWorker: { getRegistration: async () => ({ active: { postMessage: post } }) }
		});
		vi.stubGlobal('location', { href: 'https://app.test/' });
		expect(await precache(['a'])).toEqual({ ok: 0, failed: 1 });
	});

	it('gives up after 10 s when the worker never replies', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('navigator', {
			serviceWorker: { getRegistration: async () => ({ active: { postMessage: () => {} } }) }
		});
		vi.stubGlobal('location', { href: 'https://app.test/' });
		const pending = precache(['a', 'b']);
		await vi.advanceTimersByTimeAsync(10_000);
		expect(await pending).toEqual({ ok: 0, failed: 2 });
		vi.useRealTimers();
	});

	it('posts absolute urls over a channel and resolves with the reply', async () => {
		const post = vi.fn((_msg: unknown, ports: MessagePort[]) =>
			ports[0].postMessage({ type: 'audio-precached', ok: 1, failed: 0 })
		);
		vi.stubGlobal('navigator', {
			serviceWorker: { getRegistration: async () => ({ active: { postMessage: post } }) }
		});
		vi.stubGlobal('location', { href: 'https://app.test/dev/audio' });
		const res = await precache(['k1'], 'https://clips.test');
		expect(post.mock.calls[0][0]).toEqual({
			type: 'audio-precache',
			urls: ['https://clips.test/k1.mp3']
		});
		expect(res).toEqual({ ok: 1, failed: 0 });
	});
});
