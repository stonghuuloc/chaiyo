# CHY-8 S4 — picture
ACs: AC9 · Spec rev 1 · Sub-task CHY-8 (slice S4)

## What this slice is about

Cuts every sentence into tappable words and prepares the small dictionary cards a lesson bundle carries, so a Learner who taps 你们 gets the word, not the single character. Pure functions plus one data file; S2 loads the file, S3 writes the bundle.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-8` |
| Lands | `content/dictionary.json` (copy of the prototype's 4,233 rows) · `src/lib/content/derive/{dictionary,seg,thin}.ts` + tests · barrel exports · no dependency |
| Does not land | lint gate, sha (S2) · sinks, Postgres `dictionary.word_id` link, audio (S3) · loading the 122k Dictionary into Postgres (no story) |

## **AC9** — added by Loc (8.Q1 A, 2026-11-03), no ticket text

> *`seg` and thin Dictionary entries are derived.* `seg`: longest match against the Dictionary, preferring lesson words, author override wins (`docs/content-schema.md:323`). Thin entries (hanzi, pinyin, Hán Việt, meaning) for every hanzi word in every hanzi-bearing string field of a bundle, and each char of those words (ADR 0002).

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto"><title id="expected-title">Expected result: a pre-cut sentence opens a thin entry</title><desc id="expected-desc">A learner taps a hanzi in 你们好！. The sentence is pre-cut into words shown as three chips: 你们, 好 and ！. Tapping 你们 opens a thin entry: 你们 · nǐ men · nhĩ môn · các bạn (số nhiều). The pre-cut chips are the accented step that AC9 decides.</desc><defs><marker id="expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M200,132 L230,132" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M425,180 L425,198 Q425,206 417,206 L118,206 Q110,206 110,214 L110,232" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#expected-a2)"/><path d="M200,264 L230,264" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><text x="20" y="72" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">LEARNER</text><text x="230" y="72" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">PRE-CUT WORDS · AC9</text><text x="20" y="222" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">TAP</text><text x="230" y="222" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, mon... (line truncated to 2000 chars)

*Notice: the cut happens at import time, so the tap never searches the dictionary on the phone.*

## Requirement [AC9]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg viewBox="0 0 640 332" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto"><title id="requirement-title">Requirement: three promises about cutting and thin entries</title><desc id="requirement-desc">AC9 in three rows. Cut a sentence: the sentence 二十分钟 where the lesson teaches 分钟 gets the fewest words and a taught word is never cut by a dictionary word, giving 二 · 十 · 分钟. Author's cut wins: when the author wrote the cut it is used as written, so the stored cut equals the authored one. Thin entries: every word and character in the lesson's Chinese text is looked up in the dictionary, taught words use their own reading, and each gets one small entry with hanzi, pinyin, Hán Việt and meaning.</desc><defs><marker id="requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><text x="20" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">INPUT</text><text x="232" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">RULE</text><text x="454" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">RESULT</text><path d="M210,88 L232,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M432,88 L454,88" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#requirement-a2)"/><text x="20" y=... (line truncated to 2000 chars)

*Notice: the lesson's own words outrank the dictionary; the author can always override the cut.*

## Solution [AC9]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg viewBox="0 0 640 456" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto"><title id="solution-title">Solution: what S4 adds for seg and thin dictionary entries</title><desc id="solution-desc">New: content/dictionary.json with 4,233 rows, copied once from the frozen prototype/data/dict.json, and src/lib/content/derive/ with dictionary.ts (parseDictionary), seg.ts (segment, deriveSeg) and thin.ts (bundleHanzi, lessonWordEntries, thinEntries). Existing: schemas.ts and the S1 deriveHanViet feed thin.ts. Other lanes: the S2 importer loads dictionary.json and the S3 bundle sink writes entries.</desc><defs><marker id="solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="228" y="128" width="252" height="260" rx="6" fill="#2d3142" stroke="#f08a59" stroke-opacity="0.6" stroke-width="1"/><text x="244" y="146" text-anchor="start" font-size="11" fill="#f08a59" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace">src/lib/content/derive/</text><path d="M152,80 L228,80" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#solution-a1)"/><rect x="156" y="73" width="68" height="14" rx="2" fill="#2d3142"/><text x="190" y="83" text-anchor="middle" font-size="9" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">copied once</text><path d="M420,104 L420,156" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#solution-a2)"/><path d="M344,204 L344,228" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#solution-a2)"/><path d... (line truncated to 2000 chars)

*Notice: the importer never reads `prototype/`; the frozen reference is copied once into `content/dictionary.json`.*

## Settled

| Decision | Answer | Source |
|---|---|---|
| 8.Q4 Dictionary source | copy `prototype/data/dict.json` → `content/dictionary.json`; prototype stays frozen | Captain, 80% rule · `DISCUSSION.md` Resolved |
| Cut rule | fewest tokens, then most lesson-word characters; 二十分钟 → 二 · 十 · 分钟 (forward longest-match cut 分钟 in half) | advisor probe · `DISCUSSION.md` |
| Tokens | join back to the sentence exactly; punctuation one-char tokens; unknown hanzi one-char token, never an error | me (85%) |
| Authored `seg` | wins verbatim; the schema already accepts it (`schemas.ts:77`) | me (95%) |
| Strings that count | sentence hanzi, hanzi-kind `choice` + `fill` options, `order` tiles, grammar `pattern`, `titleHanzi` | ADR 0002 · me (80%) |
| Chars of those words | from one-char Dictionary rows only; none invented | me (80%) |
| Lesson word → entry | Word pinyin; authored or derived Hán Việt (blank if missing, S2 already errors); first sense as meaning | me (85%) |
| Dictionary pinyin | kept as stored (`nǐ men`) | me (80%) |

## Carried elsewhere

| Item | Where |
|---|---|
| Postgres `dictionary.word_id` link | parked (`PARKED.md`) |
| Authored `seg` not checked to join back to hanzi; spaced vs glued pinyin in one bundle | parked (`PARKED.md`) |
| Seg-based "used in" backlinks | not built; S1 `listedIn` stands |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Copy dictionary file; `parseDictionary` with row errors | AC9 | `content/dictionary.json` · `parse.ts:4` | `dictionary.test.ts`: 4,233 rows, 你们, bad row, copy equals prototype |
| 2 | `segment` (DP) + `deriveSeg` (override wins) | AC9 | `derive/seg.ts` · `schemas.ts:77` | `seg.test.ts`: 你们好！, 二十分钟, authored seg, all 101 lesson strings join back |
| 3 | `bundleHanzi` + `thinEntries` | AC9 | `derive/thin.ts` · `schemas.ts:115` | `thin.test.ts`: strings picked, entries deduped and sorted |
| 3b | `lessonWordEntries` | AC9 | `derive/thin.ts` · `schemas.ts:42` | `thin.test.ts`: 你们 → nhĩ môn, authored wins, polyphone |
| 4 | Barrel exports | CHORE | `derive/index.ts` | `pnpm check && pnpm lint` |

Mutation paths: pure functions; one data copy. Rollback: revert; `prototype/` untouched. Advisor: 2 rounds, verdict READY (round 2).

## Today → after

| | Today | After |
|---|---|---|
| `seg` of 你们好！ | none | `你们 · 好 · ！` |
| `seg` of 二十分钟 (lesson teaches 分钟) | none; forward match would give 二 · 十分 · 钟 | `二 · 十 · 分钟` |
| Dictionary data the importer may read | only `prototype/data/dict.json` | `content/dictionary.json`, 4,233 rows |
| Thin entry for 你们 | none | `{ 你们, nǐmen, nhĩ môn, các bạn }` (taught word's own reading) |

## Out of frame
- AC1, AC2 → S2 · AC3, AC7 (bundle write, Postgres, audio) → S3 · AC4–6, AC8 → S1.
