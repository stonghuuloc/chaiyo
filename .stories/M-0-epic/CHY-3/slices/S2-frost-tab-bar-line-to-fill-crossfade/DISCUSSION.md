# CHY-3 S2 — discussion
ACs: AC3, AC4

## Current behaviour (verified, with anchors)
- [AC3] `src/lib/shell/TabBar.svelte:10-16` is a plain `<nav class="tabs">` of 4 text links; no CSS, no icons, no frost. S1 left it bare on purpose.
- [AC3] `src/routes/(app)/(tabs)/+layout.svelte:8-9` renders `{@render children()}` then `<TabBar />`; the bar persists across tab navigations, so a crossfade can play in place.
- [AC3] Tokens already ported: `src/lib/styles/tokens.css:70-77` (`--frost-tint` rgb(250 246 238 / .72), `--frost-blur` 24px, `--frost-saturate` 1.75 = prototype's 175%, `--frost-rim`, `--frost-edge`, `--frost-shadow`, `--frost-pill`, `--icon-duo` .5, `--icon-duo-c` #f2cfc6). No tab-label size token (prototype `--t-tab` 11.5px, `roots.css:24`).
- [AC3] `src/app.html:5` already has `viewport-fit=cover`, so `env(safe-area-inset-bottom)` is live.
- [AC4] No icons in `src/`; `prototype/icons.svg` (86,614 B, 71 symbols) is the only Solar source. Needed: `i-regular-{house,path,brain,user-circle}` + `i-fill-…` = 8 symbols, 8,120 B.
- [AC4] `TabBar.svelte:7` derives the active tab from `page.url.pathname`, so `aria-current` flips when the route commits (not on pointer-down as in `prototype/tabs.js:45`).
- [AC4] Crossfade today in prototype: `roots.css:76` `.ic{transition:opacity .26s ease}`; `:77-78` fill `opacity 0→1` when `.icw.on`; `:81` line `opacity 1→0`. Both layers fade at once. Reduced motion: `.15s` (`:90`).

## Answered here (no human needed)
- [AC3] Blur values: 24px blur + 175% saturate, tint .72, 0.5px edge, rim/shadow as `tokens.css:70-77`. Source: `roots.css:28-36,66-72`.
- [AC3] Bar geometry: fixed, 66px tall, max 402px, `width: min(402px, 100% - 28px)`, 5px inner padding, pill radius. Source: `roots.css:66`, DESIGN.md:229.
- [AC3] Page content must scroll under the bar and still clear it at the end: tab roots need end padding ≥ 66 + 14 + inset. Plan task, not a question.
- [AC4] Fill colour = Lantern Red silhouette, Wash detail; inactive = Graphite `#4a423a`; active label = Ink. DESIGN.md:229, `tokens.css:3,6,12-13`. Brain fill is half-strength (`--duo: .42`), `roots.css:80`.
- [AC4] Opacity only, no icon scale (DESIGN.md:229). Reduced motion keeps the swap at .15s.
- [AC4] "Real phone" check names its own verification: it runs in verify on a device, not in unit tests.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC3] | safe-area placement | C — fixed full-width `<nav>` carries `padding-bottom: 14px + env(safe-area-inset-bottom)`; the 66px pill inside keeps the prototype's pixels | Loc, 2026-10-29 |
| 1 | Q2 [AC4] | pill scope | A — icon crossfade only; no milky pill, no drag/spring | Loc, 2026-10-29 |
| 1 | Q3 [AC4] | icon delivery | B — extract the 8 used symbols (8,120 B), not the 86,614 B sprite | Loc, 2026-10-29 |
| 1 | — [AC3, AC4] | motion | every visual state change in this slice animates, nothing snaps: icon line↔fill, label colour graphite→ink, press state, bar enter/leave on tab roots; durations from prototype (.26s ease, .15s reduced) or tokens; `prefers-reduced-motion` shortens or cuts | Loc, 2026-10-29 |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- SPA app routes, `ssr=false`, behind auth.
- Tabs: Hôm nay · Lộ trình · Luyện tập · Tôi.
- All identifiers English; Vietnamese only in display text (Loc, 2026-10-29).
- Every visual state change in S2 animates; nothing snaps (Loc, 2026-10-29).
