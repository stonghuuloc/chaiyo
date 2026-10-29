# CHY-4 S2 — verify
Commit `393253f` (PR #12 head, stacked on CHY-3) · `pnpm dev` (5173), the pre-S2 tree `11fc794` on 5174 for before/after, `vite preview` of the final build (4173) for the service worker · headless Chromium 390×844 + **iOS Simulator iPhone 17 (iOS 26.5), Mobile Safari — not hardware**, driven through Orca · seeded session for `/today` (temporary `static/dev-seed.html`, deleted) · temporary `src/routes/zz-probe` (deleted) · 2026-10-29

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC4 | no request to Google Fonts or another font CDN | ✅ | `/` before: **6** requests to `fonts.googleapis.com` / `fonts.gstatic.com` (1 stylesheet + 5 woff2); after: **0**, hosts = `127.0.0.1:5173` only. iOS Sim Safari probe: `cdn: 0, same: 4` |
| AC4 | fonts served from the app's own origin, 200 | ✅ | after, `/`: 4 font requests (Literata latin + vietnamese, Be Vietnam Pro 400 latin + vietnamese), all `http://127.0.0.1:5173/…`, status 200; build emits 14 woff2 in `_app/immutable/assets` |
| AC4 | Be Vietnam Pro and the display face (Literata) in use | ✅ | computed: `body` `"Be Vietnam Pro", system-ui, sans-serif`, `h1` `Literata, serif`; `document.fonts` loaded: Be Vietnam Pro 400 ×2, Literata `200 900` ×2 |
| AC4 | Onest (pinyin tone marks) | ✅ | probe `p` with `--font-pinyin`: computed `Onest, system-ui, sans-serif`; `document.fonts` loaded `Onest 400`; iOS Sim shows `nǐ hǎo ǎ ǐ ǒ ǔ` with tone marks (`screens/sim/01-kaishu-probe.png`) |
| AC4 | the lesson's Kaishu subset | ✅ | the Bài 1 page has no Chinese text, so a temporary probe page with `lang="zh"` text drew `你好`: **1** request, `ukai-h1-01.woff2`, `http://127.0.0.1:5173`, 200 (file 6,388 B, test-pinned); iOS Sim probe `ukai: 1`, loaded `AR PL UKai CN` |
| AC4 | works offline (spec) | ✅ | `vite preview` build: service worker activated and controlling; cache `shell-…` holds all 14 woff2; with `offline: true` (`navigator.onLine` false) the reload rendered, `document.fonts.check('600 36px Literata')` and `check('400 16px "Be Vietnam Pro"')` true, font requests 200 |
| AC4 | headings look as before (spec Q2) | ✅ | before/after `/` at 390px: heading box 342×72 at (24, 280) both; heading pixels unchanged in the diff (`screens/diff-landing-390.png`); whole page 0.29% pixels differ, all in the Be Vietnam Pro subtitle line (sub-pixel text rendering), no layout shift |
| AC5 | generated variables match the tokens | ✅ | `pnpm tokens` twice → no diff; `tokens.test.ts` compares `toCss(design.tokens.json)` with `tokens.css` (>70 variables); appending a line to `tokens.css` failed the test, regenerating fixed it |
| AC5 | no hex colour literal in component files | ✅ | `guard.test.ts`: 0 hits for `#hex`, `rgb(`, `rgba(`, `hsl(`, `hsla(` in every `src/**/*.svelte|css` except `tokens.css`; it failed first on 3 lines / 4 literals in `TabBar.svelte`, passes after |
| AC5 | tokenised pill looks the same (spec Q4) | ✅ | computed pill `box-shadow` and `::before` `background-image` strings identical before/after; iOS Sim `/today` screenshot is byte-identical to S1's (`shasum 62650e50…` both) |
| LOCK | no motion in S2 | ✅ | nothing added that moves |

Unit: `pnpm test` → `Test Files  7 passed (7)` · `Tests  47 passed (47)`; `pnpm check` 0 errors; `pnpm lint` clean; `pnpm build` done.

## Residual risk
- iOS Simulator is not hardware; Safari network is read from `performance.getEntriesByType('resource')`, not a network panel.
- Be Vietnam Pro subtitle differs from the CDN render in 0.29% of page pixels; same family and version family (v12 files), so judged anti-aliasing, not a different font.
- Hanzi missing from `ukai-h1-01` fall back per glyph until CHY-13 ships real subsets.
- The Literata `url()` reaches into `node_modules/@fontsource-variable/…` by relative path; it breaks if the package layout changes (the font test and build would catch it).
- A third-party host remains on pages: `va.vercel-scripts.com` (Speed Insights, not a font).
- CI and CodeRabbit for this push are not in this file; they are reported on the PR.
