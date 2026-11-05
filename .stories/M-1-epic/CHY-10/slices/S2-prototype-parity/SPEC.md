# CHY-10 S2 — spec
ACs: AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 2 (delta vs main 9b7ab62; C2/C3 = CHY-8 S3 SPEC/PLAN, PR #35)

## Behaviour
- [AC2] `importContent('content', createMemorySink(), { only: scopeFor('content', ['lessons/hsk1']) })` (C2; `scopeFor` from `import/scope.ts`, CHY-8 S3) returns `{ sha }`. `buildBundle(sink.content, 'h1-01')` (C3 body `{ sha, lesson, sentences, questions, grammar, words, chars, gateCoverage, thin }`) matches `prototype/data/h1-01.js` field by field. The import runs with `CHAIYO_VAULT` pointed at a missing dir, so lint check 7 is skipped and the test gives the same result on the Mac and in CI. Mnemonics are S1's lint gate, not parity. Verified by: the parity test below, 0 mismatches.
- [AC2] Words (10): for each prototype `WORDS` entry, the bundle word with that `hanzi` has:
  - the same `py` as its `pinyin`, compared NFC with whitespace removed (CHY-12 rewrites word `pinyin`, C4), and `hv` = `hanviet`, `vi` = `senses[0].vi`;
  - `say` = derived `spoken` (你好 → ní hǎo, 不客气 → bú kèqi);
  - prototype `chars` ↔ word `parts` (hanzi, hanviet, vi exact; pinyin exact when the prototype syllable is tone-marked, else equal after stripping tone marks, so CHY-12's fix `bu → bù`, `xi → xì`, `qi → qì` still matches `bu`, `xi`, `qi`);
  - prototype `parts` ↔ word `components` (hanzi, name, vi).
- [AC2] Word examples (`ex`): the sentence that `examples[0]` names (existing examples stay first, C4) is in `bundle.sentences` with the same hanzi and vi. Its pinyin equals `ex`'s pinyin: the bundle sentence's `spoken` (always set by C2) when the prototype word has `say`, else its `pinyin`. 不客气's sentence `s-h1-01-18` also has `pinyin` = `bù kèqi`. That check fails on main today (`bú kèqi`) and passes once S1 Task 4 has landed. Walked by hand on 9b7ab62 content: all 10 words match except that last check.
- [AC2] Sentences (9, `s01..s09` ↔ `s-h1-01-01..09`): same `hz`, `py`, `vi`, `speaker`. `spoken` is compared where the prototype carries it (s01/s02 ní hǎo, s06 bú kèqi). Dialogue (2 parts, titles and 7 lines) and grammar (title, pattern, explain + more, examples, wrong/right pair) match `DIALOGUE` and `GRAMMAR`.
- [AC2] Questions (19 = 3 drills, 1 dialogue, 5 listenSpeak, the 10 prototype gate questions x01–x10): each bundle question with a fixture id equals its row in `h1-01.prototype-questions.json`, a fixture transcribed from l4/l5/l6/l8 (10.Q3 A). The comparison covers prompt text, option text, correct option and pinyin/hanzi answers. The prototype stays untouched. x11–x20 have no prototype source and are not diffed.
- [AC3] For each of the 7 sections, the h1-01 bundle carries every field the prototype page reads (bundle-level coverage, Captain default 2026-11-03). The in-app render belongs to CHY-31..35. The test builds a coverage table (section → page → fields) and fails on any gap:
  - Khởi động `l2-warmup.html`: `lesson.sections.warmup` is `{}` (10.Q2 A), and all 6 l2 words (对不起 谢谢 没关系 再见 您 不客气) are in `sections.words.ids`.
  - Từ mới `l3-words.html`: for each of the 10 ids in `sections.words.ids` order, the `bundle.words` entry with that id (bundle order is `content.words` order, not lesson order) has `image.file`, `pinyin`, `hanviet`, ≥ 1 sense, `parts` or `components`, and `examples[0]` in `bundle.sentences`.
  - Ngữ pháp `l4`: `bundle.grammar` = [h1-g01], its 2 example sentences in `bundle.sentences`, and 3 drills.
  - Hội thoại `l5`: 2 parts with 4 and 3 lines, every line in `bundle.sentences` with a `speaker`, and 1 question.
  - Nghe nói `l6`: 5 items in order tone, choice, choice, readAloud, freeAnswer.
  - Luyện viết `l7`: `writing.chars` [你, 好, 们] ⊆ `bundle.chars`, each with `strokes` and ≥ 1 reading.
  - Gate Test `l8`: pool 20, draw 10, the 10 prototype questions present, and every word has ≥ 2 question ids in `bundle.gateCoverage`. The key set is always the 10 words (derive/gate.ts), so only a non-empty list proves coverage.
- [AC3] Kaishu for Bài 1 (CHY-13, merged): `scripts/build-content.sh` (CHY-8 S3) on the real `content/` exits 0. It leaves `static/content/<sha>/h1-01.json`, `h0-00.json` and `static/fonts/lessons/ukai-h1-01.woff2`, `ukai-h0-00.woff2`. `pnpm fonts` exits non-zero on any Han char that face 0 does not map (CHY-13 AC1), so exit 0 proves every Bài 1 hanzi has a glyph. This is the "real Bài 1 bundle" verify item of CHY-13 AC3, and it is manual (CI never imports `content/`).

## Not this slice
- S1 (chars, questions, the `s-h1-01-18` citation fix) and CHY-12's 3 `parts[].pinyin` tone marks are prerequisites. The scoped import returns `{ errors }` until both are on main.
- The importer, sinks, `scopeFor` and the bundle format → CHY-8 (C2, C3). The Primer bundle `h0-00.json` is built, but S2 does not compare it (CHY-11 owns its content).
- Rendering the sections in the app → CHY-31..35. Warm-up card derivation → CHY-32. `vercel.json` `buildCommand` → CHY-25 (its gate "content imports clean" turns true with S1 + CHY-12's fix; S2's proof step reports it).
- Word senses regeneration → CHY-12 (C4); this slice only pins `senses[0].vi` of the 10 words. The 3 derived mini-checks of `l3-words.html:62` (after words 3, 6, 9) → CHY-32.

## Seam
One vitest file, `src/lib/content/h1-01.parity.test.ts`, plus its JSON fixture. It calls `importContent` with the memory sink on the real `content/` dir, scoped to `lessons/hsk1`, and reads `buildBundle(…, 'h1-01')`.

## Test contract
- [AC2] `pnpm test -- h1-01.parity`: 10 word, 9 sentence, 2 dialogue-part, 1 grammar and 19 question comparisons, all equal. Negative control: the pure `parity(clone, fixture)` over a `structuredClone` of the bundle with 你's `senses[0].vi` changed returns exactly `['你 vi']`.
- [AC3] Same file, section coverage table: 7 rows, each field present. Negative control: pass the table a `structuredClone` of the bundle with `lesson.gate.pool` emptied and `gateCoverage` lists cleared. An on-disk change fails lint, and the import then returns `{ errors }`. Expect only the Gate Test row to fail.
- [AC3] Manual, Mac, with fontTools importable (CHY-13's venv): `scripts/build-content.sh` exits 0, and `ls static/fonts/lessons` shows `ukai-h0-00.woff2` and `ukai-h1-01.woff2`.

## Open assumptions
- [AC2] `senses[0].vi` of the 10 words stays the prototype gloss. CHY-12 keeps existing hand `senses` (no `pos`) first and verbatim, and appends generated ones (C4). Wrong pick: up to 9 word-gloss mismatches (你好 is outside CHY-12's list).
- [AC2] CHY-12 rewrites word `pinyin` (C4 "Rewritten"), so only its spacing may differ from the prototype (méi guānxi vs méiguānxi, bù kèqi vs bùkèqi). The comparison ignores whitespace. A different syllable or tone mark still fails.
