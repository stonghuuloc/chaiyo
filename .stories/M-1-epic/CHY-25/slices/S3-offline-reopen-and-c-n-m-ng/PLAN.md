# CHY-25 S3 — plan
ACs: AC5, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-25-S3 off main after S2 · run `pnpm install` first

## Files touched
- create: `src/service-worker/shell.ts`, `src/service-worker/shell.test.ts`
- edit: `src/service-worker/index.ts`, `src/service-worker/network.ts`, `src/service-worker/network.test.ts`
- create: `src/lib/catalog/view.ts`, `src/lib/catalog/view.test.ts`, `src/lib/catalog/offline.test.ts`
- edit: `src/lib/catalog/http.ts` (offline mapping, if S2 left it out)
- edit: `src/routes/(app)/lesson/[id]/[section]/+page.ts`, `+page.svelte`
- edit: `messages/vi.json`
No content, schema or lint edit.

## Anchors (verified 2026-11-06 on main 23f1db9)
- `src/service-worker/index.ts:8` `CACHE = shell-${version}`; `:9-11` `SHELL`; `:13-15` install precaches `SHELL`; `:17-23` activate drops every other cache; `:32-34` shell cache-first; `:36` `networkFirst(..., (p) => event.waitUntil(p))`.
- `src/service-worker/network.ts:1` `BUNDLE = /^\/content\/[0-9a-f]{64}\/[^/]+\.json$/`; `:11-14` `put` then `await` for BUNDLE, `waitUntil` otherwise.
- `src/service-worker/network.test.ts:4-6` fixed Requests and `noWait`; `:9-24` "caches a bundle response before resolving"; `:26-42` non-bundle deferred; `:44-50` rejecting put; `:52-60` the `it.each` that today asserts `/content/current.json` and `/content/abc/h1-01.json` are deferred; `:61-120` cache fallback and non-ok cases.
- The built shell on main: at 23f1db9 a `pnpm build` with `static/content` present emits `.svelte-kit/output/client/service-worker.js` whose asset list holds `content/7915681c…/{audio-manifest,h0-00,h1-01,manifest}.json`, `content/current.json` and `fonts/lessons/ukai-{h0-00,h1-01}.woff2`. Task 1 must make the `content/` entries disappear and keep the font entries; a build re-check is its verify step.
- `src/lib/shell/guard.ts:6-10` offline auth keeps the stored session; `src/routes/(app)/+layout.ts:4-8` is the only auth gate on the lesson route.
- `messages/vi.json:1-15` one flat JSON per locale, base `vi` (`project.inlang/settings.json`); keys used by `m.*` in `src/routes/(app)/…/+page.svelte`.
- After S2: `src/lib/catalog/http.ts` (`httpSource`), `src/lib/catalog/index.ts` (`catalog`), the lesson route `+page.ts` (`catalog.lesson(params.id)`) and `+page.svelte` (title + words + `data-content-sha`).
- `docs/screens.md:114` names the "cần mạng" state for a lesson whose section is not cached.

## Task 1 [AC5] Precache filter + app-shell navigation fallback
Files: create `src/service-worker/shell.ts`, `src/service-worker/shell.test.ts`; edit `src/service-worker/index.ts`
- Test first: `appShell(['/_app/a.js', '/content/current.json', '/content/<64hex>/h1-01.json', '/fonts/lessons/ukai-h1-01.woff2', '/'])` -> `['/_app/a.js', '/fonts/lessons/ukai-h1-01.woff2', '/']` (order kept); an input with no `/content/` path returns a new array with the same items; `appShell([])` -> `[]`. `cachedPage` over a fake cache: a cached path wins; a missing path returns the `APP_SHELL` response; neither returns `undefined`.
- Change:
  ```ts
  export const APP_SHELL = '/today';
  export function appShell(paths: string[]): string[] {
    return paths.filter((p) => !p.startsWith('/content/'));
  }
  export async function cachedPage(cache: Pick<Cache, 'match'>, request: Request, shellRequest: Request) {
    return (await cache.match(request)) ?? (await cache.match(shellRequest));
  }
  ```
  `index.ts`: `const SHELL = appShell(...)`; `const appShellRequest = new Request(new URL(APP_SHELL, self.registration.scope));`; install caches `[...SHELL, APP_SHELL]` (`cache.addAll` resolves the relative path, as it does for `SHELL` today); the fetch handler starts with `const cache = await caches.open(CACHE);` then, `if (event.request.mode === 'navigate') { const hit = await cachedPage(cache, event.request, appShellRequest); if (hit) return hit; }` before the existing `SHELL.includes` branch and `networkFirst`.
- Verify: `pnpm test -- src/service-worker/shell.test.ts`; `pnpm check` (the SW tsconfig `src/service-worker/tsconfig.json` includes the new file); a `pnpm build` with `static/content` present and the emitted `service-worker.js` inspected: no `content/` path in the asset list, `/today` present.
- Note: this is the AC5/AC6 hinge. Without the filter, the built worker precaches every bundle and AC6's "never opened" lesson is offline anyway; without the fallback, AC5 fails after the normal client-side navigation (no document request for the lesson URL exists).

## Task 2 [AC5] Await the current.json cache write too
Files: `src/service-worker/network.ts`, `src/service-worker/network.test.ts`
- Test first (the old assertion is the decision being changed): in `network.test.ts:52-60`, split the `it.each`: `/content/abc/h1-01.json` stays deferred; `/content/current.json` now resolves only after a delayed `put` (same shape as the bundle case at `:9-24`) and `waitUntil` is not called. Add: a rejecting `put` on current.json still returns the response; `/content/<64hex>/h1-01.json` keeps its awaited case; `https://example.test/api/data` keeps its deferred case (`:26-42`).
- Change: `const BUNDLE = /^\/content\/(?:[0-9a-f]{64}\/[^/]+|current)\.json$/;` at `:1`. No other line changes; `index.ts:36` already passes `waitUntil`.
- Verify: `pnpm test -- src/service-worker`; `pnpm check`.
- Mutation paths: online write awaited; offline cache hit unchanged (`:97-108`); no cache + offline rethrows (`:110-121`); non-ok response is never cached.

## Task 3 [AC6] Offline error -> state -> "cần mạng"
Files: edit `src/lib/catalog/http.ts` (if needed); create `src/lib/catalog/view.ts`, `view.test.ts`; edit the route `+page.ts`/`+page.svelte`, `messages/vi.json`
- Test first (`view.test.ts`): a stub catalog whose `lesson` throws `CatalogError('offline', 'h1-02')` -> `{ kind: 'offline', id: 'h1-02' }`; one that throws `offline` with id `current` (the sha request failed) -> `{ kind: 'offline', id: 'h1-02' }` because the route asked for h1-02; one that resolves a `LessonContent` -> `{ kind: 'ok', content }`; `not-found` and `malformed` are re-thrown (no notice).
- Test first (`offline.test.ts`): a source whose `bundle()` rejects with `TypeError('Failed to fetch')` -> `CatalogError` code `offline`, `id` = the lesson id; a rejected `current()` also maps to the lesson id at `lessonState` (the source names it `current`).
- Change:
  ```ts
  export async function lessonState(cat: Catalog, id: string) {
    try { return { kind: 'ok' as const, content: await cat.lesson(id) }; }
    catch (e) {
      if (e instanceof CatalogError && e.code === 'offline') return { kind: 'offline' as const, id };
      throw e;
    }
  }
  ```
  `messages/vi.json` gains `"lesson_offline": "Bài này cần mạng."` after `screen_lesson_section`. The route `+page.ts` returns `lessonState(catalog, params.id)`; `+page.svelte` branches on `data.kind === 'offline'` and renders `<p>{m.lesson_offline()}</p>` only (no title, no word list); `ok` keeps S2's markup.
- Verify: `pnpm test -- src/lib/catalog`; `pnpm check`; `pnpm lint` (prettier formats `messages/vi.json`).
- Mutation paths: offline at `current()`, offline at `bundle()`, not-found, malformed, ok; a page reload with `kind: 'ok'` does not show the notice.

## Task 4 [AC5][AC6] Simulate the SW cache in node, then prove it in a browser
File: create `src/lib/catalog/offline.test.ts`
- Test first (fails until Tasks 1-3 land): a Map-backed cache and an origin `fetch` serving `current.json` + the fixture h1-01/h1-02 bundles. Online pass: `networkFirst` for both current.json and the bundle through a `pageFetch` wrapper; assert both are in the map and the promises settle before the responses resolve. Offline pass (`fetch` throws): `createCatalog(httpSource(pageFetch))` -> `lesson('h1-01')` returns the same `contentSha`; `lesson('h1-02')` throws `CatalogError('offline', 'h1-02')`; the cache still holds only what was fetched online.
- Change: none beyond the tests; the code from Tasks 1-3 must satisfy them.
- Verify: `pnpm test -- src/lib/catalog/offline.test.ts`.
- Manual browser (one run on the final tree):
  1. `source ~/.capy/work/ft/bin/activate`; `bash scripts/build-content.sh`; `PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder pnpm build`; `pnpm preview`.
  2. Signed in, clear site data, load `/today` (the document request; the SW installs and precaches the shell + `/today`).
  3. Reach `/lesson/h1-01/tu-moi` by clicking through the app (client-side navigation); record `data-content-sha`; in DevTools the lesson URL has no document request, only `current.json` and `h1-01.json`.
  4. DevTools -> Network -> Offline (or airplane mode); reload; the `/today` shell serves the lesson URL and the title, the 10 words and `data-content-sha` render unchanged (AC5).
  5. Open `/lesson/h1-02/tu-moi` offline; the page shows "Bài này cần mạng." (AC6). `data-content-sha` is absent.
  6. DevTools -> Application -> Cache Storage `shell-*`: `/today` is there from install; no `/content/` entry before step 3; after it `current.json` and `h1-01.json`, and still no `h1-02.json`.
  7. Repeat AC5 with a direct online load of `/lesson/h1-01/tu-moi` (the path-cache branch), then offline reload.
  8. Shell check: `curl -s http://localhost:4173/today > /tmp/today.html` and the same for `/lesson/h1-01/tu-moi`; the bodies are the same shell (route hints may differ). A materially different body means the fallback is wrong — report it.
  9. Open `/lesson/h1-02/tu-moi` online; its bundle appears in `shell-*` only after that open, and step 5 then loads it offline. The cache grows per opened lesson, not at install.
- If no signed-in session is available locally, report the manual items as not run and do not claim AC5/AC6 verified; the node test is not a substitute for the browser check.

## Mutation paths covered
- Precache: online install with content present, content absent, a path set with no content; the filter preserves order and other files; `/today` in the install list returns 200.
- Navigation: a lesson URL with no path cache gets the `/today` shell; a navigation to a path that is cached gets that path; neither cached falls through to `networkFirst`; `/` is never used as the app shell.
- networkFirst: awaited bundle, awaited current.json, deferred API GET, rejecting put, non-ok response, offline with cache, offline without cache.
- Catalog: offline before the sha, offline after the sha, cached sha + uncached bundle, cached bundle + uncached sha, ok.
- Page: `ok` branch, `offline` branch, an unknown id (re-thrown, SvelteKit error), a lesson fetched twice (same sha).

## Rollback
Revert the SW files (`shell.ts` deleted, `index.ts`/`network.ts`/tests restored), `view.ts`/tests deleted, route `load` back to `catalog.lesson`, and the `lesson_offline` key removed. S1/S2 stay green; the offline path returns to the main behaviour (content precached, current.json deferred).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
The `appShell`, regex and `lessonState` blocks above are drafts. If the browser keeps serving `/content/` from the shell cache after the filter (an old worker still active), report it; do not delete caches by hand in code.
