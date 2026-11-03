# CHY-10 S2 — spec
ACs: AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC2] Importing `content/` (C2 `import(dir, memorySink)`) returns `{ sha }`, and the stored Bài 1 matches `prototype/data/h1-01.js` field by field. Verified by: the parity test below, 0 mismatches.
- [AC2] Words (10): per prototype `WORDS` entry the imported word has the same `hz` (hanzi), `py` (citation pinyin, compared with whitespace removed because CHY-12 rewrites word `pinyin` on every run and may join syllables), `hv` (Hán Việt), `vi` (= `senses[0].vi`), per-char breakdown (`chars` ↔ `parts`, `parts` ↔ `components`), and the `say` spoken form (= derived `spoken`: 你好 → ní hǎo, 不客气 → bú kèqi).
- [AC2] Word examples (`ex`): hanzi, pinyin, vi equal those of the sentence in `examples[0]` (existing examples stay first, C4); 不客气's `ex` pinyin `bú kèqi` is compared with the sentence's `spoken ?? pinyin` (DISCUSSION: citation, spoken only where the prototype carries it); the sentence's own `pinyin` is also compared with the citation `bù kèqi`. 不客气's `examples[0]` is `s-h1-01-18`, which S1 Task 5 sets to `pinyin: bù kèqi, spoken: bú kèqi`; this check fails on main today and passes once S1 has landed.
- [AC2] Sentences (9, `s01..s09` ↔ `s-h1-01-01..09`): same `hz`, `py`, `spoken` (derived ní hǎo for s01/s02, bú kèqi for s06), `vi`, `speaker`. Dialogue (2 parts, titles and 7 lines) and grammar (title, pattern, explain + more, examples, wrong/right pair) match `DIALOGUE` and `GRAMMAR`.
- [AC2] Questions (19: 3 drills, 1 dialogue, 5 listenSpeak, 10 prototype gate): the imported questions equal `h1-01.prototype-questions.json`, a fixture transcribed from l4/l5/l6/l8 (10.Q3 A), in prompt text, option text, correct option and pinyin/hanzi answers. The prototype stays untouched.
- [AC3] For each of the 7 sections the imported lesson carries every field the prototype page reads (bundle-level coverage, Captain default 2026-11-03); the in-app render is CHY-31..35's. The test builds a coverage table section → page → fields and fails on any gap.
- [AC3] Khởi động `l2-warmup.html`: `sections.warmup` is `{}` (10.Q2 A) and all 6 l2 words (对不起 谢谢 没关系 再见 您 不客气) are in `sections.words.ids`. Từ mới `l3-words.html`: 10 words in prototype order with image file, pinyin, hanviet, senses, parts/components, `examples[0]` resolves to a sentence. Ngữ pháp `l4`: grammar point + 3 drills. Hội thoại `l5`: 2 parts, 7 lines with speakers, 1 question. Nghe nói `l6`: 5 items in order tone, choice, choice, readAloud, freeAnswer. Luyện viết `l7`: chars 你 好 们, each with a Char entry (strokes, readings). Gate Test `l8`: pool 20, draw 10, the 10 prototype questions present, `gateCoverage` lists all 10 words.

## Not this slice
- S1 Task 5 (the `s-h1-01-18` pinyin fix) is a prerequisite of this slice, not part of it.
- Authoring the content (chars, questions, cast) → S1; the importer and bundle format → CHY-8 (C2, C3).
- Rendering the sections in the app → CHY-31..35. Warm-up card derivation → CHY-32.
- Word senses regeneration → CHY-12 (C4); this slice only pins `senses[0].vi` of the 9 prototype words. The 3 derived mini-checks of `l3-words.html:62` (after words 3, 6, 9) → CHY-32.

## Seam
One vitest file, `src/lib/content/h1-01.parity.test.ts`, plus its JSON fixture; it calls the importer with the memory sink on the real `content/` dir.

## Test contract
- [AC2] `pnpm test -- h1-01.parity`: 10 word, 9 sentence, 2 dialogue-part, 1 grammar, 19 question comparisons, all equal. Negative control: change one `vi` in an in-memory clone of the imported content, expect exactly that mismatch.
- [AC3] same file, section coverage table: 7 rows, each field present. Negative control: pass the table an in-memory clone with `gate.pool` emptied (an on-disk change fails lint and the import writes nothing), expect only the Gate Test row to fail.

## Open assumptions
- [AC2] `senses[0].vi` of the 9 words stays the prototype gloss: CHY-12 keeps existing `senses` first and verbatim and appends generated ones (CHAA-24, recorded in C4, 2026-11-03). Wrong pick: up to 9 word-gloss mismatches.
- [AC2] Word `pinyin` is rewritten by CHY-12 (C4 "Rewritten"), so only its spacing can differ from the prototype (méi guānxi vs méiguānxi, bù kèqi vs bùkèqi: 2 words); the comparison ignores whitespace. A different syllable or tone mark still fails.
- [AC3] Bundle shape follows C3 (rev 1, final after CHY-8's S3 PLAN); field names in the table are `ImportedContent` names and get adjusted to C3 when it freezes.
