# CHY-8 S1 — discussion
ACs: AC4, AC5, AC6, AC8

## Current behaviour (verified, with anchors)
- [AC4] No derive code exists: `src/lib/content/` holds only schemas.ts and parse.ts (CHY-7). Rule text: `docs/content-schema.md:319` (3-3 → 2-3, 不 before tone 4 → bú, 一 by next tone; `spoken` overrides).
- [AC4] Authored pinyin is space-separated words with multi-syllable words glued (`xǐzǎo`, `yǐjīng`, `nǐmen`) and keeps punctuation (`qǐchuáng yǐhòu, nǐ xiān`, h2-01.yaml:16). Authored `spoken` already exists on 53 sentences, e.g. `nǐ yǐjīng yǒu hǎo` → `ní yǐjīng yóu hǎo` (h2-01.yaml:18): pairwise 3-3 on original tones, no sandhi across a comma.
- [AC4] 一 in content: `yībān` → `yìbān`, `yī kè` → `yí kè` (h2-01.yaml:15). 衣/医 are also `yī`, so the hanzi is needed to find 一.
- [AC5] `Sentence.spoken?` and `Word.spoken?` are optional strings on main (schemas.ts:42-70).
- [AC6] `Word` has no `taughtIn` key (schemas.ts:42-68); gate `pool` items carry `tests.words`. `content/lessons/hsk1/h1-01.yaml` has gate pool `[]` with draw 10, so it has no coverage today. Lint check 8 (CHY-9) already fails "a lesson word never tested in gate pool", so coverage is a derived map, not a second error source.
- [C1] CHY-9 exports `lintDir`, `loadContentDir`; I export `deriveSpoken(pinyin, hanzi)` from `src/lib/content/derive/spoken.ts` (agreed with CHAA-21, 2026-11-03).

- [AC4] Probe of the 3-3 rule over all 53 authored `spoken` values (`~/.capy/work/chy8-sandhi-probe.py`, 3-3 only, no 一/不): 24 match, 29 differ. At least 7 of the 29 are authored sandhi that the AC rule does not produce: tone 3 → 2 before tone 1/2 or neutral (`nǐ xiān` → ní, `nǐ jīngcháng` → ní, `kǎowán shì` → káowán, `Xiǎo Hóng` → Xiáo, `lǎoshī` → láoshī ×2, `wǒ de` → wó). All sit in the h2–h5 preview files, not Bài 1. Lint 4 (CHY-9) will flag them: a real-content import of those files fails until CHY-10/12 re-author them. Not a question for S1: AC4 gives 3-3 only.

- [AC8] `content/chars/` is empty today (`ls content/chars`), so Hán Việt has no readings to match until CHY-10 authors Bài 1's chars. `Word.hanviet?` is an authored override (CHY-7 Q6 A); 不客气.yaml authors `hanviet: bất khách khí` today.

## Answered here (no human needed)
- [Split] Q: slice split S1 derive / S2 pipeline / S3 sinks? A: yes. Confidence 85%: each AC has one home, seams match the code path. Loc can veto at PICTURE.
- [AC4] Q: 3-3-3 chains? A: every tone-3 syllable followed by a tone-3 syllable becomes tone 2, judged on the original tones (nǐ hǎo hǎo → ní háo hǎo). Confidence 85%: it is the AC4 rule and h1-01-01, h2-01-04, h2-01-05 agree (probe 2026-11-03). Authored data does NOT fully agree: see Current behaviour, last AC4 bullet.
- [AC4] Q: 一 before a neutral syllable, or ending a phrase? A: unchanged (`yī`); before tone 4 → yí; before 1/2/3 → yì. Confidence 80%: the AC rows give yí gè and yì tiān only; exceptions (月 months, ordinals) go through the author `spoken` override (AC5).
- [AC4] Q: neutral tone after 3? A: no sandhi (nǐmen stays; only a following tone-3 syllable triggers). Confidence 90%: `nǐmen hǎo` authored without change on 你们.
- [AC5] Q: override scope? A: authored `spoken` replaces the derived value for that item only; Word and Sentence separately. Confidence 95%: AC5 text.
- [AC6] Q: what is "gate draw coverage"? A: per lesson, map wordId → ids of gate pool questions that test it; a word with an empty list stays in the map (lint 8 is what fails). Confidence 80%: AC6 says "appears in the coverage", not "errors".
- [C2] Q: what does contentSha hash? A: sha256 of the canonical JSON of the validated + derived set in sorted file order, so comment-only YAML edits do not re-ship bundles and a derive-rule change does. Confidence 85%; consumed by S2.
- [C5] Q: what is `voice` in the audio key? A: the CastId (`redpanda`, `takin`) or the literal `narrator`; the Cast → provider voice map belongs to the Audio Renderer (architecture.md:28), so keys survive the VoiceStudio spike. Confidence 85%; consumed by S3.
- [CHAA-23 Q1/Q3/Q4] Primer: `import` handles `kind: primer` and `syllables.yaml`; the Primer bundle is `h0-00.json`; the Pinyin Table manifest is `syllables.yaml` × 4 tones; the importer writes nothing back into YAML. Confidence 90%.

- [AC8] Q: how is a word's Hán Việt derived? A: split `Word.pinyin` into syllables, pair them with the chars of `Word.hanzi` one to one, pick for each char the `Char.readings` entry whose pinyin equals the syllable (tone marks included), join with spaces (`nǐ hǎo` → `nhĩ hảo`; `ài hào` 爱好 → `ái hiếu`). An unmarked (neutral) syllable matches the first non-rare reading with the same letters (`qi` ↔ `qì` → `khí`). Authored `Word.hanviet` wins. Confidence 85%: doc rule "polyphones pick the reading whose pinyin matches" (content-schema.md:320).
- [AC8] Q: a char with no file, or no matching reading? A: `deriveHanViet` returns `{ missing: [char…] }` instead of a string; S2 turns it into an import error on the word's file (path `hanviet`), so nothing is written. Confidence 80%: same all-or-nothing rule as AC1; a silent blank Hán Việt on a Word Page is worse.
- [AC8] Q: pinyin splitter shared with sandhi? A: yes, one `derive/pinyin.ts` splitter used by `deriveSpoken` and `deriveHanViet`, so the two cannot disagree on syllable boundaries. Confidence 90%.
- [Order] Q: S4 before or after S2/S3? A: S1 → S4 → S2 → S3: pure derives first, the pipeline wires them, sinks last. Confidence 85%; Captain named the slice ids only.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 8.Q1 [LOCK] | Hán Việt + seg + thin Dictionary entries in scope | A — new AC8 (Hán Việt, S1) and AC9 (seg + thin entries, new S4) | Loc, 2026-11-03 |
| 1 | 8.Q2 | Postgres sink test DB | A — PGlite | Captain (80% rule), 2026-11-03 |
| 1 | 8.Q3 | Primer sandhi drill audio | B — optional `spoken?` on syllable Prompt; CHY-11 (C6) edits schemas.ts; importer keys on `spoken ?? text` | Captain (80% rule), 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty; 8.Q1, 8.Q2, 8.Q3 answered, see Resolved)

## Locked (do not re-open)
- ADR 0002: bundle + Postgres sinks; Dictionary in Postgres. Audio key normal speed only, `sha256(hanzi|voice)`.
