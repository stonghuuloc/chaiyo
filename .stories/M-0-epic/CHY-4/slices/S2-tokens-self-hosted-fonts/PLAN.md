# CHY-4 S2 — plan
ACs: AC4, AC5  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-4 (PR #12, base CHY-3)

## Anchors (verified 2026-10-29)
- `src/app.html:12-17` two preconnects + Google Fonts stylesheet (Be Vietnam Pro 400–700, Literata opsz 500–700)
- `src/routes/layout.css:1-2` `@import 'tailwindcss'; @import '../lib/styles/tokens.css';`
- `design.tokens.json:83-120` font tokens · `:297-423` `frost` group, last child `pill` at `:410-421`
- `src/lib/shell/TabBar.svelte:64` `rgb(40 20 10 / 0.08)` · `:76` `rgb(255 255 255 / 0.45)`, `rgb(255 255 255 / 0)` · `:77` `rgb(255 255 255 / 0.25)`
- `scripts/build-tokens.mjs:49-80` `toCss(tokens)` exported; writes `tokens.css` when run directly
- `src/lib/styles/tokens.test.ts:6-14` asserts 2 of 76 variables
- `prototype/fonts/pinyin-onest-{400,500,600}.woff2` (7,568 / 7,824 / 7,832 B) · `prototype/fonts/ukai-h1-01.woff2` (6,388 B)
- fontsource files: `@fontsource/be-vietnam-pro/files/be-vietnam-pro-{latin,vietnamese}-{400,500,600,700}-normal.woff2`; `@fontsource-variable/literata/files/literata-{latin,vietnamese}-opsz-normal.woff2`
- `src/lib/shell/icons.test.ts:1-10` pattern for importing scripts and reading files in vitest

All code below is an **unexecuted draft**; a self-contradictory fixture gets reported, not bent.

## Task 1 [AC5] Guard test: no colour literals in components
File: `src/lib/styles/guard.test.ts` (new)
- Test: walk `src/**/*.svelte` and `src/**/*.css`, skip `lib/styles/tokens.css` and `paraglide`; fail on `/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/`. Names: `Given_ComponentFiles_When_ScanForColourLiterals_Then_None`, `Given_ColourLiteralSample_Then_RegexRejectsIt`. Comments `// Arrange // Act // Assert`.
- Fails first on the 4 `rgb(` in `TabBar.svelte`. Verify: `pnpm vitest --run src/lib/styles/guard.test.ts`.

## Task 2 [AC5] Tokenise the 4 TabBar literals
Files: `design.tokens.json:421` (new `frost` children), `src/lib/shell/TabBar.svelte:64,76,77`, `src/lib/styles/tokens.css` (generated)
- Change: add `frost.inner` (40/20/10 → 0.15686, 0.07843, 0.03922, α .08), `frost.sheen-top` (white α .45), `frost.sheen-clear` (white α 0), `frost.sheen-glow` (white α .25); `pnpm tokens`; TabBar uses `var(--frost-inner)`, `var(--frost-sheen-top)`, `var(--frost-sheen-clear)`, `var(--frost-sheen-glow)`.
- Test first: Task 1. Verify: guard test green; headless computed `box-shadow` / `background-image` equal to the pre-change strings captured before the edit.

## Task 3 [AC5] tokens.css equals the generator output
File: `src/lib/styles/tokens.test.ts:1-16`
- Test: `Given_DesignTokens_When_ToCss_Then_EqualsCommittedTokensCss`. Run `toCss` through `execFileSync('node', ['-e', …])` (importing the untyped `.mjs` fails `svelte-check`, CHY-3 S2 deviation) and compare with `tokens.css`. Keep the 2 motion tests.
- Verify: `pnpm vitest --run src/lib/styles/tokens.test.ts`.

## Task 4 [AC4] Font guard tests (fail first)
File: `src/lib/styles/fonts.test.ts` (new)
- Tests: no `fonts.googleapis.com`/`fonts.gstatic.com` in `src/app.html` or `src/**`; each `@font-face` in `fonts.css` has a relative `src` whose file exists; families declared ⊇ first family of `--font-sans/serif/pinyin/hanzi` from `tokens.css`; Latin faces `swap`, `AR PL UKai CN` `block`; `ukai-h1-01.woff2` is 6,388 B.
- Verify: `pnpm vitest --run src/lib/styles/fonts.test.ts`.

## Task 5 [AC4] Add packages, copy the prototype fonts
Files: `package.json:24-40`, `src/lib/assets/fonts/` (new)
- Change: `pnpm add -D @fontsource/be-vietnam-pro @fontsource-variable/literata`; copy `pinyin-onest-{400,500,600}.woff2` as `onest-pinyin-{400,500,600}.woff2` and `ukai-h1-01.woff2` from `prototype/fonts/`.
- Verify: files present, sizes unchanged (`ls -l`).

## Task 6 [AC4] `fonts.css` and the CDN removal
Files: `src/lib/styles/fonts.css` (new), `src/routes/layout.css:2`, `src/app.html:12-17`
- Change: `fonts.css`: `@import '@fontsource/be-vietnam-pro/{latin,vietnamese}-{400,500,600,700}.css'` (family `Be Vietnam Pro`, `swap`); explicit `@font-face` for `Literata` (opsz+wght files, latin + vietnamese `unicode-range` copied from the package's `opsz.css`, `font-weight: 200 900`, `swap`; **alias: the package names it `Literata Variable`, tokens say `Literata`**); `Onest` 400/500/600 (`swap`); `"AR PL UKai CN"` (`block`). `layout.css` imports `fonts.css`. Delete `app.html:12-17`.
- Test first: Task 4. Verify: `pnpm vitest --run src/lib/styles`; `pnpm build` emits the woff2 files; headless network log (verify stage).

## Mutation paths covered
- Colour literals can re-enter via `.svelte` `<style>`, inline `style=""`, or `layout.css`: the guard walks all three. A token edit without `pnpm tokens`: Task 3 fails. A CDN link re-added anywhere in `src/`: Task 4 fails.

## Rollback
`git revert` the slice's commits; `pnpm remove -D @fontsource/be-vietnam-pro @fontsource-variable/literata`.
