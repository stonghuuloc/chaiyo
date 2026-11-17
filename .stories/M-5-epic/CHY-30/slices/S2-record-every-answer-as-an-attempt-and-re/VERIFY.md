# CHY-30 S2 — verify
Env: vite dev on :5199 from the M-5 stack tip (CHY-39 branch, all wave 1+2 slices), local Supabase, agent-browser (Chrome 156, session `verify-a`), 2026-11-17. Routes: `/dev/step` (6 choice steps, section `words`, IndexedDB `chaiyo-dev-step`) and the real `/lesson/h1-01/listenSpeak` signed in as a fresh OTP user (code from Mailpit :56324). Rows read with `indexedDB.getAll` in the page. Screenshots in the session scratchpad `verify-a/`.

| AC | Verdict | Evidence |
|---|---|---|
| AC4 | ✅ | `/dev/step`: answered 好, 你, 我 → 3 rows in `inputs`, each `{questionId:'dev-0..2', correct:true, answer:<pick>, ms, contentSha:'dev-1', step:{kind:'section', lesson:'h1-01', section:'words', run:'178932a5…', of:6}}`, one shared run id. Two `click()` on "Tiếp" in one tick at step 4 → 4 rows (not 5), counter "5/6". Wrong pick 好 on step 5 → `dev-4 correct:false answer:'好'`. Two `click()` on the last "Tiếp" → 6 rows total, page shows `finished` once. No-answer steps: 3 speak steps on `/dev/speak` and on the real `listenSpeak` route each stored `correct:null, ms:0`, no `answer`/`card` keys (`chaiyo-ledger-<uid>`: `q-h1-01-s01`, `f01`, `f02`, contentSha `867bbad8…`). |
| AC5 | ✅ | `/dev/step`: after 3 answers, reload → counter "4/6", 3 `[data-on=true]` segments, title "Chữ nào là 是?" (`ac5-resume-4of6.png`); the remaining answers land on the same run `178932a5…` (6 rows, one run). After finishing, reload → "1/6", 0 segments, title "Chữ nào là 好?" (`ac5-after-finish-1of6.png`); the next answer opens a new run `6293d457…`. |

**The AC4 row is scoped.** Proven live: one Attempt per `next`, double-press guard, last-step guard, Attempt shape, no-answer shape. Not proven live: "record rejects → step stays" and the `record()` → `StudyEvent[]` return ([LOCK]). Neither is observable in the UI until S3 renders events. Both are covered by `StepRunner.svelte.test.ts` and `ledger.test.ts` in the stack run (3164 passed).

## Tests
`vitest --run --coverage` on the stack tip: Test Files 130 passed | 1 skipped, Tests 3164 passed | 2 skipped, branches 79.19% (one run, this tree).

## Residual risk
- `SectionDone` / `DayCounted` from `record()` are dropped at the runner until S3 adds `onEvents`, so no UI shows them yet.
