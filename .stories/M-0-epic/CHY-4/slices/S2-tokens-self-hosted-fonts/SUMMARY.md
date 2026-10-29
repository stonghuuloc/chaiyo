# CHY-4 S2 — summary
ACs: AC4, AC5  ·  Commits: 393253f  ·  PR: #12 (stacked on CHY-3, base `CHY-3`)

## Shipped
- [AC4] `src/app.html` no longer loads Google Fonts (2 preconnects + stylesheet removed). Test `fonts.test.ts` › `Given_Source_When_ScanForFontCdnHosts_Then_None` ✓
- [AC4] `src/lib/styles/fonts.css` (new, imported by `src/routes/layout.css:3`): Be Vietnam Pro 400/500/600/700 latin + vietnamese via `@fontsource/be-vietnam-pro` CSS imports; explicit `Literata` faces (opsz + wght, latin + vietnamese) from `@fontsource-variable/literata`; `Onest` 400/500/600 and `"AR PL UKai CN"` (`ukai-h1-01`, `block`) from `src/lib/assets/fonts/` (copied from `prototype/fonts/`). Tests: src relative + file exists, families ⊇ token families, `swap`/`block`, Kaishu 6,388 B, Onest 3 weights ✓
- [AC5] `design.tokens.json` `frost` + `inner`, `sheen-top`, `sheen-clear`, `sheen-glow`; `TabBar.svelte:64,76,77` use them. `guard.test.ts` rejects `#hex`, `rgb(`, `rgba(`, `hsl(`, `hsla(` in `src/**/*.svelte|css` (except `tokens.css`) ✓; negative samples rejected ✓
- [AC5] `tokens.test.ts` › `Given_DesignTokens_When_ToCss_Then_EqualsCommittedTokensCss` ✓ (a hand-edit of `tokens.css` fails it, checked).
- [LOCK] No motion in S2.

## Deviated from plan
- 4 new tokens, not ≈3 as round 1 said (`sheen-clear` is white at 0%, not `transparent`).
- Literata is declared by hand (`font-family: 'Literata'`) rather than through a CSS alias: the package family is `Literata Variable`, and an explicit face keeps `design.tokens.json` / `DESIGN.md` names unchanged.
- `tokens.test.ts` runs `toCss` in a child `node` process: importing the untyped `build-tokens.mjs` breaks `svelte-check` (same as CHY-3 S2).
- Latin-ext subset of the CDN stylesheet is not shipped (spec: latin + vietnamese only).

## Not done / follow-up
- Per-lesson Kaishu subsets and Chinese lesson text → CHY-13.
- `#f7f3ea` in `app.html:7` / manifest left (not component files).

## Verification run
`pnpm check` 0 errors · `pnpm lint` clean · `pnpm test` 47 passed · `pnpm build` done (14 woff2 in the client output). Pre-push review round 2: 0 findings. Rendered checks in `VERIFY.md`.
