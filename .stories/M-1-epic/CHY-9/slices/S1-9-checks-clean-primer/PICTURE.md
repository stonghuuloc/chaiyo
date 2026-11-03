# CHY-9 S1 — picture
ACs: AC1, AC2, AC3 · Spec rev 1 · Backlog task CHY-9

## What this slice is about

Gives content authors (and the importer, CHY-8) a linter that reads the whole content folder and reports one error per broken contract rule, with file, field path and check number. S1 is the engine and its fixtures; S2 wraps it as a CLI.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-9` |
| Lands | `src/lib/content/lint/` (loader, `lint()`, `lintDir()`, 9 checks) · clean Bài 1 + primer fixtures · `data/sources/polyphones.yaml` · doc + contract sync |
| Does not land | CLI + exit codes (S2) · importer and `deriveSpoken` (CHY-8) · schema additions (CHY-11) · making real `content/` lint-clean (CHY-10/11/12) |

## **AC1** — verbatim

> *Scenario Outline: Each check fails on its own fixture*
> * *Given* a fixture that breaks only check <n>: <fails when>
> * *When* the linter runs on it
> * *Then* it reports exactly 1 error, named "<check>"
> * *And* no other check reports an error
>
> | n | check | fails when |
> |---|---|---|
> | 1 | Hán Việt | a Char reading has empty or `—` hanviet |
> | 2 | Polyphones | a char with ≥2 common readings lists fewer |
> | 3 | Tone marks | authored pinyin has no marks or contains digits |
> | 4 | Sandhi | 一/不 sentence where derived spoken ≠ `spoken` override |
> | 5 | 80% known chars | a sentence uses a char not known so far and not in `unknown` |
> | 6 | Real glyphs | a code point in U+2E80–U+2FDF is used |
> | 7 | Mnemonic reuse | `mnemonic` differs from vault `meo.py` output |
> | 8 | References | unknown word/sentence/grammar/Cast id, 8–15 words broken, gate pool < 2 × draw, or lesson word untested in gate pool |
> | 9 | Audio | speaker is not hachiware/momonga, or dialogue speakers do not alternate |

## **AC2** — verbatim

> *Scenario: A clean lesson passes*
> * *Given* the Bài 1 fixture with no violations
> * *When* the linter runs
> * *Then* it reports 0 errors and exits 0

## **AC3** — verbatim

> *Scenario: Primer skips checks 1–7 and the word-count part of 8*
> * *Given* a `kind: primer` fixture with no words or chars
> * *When* the linter runs
> * *Then* checks 1–7 report nothing
> * *And* no "word count outside 8–15" error appears
> * *And* the other parts of check 8 still apply

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 640 524" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto" id="d-1-expected-root"><title id="expected-title">Expected result: the linter reports exactly what is wrong</title><desc id="expected-desc">A content author runs the linter on the content folder. Every file is read and checked against the schema, then the 9 contract checks run. A clean Bài 1 lesson gives 0 errors, a lesson breaking one rule gives exactly 1 error named by its check, and a Pinyin primer skips checks 1 to 7 and the word-count error while reference checks still run.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-1-expected-root .wrap { overflow-x:auto }       #d-1-expected-root .wrap svg { min-width:640px }</style><marker id="d-1-expected-expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-1-expected-expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M320,100 L320,132" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M320,188 L320,216" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M320,272 L320,300" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path ... (line truncated to 2000 chars)

*Notice: the only decided branch is clean vs broken vs primer; a broken lesson yields exactly one named error, never a pile.*

## Requirement [AC1][AC2][AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto" id="d-2-requirement-root"><title id="requirement-title">Requirement: nine rules, three acceptance outcomes</title><desc id="requirement-desc">An author writes a lesson and nine rules check it, grouped as Characters, Pinyin, Text, Lesson and Voices. A broken rule gives exactly one error (AC1), a clean lesson gives zero errors (AC2), and a primer skips rules 1 to 7 and the word count while the rest apply (AC3).</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-2-requirement-root .wrap { overflow-x:auto }       #d-2-requirement-root .wrap svg { min-width:640px }</style><marker id="d-2-requirement-requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-2-requirement-requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M320,100 L320,124" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a2)"/><path d="M118,328 L118,376" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a2)"/><path d="M320,328 L320,376" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a2)"/><path d="M522,328 L522,376" fill... (line truncated to 2000 chars)

*Notice: nine rules in five groups; AC1 and AC3 change what an author sees, AC2 is the control that nothing fires on good content.*

## Solution [AC1][AC2][AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 640 584" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto" id="d-3-solution-root"><title id="solution-title">Solution: the lint module added to chaiyo</title><desc id="solution-desc">New lint folder under src/lib/content: load.ts reads the content folder, parseContent turns it into a ContentSet, lint and lintDir run nine checks that use refs.ts, and the result is a LintError list. Unchanged: parse.ts, schemas.ts, the content YAML and the grammar CSV. External: CHY-8 deriveSpoken and import, and the S2 CLI.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-3-solution-root .wrap { overflow-x:auto }       #d-3-solution-root .wrap svg { min-width:640px }</style><marker id="d-3-solution-solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-3-solution-solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M172,68 L232,68" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a2)"/><path d="M320,92 L320,132" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a2)"/><path d="M172,156 L232,156" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><path d="M320,180 L320,220" fill="none" ... (line truncated to 2000 chars)

*Notice: everything orange sits in `lint/`; parser, schemas and content are untouched, and `deriveSpoken` comes from CHY-8.*

## Settled

| Decision | Answer | Source |
|---|---|---|
| Check 7 mnemonic source | vault read at lint time; skipped in CI with 1 notice | Captain (Loc's 80% rule) · `DISCUSSION.md` 9.Q1 |
| Check 2 "common readings" | repo table `polyphones.yaml`, 19 seed chars, every non-junk reading | Captain · 9.Q2 |
| Grammar `std` level rule | folded into check 8 | Captain · 9.Q3 |
| Check 9 speakers | redpanda / takin (not hachiware / momonga); every dialogue line has a speaker; ≥2 distinct voices per part, same-voice neighbours allowed | Captain, from CHY-10 10.Q1 · Answered here c9 |
| Cast ids | constant panda, redpanda, fawn, takin; `cast.yaml` not read | Answered here · C1 |
| Check 3 neutral tone | whole string must be one of 15 closed entries (de, le, … chu lai, qi lai) | Answered here · CHY-12 request |
| Check 4 scope | Sentences only, via CHY-8 `deriveSpoken` (3-3 incl.) | Answered here |
| Check 5 "known" | chars of earlier lessons' words + this lesson's, by (level, order) | Answered here |
| Fixtures | clean tree on disk; each failing case = in-test mutation; refs injected | Answered here |
| API | `lintDir(dir, { refs?, only? })` → {set, errors, notices}; `only` scopes to subpaths (CHY-8 build); check 0 = schema error | C1 in `CONTRACTS.md` |

## Carried elsewhere

| Item | Where |
|---|---|
| "exits 0" clause of AC2 | S2 (CLI owns exit codes) |
| `Sentences` file type, Question `section`, primer `say` entries | CHY-11 (C6 owner) |
| `senses[].example` field | CHY-12 / C6 (advisor park) |
| Real words with unmarked part pinyin (`bu`, `xi`, `qi`) | CHY-12 pipeline |
| "MIXED Nôm" hanviet clause | not lintable from YAML; dropped |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Types, pinyin helpers, loader (check 0), `lint` / `lintDir` | AC1 | `parse.ts:16`, `schemas.ts:231` | `load.test.ts`: bad YAML → check 0, valid files load |
| 2 | Clean Bài 1 fixture tree + injected refs | AC2 | `h1-01.yaml`, `content-schema.md:155` | `clean.test.ts`: 0 errors |
| 3 | Checks 1–3 + `polyphones.yaml` | AC1 | `schemas.ts:22,42,70` | 行 [xíng] → check 2; `ni hao` → check 3; `men` passes |
| 4 | Checks 4–6 | AC1 | `spoken.ts` (CHY-8), `schemas.ts:172` | 不 spoken mismatch; 我 unknown; `⾒` glyph; `unknown` negative control |
| 5 | Check 7 + vault loader | AC1 | `meo.py:28` | differing `am`; absent char/vault → 0 errors |
| 6 | Check 8 (ids, count, pool, untested word, decision 1, `std`, primer parts) | AC1 AC3 | `schemas.ts:115,197,209`, `content-schema.md:356` | one case per sub-item, each exactly 1 error |
| 7 | Check 9 | AC1 | `schemas.ts:70` | `panda` speaker; all-takin part; R·T·T·R passes |
| 8 | Primer fixture + skip proof | AC3 | `schemas.ts:209` | clean + primer 0 errors; 3 mutations → 1 check 8; Kangxi → 0 |
| 9 | Docs + contract sync | CHORE | `content-schema.md:356`, `README.md:5` | `pnpm check && pnpm lint && pnpm test` |

Mutation paths: read-only linter; two input paths (disk loader, in-memory mutation) both tested. Rollback: `git revert` the slice commits; no migration.

## Today → after

| | Today | After S1 |
|---|---|---|
| Contract checks in YAML pipeline | 0 (only prototype `check-lesson.py`) | 9, each with its own fixture |
| Result of a broken lesson | no check before import | list of {file, path, check, name, message} |
| Real content lint-clean | not measured | not changed (h1-01 has pool `[]`, no chars: CHY-10/11/12) |
| Primer handling | n/a | checks 1–7 skip, reference parts run |
| CI vault dependence | n/a | check 7 skipped when vault absent, 1 notice |

## Out of frame
- CLI output format and exit codes (AC4, AC2 "exits 0") → S2.
- `deriveSpoken`, importer, sinks, bundles → CHY-8. Real lesson, words, chars → CHY-10/11/12.
