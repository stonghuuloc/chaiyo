# CHY-8 S4 — spec
ACs: AC9  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC9] `segment(text, lessonWords, dict)` returns tokens that concatenate back to `text` exactly. It picks the segmentation with the fewest tokens; ties go to the one covering the most characters with lesson words; remaining ties go to the segmentation whose first differing token is longer (content-schema.md:332 longest match). So a longer Dictionary word beats shorter lesson words (fixture dict with 你好吗 → one token; the real file has no 你好吗 row, it gives `你好|吗`) and a lesson word is never cut by a Dictionary word of the same length (`二十分钟` → `二|十|分钟`, not `二|十分|钟`, with 分钟 a lesson word). Verified by: unit tests + a property check over every sentence in `content/lessons`.
- [AC9] `你们好！` with 你们, 好 in the Dictionary gives `['你们','好','！']`; with only 你, 们, 好 it gives `['你','们','好','！']`. A hanzi that matches nothing is a one-char token, never an error. Non-hanzi characters (punctuation, spaces, `/`, `+`) are one-char tokens.
- [AC9] `deriveSeg(sentence, lessonWords, dict)` returns the authored `sentence.seg` unchanged when present, else `segment(sentence.hanzi, …)`.
- [AC9] `bundleHanzi(lesson, grammar, sentences)` returns the hanzi-bearing strings of one bundle: every token of each `sentences[].seg` (the bundle's lesson and free sentences after `deriveSeg`), `choice` options with `optionKind: 'hanzi'`, `fill` options, `order` tiles, grammar `pattern` and `pitfalls[].wrong`/`right`, `titleHanzi`. Thin entries are therefore built from the seg the bundle ships, never by re-segmenting the sentence `hanzi`.
- [AC9] `lessonWordEntries(lesson, words, chars)` builds the lesson-word map: for each id in `sections.words.ids` the Word's entry `{ hanzi, pinyin: Word.pinyin, hanviet: authored else S1 deriveHanViet (blank on missing), meaning: senses[0].vi }`, keyed by hanzi, first of a polyphone pair wins, an id with no Word is skipped. 你们 → `{ pinyin: 'nǐmen', hanviet: 'nhĩ môn', meaning: 'các bạn' }`.
- [AC9] `thinEntries(texts, ctx)` returns one `{ hanzi, pinyin, hanviet, meaning }` per distinct word token of those strings (segmented as above) plus one per distinct hanzi char of those words, sorted by hanzi, no duplicates. A lesson word's entry comes from `lessonWordEntries`, not the Dictionary row. A token with no Dictionary row and no lesson word yields no entry.
- [AC9] `parseDictionary(file, rows)` turns `content/dictionary.json` rows `[hz, pinyin, toneless, hanviet, meaning, level, senses, others]` into a `Map<hanzi, ThinEntry>`; a malformed row returns an error list with file and row path, never a throw.
- [AC9] `content/dictionary.json` is a byte-for-byte copy of `prototype/data/dict.json` (4,233 rows); the prototype file stays unchanged (Captain, 8.Q4).
- [CHORE] The new derives are exported from `src/lib/content/derive/index.ts`; nothing here reads a folder or writes output (S2 loads the file, S3 writes bundles).

## Not this slice
- AC1–AC3, AC7: lint gate, sha, sinks, manifest → S2 / S3. AC4–6, AC8 → S1.
- Postgres `dictionary.word_id` link ("set when a Word with the same hanzi + pinyin is taught") → parked (no AC; ticket description omits it; no story loads Dictionary rows).
- Loading the 122k Dictionary into Postgres: no story owns it; outside CHY-8.
- Seg-based "used in" backlinks: not built; `listedIn` stays from S1.

## Seam
`src/lib/content/derive/`: `dictionary.ts` (`ThinEntry`, `parseDictionary`), `seg.ts` (`segment`, `deriveSeg`), `thin.ts` (`bundleHanzi`, `thinEntries`). Pure functions; the only data file is `content/dictionary.json`.

## Test contract
- [AC9] vitest `seg.test.ts`: 你们好！ both Dictionary cases; 二十分钟 with lesson word 分钟 → `['二','十','分钟']`; 你好吗 (fixture dict) beats lesson 你 + 好; lesson-word tie goes to more lesson-covered chars; `二十分钟` with an empty lesson set and dict 二, 十, 十分, 分钟 → `['二','十分','钟']` (remaining tie: longer first differing token); authored `seg` returned untouched; unknown hanzi → 1-char token; `/` and `+` tokens; for every sentence in every `content/lessons/**/*.yaml`, `segment(hanzi)` with the real dictionary joins back to `hanzi`.
- [AC9] vitest `thin.test.ts`: for a parsed h1-01-shaped lesson, entries include 你们 and 好 and the chars 你, 们; duplicates collapse; lesson-word pinyin beats the Dictionary row; unknown token adds nothing; `bundleHanzi` returns options only when `optionKind: 'hanzi'`, plus the grammar `pattern`, `pitfalls[].wrong`/`right`, `titleHanzi`, and every seg token; seg `['二','十分','钟']` with lesson word 分钟 yields an entry for 十分 (a shipped token re-segments to itself).
- [AC9] vitest `dictionary.test.ts`: the real file parses to 4,233 entries; 你们 → `{ pinyin: 'nǐ men', hanviet: 'nhĩ môn', meaning: 'các bạn (số nhiều); …' }` (prefix match); a row with a numeric hanviet → 1 error at `[n][3]`; `content/dictionary.json` equals `prototype/data/dict.json`.

## Open assumptions
- [AC9] Chars come only from Dictionary rows. Wrong pick (also reading `content/chars`) costs 1 branch in `thinEntries`; DISCUSSION "Answered here", confidence 80%.
- [AC9] Dictionary pinyin keeps its spaces (`nǐ men`). Wrong pick costs 1 `replace` call; confidence 80%.
