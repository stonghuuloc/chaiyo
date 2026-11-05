# CHY-12 S2 — discussion
ACs: AC4, AC5 (story-wide decisions 1–14 and Q1–Q3 are in S1's DISCUSSION.md and stand here)

## Current behaviour (verified, with anchors)
- [AC4] `prototype/data/dict.json` has 505 rows with level 1; `content/words/` has 67 files, 10 of them in that set (起床 included) (你 好 您 你们 对不起 没关系 谢谢 不客气 再见 起床). `content/sentences/` does not exist.
- [AC4] `src/lib/content/content.test.ts:27-30` hard-codes 84 files and `:8-12` lists three folders; adding ~560 word files and a sentences file breaks the count.
- [AC4] The rare flag exists only as the pilot's `common: false` (NOTES.md:111); the Word Page fold is CHY-32's AC (backlog chy-32, Scenario "Word Page renders from the C7 entry").
- [AC5] Nothing samples or gates import today; `import(dir)` (C2, CHY-8) reads whatever sits in `content/`.
- [AC5] Pilot quality signal: 10 words, 88 sentences, 24 Tatoeba / 64 "AI viết" (73%); polysemous 环 had 1 Tatoeba candidate.

## Answered here (no human needed — taken at ≥80% under Loc's 2026-11-03 rule, veto at PICTURE review)
| # | Decision | Conf. % | Reason |
|---|---|---|---|
| 1 | Full run = `uv run scripts/gen-entries.py` with no arguments (505 words, 8 threads); a re-run names only the rejected words | 90 | S1 gives per-word reject + exit 1 list |
| 2 | A word still rejected after 2 further runs stops the story: report word + sense ids to the Captain. No hand-authoring, no loosening of the reason list | 85 | AC4 says every word, AC2 says reject; both stay true |
| 3 | `--sample 20 --seed N` picks `random.Random(N).sample(sorted(staged Word ids), 20)` and writes `.cache/words/out/review-N.md`: per entry id, hanzi, pinyin, Hán Việt, senses by POS with ★ on rare ones, each example with its label (Tatoeba #id or AI viết), and the CC-CEDICT source senses beside it; header carries run totals and a sha of the staged set | 85 | AC5 "20 picked at random and shown to Loc" |
| 4 | `--promote --approved N` refuses unless `review-N.md` exists and its staged-set sha equals the current staged set; then copies staged words and `sentences/hsk1.yaml` into `content/` | 80 | stops promoting entries Loc never saw |
| 5 | Loc's verdict is recorded in this slice's `SPOTCHECK.md` (seed, 20 ids, verdict, date); any rejected entry → fix cause, regenerate affected words, new seed, new sample; approval means 20 of 20 | 90 | AC5 ordering |
| 6 | AC4 is proved on data: vitest `hsk1-words.test.ts` checks every level-1 dict.json row has `content/words/<hz>.yaml`, parsing under Word, ≥1 sense, ≥1 sense has `pos` and every sense that has `pos` has an `example` that resolves in `content/sentences/hsk1.yaml` or a lesson; the fold text itself is CHY-32's | 85 | CHY-32 owns the Word Page |
| 7 | `content.test.ts`: only a `['sentences','Sentences']` folder is added; the count edit is dropped because CHY-11 makes it glob-derived (CONTRACTS.md Shared files, Captain 2026-11-03) | 90 | Captain ruling |
| 8 | `pnpm lint:content` (CHY-9, C1) must exit 0 on the promoted tree when that command is on main; otherwise the vitest parse is the gate | 85 | C1 checks 0, 3, 6, 8 |
| 10 | Four hand files carry unmarked `parts[].pinyin` that C1 check 3 flags (reported by CHAA-21): 对不起 不 `bu`, 没关系 系 `xi`, 不客气 气 `qi`, 关系 系 `xi`. S2 fixes the four values by hand to `bù`, `xì`, `qì`, `xì` (data fix, same commit as the content) | 85 | C4 keeps `parts`, so the pipeline would keep the error and `lint:content` would fail; 关系 is outside the HSK1 list but CHY-9 flags it too |
| 9 | Tatoeba attribution lives in `Sentence.source`; the credits page text is CHY-62 | 90 | CHY-62 owns licences |
| 11 | The model's reading is matched to the source reading ignoring spacing, tone marks on toneless source vowels and a dropped erhua r (single-reading words also tolerate tone sandhi): the first full run rejected 14 of 15 words only for this formatting (bàba vs bà ba) | 90 | A reading that is the same syllables is not an invented reading |
| 12 | The word with the plain-hanzi id takes its reading from a table of 11 corrections (看 kàn, 行 xíng, 和 hé, 雨 yǔ, 差 chà, 累 lèi, 吧 ba, 着 zhe, 地方 dì fang, 页 yè, 起来 qǐ lai), else dict.json's reading, else the first source reading (个 gè, 女 nǚ): dict.json's first reading is a rare one for these and the run had staged 雨 as yù | 80 | Found by comparing staged ids with the source; the old rule made 看.yaml the "to guard" reading |
| 13 | Seed 1 failed 5 of 20 (Opus pre-check). Root causes fixed in the script, not the data: synonym senses merged and word-for-word glosses banned in the prompt; ★ judged by everyday use, not CEDICT order, and a second audit call per word un-stars everyday senses and sends back unnatural or stand-in examples (one repair round); a sense with no natural example is dropped with reason "không có ví dụ tự nhiên"; an HSK POS hint (n v a d q) with no group sends the entry back once so a core sense CEDICT omits can be added (src [], core: true, listed under "Added beyond CC-CEDICT" on the review page); pinyin written word by word. 3-3 sandhi stays unmarked (Captain) | 80 | Captain decision 2026-11-04 after precheck-1.md |
| 14 | The plain-hanzi id goes to the reading with most common senses, a tie to dict.json's reading (告诉 gào su, not the legal gào sù); S1's test that kept dict.json's reading when only the other had a common sense was rewritten to the new rule | 80 | dict.json first readings are wrong for about 20 words |
| 15 | Example pinyin is CITATION pinyin, not spoken (docs/content-schema.md principle 4: authors write citation pinyin, the importer derives spoken). So the check goes the opposite way from the Captain's note: 要 'wǒ bù qù' is correct, and a marked sandhi (yì/yí for 一, bú for 不) is rewritten to yī/bù, the syllable-by-hanzi alignment mirroring deriveSpoken; a vitest asserts no such mark survives. 3-3 stays unmarked. Pinyin is also regrouped per jieba word (méndào, zǒulù) and punctuation made ASCII | 85 | Marked sandhi in pinyin would be applied twice by deriveSpoken |
| 16 | Hán Việt: dict.json (CVDICT) is the source; Unihan kVietnamese was tried and rejected (one native or variant reading per traditional char, '?' for 94 chars). A table fixes the six native words that were stored as Hán Việt (冷 lãnh, 读 độc, 拿 nã, 最 tối, 爸 bả, 妈 ma, also inside compounds), and a warning lists every entry whose hanviet equals one of its glosses: 16 remain, all genuine Sino-Vietnamese words used in Vietnamese (电 điện, 茶 trà, 门 môn, …) | 80 | no in-repo Hán Việt data beyond dict.json |
| 17 | A classifier (Lượng từ) sense whose CEDICT text is "classifier for…" must have a numeral directly before the classifier in its example, and its gloss must not start with "lượng từ"; the HSK-hint check is extended by the audit call, which lists missing core senses and bound-form senses (bound ones get ★) | 85 | Captain items 3, 4, 6 |
| 18 | Round 4 (Captain): CEDICT senses are merged by a separate model call BEFORE the translating call (1,596 -> 1,403 senses on the 421-word part of the run, 397 -> 354 on the 84-word part); an everyday sense that only occurs in a pattern keeps its place without ★ and its gloss ends "(chỉ dùng trong …)"; a table of about 40 polysemous HSK 1 words lists must-have senses that the audit call checks; single-hanzi AI examples must contain the bare hanzi, not only a longer compound (soft: sent back once); pinyin groups per jieba word with numeral+classifier joined, 了/的/着/过 attached to their word, 的话 a unit only when a comma follows | 80 | Captain decision 2026-11-04 after precheck-3.md |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- 20-entry spot-check approved by Loc before import (AC5); LLM edits, never authors; Tatoeba verbatim.
