# CHY-8 S1 — spec
ACs: AC4, AC5, AC6, AC8  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC4] `deriveSpoken(pinyin, hanzi)` returns the spoken pinyin: every tone-3 syllable followed by a tone-3 syllable becomes tone 2 (`nǐ hǎo` → `ní hǎo`). Verified by: unit test on the 4 AC rows.
- [AC4] 不 (`bù`) before a tone-4 syllable becomes `bú` (`bù kèqi` → `bú kèqi`); elsewhere unchanged.
- [AC4] 一 (`yī`) becomes `yí` before a tone-4 syllable (`yī gè` → `yí gè`) and `yì` before tone 1/2/3 (`yī tiān` → `yì tiān`); unchanged before a neutral syllable or when nothing follows.
- [AC4] Sandhi reads the original tones (3-3-3 `wǒ hěn hǎo` → `wó hén hǎo`), crosses spaces and glued syllables (`nǐ yǐjīng` → `ní yǐjīng`) and never crosses punctuation (`yǐhòu, nǐ xiān` → `yǐhòu, ní xiān`). A neutral syllable after tone 3 triggers nothing (`nǐmen` stays).
- [AC4] 一/不 are found through `hanzi`: a `yī`/`bù` syllable whose hanzi is another char (衣, 医, 布) is never changed. Syllable splitting follows the pinyin spelling rule (a syllable with no initial may only start a run or follow an apostrophe; coda `r` only in `er` or as a run-final erhua `r`, with 儿 pairing to that syllable), so 尽管 `jǐnguǎn` is `jǐn|guǎn`. `Bù`/`Yī` at a sentence start still get sandhi, and an erhua run (`yǒudiǎnr`) never throws and still gets 3-3 (`yóudiánr`). When the hanzi chars and the pinyin syllables cannot be paired one-to-one, 一/不 are left unchanged and 3-3 still applies.
- [AC4] The citation string is returned unchanged when no rule fires, and `deriveSpoken` never reads an authored `spoken`. It is pure: no IO, no import of lint or importer code (C1 agreement with CHY-9).
- [AC5] `resolveSpoken(item)` returns `item.spoken` when authored, else `deriveSpoken(item.pinyin, item.hanzi)`. It works for Word and Sentence, each on its own item: a Word override does not touch the Sentences that contain it.
- [AC6] `deriveBacklinks(lessons)` returns, per word id listed in any lesson's `sections.words.ids`, `listedIn`: lesson ids in (level, order) order, and `taughtIn` = `listedIn[0]`. Primer lessons are skipped. A word listed in no lesson has no entry.
- [AC6] `gateCoverage(lesson)` returns, per id in the lesson's `sections.words.ids`, the ids of gate `pool` questions whose `tests.words` contain it, in pool order. A word no pool question tests is present with `[]` (lint 8 of CHY-9 is what fails it; this derive never errors).
- [AC8] `deriveHanViet(word, chars)` returns `{ hanviet: string }`: `word.hanviet` when authored, else per char the `chars[hanzi].readings` entry whose pinyin equals the word's syllable at that position, joined by spaces (你好 → `nhĩ hảo`; 爱好 `ài hào` → `ái hiếu`). Verified by: unit test with a polyphone 好 (hǎo → hảo, hào → hiếu).
- [AC8] A neutral (unmarked) syllable matches the first non-rare reading with the same letters (不客气 `qi` → khí via `qì`).
- [AC8] When a char has no entry in `chars`, or no reading matches its syllable, or the syllable and hanzi counts differ, the result is `{ missing: [hanzi…] }` (never a partial string, never a throw).
- [CHORE] The four derives are exported from `src/lib/content/derive/index.ts` for the S2 importer; nothing writes to disk or touches YAML.

## Not this slice
- AC1, AC2 (lint gate, sha, idempotency) → S2. AC3, AC7 (sinks, audio manifest) → S3.
- AC9 (`seg`, thin Dictionary entries, Dictionary links, seg-based "used in" backlinks) → S4. AC8 error reporting to the caller (`{ errors }`) → S2.
- `Word.taughtIn` in Postgres/bundle rows: S2/S3 consume `taughtIn`.
- Primer syllable audio keys and the `spoken?` Prompt field (CHY-11, C6).

## Seam
`src/lib/content/derive/`: `spoken.ts` (`deriveSpoken`, `resolveSpoken`), `backlinks.ts` (`deriveBacklinks`), `gate.ts` (`gateCoverage`), `hanviet.ts` (`deriveHanViet`), `pinyin.ts` (shared syllable splitter). Pure functions over the CHY-7 types.

## Test contract
- [AC4] vitest `spoken.test.ts`: the 4 AC rows; 3-3-3 chain; glued word; comma barrier; `nǐmen hǎo` → `nǐmen hǎo`; 一 before neutral/at end unchanged; 衣 `yī` untouched with hanzi 衣服; authored sentences s-h1-01-01, s-h1-01-06, s-h2-01-02, s-h2-01-04, s-h2-01-05 equal their derived value (verified by probe).
- [AC5] vitest: Word `{ pinyin: 'nǐ hǎo', spoken: 'nǐ hǎo' }` returns the authored value, not `ní hǎo`; same item without `spoken` returns `ní hǎo`.
- [AC6] vitest `backlinks.test.ts`: lessons h1-01 and h1-02 both list 你好 → `taughtIn` h1-01, `listedIn` [h1-01, h1-02]; input order reversed gives the same result; Primer skipped.
- [AC6] vitest `gate.test.ts`: pool with 2 questions testing 你好 and 0 testing 再见 → `{ 你好: [q1, q2], 再见: [] }`; the h1-01 content file yields a key per word id (keys only; values belong to CHY-10) and `taughtIn['你好'] === 'h1-01'`.

- [AC8] vitest `hanviet.test.ts`: 你好 → `nhĩ hảo`; 爱好 → `ái hiếu`; 不客气 → `bất khách khí` (neutral `qi`); authored `hanviet` on the word wins; char 你 absent → `{ missing: ['你'] }`; count mismatch → `{ missing }`.

## Open assumptions
- [AC4] 一 before a neutral syllable and 一 as an ordinal stay `yī`. Wrong pick costs 1 rule line; authors cover the exceptions with `spoken` (AC5). See DISCUSSION "Answered here".
- [AC8] A missing char or reading is a caller-visible `missing`, which S2 reports as an import error. Wrong pick (silent blank instead) costs 1 branch; DISCUSSION "Answered here", confidence 80%.
- [AC6] "Backlinks" = lessons that list the word in `sections.words.ids`. If Loc adds seg (8.Q1 A), usage by `seg` extends `listedIn` in a later slice.
