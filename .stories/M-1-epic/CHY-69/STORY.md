# CHY-69 — Service worker: await bundle cache write before responding

## Goal (business why, 1-2 sentences)
A lesson bundle fetched online must already be in the SW cache when its response resolves, so reopening the lesson offline (ADR 0002, CHY-25) never misses.

## Context an agent can't derive from code
- Found by CodeRabbit on PR #17; parked in CHY-6 PARKED.md.
- CHY-25 (Catalog reads offline) depends on this.

## Locked decisions (BA/Loc already ruled — never re-open)
- ADR 0002: one static JSON bundle per lesson, same origin, cached by the service worker.

## AC index

| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Bundle fetched online is cached once the response resolves | high | S1 |

## Out of scope
- Precache list, cache versioning, offline Catalog reads (CHY-25).
