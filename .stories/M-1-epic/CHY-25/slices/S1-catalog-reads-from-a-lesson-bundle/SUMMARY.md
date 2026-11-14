# CHY-25 S1 — summary
ACs: AC2, AC3, AC4, AC7  ·  Base: main 0836423e  ·  PR: none yet (coordinator pushes)

## Shipped
- [AC2][AC4][AC7] `src/lib/catalog/index.ts` `createCatalog(source)`: `lesson(id)` reads `source.current()` then `source.bundle(sha,id)`, checks sha + lesson id (`malformed`), caches the bundle, returns `LessonContent` (words in `sections.words.ids` order, Primer -> `[]`). Seam exports verbatim from SPEC `## Seam`.
- [AC2] `word(id)` / `char(hanzi)` scan every loaded bundle, return the item + `contentSha`; a miss throws `not-found` naming the id.
- [AC3] `lookup(sentenceId, tapIndex)`: code-point index -> `seg` token -> `thin` entry (char fallback; `start` = token start, or tapped index on fallback); non-concatenating `seg` -> `malformed`; punctuation / past end -> `not-found` `<id>:<i>`.
- [AC7] `fixtures/source.ts` `fixtureSource()` builds bundles in memory from `content/import/fixtures/ok`; no I/O in `index.ts` (0 `node:` imports, 0 `buildBundle`); fetch spy = 0 calls.
- Tests: `src/lib/catalog/catalog.test.ts`, 17 cases, written red first (module missing), then green.

## Deviated from plan
- None in behaviour. Test file runs under CI placeholder Supabase env (worktree has no .env).

## Not done / follow-up
- No browser check: no screen in this slice. HTTP source, route, offline: S2/S3.

## Verification run
See worker_done evidence (`pnpm check`, `pnpm lint` raw, filtered + full `pnpm test`, `pnpm build`).
