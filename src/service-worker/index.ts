// App shell offline: build output, static files and prerendered pages are precached per deploy;
// other same-origin GETs are network-first with a cache fallback.
import { self } from '$app/service-worker';
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { networkFirst } from './network';
import { APP_SHELL, appShell, cachedPage } from './shell';
import { AUDIO_CACHE, audioMessage, isAudio, serveAudio } from './audio';
import { AUDIO_BASE, SYLLABLE_BASE } from '../lib/audio/base';

const CACHE = `shell-${version}`;
const SHELL = appShell(
	[...immutable, ...assets, ...prerendered].map(
		(f) => new URL(f.path, self.registration.scope).pathname
	)
);

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...SHELL, APP_SHELL])));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))
				)
			)
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (
		event.request.method === 'GET' &&
		[AUDIO_BASE, SYLLABLE_BASE].some((base) => isAudio(url, base, self.location.origin))
	) {
		event.respondWith(
			caches.open(AUDIO_CACHE).then((cache) => serveAudio(event.request, cache, fetch))
		);
		return;
	}
	if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (event.request.mode === 'navigate') {
				try {
					return await networkFirst(event.request, cache, fetch, (p) => event.waitUntil(p));
				} catch (err) {
					const page = await cachedPage(cache, event.request, APP_SHELL);
					if (page) return page;
					throw err;
				}
			}
			if (SHELL.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			return networkFirst(event.request, cache, fetch, (p) => event.waitUntil(p));
		})()
	);
});

self.addEventListener('message', (event) => {
	event.waitUntil(
		(async () => {
			const urls = event.data?.urls;
			try {
				const cache = await caches.open(AUDIO_CACHE);
				const reply = await audioMessage(
					event.data,
					AUDIO_BASE,
					self.location.origin,
					cache,
					fetch
				);
				if (reply) event.ports[0]?.postMessage(reply);
			} catch {
				if (Array.isArray(urls)) {
					event.ports[0]?.postMessage({ type: 'audio-precached', ok: 0, failed: urls.length });
				}
			}
		})()
	);
});
