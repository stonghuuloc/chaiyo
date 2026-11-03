# CHY-10 S1 — discussion
ACs: AC1

## Current behaviour (verified, with anchors)
- [AC1] `content/lessons/hsk1/h1-01.yaml`, 10 `content/words/*.yaml`, `content/grammar/h1-g01.yaml` exist and parse (content.test.ts counts 84 files). Empty: grammar.drills, dialogue.questions, listenSpeak.items, gate.pool (h1-01.yaml:46-60). `content/chars/` holds only .gitkeep; `content/cast.yaml` is `[]`, `levels/hsk1.yaml` has `topics: []`.
- [AC1] content.test.ts folders = words, grammar, lessons; `chars/` is parsed by no test.
- [AC1] Prototype questions: l4-grammar.html:118-165 (2 choice + 1 order), l5-dialogue.html:127 (1), l6-listen.html:90-235 (tone, 2 choice, readAloud, freeAnswer), l8-gate.html:155-166 (10). None sit in `prototype/data/h1-01.js`.
- [AC1] Prototype gate tests 谢谢 对不起 没关系 你们 再见 好 不客气 您好; 你, 您, 你好 are untested (lint 8: every lesson word in the pool, pool ≥ 20).
- [AC1] Chars of the 10 words: 你 好 您 们 对 不 起 没 关 系 谢 客 气 再 见 = 15. Vault `meo.py` has anchors for 13; 系 and 客 print "chưa có lesson". `_hanviet.tsv`: 您 起 关 系 谢 客 见 are MIXED (first sound is Hán-Việt, contract line 28).
- [AC1] dialogue speakers: part 1 R·T·T·R, part 2 R·T·T. cast.yaml is empty, so scene.cast [panda, fawn] and speakers redpanda/takin resolve against nothing.
- [AC1] CHY-8 (CHAA-20, C2): importer derives Hán Việt from `content/chars/<hanzi>.yaml` readings matched on tone-marked pinyin; neutral syllables match the first non-rare reading with the same letters; every reading a Bài 1 word uses must be listed (好 hǎo→hảo, hào→hiếu).

## Answered here (no human needed)
- [AC1] Keep the generated files as the base and fill the four empty blocks. 95%, read the files.
- [AC1] Sentences s-h1-01-10..19 are deliberate narrator-voice twins of the dialogue lines (prototype audio keys 11-18 vs m11-m18), so they stay. 85%. Fix s-h1-01-18 to pinyin `bù kèqi` + spoken `bú kèqi`, like s-h1-01-06. 90%.
- [AC1] `topic` stays "Chào hỏi" (prototype LESSON.topic); levels/hsk1.yaml untouched, no Topic schema exists. 85%.
- [AC1] Char fields: radical spelled from IDS (你 → 亻, as the doc example, not vault 人); strokes from vault md, 系 7 and 客 9 by standard count; every vault reading listed per C2, `rare: true` on 没 mò, 见 xiàn, 系 jì, so neutral matches hit the normal reading. 80%.
- [AC1] Question set: 3 grammar drills, 1 dialogue, 5 listenSpeak (tone 好, audio→你好, audio→不客气 meaning, readAloud s-h1-01-06, freeAnswer 对不起), gate pool 20 = prototype 10 + 10 new covering 你 您 你好 好 plus tone/typePinyin types. 85%.
- [AC1] Add `chars` → `Char` to content.test.ts (84 → 99 files) so the 15 chars are parsed. 90%; a test edit, no schema change.

- [AC1] Cross-lane, settled by message 2026-11-03: CHAA-24 (CHY-12) keeps Bài 1 word `examples`, `image`, `parts`, `components`, `spoken`, `hanviet` and existing `senses` on re-runs (C4), so the 10 inline twins stay. 90%, their confirmation.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 10.Q1 [AC1] | lint check 9 vs R·T·T·R dialogue | A — keep prototype speakers; CHY-9 defines check 9 as ≥2 distinct speaking voices per part, no line without a speaker | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |
| 1 | 10.Q4 [AC1] | 系/客 mnemonic | A — omit | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |

## Open — needs an answer before spec
(none — frontier empty)

## Cross-lane (not Loc's)
- cast.yaml and levels/hsk1.yaml are unowned in CONTRACTS.md; lint 8/9 need cast ids (C1, CHY-9). CHY-9 AC1 says "hachiware/momonga", the schema says redpanda/takin.
- Word files carry `pos: [phrase]` for 你 and 好 and CHY-12 regenerates them (C4); lint "common readings" (check 2) is CHY-9's definition.

## Locked (do not re-open)
- 10 word ids, std [] exempt, why optional (CHY-6 S2). One JSON bundle per lesson (ADR 0002).
