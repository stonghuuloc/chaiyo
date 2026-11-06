# CHY-25 S3 — spec
ACs: AC5, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (design; anchors on main 23f1db9, 2026-11-06)

## Behaviour
- [AC5] New `src/service-worker/shell.ts` exports `appShell(paths: string[]): string[]`: it returns the paths that do **not** start with `/content/`, in order. `src/service-worker/index.ts:9-11` becomes `const SHELL = appShell([...immutable, ...assets, ...prerendered].map((f) => new URL(f.path, self.registration.scope).pathname));`. On main this matters: a local `pnpm build` with `static/content` present emits a `service-worker.js` whose asset list holds `content/7915681c…/h1-01.json`, `content/current.json`, `fonts/lessons/ukai-*.woff2` — precaching every lesson, which makes an unopened lesson available offline and leaves AC6 with nothing to report. After the filter, `/fonts/lessons/…` stays precached (opened lessons need their font offline) and every `/content/` path is not.
- [AC5] `src/service-worker/network.ts:1` accepts `current.json` in the awaited set: `const BUNDLE = /^\/content\/(?:[0-9a-f]{64}\/[^/]+|current)\.json$/;`. The cache write for `/content/<sha>/<file>.json` and for `/content/current.json` is awaited before `networkFirst` resolves; every other GET still hands the write to `waitUntil` (`:12-14`, CHY-69's LOC-10 unchanged for them). Consequence: after an online `lesson('h1-01')` the current sha and the bundle are in the SW cache when the response resolves, so an immediate reload cannot miss the sha.
- [AC5] The offline read path: the online visit caches the SPA document for `/lesson/h1-01/tu-moi` (network-first, non-bundle), `current.json` and the bundle; offline, `fetch` rejects and `cache.match` returns all three; `catalog.lesson('h1-01')` returns a `LessonContent` whose `contentSha` is the same 64-hex sha as before. Nothing is read from IndexedDB or localStorage.
- [AC6] When a content request rejects and the cache has no entry, `httpSource` (S2) throws `CatalogError` code `offline` with the id it knows (for `current()` that is `current`). New `src/lib/catalog/view.ts` exports `lessonState(cat: Catalog, id: string): Promise<{ kind: 'ok'; content: LessonContent } | { kind: 'offline'; id: string }>`; it maps any code `offline` to `{ kind: 'offline', id }` using the lesson id the route asked for, and re-throws `not-found`/`malformed`.
- [AC6] `src/routes/(app)/lesson/[id]/[section]/+page.ts` loads `lessonState(catalog, params.id)`; `+page.svelte` renders the S2 title + word list for `kind: 'ok'`, and for `kind: 'offline'` renders only `m.lesson_offline()`. `messages/vi.json` gains `"lesson_offline": "Bài này cần mạng."`, which contains the AC's "cần mạng" (the page shows no empty lesson, no title, no word list).
- [AC6] A lesson that was opened online shows no notice offline (AC5); the notice appears only for a bundle absent from the cache. An unknown id stays `not-found` and is not reported as offline.
- [NFR] The cache name `shell-${version}` (`index.ts:8`) and the activate cleanup (`:17-23`) are unchanged; the sha URL stays immutable, so no per-bundle invalidation code is added. The awaited write applies to responses with `Cache-Control: no-store`; the Cache API stores them (HTTP cache directives do not govern `cache.put`).

## Fixtures (described, not committed code)
- Node, `src/lib/catalog/offline.test.ts`: a Map-backed `Cache` (`put` stores a clone, `match` returns it) and an origin `fetch` that serves `current.json` and the fixture bundles from `fixtures/source.ts`; a `pageFetch(url)` wraps `networkFirst(new Request(new URL(url, 'https://app.test')), cache, online ? origin : offline, waitUntil)` where `offline` throws `TypeError('Failed to fetch')`. No server, no browser, no network.
- `src/service-worker/shell.test.ts` and additions to `network.test.ts` use the same plain objects the existing SW tests use (`network.test.ts:4-6,9-24`).
- `src/lib/catalog/view.test.ts` uses a stub `Catalog` whose `lesson` resolves or throws `CatalogError`.
- Browser, manual: the built app + generated `static/content` + a signed-in session (local Supabase per CHY-2, or the hosted preview with the test account); DevTools offline.

## Negative controls
- Online `lesson('h1-01')`, then offline `lesson('h1-01')` -> same `contentSha` (AC5); offline `lesson('h1-02')`, never fetched -> `offline` and the page shows "Bài này cần mạng." (AC6).
- `current.json` cached but the bundle not -> `offline` (the sha does not imply the bundle); bundle cached but current.json evicted -> `offline` (the URL cannot be built).
- `appShell(['/_app/a.js', '/content/current.json', '/content/<sha>/h1-01.json', '/fonts/lessons/ukai-h1-01.woff2'])` returns the app and font paths and no content path.
- The existing non-bundle case still resolves before its `put` resolves (`network.test.ts:26-42`); the bundle case still awaits (`:9-24`).
- A `put` that rejects still returns the response; current.json gets the same protection as a bundle.
- The page must not flash "cần mạng" for a lesson that loads normally: `lessonState` returns `ok` with the content.
- `lessonState(cat, 'h9-99')` re-throws `not-found`; the notice is only for `offline`.

## Not this slice
- PWA install/update and the precache of the SPA document for unvisited routes (CHY-61; Q3).
- The Word Page and section bodies (CHY-31..35), audio offline (CHY-16), per-lesson font loading (CHY-35).
- Caching the audio manifest or Dictionary rows.

## Seam
`src/service-worker/shell.ts` (new), `shell.test.ts` (new), `network.ts`, `network.test.ts`, `index.ts`; `src/lib/catalog/view.ts` (new), `view.test.ts`, `src/lib/catalog/http.ts` (offline mapping from S2), the lesson route `+page.ts`/`+page.svelte`, `messages/vi.json`.

## Test contract
- vitest `src/service-worker/shell.test.ts`, `src/service-worker/network.test.ts`, `src/lib/catalog/offline.test.ts`, `src/lib/catalog/view.test.ts`: the cases above. `pnpm test` and `pnpm check` (the SW tsconfig compiles the new file) green.
- Manual browser (one run on the final tree): `pnpm build` with `static/content` present, `pnpm preview`; signed-in visit `/lesson/h1-01/tu-moi` online; note `data-content-sha`; DevTools -> Network -> Offline; reload -> same title/words and the same `data-content-sha`; `/lesson/h1-02/tu-moi` -> "Bài này cần mạng."; after clearing site data, DevTools -> Application -> Cache Storage `shell-*` has no `/content/` entry before the first lesson is opened and has `current.json` + `h1-01.json` after it.
- `grep -c 'lesson_offline' messages/vi.json` -> 1; the value contains `cần mạng`.

## Open assumptions
- [AC5] The SPA document for the opened lesson URL is network-first cached by the online visit, so reloading that same URL offline gets the shell; a URL never visited offline does not (Q3).
- [AC6] The browser keeps the SW cache across an offline reload; only a new SW activation (a new deploy) drops `shell-${version}`. OS cache eviction can still remove an entry, and then the lesson is honestly offline-unavailable.
- [AC6] `Cache.put` accepts the `no-store` current.json response in the browser; the node test checks the `Cache` contract only. The Chrome manual run is the browser check.
- [AC5] `waitUntil` in `index.ts:36` still extends the event for non-bundle writes; the awaited current.json/bundle writes complete before `respondWith`'s promise settles, which is what AC5 compares.
