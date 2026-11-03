# CHY-8 S2 — picture
ACs: AC1, AC2 · Spec rev 1 · Sub-task CHY-8 (slice S2)

## What this slice is about

One function takes a content folder and either returns the lint errors and writes nothing, or returns a version id (sha) and writes exactly once. Importing the same files again does nothing. It runs against an in-memory store; the real sinks come in S3.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-8` (after S1, S4, CHY-9 lint, CHY-10 content) |
| Lands | `src/lib/content/import/`: `import`, `assemble`, `sink` (+ memory sink) · tests · a frozen `fixtures/ok` folder · no dependency |
| Does not land | bundle + Postgres sinks, audio manifest, `pnpm import:content`, Vercel build chain (S3) · lint checks (CHY-9) |

## **AC1** — verbatim

> *Scenario: Any lint error writes nothing*
> * *Given* a content folder where one word has a pinyin without tone marks
> * *When* I call `import(dir)` with the in-memory sink
> * *Then* the result is `{ errors }` with that error
> * *And* the sink holds no rows and no bundle

## **AC2** — verbatim

> *Scenario: Re-running the same files is a no-op*
> * *Given* a valid content folder was imported and returned sha A
> * *When* I call `import(dir)` again with no file changes
> * *Then* the result is `{ sha: A }`
> * *And* `content_versions` still has exactly 1 row for A

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg viewBox="0 0 640 376" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto"><title id="expected-title">Expected result: import lints first, then writes once by sha</title><desc id="expected-desc">A developer imports a content folder, which is linted. Any lint error returns { errors } and nothing is written (AC1). Otherwise fields are derived and hashed to sha A. If the sink already has A, the result is { sha: A } with no write (AC2). If not, the folder is written once and the result is { sha: A } with one content_versions row. The two decisions are accented.</desc><defs><marker id="expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><path d="M140,88 L160,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M260,88 L270,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M160,88 L180,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M296,88 L316,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#expected-a1)"/><path d="M456,88 L486,88" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#expected-a2)"/><rect x="457.0" y="71" width="28" height="14" rx="2" fill="#2d3142"/><text x="471" y="81" text-anchor="middle" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">YES</text><path d="M386,128 L386,158 Q386,166 378,166 L103,166 Q95,166 95,174 L95,190" fill="none" stroke="#f08a59" stroke-width="1.2" marke... (line truncated to 2000 chars)

*Notice: two decisions, both made before any write; the only path that writes is "no error" and "sha not seen".*

## Requirement [AC1][AC2]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg viewBox="0 0 640 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto"><title id="requirement-title">Requirement: errors stop the import, same content gives the same version</title><desc id="requirement-desc">AC1: a folder where one word's pinyin has no tone marks. Any error stops the import, so the developer sees that error and the store stays empty. AC2: the same files imported a second time. Same content gives the same version id, so nothing is written again and there is still one version row.</desc><defs><marker id="requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><text x="20" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">INPUT</text><text x="232" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">RULE</text><text x="454" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">RESULT</text><text x="20" y="44" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">AC1 · BAD FOLDER</text><path d="M210,88 L232,88" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#requirement-a1)"/><path d="M432,88 L454,88" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#requirement-a2)"/><rect x="20" y="52" wi... (line truncated to 2000 chars)

*Notice: AC1 stops the import; AC2 makes the second run harmless.*

## Solution [AC1][AC2]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg viewBox="0 0 640 436" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto"><title id="solution-title">Solution: what S2 adds under src/lib/content/import/</title><desc id="solution-desc">New in src/lib/content/import/: import.ts (importContent, canonical sha) calls assemble.ts (lint set to ImportedContent) and has or writes to sink.ts (Sink, createMemorySink). lintDir from CHY-9 (C1) feeds import.ts, and existing derive/* from S1 and S4 feeds assemble.ts. Other lane S3: the bundle sink and the Postgres sink (PGlite tests) implement Sink.</desc><defs><marker id="solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><text x="20" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">OTHER LANE · EXISTING</text><text x="196" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">NEW · S2</text><text x="510" y="28" text-anchor="start" font-size="10" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">OTHER LANE · S3</text><rect x="196" y="44" width="290" height="336" rx="6" fill="#2d3142" stroke="#f08a59" stroke-opacity="0.6" stroke-width="1"/><text x="212" y="62" text-anchor="start" font-size="11" fill="#f08a59" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace">src/lib/content/import/</text><path d="M150,112 L212,112" fill="none" stroke="#bfc0c0" stroke-width="1.2" mark... (line truncated to 2000 chars)

*Notice: lint stays in CHY-9 and the derives in S1/S4; this slice is only the order of calls, the sha and the sink contract.*

## Settled

| Decision | Answer | Source |
|---|---|---|
| Function name | `importContent(dir, sink)` (`import` is reserved); documented as the ticket's `import(dir)` | me (95%) |
| Who makes writes atomic | the sink (memory: assign at the end; Postgres: one transaction; bundle: temp dir + rename) | me (90%) |
| Derive-time errors | `LintError` with `check: 10, name: 'Derive'`; CHY-9 accepted, C1 updated | CHAA-21 · C1 |
| `has(sha)` | "is the content the sink holds now", so A → B → A rewrites A (found by the S3 advisor) | S3 advisor r1 · `SPEC.md` |
| Result | exactly `{ sha }` or `{ errors }`; lint notices dropped | me (85%) |
| What is hashed | sha256 of canonical JSON of the whole derived content, no timestamp; Dictionary or derive change → new sha | me (85%) |
| `createdAt` | set by the sink, never hashed | me (90%) |
| `ImportedContent` | lessons (+ gateCoverage, thin), words, sentences (+ spoken, seg), chars, grammar, questions with role, syllables; plain objects only | me (85%) · `SPEC.md` |
| Missing `dictionary.json` | empty Dictionary, no error | me (80%) |
| Test runner for CLIs | `tsx`, added by CHY-9 | CHAA-21 · C1 |
| Test fixture | frozen lint-clean folder from CHY-10's Bài 1 + a free sentence; tests copy it to a temp dir | me (80%) |

## Carried elsewhere

| Item | Where |
|---|---|
| `pnpm import:content`, bundle + Postgres sinks, Vercel chain | S3 |
| Lint 4 over-flags ordinal 一 and h2–h5 preview `spoken` values | parked (`PARKED.md`) · CHY-9 |
| Malformed `dictionary.json` row | tested here as a check-10 error |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | `Sink` contract + `createMemorySink` (atomic write, versions) | AC2 | `import/sink.ts` | `sink.test.ts`: has/write, failed write leaves state |
| 2 | `assemble`: lint set → `ImportedContent` (derives, roles, Primer, free sentences) | AC2 | `import/assemble.ts` · `schemas.ts:172` | `assemble.test.ts`: 你好 → h1-01, seg/spoken present, no `Map` |
| 3 | `importContent`: lint gate, canonical sha, `has` before `write` | AC1 AC2 | `import/import.ts` · C1 `lintDir` | `import.test.ts`: bad pinyin → check 3, twice → 1 row, sha stable/changes |
| 4 | Barrel + full checks | CHORE | `import/index.ts` | `pnpm check && pnpm lint && pnpm test:coverage` |

Mutation paths: read-only on the folder; the sink is the only writer; temp-dir copies only in tests. Rollback: delete `src/lib/content/import/`. Advisor: 2 rounds; round 2 found 2 mechanical errors (the sha test edited a lesson word's row; a stale call in the draft), fixed post-cap, same as S1; accepted by Captain 2026-11-03 (S2 READY).

## Today → after

| | Today | After |
|---|---|---|
| Import a folder with `pinyin: ni hao` | no importer | `{ errors: [check 3 on words/你好.yaml] }`, 0 versions |
| Import the valid fixture twice | no importer | `{ sha: A }` both times, 1 `content_versions` row |
| YAML comment-only edit | n/a | same sha |
| Edit the 们 Dictionary row | n/a | different sha |

## Out of frame
- AC3 (JSON bundle, Postgres, same content per sink) and AC7 (audio manifest) → S3 · AC4–6, AC8 → S1 · AC9 → S4.
