# CHY-16 S2 — spec
ACs: AC3, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a; needs S1 merged or stacked, CHY-15 S2 clips for the final R2 proof)

## Behaviour
- [AC3] `precache(keys)` (client) posts `{ type: 'audio-precache', urls }` over a MessageChannel to (await navigator.serviceWorker.getRegistration())?.active (the cache is origin-wide), one url per key built with the same base as `play`, and resolves when the worker answers `{ type: 'audio-precached', ok, failed }`. With no registration it resolves `{ ok: 0, failed: keys.length }` and throws nothing.
- [AC3] The worker fetches each url whole (`mode: 'cors'`, no `Range`) and stores the `200` in cache `audio-v1`; a url already cached is skipped. A non-200 or network error counts as `failed` and stores nothing.
- [AC3] For a GET to the audio origin ending `.mp3`, the worker answers from `audio-v1` first (cache-first), then falls back to the network and caches that `200`. A request with `Range: bytes=a-b` (or `a-`) is answered `206` with `Content-Range`, `Content-Length`, `Accept-Ranges: bytes` and `Content-Type: audio/mpeg`, built from the cached bytes; a request without `Range` gets the `200`.
- [AC3] Offline playback needs a controlled page (a first visit is controlled from its next navigation; clients.claim is CHY-25 territory). Offline, after `precache`, tapping a precached key plays it: `ended` fires and `currentTime` > 0. An uncached key offline still resolves `false` with no uncaught error (AC4 unchanged).
- [AC3] A deploy (new `shell-<version>`) keeps `audio-v1`; the shell's activate cleanup deletes every other cache except `audio-v1`.
- [AC3] The audio base is `PUBLIC_AUDIO_BASE_URL` (public, static, optional; default `/audio` for same-origin fixtures). The player and the worker both import PUBLIC_AUDIO_BASE_URL from '$app/env/public' (declared { public: true, static: true, schema: optional }). A Range start past the end gets 416.
- [AC5] `/dev/audio` lists three fixture clips served from PUBLIC_AUDIO_BASE_URL (second-port CORS server in the browser proof, R2 on the preview, never static/): (`prototype/talk/nihao.mp3`, `meiguanxi.mp3`, `duibuqi.mp3`) with a ▶ button each, a "cache this lesson" button (`precache`), a live `rate/pitch/ok` readout, and the page's online state. Not in nav, `prerender = false`, 404 when `VERCEL_ENV === 'production'`.
- [AC5] On iOS Safari (a real iPhone, or the Xcode simulator booted by Loc), first tap on clip 1 plays; then taps on clips 2 and 3 play with no second prompt; a second tap on one plays at 0.5×; airplane mode after "cache this lesson" still plays all three.
- [CHORE] `.env.example` gains `PUBLIC_AUDIO_BASE_URL=`; `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` green.

## Not this slice
- Real lesson steps (M-5), an `audioKey` in the bundle (CHY-8 follow-up), creating the R2 bucket or CORS (CHY-15 S2 / Loc), cache size limits or eviction (HSK1 is about 20 MB), any change to `play` semantics (S1).

## Seam
Worker: new `src/service-worker/audio.ts` (match, range, cache, precache handler) with two lines in `src/service-worker/index.ts` (CHY-25 rebases cheaply). Client: `precache` in `src/lib/audio/precache.ts`. Route: `src/routes/dev/audio/`.

## Test contract
- [AC3] vitest on `audio.ts` with a fake `Cache` and fake `fetch`: cold request → network fetch without `Range`, `200` stored, response served; warm request → no fetch; `Range: bytes=0-99` → 206, body 100 bytes, correct `Content-Range`; `bytes=10-` → rest; a 404 stores nothing; `precache` handler counts ok/failed.
- [AC3] vitest on the client `precache`: no `serviceWorker` in `navigator` → `{ ok: 0, failed: n }`.
- [AC3] browser, built app via `vite preview` plus a second-port CORS fixture server standing in for R2: register worker, click "cache this lesson", `context.setOffline(true)`, tap each clip → `ended`; a never-cached key → `false`, no `pageerror`; reload keeps `audio-v1` after a rebuilt version.
- [AC5] on device (Loc or the simulator): the AC5 sentence above, with a screenshot of the readout; a Linux WebKit run is recorded as partial evidence only.

## Open assumptions
- [AC3] Kit 3.1 inlines static public vars into the worker (advisor checked core/env.js); if a build disagrees, the worker takes the origin from the first message, cost one stored string.
- [AC5] The real device step needs Loc or a Mac with Xcode. Without it, AC5 stays unchecked and S2 reports "blocked on device", not green.
