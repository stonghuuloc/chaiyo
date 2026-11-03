# CHY-69 S1 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] For a same-origin GET that is not served from the shell precache, a 200 network response is written to the SW cache before the fetch handler's response resolves. Verified by: a fake cache whose put resolves late; when the handler resolves, put has completed and the cache holds the request.
- [AC1] If the cache write rejects (e.g. QuotaExceededError), the handler still resolves with the network response (Q1 A). Nothing is cached; nothing throws.
- [AC1] Non-ok responses are not cached and are returned as-is (unchanged).
- [AC1] Network failure still falls back to the cache, and a miss still rejects (unchanged, index.ts:39-42).

## Not this slice
- Offline Catalog reads and bundle URLs → CHY-25. Precache list, cache naming, activate cleanup: unchanged.

## Seam
The fetch handler's network branch in `src/service-worker/index.ts:35-43` (try + network-fail fallback), extracted as a function that takes the request, the cache and a fetch function, so node tests can drive it with fakes.

## Test contract
- [AC1] vitest: late-resolving put → the handler result resolves only after put resolved; cache holds the request.
- [AC1] vitest: put rejects → the handler resolves with the 200 response, no throw.
- [AC1] vitest: 404 response → returned, put never called. Network throws + cache hit → the hit is returned; network throws + miss → rejects.

## Open assumptions
- None.
