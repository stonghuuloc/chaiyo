# CHY-3 S2 — plan
ACs: AC3, AC4  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-3

## Anchors (verified 2026-10-29)
- `src/lib/shell/TabBar.svelte:10-16` — plain `<nav class="tabs">` + 4 `<a class="tab">`; `:7` `active = $derived(tabFor(page.url.pathname))`
- `src/lib/shell/tabs.ts:3-8` — `TABS` (`path`, `route`, `label`); `:10-13` `tabFor`
- `src/routes/(app)/(tabs)/+layout.svelte:8-9` — `{@render children()}` then `<TabBar />`
- `src/routes/(app)/+layout.ts` — guard load only; no `+layout.svelte` in `(app)` today
- `src/lib/styles/tokens.css:70-77` — `--frost-tint/blur/saturate/rim/edge/shadow/pill`, `--icon-duo`, `--icon-duo-c`; no motion token
- `design.tokens.json:279` (`frost`), `:406` (`icon`) — DTCG groups; groups without a Tailwind namespace become `:root` vars
- `scripts/build-tokens.mjs:22-39` — `value()` switch (`dimension` at `:27`, default `String(v)` would print an object for a duration); `:47` `export function toCss`
- `package.json:18` — `"icons"` script; `:17` `"tokens"`
- `prototype/roots.css:66-72` bar · `:74-82` tab, icon layers, `.26s ease` · `:90` reduced motion
- `prototype/icons.svg` — 71 symbols; 8 needed, ids `i-{regular,fill}-{house,path,brain,user-circle}`; paths carry `opacity:var(--duo,.5);color:var(--duo-c,currentColor)`
- `node_modules/svelte/src/motion/index.js:30` — `prefersReducedMotion` (`.current`)
- `vite.config.ts:26-36` — vitest `server` project only (node, `src/**/*.test.ts`); no component tests
- `src/app.html:5` — `viewport-fit=cover` already set

## Task 1 [CHORE] Motion tokens
File: `design.tokens.json:279` (new `motion` group before `frost`), `scripts/build-tokens.mjs:27`
- Add `motion.fade` `{ $type: "duration", $value: { value: 260, unit: "ms" } }` and `motion.fade-reduced` 150ms.
- `value()`: `case 'duration': return `${v.value}${v.unit}`;`. Run `pnpm tokens`; commit `tokens.css`.
- Test first: new `src/lib/styles/tokens.test.ts` — `toCss(tokens)` contains `--motion-fade: 260ms;` and `--motion-fade-reduced: 150ms;`.
- Verify: `pnpm vitest --run src/lib/styles/tokens.test.ts`

## Task 2 [AC4] Extract the 8 tab icons
File: new `scripts/build-tab-icons.mjs` → new `src/lib/assets/tab-icons.svg`; `package.json:18` (+ `"tab-icons"` script)
- Read `prototype/icons.svg`, keep the 8 `<symbol>` ids, wrap in `<svg xmlns width="0" height="0" style="position:absolute" aria-hidden="true">`; fail if an id is missing.
- Test first: new `src/lib/shell/tab-icons.test.ts` — the committed file holds exactly the 8 ids and is < 10,000 B.
- Verify: `pnpm tab-icons && pnpm vitest --run src/lib/shell/tab-icons.test.ts`

## Task 3 [AC4] Icon name per tab
File: `src/lib/shell/tabs.ts:3-8`
- Add `icon: 'house' | 'path' | 'brain' | 'user-circle'` to each `TABS` entry (order from `prototype/tabs.js:4`).
- Test first: `tabs.test.ts` — each `TABS` icon has both `i-regular-<icon>` and `i-fill-<icon>` in `tab-icons.svg`.
- Verify: `pnpm vitest --run src/lib/shell/tabs.test.ts`

## Task 4 [NFR] Bar slide params
File: new `src/lib/shell/motion.ts`
- `slideParams(reduced: boolean) → { duration: reduced ? 0 : 260 }` (pure, tested) and `barSlide(node, reduced)` returning a Svelte transition `{ duration, easing: cubicOut, css: (_, u) => `transform: translateY(${u * 100}%)` }` — transform only, never opacity (SPEC [LOCK]).
- Test first: new `src/lib/shell/motion.test.ts` — `slideParams(false).duration === 260`; `slideParams(true).duration === 0`.
- Verify: `pnpm vitest --run src/lib/shell/motion.test.ts`

## Task 5 [AC3][AC4] TabBar markup + CSS
File: `src/lib/shell/TabBar.svelte:10-16`
- Import `sprite from '#lib/assets/tab-icons.svg?raw'`, `barSlide`, `prefersReducedMotion`.
- `{#if active !== null}` `<nav class="bar" transition:barSlide>`: `{@html sprite}` (static trusted file; add the eslint `svelte/no-at-html-tags` disable), `<div class="pill">` with the 4 links, each `<span class="icw"><svg class="ic l"><use href="#i-regular-X"/></svg><svg class="ic f n-X"><use href="#i-fill-X"/></svg></span>` + label.
- Selected state is CSS on `aria-current="page"` (`.tab[aria-current] .f {opacity:1}`, `.l {opacity:0}`) so the transition fires whenever `active` changes.
- Test: none unit-level (no component project); covered by Task 7.

## Task 6 [AC3] Mount once, clear the bar
File: new `src/routes/(app)/+layout.svelte`; `src/routes/(app)/(tabs)/+layout.svelte:8-9`
- New `(app)/+layout.svelte`: `{@render children()}` + `<TabBar />` (always mounted; TabBar decides).
- `(tabs)/+layout.svelte`: drop `<TabBar />` and its import; wrap children in `<div class="pb-[calc(66px+14px+env(safe-area-inset-bottom,0px))]">`.
- Test: `pnpm check` (route types) + Task 7.

## Task 7 [AC3][AC4] Rendered check
File: `src/lib/shell/TabBar.svelte:10` (subject); evidence → `VERIFY.md`
- `pnpm dev`; headless Chromium 390px, signed in via Inbucket magic link (`supabase/config.toml:154,158`).
- AC3: computed `position`, `backdropFilter`, pill height 66, nav `paddingBottom` = 14px + inset (emulate inset), top edge equal at scroll 0/600.
- AC4: sample opacities mid-transition; end states for all 4 tabs; `transform` none on icons; bar slide in/out via `/practice` → `/practice/session` → back; `emulateMedia({reducedMotion:'reduce'})` → durations 150ms / slide 0.
- AC4 real phone (its own named check): side by side with `prototype/t2-roadmap.html` on the same phone; confirm blur holds during slide.

## Task 8 [CHORE] Gates
- `pnpm check && pnpm lint && pnpm test && pnpm build` all green on the final tree.

## Mutation paths covered
- Selection changes three ways, all through `page.url.pathname`: tap, keyboard Enter, browser back/forward — one `$derived`, so the same CSS transition fires (Task 7 clicks and uses back).
- Bar mount changes: cold load on a tab root (no slide), root→root (no move), root→pushed (slide out), pushed→root (slide in).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
```svelte
<!-- TabBar.svelte sketch -->
{#if active !== null}
  <nav class="bar" aria-label={m.tabs_label()} transition:barSlide={prefersReducedMotion.current}>
    {@html sprite}
    <div class="pill">…</div>
  </nav>
{/if}
<style>
  .bar { position: fixed; inset: auto 0 0 0; display: flex; justify-content: center; pointer-events: none;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); z-index: 10; }
  .pill { pointer-events: auto; width: min(402px, calc(100% - 28px)); height: 66px; padding: 5px;
    display: grid; grid-template-columns: repeat(4, 1fr); border-radius: var(--radius-pill);
    background: var(--frost-tint); backdrop-filter: blur(var(--frost-blur)) saturate(var(--frost-saturate)); }
  .ic { position: absolute; inset: 0; transition: opacity var(--motion-fade) ease; }
  .tab { color: var(--color-graphite); transition: color var(--motion-fade) ease; }
  .tab[aria-current='page'], .tab:active { color: var(--color-ink); }
  @media (prefers-reduced-motion: reduce) { .ic, .tab { transition-duration: var(--motion-fade-reduced); } }
</style>
```
A self-contradictory result (e.g. blur absent mid-slide) is reported, not hacked around.

## Rollback
`git revert` the slice commits; `pnpm tokens` regenerates `tokens.css`. No migration, no hosted config.
