# CHY-16 S2 — plan
ACs: AC3, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-16 (stacked on S1)  ·  rebases on CHY-25 for `src/service-worker/index.ts`

## Anchors (verified 2026-11-07 on main fd2b67a)
- `src/service-worker/index.ts:25-39` — fetch handler returns early for cross-origin (:27); audio hook goes before that line.
- `src/service-worker/index.ts:17-23` — activate deletes every cache except `CACHE`; must also spare `audio-v1`.
- `src/service-worker/network.ts:1-22` — `networkFirst` style (injected `fetch`, `Cache` and `waitUntil` so it unit-tests); `network.test.ts` is the pattern.
- `src/service-worker/tsconfig.json` — worker typecheck (`pnpm check` runs `tsc -p src/service-worker`).
- `src/env.ts:6-13` — `defineEnvVars` with `optional`; add `PUBLIC_AUDIO_BASE_URL`.
- `src/routes/+layout.ts:9` — `ssr = false` for the SPA, `src/routes/+page.ts:2` the prerendered landing; `/dev/audio` sits outside `(app)`.
- `vite.config.ts:41-52` — coverage excludes `src/service-worker/**`, so the worker tests are about behaviour, not coverage.
- `src/lib/audio/player.ts` (S1) — `createPlayer({ base })`; S2 wires the base.

## Task 1 [AC3] Worker audio module, tests first
Files: `src/service-worker/audio.test.ts`, `src/service-worker/audio.ts` (new)
- `isAudio(url, base)`, `serveAudio(request, cache, fetchFn)`, `precacheAudio(urls, cache, fetchFn)`, `range(bytes, header)`. Cases = SPEC test contract. Verify: `pnpm exec vitest --run --project server src/service-worker --maxWorkers=2`.

## Task 2 [AC3] Wire the worker
File: `src/service-worker/index.ts:17-27`
- Spare `audio-v1` in activate; before the cross-origin return, `if (isAudio(...)) return event.respondWith(serveAudio(...))`; add a message listener: event.waitUntil(precacheAudio(urls, cache, fetch).then((r) => event.ports[0]?.postMessage({ type: "audio-precached", ...r }))); the client sends with a MessageChannel. Cache by url string, cache.match(url, { ignoreVary: true }). Keep it to those lines. Verify: `pnpm check`.

## Task 3 [AC3] Client `precache` and the base setting
Files: `src/lib/audio/precache.ts`, `src/lib/audio/index.ts`, `src/env.ts:13`, `.env.example`
- Verify: vitest for the no-worker case; `pnpm check`.

## Task 4 [AC5] `/dev/audio`
Files: `src/routes/dev/audio/+page.svelte`, `+page.ts` (`prerender = false`, 404 in production)
- Verify: dev server screenshot; the 404 with `VERCEL_ENV=production` build.

## Task 5 [AC3] Offline proof in a browser
Scratch: `vite build && vite preview` + a CORS fixture server on another port; Playwright offline run per SPEC; reload once and assert navigator.serviceWorker.controller before setOffline(true). Verify: values pasted into the PR.

## Task 6 [AC5] Device proof (Loc or simulator)
Hand Loc the https Vercel preview URL (a LAN dev server has no service worker, taps only) and the AC5 checklist; record the result. Verify: screenshot of the readout from the device.

## Mutation paths covered
- Cold, warm, range, non-200, network error, precache with partial failure, deploy with a new shell version, no controlling worker.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
export const AUDIO_CACHE = 'audio-v1';
export function range(buf: ArrayBuffer, header: string | null): Response {
	const m = header?.match(/^bytes=(\d+)-(\d*)$/);
	if (!m) return new Response(buf, { headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
	const a = +m[1], b = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
	if (a >= buf.byteLength || a > b) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + buf.byteLength } });
	return new Response(buf.slice(a, b + 1), { status: 206, headers: {
		'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes',
		'Content-Range': `bytes ${a}-${b}/${buf.byteLength}`, 'Content-Length': String(b - a + 1) } });
}
```

## Rollback
git revert; the worker change is two lines plus one file, the route is deletable.
