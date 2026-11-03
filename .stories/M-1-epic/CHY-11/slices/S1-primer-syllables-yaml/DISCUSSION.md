# CHY-11 S1 — discussion
ACs: AC1, AC2, AC3, AC4

## Current behaviour (verified, with anchors)
- [AC2] `content/syllables.yaml` has 405 rows, 0 duplicates, key set identical to `prototype/data/syllables.js`. Every single-syllable key the prototype Primer uses (cards, pairs, drills) resolves after dropping the tone digit and `v`→`ü` (lv3 → lü). Nothing to add.
- [AC1] `prototype/data/h0-00.js`: 5 sections, 29 cards (105 chip entries, 10 pairs), 4 drills per section (20), gate pool 24 (tones 4, finals 5, initials 5, spelling 5, sandhi 5), `draw: 10`, `testOut: true`.
- [AC1] Prototype questions are `{t, key, opts, ans, why}` with `s` on pool items; schema `Question` (schemas.ts:105-155) is `{id, tests, type, prompt, options, answer: index, optionKind}` and strict, so no `why`, no section tag, no instruction text.
- [AC1] `Primer` schema (schemas.ts:197-225) is strict: `PrimerSection` has only `cards`, `drills`; prototype section `title`/`hint` and per-question `title` have no home.
- [AC1] `Id` is `z.string()`; `scene.cast: ['panda']` but `content/cast.yaml` is `[]` (no schema or lint check on it today).
- [AC1] CHY-9 will expose `lintDir(dir): { set, errors: LintError[] }` from `src/lib/content/lint/`; CLI `pnpm lint:content` is their S2. Normalisation: NFD, drop tone marks, keep ü, split on whitespace, each piece must be a syllables.yaml row; error path `sections.finals.cards[2].syllables[1]`; skip by `kind: primer` (CHAA-21 reply, items 1-5). No lint module or CLI on main yet (C1 draft, CHY-9). `parseContent('Primer'|'Syllables', …)` exists (parse.ts:13).

- [AC1] CHY-8 (CHAA-20): `import` builds Primer into bundle `h0-00.json`; manifest = every syllables.yaml row × tones 1-4 + every Primer `syllables`/`pairs` entry; importer writes nothing back. Spoken derivation does not reach `kind: syllable` prompts (no hanzi), so the 9 sandhi questions (4 drills + 5 pool) that show 'nǐ hǎo' but must play 'ní hǎo' depend on CHY-8's open 8.Q3 (optional `spoken?` on the syllable Prompt). Until Loc answers, I author displayed text only and list these 9 as override-dependent.

## Answered here (no human needed) — Loc may veto at PICTURE
| # | AC | Decision | Conf. | Reason |
|---|---|---|---|---|
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

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
### 11.Q1 [AC1] Owner: Loc — Where does a drill's instruction text ("Nghe 去 (đi). Pinyin đúng là…") live, now that the schema Prompt is one of hanzi / audio / image / vi / syllable?

**Setup** — Bài 0 spelling drill 1 (`prototype/data/h0-00.js`, spell qu4): the learner hears *qù*, reads "Nghe 去 (đi). Pinyin đúng là…", picks among qù / qǜ / qiù. In the schema `prompt` holds exactly one kind, so a drill cannot carry both the audio and the sentence. 44 Bài 0 questions (20 drills + 24 gate pool): 26 are audio only, 4 are text only, **14 need audio AND text** (spelling 5, sandhi 9).

| | A — add optional `ask?: string` beside `prompt` | B — prompt = audio only, instruction derived from optionKind | C — prompt = `vi` text only |
|---|---|---|---|
| 去 drill: hears | qù | qù | nothing |
| 去 drill: reads | "Nghe 去 (đi). Pinyin đúng là…" | generic "Nghe rồi chọn pinyin" | "Nghe 去 (đi). Pinyin đúng là…" |
| sandhi drill 你好: reads | "Chữ đầu của 你好 (viết nǐ hǎo) thực tế đọc là…" | generic line, 你好 not shown | same as A, no audio |
| authored copy kept | 44 / 44 | 30 / 44 | 44 / 44 |
| questions that lose audio | 0 | 0 | 14 |
| schema change | +1 optional field on Question (shared with CHY-10) | none | none |

**Gap: 14 questions** either lose their sentence (B) or their audio (C); A keeps all 44 at the price of one optional field.

➡️ A. It is the only column that keeps the prototype's behaviour; `why` (the feedback line, on all 44) and `section` (pool tag, see DISCUSSION) need schema changes anyway, so the Captain assigns one lane for the three fields together.

**Answer: pick A, B or C.**

### 11.Q2 [AC2] Owner: Loc — Does a Primer card chip stay a plain tone-marked string, or become an object that can keep its label and hanzi?

**Setup** — the Finals card "Vần mũi: -n và -ng" lists chip `deng1=eng`: the learner taps it, hears *dēng*, and the chip is labelled **eng** (the final alone). The Tones card "Thanh 1" shows hanzi 妈 under *mā*; the Sandhi card shows 你好 under *nǐ hǎo*. The schema today is `syllables: string[]` (e.g. `['mā','má']`). Across 29 cards there are 105 chip entries: 62 have a label different from what is played, 28 show hanzi (8 single syllables, 20 phrases).

| | A — keep `string[]` | B — chip is `'dēng'` or `{ say: 'dēng', label: 'eng', hanzi?: '妈' }` |
|---|---|---|
| chip `deng1=eng` shows / plays | **dēng** / dēng | **eng** / dēng |
| chip `bo1=b` (initials pair b|p) | **bō** / bō | **b** / bō |
| hanzi under 妈, 你好 | dropped (28 chips) | kept |
| labels kept | 43 / 105 | 105 / 105 |
| schema change | none | `syllables`, `pairs` entries become string or object; lint reads `say` |
| YAML size | 105 short strings | 15 strings + 90 flow maps (62 labelled + 28 hanzi) |

**Gap: 62 chip labels and 28 hanzi** (the final/initial contrast on the Finals and Initials cards is the point of those labels).

➡️ B. The initials card teaches "b vs p"; showing bō vs pō teaches the syllable, not the sound. Strings stay valid, so Bài 1 and the schema fixtures don't change.

**Answer: pick A or B.**

## Locked (do not re-open)
- Primer makes no review cards, not in the Lexicon (content-schema.md:311). Schemas strict (CHY-7 Q4).
