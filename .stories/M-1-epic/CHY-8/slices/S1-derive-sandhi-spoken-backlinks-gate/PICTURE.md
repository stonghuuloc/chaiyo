# CHY-8 S1 — picture
ACs: AC4, AC5, AC6, AC8 · Spec rev 1 · Sub-task CHY-8 (slice S1)

## What this slice is about

Pure functions that fill in what authors never write: spoken pinyin (sandhi, or the author's override), Hán Việt per word, which lesson teaches a word, and which gate questions test it. Nothing reads a folder or writes anywhere yet; the S2 importer calls them.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-8` |
| Lands | `src/lib/content/derive/`: `pinyin`, `spoken`, `hanviet`, `backlinks`, `gate`, `index` + a test file each · no dependency |
| Does not land | lint gate, sha, idempotency (S2) · `seg` + thin Dictionary entries (S4) · sinks, audio manifest (S3) |

## **AC4** — verbatim

> *Scenario Outline: Sandhi derives spoken pinyin*
> * *Given* an authored citation pinyin <citation>
> * *When* the importer derives the spoken pinyin
> * *Then* it is <spoken>
>
> *Examples:* nǐ hǎo → ní hǎo (3-3 → 2-3) · bù kèqi → bú kèqi (不 before tone 4 → bú) · yī gè → yí gè (一 by next tone) · yī tiān → yì tiān (一 by next tone)

## **AC5** — verbatim

> *Scenario: Author spoken override wins*
> * *Given* a word whose `spoken` field differs from the sandhi result
> * *When* the importer derives the spoken pinyin
> * *Then* the stored spoken pinyin equals the authored `spoken`

## **AC6** — verbatim

> *Scenario: Backlinks and gate coverage are derived*
> * *Given* lesson h1-01 lists 你好 in `sections.words`
> * *When* the importer runs
> * *Then* Word 你好 has `taughtIn` = h1-01
> * *And* every lesson word appears in the gate draw coverage

## **AC8** — added by Loc (8.Q1 A, 2026-11-03), no ticket text

> *Hán Việt derived per word:* from `Char.readings`, matched to the word's pinyin (polyphones pick the reading whose pinyin matches); an authored `Word.hanviet` wins. Source: `docs/content-schema.md:320`, ticket description.

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg viewBox="0 0 640 452" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto"><title id="expected-title">Expected result: derived fields, one rule per branch</title><desc id="expected-desc">An author writes YAML with nǐ hǎo and 你好. The importer checks whether spoken is authored: if yes the authored value wins, if no the sandhi rule gives ní hǎo. It then derives spoken, Hán Việt, the first lesson and gate coverage, so every derived field is consistent and ready to write.</desc><defs><marker id="expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M160,112 L180,112" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M320,112 L370,112" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#expected-a2)"/><path d="M250,152 L250,192 Q250,200 258,200 L370,200" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#expected-a2)"/><path d="M590,112 L598,112 Q606,112 606,120 L606,240 Q606,248 598,248 L193,248 Q185,248 185,256 L185,268" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M590,200 L606,200" fill="none" stroke="#bfc0c0" stroke-width="1.2"/><circle cx="606" cy="200" r="3" fill="#bfc0c0"/><path d="M350,350 L400,350" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><text x="20" y="72" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">AUTHOR</text><text x="370" y="72" text-anchor="start" font-size=... (line truncated to 2000 chars)

*Notice: the one branch the ACs decide is override vs rule; every other output is computed from authored data only.*

## Requirement [AC4][AC5][AC6][AC8]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg viewBox="0 0 640 392" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto"><title id="requirement-title">Requirement: four promises about derived fields</title><desc id="requirement-desc">AC4: citation pinyin nǐ hǎo becomes spoken ní hǎo by tone sandhi. AC5: an authored spoken value wins over the rule. AC6: the first lesson that lists a word teaches it and every lesson word is in gate coverage. AC8: Hán Việt is the reading whose pinyin matches, nhĩ hảo.</desc><defs><marker id="requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M200,84 L228,84" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M412,84 L440,84" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#requirement-a2)"/><path d="M200,168 L228,168" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M412,168 L440,168" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#requirement-a2)"/><path d="M200,252 L228,252" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M412,252 L440,252" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M200,336 L228,336" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M412,336 L440,336" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><text x="20" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC... (line truncated to 2000 chars)

*Notice: four promises, one row each; AC5 is the only row where the author's value beats the computed one.*

## Solution [AC4][AC5][AC6][AC8]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg viewBox="0 0 640 532" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto"><title id="solution-title">Solution: what S1 adds under derive/</title><desc id="solution-desc">New: pinyin, spoken, hanviet, backlinks and gate modules plus an index barrel in src/lib/content/derive/. Existing: the CHY-7 schemas. Other lanes: the S2 importer and lint check 4 import from the barrel.</desc><defs><marker id="solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="180" y="44" width="300" height="440" rx="6" fill="#2d3142" stroke="#f08a59" stroke-opacity="0.6" stroke-width="1"/><text x="196" y="62" text-anchor="start" font-size="10" fill="#f08a59" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace">src/lib/content/derive/</text><path d="M160,300 L180,300" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#solution-a1)"/><path d="M328,196 L328,216" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#solution-a2)"/><path d="M216,172 L204,172 Q196,172 196,180 L196,436 Q196,444 204,444 L216,444" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#solution-a2)"/><path d="M440,240 L456,240" fill="none" stroke="#f08a59" stroke-width="1.2"/><path d="M440,308 L456,308" fill="none" stroke="#f08a59" stroke-width="1.2"/><path d="M440,376 L456,376" fill="none" stroke="#f08a59" stroke-width="1.2"/><path d="M440,444 L448,444 Q456,444 456,436 L456,128 Q456,120 448,120 L440,120" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#solution-a2)"/><circle cx="456" cy="240" r="3"... (line truncated to 2000 chars)

*Notice: everything new sits in one folder and imports nothing but types; CHY-9's check 4 reuses `deriveSpoken`, so lint and importer cannot drift.*

## Settled

| Decision | Answer | Source |
|---|---|---|
| 8.Q1 scope | Hán Việt (AC8, here) and seg + thin entries (AC9, new S4) are in the story | Loc · `DISCUSSION.md` Resolved |
| 8.Q2 Postgres test DB | PGlite (S3) | Captain, 80% rule |
| 8.Q3 Primer sandhi audio | optional `spoken?` on the syllable Prompt (CHY-11) | Captain, 80% rule |
| Slice split and order | S1 → S4 → S2 → S3; 3 slices became 4 | Captain + me (85%) · Answered here |
| 3-3-3 chain | pairwise on original tones: wǒ hěn hǎo → wó hén hǎo | me (85%) |
| 一 before neutral / at end | unchanged; exceptions via AC5 override | me (80%) |
| Sandhi never crosses punctuation | yǐhòu, nǐ → stays nǐ | me (85%) |
| Hán Việt match | exact tone-marked pinyin; neutral syllable → first non-rare reading | me (85%) |
| Missing char or reading | `{ missing }`, S2 turns it into an import error | me (80%) |
| `deriveSpoken` path and shape | `derive/spoken.ts`, `(pinyin, hanzi) → string`, pure | CHY-9 agreement · CONTRACTS C1/C2 |
| Gate coverage | map wordId → pool question ids; empty list allowed (lint 8 fails it) | me (80%) |

## Carried elsewhere

| Item | Where |
|---|---|
| Lint 4 fails ordinal/month 一 and the h2–h5 preview `spoken` values that over-apply 3→2 (7+ sentences) | parked (`PARKED.md`) · S2 / CHY-9 |
| Erhua words in `deriveHanViet` return `missing` | parked (`PARKED.md`) |
| `seg`, thin Dictionary entries, seg-based "used in" backlinks | S4 (AC9) |
| `Word.taughtIn`, bundle and Postgres rows | S2 / S3 consume `taughtIn` |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 0 | Shared pinyin splitter (spelling rule, erhua, apostrophe) | AC4 AC8 | `derive/pinyin.ts` · `schemas.ts:42` | `pinyin.test.ts`: 尽管, 怀念, 污染, erhua |
| 1 | `deriveSpoken`: 3-3, 不, 一 through the hanzi | AC4 | `derive/spoken.ts` · `content-schema.md:319` | `spoken.test.ts`: 4 AC rows + chains, comma, 衣, capitals, erhua |
| 2 | `resolveSpoken`: authored `spoken` wins | AC5 | `derive/spoken.ts` · `schemas.ts:70` | `spoken.test.ts`: override ≠ derived |
| 3 | `deriveBacklinks`: `taughtIn` + `listedIn`, (level, order) | AC6 | `derive/backlinks.ts` · `schemas.ts:172` | `backlinks.test.ts`: 你好 → h1-01 on literals + real file |
| 4 | `gateCoverage`: wordId → pool question ids | AC6 | `derive/gate.ts` · `schemas.ts:102` | `gate.test.ts`: [q1,q2] / [] + real h1-01 keys |
| 4b | `deriveHanViet` from `Char.readings` | AC8 | `derive/hanviet.ts` · `schemas.ts:22` | `hanviet.test.ts`: 好 hǎo/hào, 不客气, `missing` |
| 5 | Barrel for S2 | CHORE | `derive/index.ts` | `pnpm check && pnpm lint` |

Mutation paths: none, pure functions; callers are S2 and CHY-9 check 4 with the same two strings. Rollback: delete `src/lib/content/derive/`; no dependency, no data change. Advisor: 2 rounds; confirmation NOT READY → 3 mechanical fixes applied post-cap (erhua test value `yóudiánr`, 儿 in the count rule, capitals kept), accepted by Captain 2026-11-03.

## Today → after

| | Today | After |
|---|---|---|
| spoken for `nǐ hǎo`/你好 | not computed; 53 authored values, 24 match the rule | `ní hǎo`; author override still wins |
| `taughtIn` of 你好 | no value | `h1-01` |
| gate coverage of h1-01's 10 words | none | 10 keys (all `[]` until CHY-10 authors the pool) |
| Hán Việt of 你好 | authored only | `nhĩ hảo` from chars, or `missing` |

## Out of frame
- AC1, AC2 (lint gate, sha, no-op rerun) → S2; AC3, AC7 (sinks, audio manifest) → S3; AC9 (seg, thin entries) → S4.
- The importer reading a folder, and turning `missing` into `{ errors }` → S2.
