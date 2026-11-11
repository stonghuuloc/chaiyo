# CHY-28 S3 — plan
ACs: AC4, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-28  ·  Lane L3 Placement

## Depends on (execution order)
- CHY-28 S2 merged (handoff written); CHY-28 S1 (`CURRICULUM`, `LESSONS`, run rules); CHY-26 S1 (session); CHY-26 S3 (sync after a record, `src/lib/ledger/ledger.ts`).

## Anchors (verified 2026-11-11 on main 18af4bb)
- `src/lib/study/progress.ts:49-66` placement rule; `src/lib/study/apply.ts:8-26` `initialState` (only the first lesson unlocked).
- `src/lib/ledger/ledger.ts:10-16` `openLedger({ initial, store, db, idb })`; `src/lib/ledger/index.ts:1-5` exports; `src/routes/dev/ledger/+page.svelte:14-37` mount pattern (open, subscribe, `syncWhenOnline`, cancel on unmount).
- `src/routes/dev/ledger/ledger-page.test.ts:1-20` — `fake-indexeddb` + `memoryStore` test pattern.
- `prototype/o3-result.html:41-84` copy and branches; `:83` confetti rule; `prototype/step.js:106-180` confetti.
- `supabase/migrations/20261110000000_learner_tables.sql:9-13` `settings.tz`, `:46-51` its policies.

## Task 1 [AC4] resultView
Files: `src/lib/placement/result.ts`, `src/lib/placement/result.test.ts` (new)
- Verify: `pnpm vitest run src/lib/placement/result` → pass. Negative control: count words with `l.level < cleared` → the 1 row gives "+0 từ" and fails; revert.

## Task 2 [AC5] learner Ledger
Files: `src/lib/learner/index.ts`, `src/lib/learner/learner.test.ts` (new)
- Verify: `pnpm vitest run src/lib/learner` → pass.

## Task 3 [AC5] Study fold proof
File: `src/lib/placement/placement-study.test.ts` (new)
- Verify: `pnpm vitest run src/lib/placement/placement-study` → pass; negative control per SPEC.

## Task 4 [AC4] [AC5] result page + confetti
Files: `src/routes/(onboard)/placement/result/+page.svelte` (replaces S2's stub), `src/lib/ui/celebrate.ts` (new), `messages/vi.json` (art from CHY-26 S1)
- Verify: tester's local rows.

## Task 5 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Mutation paths covered
- cleared 0, 1, 2, 4, 5; missing handoff; reload before removal; reduced motion; second learner on the same device; settings row missing.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/placement/result.ts (core of the 1-4 branch)
const lvl = (l: number) => LESSONS.filter((x) => x.level === l);
const next = lvl(cleared + 1)[0];
const last = lvl(cleared).at(-1)!;
const words = LESSONS.filter((x) => x.level <= cleared).reduce((s, x) => s + x.words.length, 0);
const range = cleared > 1 ? `HSK 1–${cleared}` : 'HSK 1';
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; recorded Placement Attempts stay (append-only) and keep their effect, as Study defines.
