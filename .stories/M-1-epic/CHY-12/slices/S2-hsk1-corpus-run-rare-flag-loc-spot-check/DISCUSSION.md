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

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- 20-entry spot-check approved by Loc before import (AC5); LLM edits, never authors; Tatoeba verbatim.
