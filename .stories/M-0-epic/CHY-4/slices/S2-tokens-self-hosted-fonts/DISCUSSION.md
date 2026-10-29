# CHY-4 S2 — discussion
ACs: AC4, AC5

## Current behaviour (verified, with anchors)
- [AC4] `src/app.html:12-17` loads Be Vietnam Pro 400–700 and Literata 500–700 (opsz 7..72) from `fonts.googleapis.com` / `fonts.gstatic.com` (2 preconnects + 1 stylesheet). **AC4 fails: 2 CDN origins on every page → TASK.**
- [AC4] No `@font-face` exists in `src/` (`rg '@font-face' src` empty). Families are only named: `tokens.css:27` `--font-hanzi: "AR PL UKai CN", "Kaiti SC", …`, `design.tokens.json:83-120` serif Literata, sans Be Vietnam Pro, pinyin Onest.
- [AC4] Same-origin binaries on disk, all in `prototype/fonts/` (984 KB): `pinyin-onest-{400,500,600}.woff2` (7,568 + 7,824 + 7,832 B), `ukai-h1-01.woff2` (6,388 B, the Bài 1 subset), 7 other Kaishu subsets (959,616 B). Be Vietnam Pro and Literata are **not** in the repo.
- [AC4] The prototype names the Kaishu face `"UKai"` (`prototype/lesson.css:1`, `font-display: block`) and Onest `"Pinyin"` / `"PinyinMarks"` with `unicode-range: U+01CD-01DC, U+01F9, U+1E3F` (`prototype/roots.css:3-4`); the tokens name `"AR PL UKai CN"` and `Onest`.
- [AC4] The Bài 1 route is a skeleton: `src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5` renders one `<h1>`; no Chinese text uses `--font-hanzi` yet, so no Kaishu request fires.
- [AC5] `pnpm tokens` is idempotent: run twice, `git status src/lib/styles` clean. `design.tokens.json` has 54 leaf tokens → 76 CSS variables (`tokens.css`). `tokens.test.ts:6-14` asserts 2 of them (`--motion-fade`, `--motion-fade-reduced`). **"generated variables match the tokens" is unproven for 74 → TASK (test).**
- [AC5] Hex literals in `*.svelte` / `layout.css`: **0** (`rg '#[0-9a-f]{3,8}\b' src`, excluding `tokens.css`). Colour literals of another kind: 4 `rgb()` calls in `TabBar.svelte:64,76,77`.
- [AC5] Hex outside component files: `app.html:7` `theme-color`, `static/manifest.webmanifest:9-10`, all `#f7f3ea` = `notebook-paper`.

## Answered here (no human needed)
| Q | A | Source |
|---|---|---|
| Which Kaishu file does Bài 1 need? | `ukai-h1-01.woff2`, 6,388 B; per-lesson subsets are CHY-13 | `STORY.md` context, `prototype/lesson.css:1` |
| Do same-origin fonts work offline? | Yes: the service worker precaches build output + `static/` per deploy | `src/service-worker/index.ts:1` |
| Display face? | Literata (serif) | `DESIGN.md:166` |
| Where does Onest apply? | pinyin words use it; tone-mark code points elsewhere fall back to it | `DESIGN.md:169` |
| Kaishu `font-display`? | `block`, so hanzi never flash a fallback | `prototype/lesson.css:1` |
| Are `app.html` / manifest hexes in scope of AC5? | No: AC5 says "component files" | AC5 text |
| Does `pnpm tokens` need a change to be repeatable? | No | run twice, no diff |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC4] | source of Be Vietnam Pro + Literata | A — `@fontsource` npm dev dependencies; 0 B of binaries committed for them | Loc 2026-10-29, accepted recommendations |
| 1 | Q2 [AC4] | Literata optical size | A — keep opsz + wght (132,392 B latin + vietnamese) | Loc 2026-10-29, accepted recommendations |
| 1 | Q3 [AC4] | proving the Kaishu clause with no Chinese text on Bài 1 | A — static proof plus a temporary probe page (1 request, 6,388 B), deleted after | Loc 2026-10-29, accepted recommendations |
| 1 | Q4 [AC5] | does AC5 cover `rgb()` | B — hex and `rgb()/hsl()`; tokenise the 4 `TabBar.svelte` literals | Loc 2026-10-29, accepted recommendations |
| 1 | Q5 [AC4] | `font-display` for Latin faces | A — `swap` (Kaishu stays `block`) | Loc 2026-10-29, accepted recommendations |

## Open — needs an answer before spec
(none)

## Locked (do not re-open)
- No emoji in UI; one red primary button per screen (STORY.md). Colours in components come from tokens (STORY.md AC5 scope).
- Anything that moves animates; reduced motion shortens or cuts it (Loc, CHY-3): S2 adds no motion, nothing applies.
