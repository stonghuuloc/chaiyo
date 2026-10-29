# CHY-4 S1 — discussion
ACs: AC1, AC2

## Current behaviour (verified, with anchors)
- [AC1] `package.json:18` `"icons": "scripts/build-icons.sh"` — that script turns `assets/brand/source.png` into logo/PWA PNGs under `static/brand` (`scripts/build-icons.sh:1-3`). It never touches Solar. **AC1 fails: `pnpm icons` builds no sprite → TASK.**
- [AC1] No Iconify Solar JSON exists locally: `@iconify*` absent from `node_modules`, no `iconify`/`solar` in `package.json`. npm has `@iconify-json/solar@1.2.13`.
- [AC1] `prototype/icons.svg` (71 symbols: 25 `regular`, 45 `fill`, 1 `bold`) is the only sprite; its header says "Old weight-name ids kept". No script in `scripts/` or git history (1 commit) generates it → it is hand-built. **TASK: generate from Solar JSON.**
- [AC1] `scripts/build-tab-icons.mjs:4-14` copies 8 symbols out of `prototype/icons.svg` into `src/lib/assets/tab-icons.svg` (4 tab icons × line+fill). It is an extract of the hand-built file, not Solar-sourced; `pnpm` has no script for it.
- [AC1] Consumer: `TabBar.svelte:5` imports `#lib/assets/tab-icons.svg?raw`, `:30-31` uses `#i-regular-{icon}` / `#i-fill-{icon}`. `tab-icons.test.ts:8,15` pins 8 symbols and "not the 86,614 B prototype sprite".
- [AC2] Already works in the extract: each duotone layer carries `style="opacity:var(--duo,.5);color:var(--duo-c,currentColor)"` (`tab-icons.svg`, 11 `--duo` + 11 `--duo-c` refs). Parent-set `--duo`/`--duo-c` inherit into `<use>`. Used at `TabBar.svelte:120-121,127`. Tokens: `tokens.css:79-80`, `design.tokens.json:424-434`.
- [AC2] Not proven for the full sprite: no test sets `--duo`/`--duo-c` on a parent and reads the secondary layer. **TASK: add that check.**

## Answered here (no human needed)
| Q | A | Source |
|---|---|---|
| Does `pnpm icons` build the sprite? | No — logo PNGs | `build-icons.sh:1-3` |
| Is Solar JSON on disk? | No; installable as `@iconify-json/solar` | `node_modules`, npm |
| Does the secondary layer already honour `--duo`/`--duo-c`? | Yes, in the 8 tab symbols | `tab-icons.svg`, `TabBar.svelte:120-127` |
| Which sprite ids do screens use? | **58** of the 71 (static `href`s + every quoted `ic('…')`/id literal in `prototype/*.html,*.js`); 13 unused: `fill-calendar,case,chat-dots,code,cup,dumbbell,restart,suitcase,wallet`, `regular-check,dumbbell,fire,lock-simple`. Round 1 said 21 — it counted only `href="#i-…"`; screens build ids via `ic()` (`step.js:5`) | scan 2026-10-29 |
| Is duotone solid-layer default right? | Yes, `--duo` .5, `--duo-c` pale red | `DESIGN.md:134`, `tokens.css:79-80` |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | command that builds the sprite | A — `pnpm icons` = sprite → `src/lib/assets/icons.svg`; logo script renamed `pnpm brand` | Loc 2026-10-29, accepted recommendations |
| 1 | Q2 [AC1] | icon list in the sprite | A — only ids screens use, tab symbols folded in, `tab-icons.svg` + `build-tab-icons.mjs` deleted. **Numbers corrected after the answer: 58 ids, not 21; 13 of 71 unshipped, not 50.** Re-confirm if the smaller gap changes the pick | Loc 2026-10-29, accepted recommendations |
| 1 | Q3 [AC1] [AC2] | symbol id scheme | A — keep `i-regular-*` / `i-fill-*` / `i-bold-check`; map to Solar weights once in the script | Loc 2026-10-29, accepted recommendations |

## Open — needs an answer before spec
(none)

## Locked (do not re-open)
- Solar duotone icons by meaning; no emoji in UI. (STORY.md)
- `--duo` / `--duo-c` token names and defaults (`design.tokens.json:424-434`).
- Anything that moves animates; reduced motion shortens or cuts it (Loc, CHY-3). **S1 has no motion** — a static sprite — so nothing applies.
