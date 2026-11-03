# CHY-13 S1 — spec
ACs: AC1, AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `pnpm fonts <bundleDir> <fontsDir>` reads `<bundleDir>/manifest.json` (C3: `{ sha, lessons: [{ id, file, bytes }] }`) and writes `<fontsDir>/ukai-<lessonId>.woff2` for every listed lesson, Bài 0 (`h0-00`) included. Verified by: listing `<fontsDir>` after a run over a bundle dir with h1-01 and h0-00 → exactly `ukai-h1-01.woff2` and `ukai-h0-00.woff2`.
- [AC1] A lesson's glyph set = every Han code point (U+3400–4DBF, U+4E00–9FFF, U+F900–FAFF, U+20000–2FA1F) in any string value of its bundle JSON, found by walking the whole tree, plus every fullwidth mark (U+3000–303F, U+FF00–FFEF) found in a string that also holds a Han char (13.Q1 A). Nothing else: no fixed punctuation list, no ASCII, no Vietnamese letters. Verified by: the font's cmap minus `.notdef` equals that set exactly.
- [AC1] Bài 1 sentences (`你好！ 对不起！ 没关系。 谢谢！ 不客气。 再见！ 您好！ 你们好！`): 15 hanzi + 。！ = 17 glyphs, 5,448 B measured with `pyftsubset`, against the 6,640 B prototype file. The fixture also holds the word-page component 亻 (U+4EBB), so its h1-01 cmap has 18 entries.
- [AC1] The output is real WOFF2: the file starts with `wOF2` and for the 18-glyph fixture its size is within 10% of 5,476 B (`pyftsubset` on the same 18 chars) (the fontTools API writes a TTF unless the flavor is set).
- [AC1] Source face is `assets/ukai.ttc` face 0 (AR PL UKai CN), WOFF2 flavour, layout tables kept as pyftsubset does by default. Name ID 10 carries the Arphic §2a modification notice stamped with the build date (`--date YYYY-MM-DD`, default today).
- [AC1] A glyph-set char that `ukai.ttc` face 0 does not map is an error naming the lesson id and the char (`U+XXXX`). When any lesson has an error, the run exits non-zero and writes no font for any lesson.
- [AC2] Running again after a bundle gained a string with a new char (e.g. 新 added to h1-01) rewrites `ukai-h1-01.woff2` so its cmap now contains 新 (19 entries); the other lesson's font keeps its cmap. Verified by: run, add the sentence, run, compare cmaps.
- [AC2] Every run regenerates every listed lesson; there is no cache or skip-if-unchanged check (Answered here).
- [AC3] For the Bài 1 fixture, every Han char in the bundle maps in the generated font to a glyph id other than 0 (`.notdef`) whose glyph has contours. The same holds for the real Bài 1 bundle once CHY-8 emits it (verify stage).
- [AC3] Every hanzi section of Bài 1 draws in Kaishu: a throwaway probe page (not committed) sets each Bài 1 hanzi string in `font-family: 'AR PL UKai CN'` with `lang="zh"`, loads only the generated `ukai-h1-01.woff2`, and the browser requests it once and shows no empty-box glyph (verify stage, as in CHY-4).
- [CHORE] `.github/workflows/ci.yml` sets up Python (actions/setup-python), installs `scripts/requirements-fonts.txt` (fonttools, brotli, pinned) and runs the Python unit tests.
- [CHORE] The notice text in `scripts/stamp-arphic-notice.py` says "one lesson uses", not "one screen uses".

## Not this slice
- The importer, bundle format, `manifest.json` and `pnpm import:content` → CHY-8 (C3). Deleting fonts of lessons removed from the manifest.
- Per-lesson `@font-face` / `unicode-range` loading, `fonts.css` and the committed `src/lib/assets/fonts/ukai-h1-01.woff2` → Catalog and lesson-screen stories (CHY-25, CHY-31+).
- Xingshu font; the prototype `scripts/build-lesson-media.py` font block; the Vercel build command that chains import then fonts.

## Seam
`scripts/build-kaishu-subsets.py`: reads the bundle dir, collects each lesson's glyph set, subsets `assets/ukai.ttc`, stamps the notice, writes the woff2 files.

## Test contract
- [AC1] unittest: fixture bundle dir with h1-01 and h0-00 → output dir holds exactly the two named files, and each cmap equals the glyph set computed by hand from the fixture (h1-01 = 18 entries).
- [AC1] unittest: glyph set ignores ASCII, Vietnamese text and a fullwidth mark in a string with no Han char (e.g. `vi: "Chào!"`, `note: "（ghi chú）"`).
- [AC1] unittest: name ID 10 of the output contains "Modified by chaiyo on 2026-11-03" when run with `--date 2026-11-03`.
- [AC1] unittest: a fixture string holding 𠀀 (U+20000, Han Ext-B, absent from face 0: face 0 maps 23,873 code points) → non-zero exit, message has `h1-01` and the code point, output dir empty.
- [AC2] unittest: run, append a sentence with 新 to the fixture's h1-01.json, run → cmap has 新 and 19 entries; h0-00 cmap unchanged.
- [AC3] unittest: for every Han char in the h1-01 fixture, `cmap[ord(c)] != '.notdef'` and `glyf[name].numberOfContours != 0`.

## Open assumptions
- [AC1] The real bundle puts every rendered string inside the bundle JSON (C3, agreed with CHAA-20, draft until CHY-8's S3 PLAN is READY). If a rendered char lived outside the bundle, it would be tofu; wrong assumption costs 1 verify-stage coverage check against the real Bài 1 bundle.
- [AC1] The Python toolchain (fontTools) is acceptable in CI (DISCUSSION.md Answered here, 80%). Wrong pick costs a swap to a Node subsetter plus a TTC face extraction step, about 1 file.
