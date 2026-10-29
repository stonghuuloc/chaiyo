# CHY-4 S3 — plan
ACs: AC3  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-4 (PR #12, base CHY-3)

## Anchors (verified 2026-10-29)
- `design.tokens.json:279-296` `motion` group; `:297-` `frost` group (`pill` last, then `divider` goes after it); top-level groups `icon` at `:424`
- `scripts/build-tokens.mjs:49-80` `toCss`: color/dimension/duration/shadow/number, ungrouped → `:root`
- `src/lib/shell/motion.ts:1-20` `barSlide` + `slideParams(reduced)`; `src/lib/shell/TabBar.svelte:23` `transition:barSlide={{ reduced: prefersReducedMotion.current }}`
- `src/lib/shell/icons.test.ts` and `src/lib/styles/guard.test.ts` patterns; `vite.config.ts:25-34` vitest `server` project, `src/**/*.test.ts`
- Prototype: `lesson.css:27-31` (.cta), `onboard.css:11-13,33-40` (.ghost, scrim, sheet), `streak.js:34-35,44,77-78,89` (dialog), `home.html:59-66` (chip), `lesson.css:54` (section), `a1-reports.html:61-64` (toast)
- Sprite ids used: `#i-regular-caret-right`, any `#i-fill-*` / `#i-regular-*` for the left icon (S1 sprite, mounted in `(app)/+layout.svelte`)

All code below is an **unexecuted draft**; a self-contradictory fixture gets reported.

## Task 1 [AC3] Tokens
File: `design.tokens.json` (+ `pnpm tokens` → `tokens.css`)
- Add: `size.column` 430px, `size.dialog-max` 340px; `lift.shadow` (0 10px 24px, Press-red 28%) + `lift.rim` (white 18%); `overlay.scrim` (Ink 50%), `overlay.shadow` (0 20px 60px, Ink 30%); `frost.divider` (40/25/15 at 18%); `motion.press` 120ms, `motion.scrim` 150ms, `motion.sheet` 280ms, `motion.dialog` 280ms, `motion.toast` 180ms.
- Test first: `src/lib/ui/tokens.ui.test.ts`… in `tokens.test.ts` add `Given_PrimitiveTokens_Then_PresentInTokensCss` (fails before). Verify: `pnpm vitest --run src/lib/styles/tokens.test.ts`.

## Task 2 [LOCK] Motion helpers
File: `src/lib/ui/motion.ts` (new)
- `cssMs(name, fallback)` reads `--motion-*` from `:root` (fallback in node); `scrimFade`, `sheetSlide`, `dialogPop`, `toastRise`: each `{ reduced }` → `TransitionConfig`; reduced = `--motion-fade-reduced` opacity only.
- Test first: `src/lib/ui/motion.test.ts` — reduced → duration 150 and css without `transform`; normal → token ms and transform. Verify: `pnpm vitest --run src/lib/ui/motion.test.ts`.

## Task 3 [AC3] Button
File: `src/lib/ui/Button.svelte` (new) — props `variant`, `href`, `disabled`, `icon`, `caret`, `type`, `onclick`, `children`.
- Test first: `src/lib/ui/ui.test.ts` › Button: 3 variants class, `<a>` with href, `disabled`, icon `<use href="#i-fill-play">`, caret `#i-regular-caret-right`. Verify: `pnpm vitest --run src/lib/ui/ui.test.ts -t Button`.

## Task 4 [AC3] Section and Chip
Files: `src/lib/ui/Section.svelte`, `src/lib/ui/Chip.svelte` (new)
- Test first: `ui.test.ts` › Section renders `<section>` with children; Chip renders children in `.chip`. Source asserts: Section uses `var(--color-ruled-line)`, `padding-top: var(--spacing-s6)`; Chip uses `--frost-*` and `--frost-divider`. Verify: `-t "Section|Chip"`.

## Task 5 [AC3] Sheet and Dialog
Files: `src/lib/ui/Sheet.svelte`, `src/lib/ui/Dialog.svelte` (new) — props `open` (bindable), `onclose`, `title`, `children`; `{#if open}` with `transition:scrimFade` / `sheetSlide` / `dialogPop`; Esc handler on `<svelte:window>`; focus the panel on open, restore on close.
- Test first: `ui.test.ts` › closed renders nothing; open renders `role="dialog" aria-modal="true"` with the title; Dialog source contains `var(--size-dialog-max)`. Verify: `-t "Sheet|Dialog"`.

## Task 6 [AC3] Toast
File: `src/lib/ui/Toast.svelte` (new) — props `open`, `message`, `actionLabel`, `onaction`, `onclose`, `duration` (4500); `role="status"`; auto-dismiss via `$effect` timer.
- Test first: `ui.test.ts` › Toast closed empty, open has `role="status"` and action button. Verify: `-t Toast`.

## Task 7 [LOCK] Guards stay green
Files: all new `.svelte`; `guard.test.ts` (unchanged)
- Verify: `pnpm vitest --run src/lib` — guard finds 0 colour literals in `src/lib/ui/*.svelte`.

## Mutation paths covered
- Open/close both animate (exit transitions); `open` false→true→false; Esc, scrim tap, and `onclose` all route through one close path; `href` vs button render paths tested; reduced motion branch tested in `motion.test.ts`.

## Rollback
`git revert` the slice's commits; no dependency change.
