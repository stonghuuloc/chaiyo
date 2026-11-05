# CHY-10 S1 — picture
ACs: AC1 · Spec rev 2 · Sub-task CHY-10 S1

## What this slice is about

Fills the hollow parts of Bài 1 "Xin chào": 15 character files, 29 practice questions (3 grammar, 1 dialogue, 5 listen/speak, 20 final-test), and one pinyin fix. The linter then reports 0 errors on the lesson and its character files. The rest of the Bài 1 scope is clean once CHY-12 adds 3 tone marks to word parts.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-10` |
| Lands | `content/chars/*` (15) · `h1-01.yaml` questions · `scripts/chars-from-vault.ts` |
| Does not land | importer diff and section coverage (S2) · word senses (CHY-12) · lint code (CHY-9) · cast.yaml (parked) |

## **AC1** — verbatim

> *Scenario: Bài 1 files pass the linter*
> * *Given* `content/lessons/hsk1/h1-01.yaml` and its words, chars and sentences
> * *When* I run the lint CLI on `content/`
> * *Then* it reports 0 errors and exits 0

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto" id="d-1-expected-root"><title id="expected-title">Expected: Bài 1 passes the linter</title><desc id="expected-desc">An author runs the lint command on the Bài 1 scope. The linter reads the Bài 1 lesson with its 10 words, 15 characters and 29 questions. If a character file lacks a required reading it reports an error naming the character; otherwise it finishes with 0 errors and exit 0.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-1-expected-root .wrap { overflow-x:auto }       #d-1-expected-root .wrap svg { min-width:640px }</style><marker id="d-1-expected-expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-1-expected-expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M320,100 L320,132" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M240,204 L240,232 Q240,240 232,240 L138,240 Q130,240 130,248 L130,264" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M400,204 L400,232 Q400,240 408,240 L502,240 Q510,240 510,248 L510,264" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d... (line truncated to 2000 chars)

*Notice: the one decided branch is a char file that lacks a required reading, which fails with that char's name.*

## Requirement [AC1]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto" id="d-2-requirement-root"><title id="requirement-title">Requirement: Bài 1 content is complete and clean</title><desc id="requirement-desc">A lesson author writes 15 character cards and 29 practice questions. Every word is tested and every reference resolves, then the checker says the lesson is clean.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-2-requirement-root .wrap { overflow-x:auto }       #d-2-requirement-root .wrap svg { min-width:640px }</style><marker id="d-2-requirement-requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-2-requirement-requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M240,100 L240,116 Q240,124 232,124 L138,124 Q130,124 130,132 L130,156" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M400,100 L400,116 Q400,124 408,124 L432,124 Q440,124 440,132 L440,156" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M130,228 L130,244 Q130,252 138,252 L232,252 Q240,252 240,260 L240,276" fill="none" stroke="#bfc0c0" stroke-wi... (line truncated to 2000 chars)

*Notice: the learner-facing promise is that every word is tested and every reference resolves.*

## Solution [AC1]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto" id="d-3-solution-root"><title id="solution-title">Solution: what S1 adds to chaiyo</title><desc id="solution-desc">New: 15 character files and a one-off vault script. Changed: the Bài 1 lesson file. Unchanged: words (CHY-12), lint module (CHY-9) and importer (CHY-8), which belong to other lanes.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-3-solution-root .wrap { overflow-x:auto }       #d-3-solution-root .wrap svg { min-width:640px }</style><marker id="d-3-solution-solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-3-solution-solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M200,92 L228,92" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a2)"/><path d="M412,92 L440,92" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a2)"/><path d="M470,140 L470,164 Q470,172 462,172 L328,172 Q320,172 320,180 L320,196" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><path d="M580,140 L580,196" fill="none" stroke="#bfc0c0" stroke-width="1.2" m... (line truncated to 2000 chars)

*Notice: only data and a one-off script change; the lint command (CHY-9) is already on main.*

## Settled

| Decision | Why / source |
|---|---|
| Keep prototype speakers (R·T·T·R, R·T·T); check 9 = ≥2 distinct voices per part | 10.Q1 A, Captain under Loc 80% rule; CHAA-21 confirmed in C1 |
| 系 and 客 get no mnemonic | 10.Q4 A; vault has no lesson for them (`meo.py 系 客`) |
| 10 sentence twins `s-h1-01-10..19` stay | prototype audio keys 11-18 vs m11-m18; CHAA-24 keeps `examples` (C4) |
| Gate pool = prototype 10 + 10 new, covers all 10 words | `DISCUSSION.md` "Answered here" (85%) |
| Chars generated from the vault, 13 mnemonics verbatim | `DISCUSSION.md`; lint 7 compares with `meo.py` |
| Readings list all vault readings; mò, xiàn, jì marked rare | C2 (CHAA-20) matching rule; CHAA-21 check 2 passes |
| Radical spelled from IDS (你 亻) | `DISCUSSION.md` (80%); no lint reads it |

## Carried elsewhere

| Item | Where |
|---|---|
| `content/cast.yaml` has no reader or schema | parked, `PARKED.md`; lint holds a constant (CHAA-21) |
| `ask`/`why` question fields | CHY-11 schema (C6), not authored here |
| `content.test.ts` file count | glob-derived by CHY-11 (CONTRACTS.md Shared files) |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Generate the 15 Char files from the vault | AC1 | `scripts/chars-from-vault.ts` (new, imports `loadVaultMnemonics`) | `content.test.ts`, lint 1/2/3/6/7 |
| 2 | 3 drills, 1 dialogue, 5 listenSpeak questions | AC1 | `h1-01.yaml:39,46,48` | `content.test.ts`, lint 5/8/9 |
| 3 | 20-question gate pool, 2 per word | AC1 | `h1-01.yaml:52-53` | lint 8 (pool ≥ 2 × draw, every word tested) |
| 4 | `s-h1-01-18` citation `bù kèqi` + spoken | AC1 | `h1-01.yaml:31` | lint 3 and 4 |
| 5 | Prove: no lint error in h1-01 or chars/, negative controls (drop 好 hào, edit 你 mnemonic), scoped import | AC1 | `package.json:18` `lint:content`; `import:content` (PR #35) | `pnpm lint:content`, `pnpm import:content --only lessons/hsk1`, `pnpm test`, `pnpm check`, `pnpm lint` |

Mutation paths: none (read-only content; CHY-12 keeps examples, image, parts, components, spoken, hanviet). Rollback: `git revert`.

## Today → after

| | Today | After |
|---|---|---|
| `content/chars/` | 0 files | 15 |
| questions in `h1-01.yaml` | 0 (4 empty blocks) | 29 (3 + 1 + 5 + 20) |
| gate pool vs draw | 0 vs 10 | 20 vs 10 |
| lint errors in h1-01 + `chars/` | 11 | 0 |
| `s-h1-01-18` pinyin | `bú kèqi` | `bù kèqi` (+ spoken `bú kèqi`) |

## Out of frame
- Importer diff against `prototype/data/h1-01.js` and section coverage → S2
- Word senses, POS, examples → CHY-12 (C4); lint code and `lint:content` script → CHY-9; Hán Việt derivation → CHY-8
