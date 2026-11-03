# CHY-11 S1 — discussion
ACs: AC1, AC2, AC3, AC4

## Current behaviour (verified, with anchors)
- [AC2] `content/syllables.yaml` has 405 rows, 0 duplicates, key set identical to `prototype/data/syllables.js`. Every single-syllable key the prototype Primer uses (cards, pairs, drills) resolves after dropping the tone digit and `v`→`ü` (lv3 → lü). Nothing to add.
- [AC1] `prototype/data/h0-00.js`: 5 sections, 29 cards (105 chip entries, 10 pairs), 4 drills per section (20), gate pool 24 (tones 4, finals 5, initials 5, spelling 5, sandhi 5), `draw: 10`, `testOut: true`.
- [AC1] Prototype questions are `{t, key, opts, ans, why}` with `s` on pool items; schema `Question` (schemas.ts:105-155) is `{id, tests, type, prompt, options, answer: index, optionKind}` and strict, so no `why`, no section tag, no instruction text.
- [AC1] `Primer` schema (schemas.ts:197-225) is strict: `PrimerSection` has only `cards`, `drills`; prototype section `title`/`hint` and per-question `title` have no home.
- [AC1] `Id` is `z.string()`; `scene.cast: ['panda']` but `content/cast.yaml` is `[]` (no schema or lint check on it today).
- [AC1] CHY-9 will expose `lintDir(dir): { set, errors: LintError[] }` from `src/lib/content/lint/`; CLI `pnpm lint:content` is their S2. Normalisation: NFD, drop tone marks, keep ü, split on whitespace, each piece must be a syllables.yaml row; error path `sections.finals.cards[2].syllables[1]`; skip by `kind: primer` (CHAA-21 reply, items 1-5). No lint module or CLI on main yet (C1 draft, CHY-9). `parseContent('Primer'|'Syllables', …)` exists (parse.ts:13).

- [AC1] CHY-8 (CHAA-20): `import` builds Primer into bundle `h0-00.json`; manifest = every syllables.yaml row × tones 1-4 + every Primer `syllables`/`pairs` entry; importer writes nothing back. Spoken derivation does not reach `kind: syllable` prompts (no hanzi), so only the 3-3 sandhi questions need an override (nǐ hǎo drill + pool = 2); the other sandhi prompts are already written as spoken (bú shì, yí gè, yì tiān). CHY-8 8.Q3 B settled it: optional `spoken?` on the syllable Prompt.

## Answered here (no human needed) — Loc may veto at PICTURE
| # | AC | Decision | Conf. | Reason |
|---|---|---|---|---|
| 1 | 11.Q1 [AC1] | drill instruction text beside the audio prompt | A — optional `ask?: string` on Question | Captain (80% rule), 2026-11-03 |
| 1 | 11.Q2 [AC2] | Primer chip shape | B — string or `{ say, label?, hanzi? }`; lint reads `say` | Captain (80% rule), 2026-11-03 |
| 1 | 8.Q3 B [AC1] | sandhi audio of syllable prompts | optional `spoken?` on syllable Prompt; audio key = `spoken ?? text` | Captain (80% rule) via CHY-8, 2026-11-03 |
| a1 | AC2 | `syllables.yaml` gets no edits unless lint finds a gap | 95% | 405/405 rows match the prototype; every Primer reference resolves |
| a2 | AC1 | tone drills → `type: choice`, `optionKind: pinyin`, prompt `syllable` (audio, never shown), `tests: {tone: true}` | 85% | content-schema.md:307 says "tone / choice(pinyin) with Prompt kind syllable" |
| a3 | AC1 | finals/initials drills: prompt = tone-1 marked syllable that the prototype plays (an1 → 'ān'), options toneless ('an','ang') | 85% | keeps audio/py/<key>.mp3 identical to prototype |
| a4 | AC1 | sandhi/tone drills carry `tests.tone: true`; others `{}` | 80% | Learner Stats counts per-tone accuracy (content-schema.md:311) |
| a5 | AC1 | HTML in prompts (`<span class="hz">去</span>`) → plain text 去 | 85% | schema fields are plain strings; styling is renderer work |
| a6 | AC1 | question ids `q-h0-00-<section>-NN` (drills) and `q-h0-00-g-<section>-NN` (pool); pool kept as 24 own copies even where it repeats a drill | 85% | prototype pool is independent of drills; ids must be unique |
| a7 | AC1 | prototype section `title`/`hint` and per-question `title` are dropped | 85% | five fixed section keys; renderer owns the strings; strict schema |
| a8 | AC1 | `h0-00.yaml` is generated once by a scratch script (not committed), YAML committed | 90% | lessons-to-yaml.mjs precedent; scripts/ is outside this lane |
| a9 | AC1 | scene copied as-is (`cast: [panda]`) | 85% | cast.yaml placeholders are CHY-7 Q2 (A); no check reads it |
| a10 | AC4 | gate pool section tag = optional `section` field on pool Question | 80% | linter and runtime ("2 per section") both need it; agreed by CHY-9 (CHAA-21, 2026-11-03); schema change still needs the Captain to assign one lane |
| a11 | AC1 | feedback line `why?: string` added to Question | 90% | on 44 / 44 prototype questions; dropping it loses the post-answer teaching line |
| a12 | AC1 | 2 questions use `prompt.spoken: 'ní hǎo'`; all other syllable prompts omit `spoken` | 90% | prototype audio for those two is the said form |
| a13 | AC1-4 | tests = new `primer.test.ts` calling `lintDir` on a temp dir holding h0-00.yaml + syllables.yaml (mutated copies for the negative cases); CLI half of AC1 rides on CHY-9 S2 wrapping `lintDir` | 85% | other lanes' unfinished content must not turn AC1 red; CHAA-21 said not to depend on the CLI |
| a14 | AC1 | chips for 3-3 phrases (你好, 很好, 水果) play `say` as written; no `spoken` on chips (not in C6). Risk: a TTS that does not apply sandhi plays nǐ nǐ. Parked, checked at audio render | 80% | keeps C6 as agreed; 3 chips |
| a15 | AC1 | `content.test.ts` picks `Primer` for `lessons/hsk1/h0-00.yaml` and expects 85 files | 90% | the folder map types every file under lessons/ as Lesson; h0-00 would fail |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
(none — frontier empty). Parked: 3-3 chip audio, see Answered here a14.

## Locked (do not re-open)
- Primer makes no review cards, not in the Lexicon (content-schema.md:311). Schemas strict (CHY-7 Q4).
