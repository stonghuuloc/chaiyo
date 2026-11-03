# CHY-69 S1 — plan
ACs: AC1  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-69 (off main bc15e16)

## Anchors (verified 2026-11-03 on main bc15e16)
- `src/service-worker/index.ts:24-46` fetch listener; `:30` `const cache = await caches.open(CACHE)`; `:31-34` shell hit; `:36` `const res = await fetch(event.request)`; `:37` `if (res.ok) cache.put(event.request, res.clone());` (the bug); `:39-42` network-fail → cache.match fallback.
- `src/service-worker/index.ts:3-5` imports `$app/service-worker`, `$app/manifest`, `$app/env` — not importable in node tests, hence the extraction.
- `src/service-worker/tsconfig.json` exists (webworker lib); `vite.config.ts:33` vitest include `src/**/*.{test,spec}.{js,ts}`, node env, `requireAssertions: true`.
- No `rg` on the Mac: use `grep`.

## Task 1 [AC1] Extract and fix the network branch
Files: new `src/service-worker/network.ts`, `src/service-worker/index.ts:35-43`
- Test first: `src/service-worker/network.test.ts` — `caches the response before resolving`, `returns the response when the cache write fails`, `does not cache a non-ok response`, `falls back to the cache when the network fails`, `rejects on network failure with no cached copy`.
- Change: `export async function networkFirst(request: Request, cache: Pick<Cache, 'put' | 'match'>, fetchFn: typeof fetch): Promise<Response>`. On ok: `await cache.put(request, res.clone()).catch(() => {})` before returning `res` (Q1 A). Keep the try/catch fallback identical to :39-42. index.ts calls `networkFirst(event.request, cache, fetch)` inside the existing respondWith; the shell branch (:31-34) stays.
- Verify: `pnpm vitest --run src/service-worker/network.test.ts`; then `pnpm check`, `pnpm lint`, `pnpm build` (SW still bundles).

## Mutation paths covered
- Only the fetch handler's network branch. install/activate are untouched.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
export async function networkFirst(request: Request, cache: Pick<Cache, 'put' | 'match'>, fetchFn: typeof fetch) {
  try {
    const res = await fetchFn(request);
    if (res.ok) await cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw err;
  }
}
```
Note: in the draft, a rejecting put is swallowed before the catch, so it never reaches the cache fallback.

## Rollback
git revert of the slice commits. No data, no migration.
