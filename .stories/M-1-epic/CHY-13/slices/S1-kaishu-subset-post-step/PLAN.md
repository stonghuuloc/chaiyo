# CHY-13 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-13

## Anchors (verified 2026-11-03 on main 9007e338d)
- `scripts/build-lesson-media.py:61-65` current subset call: `pyftsubset assets/ukai.ttc --font-number=0 --text=… --flavor=woff2`, then the stamp script; chars from a regex over the prototype lesson JSON.
- `scripts/stamp-arphic-notice.py:8` `NOTICE` ("subset to the glyphs one screen uses") · `:13` `def stamp(path, date)` writes name ID 10 (3,1,0x409 and 1,0,0) · `:28` `__main__`. File name has hyphens, so load it with importlib.
- `assets/ukai.ttc` tracked in git, 4 faces, face 0 = AR PL UKai CN, 23,873 cmap entries, max code point 195028 (U+2FA14); lacks U+20000.
- `package.json:22` `"assets:pull": "python3 scripts/assets_pull.py"` (python scripts run as plain `python3`; add the `fonts` script next to it).
- `.github/workflows/ci.yml:26` `pnpm install` · `:29` `pnpm test:coverage` · no Python step today.
- `.gitignore:38` `scripts/__pycache__/` already ignored.
- `static/licenses/ARPHICPL.TXT` ships unaltered (the notice references it).
- C3 (CHY-8, draft): `<outDir>/<contentSha>/<lessonId>.json` + `manifest.json` `{ sha, lessons: [{ id, file, bytes }] }`; default outDir `static/content`.
- fontTools 4.x + brotli installed in `~/.capy/work/ft` (venv for this Mac). No rg: use grep.

## Task 1 [AC1] Glyph-set collection from a bundle
File: new `scripts/build-kaishu-subsets.py` (function `glyph_set(bundle) -> set[str]`)
- Test first: `scripts/test_kaishu_subsets.py` — `test_Given_Bundle_When_GlyphSet_Then_HanAndMarksInHanStringsOnly` against `scripts/fixtures/kaishu/<sha>/h1-01.json` (18 expected: 15 hanzi + 亻 + 。！) and a string-only-marks case.
- Change: recursive walk over dict values, list items and strings (keys are ignored); per string, Han chars by the four ranges; if the string has ≥1 Han char, add chars in U+3000–303F and U+FF00–FFEF. Returns a set.
- Verify: `cd scripts && python3 -m unittest test_kaishu_subsets.GlyphSetTests` (scripts/ has no __init__.py; the script file is hyphenated, so the test loads it with importlib).

## Task 2 [AC1][AC3] Subset, stamp, all-or-nothing write
File: `scripts/build-kaishu-subsets.py` (function `build(bundle_dir, fonts_dir, date)`)
- Test first: `test_Given_TwoLessons_When_Build_Then_TwoFilesWithExactCmaps` (h1-01 18 entries, h0-00 per fixture), plus a `wOF2` magic-bytes check, `test_Given_Output_Then_NoGlyphIsNotdef` [AC3] (cmap gid ≠ 0 and glyf contours ≠ 0 for every Han char), `test_Given_CharMissingInFace0_Then_ErrorAndNothingWritten` (𠀀 U+20000 in h1-01 → `SystemExit`/non-zero, message has `h1-01` and `U+20000`, fonts dir empty), `test_Given_Date_Then_NoticeInNameId10`.
- Change: load `manifest.json`, for each lesson read `<bundle_dir>/<file>` (manifest `file`), compute `glyph_set`; first pass checks every char against `TTCollection(assets/ukai.ttc).fonts[0].getBestCmap()` and collects errors; any error → print all, `sys.exit(1)`, write nothing. Second pass: `fontTools.subset.Subsetter` on face 0 for `unicodes=sorted(ord)`, then `subset.save_font(font, path, options)` with `Options(flavor='woff2')` (plain `font.save` would write a TTF) to `<fonts_dir>/ukai-<id>.woff2`, then `stamp(path, date)` loaded via `importlib.util.spec_from_file_location` from `stamp-arphic-notice.py`. CLI: `python3 scripts/build-kaishu-subsets.py <bundleDir> <fontsDir> [--date YYYY-MM-DD]`; creates `fontsDir`; ukai path from the script's own `../assets/ukai.ttc`.
- Verify: `cd scripts && python3 -m unittest test_kaishu_subsets.BuildTests`

## Task 3 [AC2] Re-run regenerates a changed lesson
File: `scripts/test_kaishu_subsets.py` (no new production code: Task 2's `build` rewrites every lesson each run)
- Test first: `test_Given_NewCharAdded_When_Rebuild_Then_FontHasIt` — copy the fixture to a tmp dir, build, append a sentence `{ "hanzi": "新！" }` to its h1-01.json, build again; assert cmap(h1-01) has 新 (absent before) and 19 entries, h0-00 cmap unchanged.
- Verify: `cd scripts && python3 -m unittest test_kaishu_subsets.RebuildTests`

## Task 4 [AC1] Fixtures
Files: new `scripts/fixtures/kaishu/abc123/manifest.json`, `h1-01.json`, `h0-00.json` (sha dir name is a placeholder)
- Change: `h1-01.json` is hand-built from `content/lessons/hsk1/h1-01.yaml:13-31` shaped like a bundle (lesson, sentences with hanzi/pinyin/vi, a thin dictionary entry list, a word with `components: [亻]`); it also holds `vi: "Chào!"`, `note: "（ghi chú）"` (marks without Han, must be ignored) and ASCII. `h0-00.json` holds 34 hanzi from the Primer (`prototype/data/h0-00.js`) as one list plus 、，. Expected sets are written in the test by hand. If CHY-8's real bundle has a different field layout, the fixture stays valid: only string values matter.
- Verify: used by Tasks 1–3.

## Task 5 [CHORE] Script entry, CI, requirements, notice text
Files: `package.json:22` add `"fonts": "python3 scripts/build-kaishu-subsets.py"`; new `scripts/requirements-fonts.txt` (`fonttools==4.x`, `brotli==1.x`, pinned to the versions installed when executing); `.github/workflows/ci.yml:26` insert after `pnpm install`: `actions/setup-python` (3.12) then `pip install -r scripts/requirements-fonts.txt` and `python3 -m unittest discover -s scripts -p 'test_*.py'`; `scripts/stamp-arphic-notice.py:8` "one screen uses" → "one lesson uses".
- Verify: `pnpm fonts scripts/fixtures/kaishu/abc123 ~/.capy/work/fonts-out --date 2026-11-03` prints one line per lesson and writes 2 files; `pnpm lint` (prettier covers `package.json`, ci.yml).
- Shared-file note: `package.json` is also edited by CHY-8 (`import:content`) and CHY-9; one line each, so a merge conflict is mechanical.

## Mutation paths covered
- One writer (`build`): first run (empty fonts dir), re-run over existing files (overwrite), and a lesson gaining a char (Task 3). A lesson removed from the manifest leaves a stale font (not this slice, SPEC).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```python
RANGES = [(0x3400,0x4DBF),(0x4E00,0x9FFF),(0xF900,0xFAFF),(0x20000,0x2FA1F)]
MARKS = [(0x3000,0x303F),(0xFF00,0xFFEF)]
def _in(c, rs): return any(a <= ord(c) <= b for a, b in rs)
def glyph_set(node):
    if isinstance(node, dict): return set().union(*map(glyph_set, node.values()), set())
    if isinstance(node, list): return set().union(*map(glyph_set, node), set())
    if not isinstance(node, str): return set()
    han = {c for c in node if _in(c, RANGES)}
    return han | {c for c in node if _in(c, MARKS)} if han else set()
```
A self-contradictory fixture (a count that does not add up) is reported to the Captain, not edited to pass.

## Rollback
git revert of this slice's commit; nothing else reads the script or its output yet.

## Files touched
create:
- scripts/build-kaishu-subsets.py
- scripts/test_kaishu_subsets.py
- scripts/requirements-fonts.txt
- scripts/fixtures/kaishu/abc123/manifest.json
- scripts/fixtures/kaishu/abc123/h1-01.json
- scripts/fixtures/kaishu/abc123/h0-00.json

edit:
- package.json (`fonts` script, line 22 area)
- .github/workflows/ci.yml (Python install + unit tests, after line 26)
- scripts/stamp-arphic-notice.py (notice wording, line 8)
