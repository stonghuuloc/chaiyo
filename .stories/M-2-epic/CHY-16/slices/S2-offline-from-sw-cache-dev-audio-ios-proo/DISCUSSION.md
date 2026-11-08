# CHY-16 S2 — discussion

Loc's answers (2026-11-07): Q4 A (r2.dev + CORS GET, custom domain before launch), Q5 A (bundle carries `audioKey`; CHY-8 follow-up outside M-2), Q6 A (one `/dev/audio` route). Calls made at ≥80%, all serving [AC3] and [AC5]:

## Q-block D1 — how do clips get into the cache?
| | A — message the worker with the lesson's urls (picked) | B — cache only what was already played |
|---|---|---|
| "opened Bài 1, then airplane mode" | works: opening the lesson calls `precache(keys)` | clips never tapped are missing |
| client code | `precache(keys)` ~10 lines | none |
| worker code | `message` handler + shared `put` | cache-first fetch only |
rec: **A**, and the fetch handler also caches every clip it fetches (so B comes for free). The keys come from the lesson bundle's `audioKey` once the CHY-8 follow-up lands; `/dev/audio` passes a fixture list until then. **Message for the Captain: the CHY-8 follow-up slice (bundle.ts: `audioKey` on every sentence, word and chip, C3 rev 4) must land before an M-5 lesson step can call `precache`.**

## Q-block D2 — cross-origin range requests
`<audio>` sends `Range` requests, Safari insists on a `206` answer, and `Cache.put` refuses a `206`. So the worker fetches the whole clip itself (`mode: 'cors'`, no `Range`), caches the `200`, and builds each `206` from the cached bytes. A CORS response is readable, so slicing works; an opaque response is not. A worker may answer a no-cors media request with a cors response, so the element needs no `crossOrigin` attribute and the first (pre-worker) play still works from r2.dev without CORS.

## Q-block D3 — the cache name
`audio-v1`, not `shell-<version>`: clips are content-addressed and immutable, so a deploy must not delete them (index.ts:21-23 deletes every cache but the shell's). The shell's activate cleanup must therefore leave `audio-v1` alone: one-line change in S2.

## Q-block D4 — who can open `/dev/audio`?
Outside `(app)`, so no login. `+page.ts` throws `error(404)` when `VERCEL_ENV` is `production`, Loc's phone uses the https Vercel preview (a LAN http dev server has no service worker, so it proves taps only). `prerender = false`; no nav link.

## Answered during execute (all [AC3] / [AC5], each at ≥80%)
- D5 [AC5] Fixture clips: /dev/audio lists the 25 real Bài 1 clips (15 sentences + 10 words, keys from the HSK1 manifest, CHY-15 S2), not the three prototype mp3s: they exist on R2 now and exercise the real URL and CORS path. The device checklist "clips 1, 2, 3" is the first three rows.
- D6 [AC5] Production 404 is client-side: the SPA has ssr = false, so the shell answers 200 and the page renders 404. Verified in a VERCEL_ENV=production build. The route chunk still ships; it holds only public clip keys.
- D7 [AC3] If the cors fetch throws (bucket CORS missing), the worker falls back to a plain fetch of the request, uncached, so playback online never depends on CORS. Offline behaviour is unchanged.
- D8 [AC3] precache gives up after 10 s (resolves all failed) and the worker always replies, so a stale worker from before this deploy (no message listener, no skipWaiting) cannot hang a caller.
