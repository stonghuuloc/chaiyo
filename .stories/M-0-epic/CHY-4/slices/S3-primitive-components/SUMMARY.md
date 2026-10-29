# CHY-4 S3 — summary
ACs: AC3  ·  Commits: ca27cb3, 2beeb97, dc152a0, d36e412  ·  PR: #12  ·  Mode: team (impl + tester)

## Shipped
- [AC3] `Button.svelte`: `primary` / `ink` / `outline`, `<a>` with `href`, `disabled`, Solar icon + caret. Classes `btn-primary|ink|outline` (Tailwind's global `.outline` clashed). Press scale only on primary/ink. Tests `ui.test.ts › Button` ✓
- [AC3] `Sheet.svelte`, `Dialog.svelte`: scrim, `role="dialog" aria-modal`, Esc + scrim tap close, focus in and back to the opener (`modal.ts`). Dialog `min(340px, 100% − 40px)`, title `var(--text-action)` (21px, prototype `streak.js:38`). Tests ✓
- [AC3] `Chip.svelte` (40px frost pill, 1×18px divider), `Section.svelte` (ruled line, none on first). Tests ✓
- [AC3] `Toast.svelte`: `role="status"`, action, 4,500ms auto-close; a new message restarts the timer (review round 3). Tests ✓
- [AC3] Tokens: `size.column/dialog-max`, `lift.*`, `overlay.*`, `frost.divider`, `motion.press/scrim/sheet/dialog/toast` → `tokens.css`. `tokens.test.ts` ✓
- [LOCK] `motion.ts`: durations read from `--motion-*`; reduced motion = 150ms fade, no transform. `motion.test.ts` ✓. Colour guard green.

## Deviated from plan
- `modal.ts` (not in PLAN): shared Esc + focus-in/restore action for Sheet and Dialog (Q6), used by 2 components.
- Dialog title uses `--text-action` (21px), not `--text-headline` (23px): prototype dialog title is 21px. Kept headline weight/line-height.
- Toast timer test asserts the effect's tracked props from source: vitest has no DOM environment, so no mounted test.

## Not done / follow-up
- iOS Simulator Safari not checked (⚠️). Safari may not focus a tapped button, so focus restore there is unproven.
- Review nits, not fixed: stacked Esc listeners when a Dialog opens over a Sheet (`modal.ts:5-8`); no mounted tests for focus/Esc/timer; Toast live region mounts already filled.
- Solar CC BY credit screen → parked (PARKED.md).

## Verification run
`pnpm vitest --run src/lib` → 86 passed, 0 failed · `pnpm check` 0 errors · `pnpm lint` clean · `pnpm build` done (Node 24, as CI). Tester in Chromium at 390/1280 on dc152a0: every SPEC line ✅ incl. reduced motion; shots `/private/tmp/claude-501/-Users-loctong-Documents-Projects-chaiyo/8e32079d-7d83-4492-8084-0661d4cc5fcf/scratchpad/s3/`. Pre-push review round 3 (deep): 1 Important fixed in d36e412.
