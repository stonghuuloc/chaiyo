# CHY-3 S2 — spec
ACs: AC3, AC4  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC3] On a tab root the bar stays at the same screen position while the page scrolls: its top edge
  Y is identical at scroll 0 and scroll 600. Verified by: two `getBoundingClientRect().top` reads.
- [AC3] The `<nav>` is a full-width fixed strip at `bottom: 0` with
  `padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px))` (DISCUSSION Q1 → C).
  With a 34px inset the pill's bottom edge is 48px above the screen bottom; with no inset, 14px.
- [AC3] Inside it one pill: 66px tall, `min(402px, 100% − 28px)` wide, centred, 999px radius, 5px padding,
  4 equal columns. The strip passes taps through (`pointer-events: none`); only the pill takes them.
- [AC3] The pill carries `backdrop-filter: blur(24px) saturate(1.75)` (and the `-webkit-` form), tint
  `rgb(250 246 238 / .72)`, 0.5px edge, inset top rim, drop shadow — all from the existing `--frost-*` tokens.
  Verified by: computed `backdropFilter` reads `blur(24px) saturate(1.75)`.
- [AC3] Page content scrolls under the pill and its last element clears it: tab roots end with
  padding ≥ 66 + 14 + inset px (80px with no inset).
- [AC4] Each tab shows two stacked 24px icons, line (`i-regular-*`) and fill (`i-fill-*`):
  house · path · brain · user-circle for Hôm nay · Lộ trình · Luyện tập · Tôi. Both are `aria-hidden`.
- [AC4] Selected tab: fill opacity 1, line opacity 0. Every other tab: fill 0, line 1.
- [AC4] Tapping Lộ trình while Hôm nay is selected: Hôm nay fill 1→0 and line 0→1; Lộ trình line 1→0 and
  fill 0→1; all four layers share one `opacity .26s ease` transition and start when the route commits.
  Verified by: computed `transitionDuration` `0.26s`, and a mid-transition opacity strictly between 0 and 1.
- [AC4] Fill icon colours match `prototype/roots.css:77-80`: silhouette Lantern Red `#c6301d` (`--duo-c`,
  `--duo: 1`), detail Lantern Red Wash `#f6e1db`; the brain fill is `#c6301d` at `--duo: .42`.
- [AC4] Selection changes no icon size or position: `transform` stays `none` on both layers.
- [LOCK] Motion: tab label colour moves Graphite `#4a423a` → Ink `#1d1814` over the same `.26s ease`
  when `aria-current` changes. A pressed tab (`:active`) shows the Ink label through that same transition.
- [LOCK] Motion: moving from a pushed screen to a tab root slides the bar up from below its own height
  in `.26s` ease-out; moving to a pushed screen slides it down and removes it from the DOM when the
  slide ends. Tab root → tab root never moves the bar. First load of a tab root does not animate.
- [LOCK] The bar slides only; it never fades. Opacity < 1 on an ancestor makes the pill's
  `backdrop-filter` blur nothing mid-slide and snap on at the end.
- [NFR] `prefers-reduced-motion: reduce`: icon and label transitions shorten to `.15s`
  (`prototype/roots.css:90`); the bar's slide drops to 0ms (it appears and disappears at once).
- [CHORE] `design.tokens.json` gains a `motion` group (`fade` 260ms, `fade-reduced` 150ms); `pnpm tokens`
  emits `--motion-fade` and `--motion-fade-reduced`. No motion token exists today.
- [CHORE] The 8 icon symbols (8,120 B) come from a script that extracts them from `prototype/icons.svg`
  into one committed file (DISCUSSION Q3 → B); never the whole 86,614 B sprite.
- [LOCK] No milky selection pill, no drag, no spring (DISCUSSION Q2 → A). Identifiers in English.

## Not this slice
- Milky pill, finger-follow drag, spring release, navigate-after-settle (`prototype/tabs.js:19-55`) → no AC;
  add one to CHY-3 if wanted.
- Tab root content, and the icons of any other screen → later milestones.
- Which tab is selected and which routes show the bar → S1 (AC1, AC2); S2 only restyles `TabBar`.
- `docs/screens.md:9` still says Từ điển → CHY-5 syncs docs.

## Seam
`src/lib/shell/TabBar.svelte`, mounted once and always from a new `src/routes/(app)/+layout.svelte`;
it wraps its `<nav>` in `{#if tabFor(pathname) !== null}` so one component owns enter, leave and tab-to-tab.

## Test contract
- [AC4] vitest: the extracted icon file contains exactly the 8 ids `i-{regular,fill}-{house,path,brain,user-circle}`.
- [AC4] vitest: every `TABS` entry names an icon whose two ids exist in that file.
- [AC3] vitest: `toCss` emits `--frost-*` (existing) and, after this slice, `--motion-fade: 260ms`.
- [NFR] vitest: the bar-slide params helper returns 260ms normally and 0 when reduced motion is on.
- [AC3] verify (rendered, headless Chromium, 390px viewport): computed `position: fixed`, `backdropFilter`,
  pill 66px tall, `padding-bottom` = 14px + inset, top edge unchanged after scroll.
- [AC4] verify (rendered): mid-transition opacity in (0,1); end state per selected tab.
- [AC4] verify (real phone — the AC's own check): crossfade matches the prototype's `.26s` fade side by side;
  bar slide keeps its blur through the slide.

## Open assumptions
- [AC3] The `(app)/+layout.svelte` mount replaces S1's `(tabs)/+layout.svelte` mount of `<TabBar />`.
  Reading: same DOM on every route (bar on 4 roots, none elsewhere); wrong pick costs 1 file move.
  No Q-block: no observable difference beyond the new slide, which Loc asked for.
