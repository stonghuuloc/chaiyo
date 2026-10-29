# CHY-3 S2 — summary
ACs: AC3, AC4  ·  Commits: see PR  ·  PR: pending

## Shipped
- [AC3] `src/lib/shell/TabBar.svelte` — fixed full-width `<nav class="bar">`, `padding-bottom: calc(14px + env(safe-area-inset-bottom))`, 66px frost pill (`blur(24px) saturate(1.75)`). Rendered check below.
- [AC3] `src/routes/(app)/(tabs)/+layout.svelte` — tab roots end with `66px + 14px + inset` padding so content clears the bar.
- [AC4] Line + fill icon layers per tab, `opacity var(--motion-fade) ease`; label colour fades the same. `src/lib/shell/tabs.ts` `icon` per tab; `src/lib/assets/tab-icons.svg` (8 symbols, 8,233 B) from `scripts/build-tab-icons.mjs`.
- [LOCK] Bar slide in/out (`src/lib/shell/motion.ts`, transform only, 260ms; 0ms under reduced motion), mounted always from new `src/routes/(app)/+layout.svelte`.
- [CHORE] `design.tokens.json` `motion` group → `--motion-fade: 260ms`, `--motion-fade-reduced: 150ms`; `build-tokens.mjs` `duration` case.

## Deviated from plan
- Task 1 test reads generated `tokens.css`, not `toCss()`: importing the untyped `.mjs` made `svelte-check` fail (5 implicit-any errors in `build-tokens.mjs`).
- Task 2: extract is 8,233 B (plan said 8,120 B, the symbols alone; the wrapper `<svg>` adds 113 B).
- Task 7 signed in with a seeded `sb-127-auth-token` (30-day expiry) in localStorage. Local Supabase (`:56321`) was not running and Docker is not mine to start. The guard accepted it (`/today` rendered).
- `.tab:active` press state is a colour change only (Ink), no new numbers.

## Not done / follow-up
- AC4 "matches `prototype/tabs.js` on a real phone" and bar blur holding mid-slide on a real phone → verify stage.

## Rendered check (headless Chromium 390×844, safe-area bottom 34px via CDP)
| Measure | Value |
|---|---|
| nav `position` / `pointer-events` | `fixed` / `none` |
| nav `padding-bottom` | 48px (14 + 34) |
| pill height / width | 66px / 362px; bottom edge 48px above screen bottom |
| pill `backdrop-filter` | `blur(24px) saturate(1.75)`; tint `rgba(250, 246, 238, 0.72)`; radius 999px |
| pill top at scroll 0 / 600 | 730px / 730px |
| icon + label `transition-duration` | 0.26s; reduced motion 0.15s |
| tap Lộ trình→Hôm nay, t=83ms | Lộ trình fill 0.58, line 0.42; Hôm nay fill 0.42, line 0.58 |
| same tap, t=333ms | fill/line 0/1 and 1/0; selected tab fill 1, line 0 |
| label colour | Graphite `rgb(74,66,58)` → Ink `rgb(29,24,20)` |
| icon `transform` | `none` on both layers; pill top moved 0px during tab→tab |
| bar slide out (/today→/settings) | translateY 0→114px, nav removed at ~279ms; opacity 1 throughout |
| bar slide in (back) | translateY 114px→0, settled by ~615ms sample end; opacity 1 throughout |
| reduced motion | nav removed within 14ms; 0 `nav.bar` after |
| fill colours | silhouette `rgb(198,48,29)` (Lantern Red), detail `rgb(246,225,219)` (Wash); brain `--duo .42` |

Screenshots: `screens/before-today-390.webp` (main), `screens/after-today-390.webp` (this slice; stripes behind the bar prove the blur).

## Verification run
`pnpm check` → 0 errors · `pnpm lint` → clean · `pnpm test` → 5 files, 23 passed · `pnpm build` → done
