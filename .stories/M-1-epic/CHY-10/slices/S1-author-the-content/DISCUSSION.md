# CHY-10 S1 — discussion
ACs: AC1  ·  rev 2 (delta vs main 9b7ab62)

## Current behaviour (verified on main 9b7ab62, with anchors)
- [AC1] `content/lessons/hsk1/h1-01.yaml` (53 lines), 10 `content/words/*.yaml` and `content/grammar/h1-g01.yaml` exist and parse. These four blocks are empty: `grammar.drills` (:39), `dialogue.questions` (:46), `listenSpeak.items` (:48) and `gate.pool` (:53). `content/chars/` is empty. `content/sentences/` is absent. `content/cast.yaml` is `[]`, and `levels/hsk1.yaml` has `topics: []`.
- [AC1] The Primer `content/lessons/hsk1/h0-00.yaml` (`kind: primer`, order 0, CHY-11) sits under `lessons/hsk1`, so it is in every Bài 1 scoped run, and it lints clean. Checks 1–7 and the word-count part of 8 skip it (C1). It teaches no words, so it adds nothing to h1-01's known chars (check 5).
- [AC1] `pnpm -s lint:content content` (C1 CLI, package.json:18) gives 107 errors in 9 files: h1-01 11, h2-01 14, h3-01 26, h4-01 27, h5-01 25, and 1 each in words 不客气, 对不起, 没关系 and 关系. The CLI has no `--only` flag (scripts/lint-content.ts:10).
- [AC1] Bài 1 scope (the 15 `scopeFor` entries of CHY-8 S3, PR #35 head 00f4ce9 `import/scope.ts`): `lintDir('content', { only })` gives 14 errors. 11 are in h1-01: `gate.pool` has 0 questions (needs 20), and each of the 10 words is untested. 3 are `parts[].pinyin #3` (不客气 `qi`, 对不起 `bu`, 没关系 `xi`). This matches CHAA-40's S3 delta report.
- [AC1] content.test.ts:10-15 already parses `chars/` as `Char` and `sentences/` as `Sentences`, with a glob-derived count (CHY-11). No test edit is needed.
- [AC1] Prototype questions: l4-grammar.html:118-165 (2 choice + 1 order), l5-dialogue.html:135-146 (1), l6-listen.html:90-235 (tone, 2 choice, readAloud, freeAnswer), l8-gate.html:155-166 (10). None of them is in `prototype/data/h1-01.js`.
- [AC1] The prototype gate tests 谢谢 对不起 没关系 你们 再见 好 不客气 您; 你 and 你好 are untested. So x11–x20 add a second question for each word.
- [AC1] Chars of the 10 words: 你 好 您 们 对 不 起 没 关 系 谢 客 气 再 见 = 15. `loadVaultMnemonics` (check 7's reader) has all four anchors for 13 of them; 系 and 客 print "chưa có lesson". Polyphone rows: 好 没 见 系.
- [AC1] All 10 Bài 1 word files are on main as hand files (CHY-7). 你好 is not in the HSK 3.0 level-1 list (dict.json level 0), so CHY-12 never touches it. The other 9 are in the list, and CHY-12 S2's promote overwrites them while it keeps the hand fields (C4, CHY-12 S2 PLAN:48).

## Answered here (no human needed)
- [AC1] Keep the generated files as the base and fill the four empty blocks. 95%, read the files.
- [AC1] Sentences s-h1-01-10..19 are deliberate narrator-voice twins of the dialogue lines (prototype audio keys 11-18 vs m11-m18), so they stay. 85%. Change s-h1-01-18 to pinyin `bù kèqi` + spoken `bú kèqi`, like s-h1-01-06. 90%.
- [AC1] `topic` stays "Chào hỏi" (prototype LESSON.topic). levels/hsk1.yaml is untouched, and no Topic schema exists. 85%.
- [AC1] Char fields: the radical is spelled from IDS (你 → 亻, as in the doc example, not the vault's 人). Strokes come from the vault md: 系 7 and 客 9 by standard count. Every vault reading is listed per C2, with `rare: true` on 没 mò, 见 xiàn and 系 jì, so neutral matches hit the normal reading. 80%.
- [AC1] Question set: 3 grammar drills, 1 dialogue, 5 listenSpeak (tone 好, audio→你好, audio→不客气 meaning, readAloud s-h1-01-06, freeAnswer 对不起). The gate pool is 20 = the prototype's 10 + 10 new, exactly 2 per word. 85%.
- [AC1] (rev 2) AC1's Bài 1 files = the `--only lessons/hsk1` scope, not the whole `content/` tree. AC1's Given names "h1-01.yaml and its words, chars and sentences". The 93 non-Bài-1 errors are h2–h5 lessons and `words/关系.yaml`, which no CHY-10 file can fix. C2/C3 production already imports only this scope. 90%.
- [AC1] (rev 2) The 3 `parts[].pinyin` errors stay CHY-12's: C4 forbids CHY-10 edits to word files, and CHY-12 S2 SPEC [AC4] already owns the fix as a step-0 hand edit "done before the run". S1 merges on its lane gate. AC1 is ticked when the scoped import first exits 0. If the step-0 fix is not on main when S1 reaches verify, the Captain asks CHAA-24 to land that 4-value commit alone, ahead of the 505-word run and Loc's spot-check. Nothing in it depends on them. 85%.
- [AC1] (rev 2) Generator is `scripts/chars-from-vault.ts` run with `tsx`, not `.mjs`. It imports `loadVaultMnemonics`, the reader check 7 compares against. A second parser of `meo.py` output could drift (`**nhĩ**` markdown, "— NGƯƠI/BẠN" tails). CONTRACTS.md "Shared files" blesses `chars-from-vault.mjs`; the Captain updates that name. 85%.
- [AC1] (rev 2) `mnemonic.kind` comes from the char's HÌNH label in its vault lesson, read at execute and listed in the PR body. Rev 1 hard-coded a 7/6 split that no lint checks. A quick re-read on 2026-11-05 disagreed with it on 你, 们, 起 and 没, so rev 2 does not copy it. 80%.
- [AC1] (rev 2) The negative control is "drop 好's `hào` reading" (check 2) plus "edit 你's `mnemonic.hinh`" (check 7). Rev 1's "move 好.yaml away" raises no error: all 10 words have authored `hanviet`, so neither lint nor C2 reads the char file for them. 95%, read checks 1, 2, 7 and derive/hanviet.ts.
- [AC1] (rev 2) Rev 1 gate row x19 (`prompt: hanzi 您好`) fails check 8, because `您好` is neither a word id nor a sentence id. Rev 1 also left 对不起 and 好 tested only once in the pool. x14 is now 对不起 (vi "xin lỗi") and x19 is a 好 trueFalse, so every word is tested exactly twice. 95%, hand count in PLAN Task 3.
- [AC1] (rev 2) Do not author `why`/`ask` (C6, on main). Both are optional (CHY-6 S2 lock), `ask` means "sentence shown next to the audio", and the prototype gate has no explanation text. 85%.
- [AC1] Cross-lane, settled by message 2026-11-03: CHAA-24 (CHY-12) keeps Bài 1 word `examples`, `image`, `parts`, `components`, `spoken`, `hanviet` and existing `senses` on re-runs (C4), so the 10 inline twins stay. 90%, their confirmation.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 10.Q1 [AC1] | lint check 9 vs R·T·T·R dialogue | A — keep prototype speakers; check 9 = ≥2 distinct speaking voices per part, no line without a speaker (C1, on main) | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |
| 1 | 10.Q4 [AC1] | 系/客 mnemonic | A — omit | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |

## Open — needs an answer before spec
(none — frontier empty)

## Cross-lane (not Loc's)
- `cast.yaml` and `levels/hsk1.yaml` are unowned in CONTRACTS.md; lint holds the cast ids as a constant (C1).
- CHY-12 S2 step-0 fix of 3 Bài 1 `parts[].pinyin` gates the scoped import (see "Answered here").

## Locked (do not re-open)
- 10 word ids, std [] exempt, why optional (CHY-6 S2). One JSON bundle per lesson (ADR 0002).
