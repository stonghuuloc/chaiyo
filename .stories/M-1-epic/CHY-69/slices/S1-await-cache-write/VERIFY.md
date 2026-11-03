# CHY-69 S1 — verify
Ref: branch CHY-69 @ ac11bf7. Run by implementer CHAA-18 on the final tree; pre-push review by Opus (0 Important, 2 Nits fixed).

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC1 | bundle is in the cache once the response resolves | ✅ | network.test.ts "caches the response before resolving": late-resolving fake put; handler resolves only after put, cache holds the request · 5/5 passed |
| AC1 | proof is real (negative control) | ✅ | `await` removed → "× caches the response before resolving", 1 failed / 4 passed; restored → 5/5 |
| AC1 | write failure still serves the lesson (Q1 A) | ✅ | "returns the response when the cache write fails": put rejects → 200 returned, no throw |
| AC1 | unchanged paths | ✅ | non-ok 404 not cached; network fail → cache hit returned; miss → rejects; shell branch index.ts:31-34 untouched |
| — | suite | ✅ | `pnpm test` 216/216 (15 files); `pnpm check` 0 errors; `pnpm lint` clean; `pnpm build` ✔ done |
| — | Signing | ✅ | 3/3 commits `%G?` = G, stonghuuloc noreply on author and committer |

## Residual risk
- Not proven in a real browser: no lesson bundles exist yet (CHY-8+), so an offline reopen can only be checked once CHY-25 serves one. The node test drives the same `networkFirst` function the worker calls.
- `pnpm build` ran before the last commit, which touched only the test file.
