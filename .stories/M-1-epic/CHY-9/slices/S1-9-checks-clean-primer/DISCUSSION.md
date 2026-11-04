# CHY-9 S1 — discussion
ACs: AC1, AC2, AC3

## Current behaviour (verified, with anchors)
- [AC1] No lint module: `src/lib/content/` holds schemas.ts, parse.ts only. `parseContent` returns `ContentError {file,path,message}` (parse.ts:5-11).
- [AC1] `docs/content-schema.md:345-357` lists the 9 checks; the AC table words check 9 as hachiware/momonga, the doc (357), CONTEXT.md:177 and content (`h1-01.yaml`) use redpanda/takin.
- [AC1] Vault source: `~/Documents/second-brain/mandarin/meo.py` (index of L*.md, 4 neo HÌNH/ÂM/ĐỜI THẬT/TƯƠNG PHẢN) and `_lesson-contract.md` rules 1-9; both Mac-only.
- [AC1] `content/chars/` is empty, `cast.yaml` is `[]`, h1-01 gate pool is `[]` with draw 10: real content is not lint-clean (CHY-10/11/12).
- [AC1] Real data already breaks check 3: `content/words/不客气.yaml` parts pinyin `bu`, 们 `men`, 系 `xi` (no marks).
- [AC2] No Bài 1 fixture exists; `src/lib/content/fixtures/` holds per-type valid/invalid files for schemas.
- [AC3] `schemas.ts:204-223` Primer: `kind: 'primer'`, sections tones/finals/initials/spelling/sandhi, gate `testOut`.

## Answered here (no human needed)
- [AC1] Q: 'hachiware/momonga' vs 'redpanda/takin'? A: **redpanda/takin**, confidence 85%. Why: CONTEXT.md:177 + NOTES.md:47 (cast v2) + docs/lesson-preview-format.md:45 + real h1-01 content all say redpanda/takin; hachiware/momonga survives only in backlog tasks written before cast v2. Reversal = one constant. Loc can veto at PICTURE.
- [AC1] Q: unknown Cast id source (cast.yaml is `[]`)? A: constant `panda, redpanda, fawn, takin`, 85%; check 8 validates `scene.cast` and `image.cast` only, speaker belongs to check 9 alone (else one bad speaker = 2 errors).
- [AC1 c3] Q: neutral-tone syllables have no mark (们 men). A: no-mark string passes only as a single syllable in a closed list (de le ma me men ne ba zi zhe guo a ya); digits always fail; fields scanned = Word/Sentence pinyin+spoken, parts/collocations/unknown pinyin, Char readings. `typePinyin` answers exempt (schema doc: digits accepted). 80%.
- [AC1 c4] Q: scope? A: Sentences only, per AC; compares authored `spoken` with `deriveSpoken(pinyin, hanzi)` (CHY-8, `derive/spoken.ts`) when hanzi has 一/不 and `spoken` exists; 3-3 in the same sentence counts. 85%.
- [AC1 c5] Q: "known so far"? A: chars of `Word.hanzi` for ids in `sections.words.ids` of lessons with lower (level, order) plus this lesson; CJK ideographs only (punctuation ignored); chars of the sentence's `unknown[].hanzi` allowed. 85%.
- [AC1 c6] A: deep walk of every string in every file, code points U+2E80–U+2FDF, one error per field. 90%.
- [AC1 c1] A: Char readings[].hanviet empty or `—`; the doc's "MIXED Nôm" clause is not detectable from YAML, left out. 85%.
- [AC1 c8] A: id resolution across the set (words by `Word.id`, sentences lesson ∪ `content/sentences`, grammar, Cast), word count 8–15, pool < 2×draw, word absent from every pool `tests.words`, decision-1 clause as written in the doc. Primer: syllables/pairs exist in `syllables.yaml`, each section ≥1 drill, pool ≥2×draw, `section` tag on every pool question covering all 5 (agreed with CHY-11). 85%.
- [AC1 c9] SUPERSEDED by Captain, 2026-11-03 (80% rule, from CHY-10 10.Q1): every dialogue-part line needs a speaker in {redpanda, takin}; each part has ≥2 distinct speakers; back-to-back same-voice lines allowed (Bài 1: R·T·T·R, R·T·T). Other sentences with a speaker must also be in the set.
- [AC1/2/3] Q: how are fixtures built? A: one clean content tree on disk (Bài 1 + words/chars/grammar + primer), loaded by `loadContentDir`; each failing case = in-test mutation of the loaded set asserting exactly 1 error with the right check; mnemonic refs injected. 85%.
- [AC1] Cross-lane, agreed: C1 (lint API) in CONTRACTS.md; CHY-8 exports `deriveSpoken`; CHY-12 adds `content/sentences` to the set; CHY-11 adds the pool `section` tag.
- [AC1 c8f] Advisor r3 (2026-11-04): std rule "none at level" is reported in the lesson file at `sections.grammar.ids`; Word `senses[].example` is resolved by check 8; check 9 skips a dialogue line id that does not resolve (check 8 reports it). Anchors re-verified on main e4444ec (Sentences, Question section, deriveSpoken, Mnemonic type defined in types.ts). 90%.
- [AC1 c8f] Execute: the std "above level" test compares an item with the grammar point's own `level` (one source, no cross-file dedupe); "none at level" compares with the lesson's `level`. A grammar point's level equals its lesson's by schema convention. 85%.

## Advisor round 1 (2026-11-03)
9 findings applied (anchor meo.py:28, 我 not 谢, 好 mutation, lintDir refs arg, toned fixture parts, `say` entries, S2 owns "exits 0", Sentences type asked of CHY-11, check 4 on sentence files). Parked: `senses[].example` field is CHY-12/C6.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 9.Q1 [AC1] | check 7 mnemonic source | A — read the vault at lint time; skip + 1 notice when absent | Captain under Loc's 80% rule, 2026-11-03 |
| 1 | 9.Q2 [AC1] | "common readings" list | A — curated `data/sources/polyphones.yaml` | Captain under Loc's 80% rule, 2026-11-03 |
| 1 | 9.Q3 [AC1] | grammar `std` level rule | A — fold into check 8 | Captain under Loc's 80% rule, 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty. 9.Q1–Q3 answered in round 1, kept under Resolved.)

## Locked (do not re-open)
- Single char beside its compound only when taught on its own (CHY-6 S2). Schemas strict (CHY-7).
