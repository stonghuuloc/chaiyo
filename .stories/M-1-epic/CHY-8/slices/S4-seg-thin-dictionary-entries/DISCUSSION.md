# CHY-8 S4 — discussion
ACs: AC9

## Current behaviour (verified, with anchors)
- [AC9] No segmentation code exists. `Sentence.seg?: string[]` is already in the Zod schema (`schemas.ts:77`) and the doc type (content-schema.md:105), so an authored override parses today and no schema change is needed. Derive rule: longest match against Dictionary, preferring lesson words, author override wins (content-schema.md:323).
- [AC9] ADR 0002 fixes the thin-entry scope: every hanzi word in every hanzi-bearing string field of a bundle (sentence `seg`, question options and `order` tiles, grammar `pattern`, the lesson title), segmented like `seg`, plus each char of those words; entry = hanzi, pinyin, Hán Việt, meaning.
- [AC9] The only Dictionary data in the repo is `prototype/data/dict.json`: 4,233 rows `[hz, pinyin, toneless, hanviet, meaning, level, senses, others]`, one row per hz (0 hz with two rows; other readings sit in `others`). Its pinyin is syllable-spaced (`nǐ men`) while authored pinyin is glued (`nǐmen`).
- [AC9] Bài 1's 10 word ids vs `dict.json` (probe 2026-11-03): 你:true 好:true 您:true 你们:true 你好:true 对不起:true 没关系:true 谢谢:true 不客气:true 再见:true. 您好 is not a Dictionary row (it segments as 您 + 好).

## Answered here (no human needed)
- [AC9] Q: what do seg tokens cover? A: tokens concatenate back to the sentence `hanzi` exactly, punctuation as its own single-char tokens, so a tap index maps to one token. Confidence 85%: `lookup(sentenceId, tapIndex)` (architecture.md:29) needs it.
- [AC9] Q: lesson words vs Dictionary? A (revised after advisor probe): pick the segmentation with the fewest tokens; ties go to the one covering the most characters with lesson words. Probe on real data: forward longest-match splits `二十分钟` (s-h2-01-06) as `二|十分|钟`, cutting lesson word 分钟 (h2-01.yaml:30); the rule above gives `二|十|分钟`. A longer Dictionary word still beats shorter lesson words (你好吗 is 1 token, not 你|好|吗). Confidence 80%.
- [AC9] Q: how does a lesson Word become a thin entry? A: `pinyin` = `Word.pinyin`, `hanviet` = authored `Word.hanviet` else S1 `deriveHanViet` (blank when it returns `missing`; S2 already fails that import under AC8), `meaning` = first `senses[].vi` (senses are "most used first", content-schema.md:80). The lesson-word set is the Words named in `sections.words.ids`, keyed by `Word.hanzi`; a polyphone split pair keeps the first. Confidence 85%.
- [AC9] Q: authored `seg`? A: wins verbatim; the schema already accepts it (`schemas.ts:77`). Confidence 95%.
- [AC9] Q: a hanzi with no Dictionary or lesson match? A: a single-char token, no entry, no error. Confidence 90%.
- [AC9] Q: which reading does a thin entry show? A: the lesson Word's own pinyin/Hán Việt when the token is a lesson word; else the Dictionary row's main reading. Confidence 80%.
- [AC9] Q: Dictionary pinyin spacing? A: entries are emitted with the Dictionary's own pinyin as is (spaces kept); the Catalog formats. Confidence 80%.
- [AC9] Q: does S4 write the Postgres `dictionary.word_id` link? A: no. Re-checked in S3 discuss: no AC or ticket text lists the link and no story loads Dictionary rows, so it is parked. Confidence 85%.

- [AC9] Q: which strings count as "hanzi-bearing"? A: `sentences[].hanzi`, `choice` and `fill` options (choice only when `optionKind: 'hanzi'`), `order` tiles, grammar `pattern`, and `titleHanzi` (ADR 0002 names sentence seg, options, order tiles, grammar pattern, lesson title). `trueFalse.statement` and `rubric` are Vietnamese, Primer has no words, so neither counts. Confidence 80%.
- [AC9] Q: entries for "each char of those words"? A: from Dictionary rows with a one-char hanzi (866 in `dict.json`), nothing invented when absent; the bundle's Char files (C3 `chars`) are separate. Confidence 80%.
- [AC9] Q: Dictionary row shape? A: `[hz, pinyin, toneless, hanviet, meaning, level, senses, others]` (`build-dict.py` header); the thin entry is `{ hanzi, pinyin, hanviet, meaning }`. Parsed once by `parseDictionary`, which returns file/path errors in the `ContentError` shape for a malformed row. Confidence 85%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 2 | 8.Q4 [AC9] | Dictionary source for seg + thin entries | A, changed: copy `prototype/data/dict.json` to `content/dictionary.json` (prototype stays frozen); importer reads the copy | Captain (80% rule), 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty; 8.Q4 answered, see Resolved)

## Locked (do not re-open)
- Loc 8.Q1 A: AC9 = `seg` + thin Dictionary entries (2026-11-03). ADR 0002: Dictionary stays in Postgres; the bundle carries thin entries.
