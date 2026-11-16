# CHY-25 S1 — verify
Tree: PR #164 head c8fc4bac. Caller grep: `grep -rln "lib/catalog" src` outside `src/lib/catalog/` = 0 hits, so no route or screen consumes the catalog yet (HTTP source and route are S2/S3). No browser path exists in S1; Loc accepted the real-bundle run as S1 evidence (2026-11-16).
Evidence run: real built bundle (`tsx scripts/import-content.ts --sink bundle --only lessons/hsk1`, sha `aaa34b03…53b3`, 6 lesson files) read through `createCatalog` by a throwaway script (/tmp/claude-501/verify-CHY-25/run.mts), no mock.
Tests: `pnpm exec vitest run src/lib/catalog` (CI placeholder Supabase env) -> PASS 20, FAIL 0.

| AC | Verdict | Evidence |
|---|---|---|
| AC2 | ✅ | Real bundle: `lesson('h1-01')` Xin chào, 10 words in order 你,好,您,你们,你好,对不起,没关系,谢谢,不客气,再见; `word('你好')` nǐ hǎo / nhĩ hảo, listedIn `['h1-01']`, taughtIn `h1-01`, contentSha `aaa34b03…`; `char('你')` 1 reading + same sha; Primer `h0-00` -> 0 words. No rendered surface in S1 (accepted, Loc 2026-11-16). |
| AC3 | ✅ | Real bundle `s-h1-01-01` (`你好！`): tap 0 and tap 1 -> `你好` start 0; tap 2 (`！`) -> not-found `s-h1-01-01:2`; tap 99 -> `s-h1-01-01:99`; unknown sentence -> `s-h9-99-01`. No rendered surface in S1 (accepted, Loc 2026-11-16). |
| AC4 | ✅ | Unit tests assert not-found + id for `h9-99` (in the 20 passing). Real-file source: `lesson('h9-99')` threw ENOENT, not a CatalogError — S1's only Source (fixture) is correct; mapping moved to S2 (Decisions). |
| AC7 | ✅ | 20/20 tests use `fixtureSource()` (in-memory, `content/import/fixtures/ok`); fetch spy 0 calls in tests; my real-bundle run also stubbed `fetch`: 0 calls; `index.ts` has no `node:` import |

## Decisions (Loc, 2026-11-16)
- AC2/AC3: executed run on the real hsk1 bundle is the S1 evidence; first rendered proof comes with the S2 lesson route.
- AC4: the catalog keeps passing Source errors through. The S2 HTTP Source must throw `CatalogError` itself: 404 → `not-found` naming the id, network failure → `offline`, with a test in S2 (raw `ENOENT`/`TypeError` today if a Source doesn't).

## Residual risk
- No browser proof for AC2/AC3/AC4 in S1; first rendered proof is S2/S3.
- Full-content bundle import fails lint (hsk5 errors); only `lessons/hsk1` (production root) built.
