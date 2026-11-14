# CHY-30 S1 — summary
ACs: AC1, AC2, AC3  ·  Commits: see git log origin/main..HEAD  ·  PR: not opened (coordinator pushes)

## Shipped
- [AC1] `src/lib/lesson/progress.ts` + `StepRunner.svelte`: ✕ link (`lesson_exit_label`, `exit` href), N segments, counter in the FocusFrame top bar; CTA in the sticky actions bar, disabled until a view sets one. Tests: `progress.test.ts`, `StepRunner.test.ts` ✓
- [AC2] `choice.ts` (`grade`, `choiceCta`, `toAnswer`) + `steps/Choice.svelte`: Kiểm tra → marks + verdict → Tiếp, `Answer` reported, next step. Tests: `choice.test.ts` ✓
- [AC3] Test mode: "Câu tiếp" (caret), "Nộp bài" on last, no marks. Placement: `isLast` (`run.ts`) → `+page.svelte` CTA reads `lesson_submit` at level 5 index 9. Tests: `choice.test.ts`, `run.test.ts` ✓
- [NFR] `steps.ts`: `LessonStep` union + `viewOf` via `import.meta.glob` on file name. Test: `steps.test.ts` ✓
- Dev proof route `src/routes/dev/step` (`?mode=test`). 9 `lesson_*` keys in `messages/vi.json` after `screen_gate`.

## Deviated from plan
- Plan said leave `lesson/section/contentSha` out of the destructure to keep lint clean; `svelte/no-unused-props` fires anyway, so one `eslint-disable-next-line` with reason sits on the destructure.
- `✕` anchor needs `eslint-disable svelte/no-navigation-without-resolve` (callers pass resolved paths; same reason as `Button.svelte`).
- `next()` in the runner ignores its `answer` arg (S2 records it); `steps.ts` types views as `Component<StepProps<LessonStep>>`.
- PLAN anchors for `placement/+page.svelte` re-pointed after rebase (docs commit); behaviour unchanged.

## Not done / follow-up
- Placement "Nộp bài" not seen in a browser: `/placement` redirects to `/login` locally (no Supabase). Covered by `isLast` unit tests only.
- Keyboard shortcuts / audio prompt in Choice: parked (no AC).
- `icons.test.ts` sprite mismatch fails on the full run; slice touches no icons file (pre-existing).

## Verification run
- `pnpm check` → 0 errors, 0 warnings (2043 files)
- `pnpm lint` (raw) → prettier clean, eslint clean
- `pnpm vitest --run src/lib/lesson src/lib/placement` → pass
- full `pnpm test` → 2 failed (timeouts, load ~580) | 2921 passed; the two timeout files pass alone at load 391 (`--testTimeout=120000`); `icons.test.ts` still fails
- `pnpm build` → exit 0
- Browser (`/dev/step`, `?mode=test`): see worker_done
