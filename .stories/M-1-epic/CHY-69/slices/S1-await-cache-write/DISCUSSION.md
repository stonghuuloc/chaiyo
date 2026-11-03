# CHY-69 S1 — discussion
ACs: AC1

## Current behaviour (verified, with anchors)
- [AC1] src/service-worker/index.ts:37 `if (res.ok) cache.put(event.request, res.clone());` — not awaited, not in waitUntil; the response returns at :38 while the write is in flight.
- [AC1] No service-worker tests exist; vitest runs src/**/*.test.ts in node (vite.config.ts:33).

## Answered here (no human needed)
- [AC1] AC says "in the cache once the response resolves", so the write must finish before the response resolves: `event.waitUntil` alone keeps the worker alive but resolves the response first, so it fails the AC as written.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | cache write failure | A — await, swallow the write error, still return the network response | Loc, 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- ADR 0002 static bundles, same origin, SW-cached.
