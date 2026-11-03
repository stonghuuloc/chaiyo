# CHY-13 S1 — discussion
ACs: AC1, AC2, AC3

## Current behaviour (verified, with anchors)
- [AC1] Subsetting is a manual prototype step: `scripts/build-lesson-media.py:61-65` runs `pyftsubset assets/ukai.ttc --font-number=0 --text=<chars> --flavor=woff2`, then `scripts/stamp-arphic-notice.py` writes the Arphic §2a notice to name ID 10 with the run date. It reads `prototype/data/<id>.js`, not the real bundle.
- [AC1] Prototype subsets are not exact: `ukai-h0-00.woff2` has 1,241 hanzi (357,668 B) though `prototype/data/h0-00.js` holds 34; `ukai-h1-01.woff2` has 21 hanzi + 。！ (6,640 B) while `h1-01.yaml` has 15 hanzi (the extra 亻女子尔心门 are word-page radical components).
- [AC1] `assets/ukai.ttc` is tracked in git (17 MB), face 0 = AR PL UKai CN, 23,873 cmap entries; it covers all 15 Bài 1 hanzi and both marks.
- [AC1] No pnpm script, importer hook or bundle exists yet: `src/lib/content/` has only schemas.ts and parse.ts; CI (`.github/workflows/ci.yml`) has no Python step.
- [AC3] `src/lib/styles/fonts.css:62-67` loads one committed `ukai-h1-01.woff2`; lesson routes (`src/routes/(app)/lesson/[id]/[section]/+page.svelte`) are placeholders with no bundle reader.
- [AC1] `subset-font` (npm, harfbuzz wasm) throws "Unrecognized font signature: ttcf" on `ukai.ttc`; Python fontTools reads it directly.

## Answered here (no human needed)
- [AC1] Q: what is "the chars a lesson uses"? A: every Han code point (`\p{Script=Han}`) in any string value of the bundle JSON, walking the whole tree; plus Q1's marks. Confidence 85%: ADR 0002 puts thin Dictionary entries, `seg`, options and title in the bundle, so a tree walk needs no field list and cannot drift from what the app renders. Sent to CHAA-20 as C3.
- [AC3] Q: a bundle char missing from `ukai.ttc`? A: the post-step fails with the char and lesson id, writes no font for that lesson. Confidence 90%: AC3 forbids tofu; a silent skip is tofu.
- [AC1] Q: tool? A: Python fontTools + brotli (`pyftsubset` API) pinned in `scripts/requirements-fonts.txt`, reusing `stamp-arphic-notice.py`; CI gets one `pip install` step. Confidence 80%: npm cannot read the TTC; extracting face 0 first adds a second tool.
- [AC1] Q: where does it run? A: separate command after the importer (`<lessonId>` bundles in, fonts out), never inside `import()`. Confidence 85%: keeps CHY-8's all-or-nothing rule its own; AC1 allows "importer or its post-step".
- [AC2] Q: skip-if-unchanged logic? A: none; regenerate every lesson every run. Confidence 85%: 40 lessons × a few ms each; AC2 only needs the new char present; the notice date is the build date, passed in so tests pin it.
- [AC1] Q: manifest with unicode-range for per-lesson `@font-face`? A: no. Confidence 80%: loading is out of scope (frame approved), so no consumer exists; the file name `ukai-<lessonId>.woff2` is the whole interface.
- [AC3] Q: how is "every Bài 1 section renders Kaishu" proven? A: coverage test (cmap ⊇ every Han char in the Bài 1 bundle, no .notdef) plus a throwaway probe page with `lang="zh"` text, as CHY-4 did. Confidence 85%: frame approval keeps app wiring out of scope.
- [C3] Q: where are the bundles? A: `<outDir>/<contentSha>/<lessonId>.json` (default `static/content`), plus `<outDir>/<contentSha>/manifest.json` = `{ sha, lessons: [{ id, file, bytes }] }`; CI runs `pnpm import:content` then `pnpm fonts static/content/<sha> <fontsDir>`; every rendered string is inside the bundle JSON. Agreed with CHAA-20 (2026-11-03), status draft until CHY-8's S3 PLAN is READY. Confidence 95%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 13.Q1 [AC1] | fullwidth marks in the font? | A — hanzi + the marks that appear in hanzi strings (17 glyphs, 5,448 B for Bài 1) | Captain under Loc's 80% rule, 2026-11-03 (Loc may veto at PICTURE) |

## Open — needs an answer before spec
None. 13.Q1 answered (see Resolved); numbering kept.

## Locked (do not re-open)
- ADR 0002: one static JSON bundle per lesson, same origin.
- Frame (Captain, 2026-11-03): one slice AC1–3; per-lesson `@font-face` loading out of scope.
