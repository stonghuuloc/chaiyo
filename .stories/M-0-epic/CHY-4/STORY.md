# CHY-4 — Design-system primitives in Svelte

Backlog: `backlog/tasks/chy-4 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-4.N`

## Goal (business why, 1-2 sentences)
Build the shared UI blocks once so every screen follows the same visual rules.

## Context an agent can't derive from code
- `scripts/build-icons.sh` (`pnpm icons`) and `scripts/build-tokens.mjs` (`pnpm tokens`) already exist — S1/S2 may be audit + gap-fill.
- Port from `prototype/lesson.css`, `roots.css`, `icons.svg`.
- Kaishu subset per lesson is CHY-13; AC4 only needs it served same-origin.

## Locked decisions (BA/Loc already ruled — never re-open)
- One red primary button per screen; sections split by divider lines; no emoji in UI; Solar duotone icons by meaning.
- Dialog max width 340px.

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | `pnpm icons` builds deterministic Solar sprite, no hand edits | high | S1 |
| AC2 | `--duo` / `--duo-c` drive icon secondary layer | high | S1 |
| AC3 | Button, Sheet, Dialog, Chip, Section, Toast with variants | high | S3 |
| AC4 | All fonts served from own origin, no font CDN | high | S2 |
| AC5 | CSS vars match tokens; no hex literals in components | high | S2 |

## Out of scope
- Kaishu subsetting pipeline (CHY-13).
- Screen-level templates.
