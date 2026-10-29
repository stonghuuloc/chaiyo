# CHY-4 S3 — spec
ACs: AC3  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC3] `Button` renders three variants. `primary`: Lantern Red fill, white Literata 21px label, 62px tall, 18px radius, full width, lift shadow, optional Solar icon left and caret right. `ink`: Ink fill, Paper label, same geometry, no lift, Graphite when pressed (Q1 → A). `outline`: 56px, 1px Ruled Line, 50% white fill, Ink label, Shaded Paper when pressed. Pressed primary/ink: Press colour and `scale(.985)` over 120ms; focus ring 2.5px Lantern Red, 3px offset; `disabled` = Shaded Paper fill, Pencil label, no shadow. With `href` it renders `<a>`, else `<button>`. Verified by: SSR render per variant; computed height/radius/colour in Chromium.
- [AC3] `Sheet` is a bottom sheet: scrim Ink at 50%, panel `min(430px, 100%)` wide, Paper, 1px Ruled Line on top, 18px top corners (Q4), bottom padding 20px + safe-area inset. It slides up in 280ms; reduced motion = 150ms fade, no movement. Esc and scrim tap close it; focus moves into it and returns to the opener (Q6).
- [AC3] `Dialog` is centered, width `min(340px, 100% − 40px)` (locked 340px), Paper, 24px radius, padding 20/16/16, overlay shadow. It enters with translateY 24px + scale .96 + fade over 280ms, ease-out, no overshoot (Q3); reduced motion = 150ms fade. Same dismissal as Sheet.
- [AC3] `Chip` (default) is a 40px pill with Ink 600 15px text, frost tint/blur/rim/shadow from the `frost` tokens, and a 1px × 18px divider between facts. It is not interactive.
- [AC3] `Section` renders a `<section>` with a 1px Ruled Line above it, 20px margin above the line, 24px padding below it (Q2 → A); the first section on a page has no line.
- [AC3] `Toast` is an Ink pill, Paper 14px/500 text, optional underlined 44px action button, `role="status"`, fixed 20px + inset above the bottom edge (Q5), enters with 8px rise + fade over 180ms, auto-dismisses after 4,500ms; reduced motion = 150ms fade.
- [LOCK] Every movement above animates in and out (Sheet, Dialog, Toast exit too); reduced motion cuts transforms and keeps a ≤150ms fade. Durations are tokens, read at runtime.
- [LOCK] No colour literal in any component; values are tokens or `color-mix()` of tokens (guard test).

## Not this slice
- Screens that use the primitives, and the Streak/celebration dialogs → later stories.
- Toast lift above the tab bar (Q5), focus trapping (Q6), body scroll lock: no AC.
- Fonts, tokens pipeline, sprite → S1/S2 (done).

## Seam
`src/lib/ui/{Button,Sheet,Dialog,Chip,Section,Toast}.svelte` and `src/lib/ui/motion.ts` (new); tokens in `design.tokens.json` → `tokens.css`.

## Test contract
- [AC3] vitest (SSR via `svelte/server`): Button variants/tags/disabled/icon+caret; Sheet, Dialog, Toast closed → empty, open → `role`/`aria-modal`/`role="status"`; Chip and Section markup.
- [AC3] vitest: `tokens.css` carries `--size-dialog-max: 340px`, `--size-column: 430px`, the overlay/lift/motion tokens; component sources use them.
- [LOCK] vitest: motion helpers give 150ms and no transform when reduced; durations come from the token with a fallback in node. Guard and tokens-equality tests stay green.
- [AC3] browser: each primitive's computed size/colour/radius/duration; side-by-side with its prototype counterpart; iOS Simulator Safari screenshots.

## Open assumptions
- [AC3] The 6 picks in DISCUSSION.md are auto-accepted recommendations pending Loc's review. Cost of a wrong pick is one value each (Q1 a fill colour, Q2 8px, Q3 140ms, Q4 6px, Q5 60px, Q6 a focus trap).
