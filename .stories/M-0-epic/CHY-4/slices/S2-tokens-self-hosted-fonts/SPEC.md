# CHY-4 S2 — spec
ACs: AC4, AC5  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC4] Loading `/today`, `/practice/session` or any (app) page makes **0** requests to `fonts.googleapis.com`, `fonts.gstatic.com` or another font CDN; `src/app.html` carries no preconnect or stylesheet link to them. Verified by: headless network log, and a test that scans `src/` for those hosts.
- [AC4] Be Vietnam Pro 400/500/600/700, Literata (opsz + wght), Onest 400/500/600 and the Bài 1 Kaishu subset `ukai-h1-01` are declared by `@font-face` rules whose `src` is a same-origin file. Latin and vietnamese subsets only for the first two. Verified by: test over the stylesheet; every font request in the network log has the app's origin and status 200.
- [AC4] Computed `font-family` on `body` starts with "Be Vietnam Pro", on `h1/h2/h3` with "Literata"; `document.fonts` reports those faces `loaded`. Literata keeps its optical-size axis, so heading glyphs look the same as with the CDN file (Q2 → A).
- [AC4] The Kaishu face is named `"AR PL UKai CN"` (the first name in `--font-hanzi`) with `font-display: block`; Latin faces use `font-display: swap` (Q5 → A). A page with Chinese text in `--font-hanzi` makes exactly **1** Kaishu request, 6,388 B, same-origin (probe page, Q3 → A).
- [AC4] After the service worker has installed, the same fonts load with the network off. Verified by: headless run with offline emulation.
- [AC5] `src/lib/styles/tokens.css` equals the output of `toCss(design.tokens.json)` byte for byte, so each of the 54 tokens' variables is the generated one. Verified by: a test that runs the generator and compares.
- [AC5] The 4 `rgb()` literals of `TabBar.svelte` become 4 colour tokens under `frost` with the same values; computed `box-shadow` and `background-image` of the pill are unchanged (Q4 → B).
- [AC5] No `*.svelte` or `*.css` file under `src/` (except generated `tokens.css`) contains a hex colour, `rgb()`, `rgba()`, `hsl()` or `hsla()`. Verified by: a guard test over every such file.
- [LOCK] "Anything that moves animates" does not apply: S2 adds no motion.

## Not this slice
- Per-lesson Kaishu subsets and the lesson text that uses them → CHY-13.
- Button, Sheet, Dialog, Chip, Section, Toast → S3 (AC3).
- Icon sprite → S1 (done).
- `#f7f3ea` in `app.html:7` and `static/manifest.webmanifest:9-10`: not component files, AC5 says components.
- Onest as the tone-mark fallback inside the Be Vietnam Pro stack (`DESIGN.md:169`): screens use `--font-pinyin`; no AC here.

## Seam
`src/lib/styles/fonts.css` (new, `@font-face` rules) imported by `src/routes/layout.css`; `src/app.html` loses the CDN links; `design.tokens.json` `frost` group gains 4 tokens consumed by `src/lib/shell/TabBar.svelte`.

## Test contract
- [AC4] vitest: `app.html` and `src/**` contain no `fonts.googleapis.com` / `fonts.gstatic.com`.
- [AC4] vitest: every `@font-face` `src` is relative, its file exists; declared families ⊇ first family of `--font-sans`, `--font-serif`, `--font-pinyin`, `--font-hanzi`.
- [AC4] vitest: Latin faces `swap`, Kaishu `block`; Kaishu file is `ukai-h1-01` at 6,388 B.
- [AC4] browser: 0 CDN requests, all font requests 200 same-origin, computed families, probe page 1 Kaishu request, offline load.
- [AC5] vitest: `toCss(tokens)` equals the committed `tokens.css`.
- [AC5] vitest: guard over `src/**/*.svelte|css` finds 0 colour literals; a negative-control string is rejected by the same regex.
- [AC5] browser: pill `box-shadow` / `background-image` equal before and after.

## Open assumptions
- [AC4] `@fontsource` files are the Google Fonts files at the pinned version (5.3.0), so glyphs match the CDN (Q1 → A). If a heading differs, the before/after screenshot shows it; cost: Q2's 68,488 B opsz choice flips to B.
- [AC5] The 4th token is needed: `rgb(255 255 255 / 0)` is not `transparent` (black, alpha 0), and swapping it changes the gradient midtones. Round 1 said ≈3 tokens; the real count is 4.
