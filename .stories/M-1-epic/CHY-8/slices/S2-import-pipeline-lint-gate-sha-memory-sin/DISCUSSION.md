# CHY-8 S2 — discussion
ACs: AC1, AC2

## Current behaviour (verified, with anchors)
- [AC1] No importer exists. `src/lib/content/` holds schemas.ts + parse.ts (`parseContent(type, file, text)`, errors as `{ file, path, message, line?, col? }`, parse.ts:4-9). The lint module is CHY-9's (C1 in CONTRACTS.md): `lintDir(dir, opts?: { refs?, only? }) → { set, errors, notices }`, `LintError { file, path, check 0–10 (10 = Derive, importer only), name, message }`. Check 3 = tone marks (content-schema.md:350).
- [AC1] The repo's own `content/` is not lint-clean today: `content/chars/` is empty, so Hán Việt and polyphone checks have nothing to read; S2 tests therefore use their own fixture folder, built from CHY-9's lint/fixtures/clean + primer.
- [AC2] No `content_versions` store exists; `supabase/` has no migrations (S3 adds them). Doc rule: one row per import, keyed by `sha` (content-schema.md:341).
- [AC2] Delivery contract: the sha is the URL of every bundle (ADR 0002), so it must change exactly when a bundle's content changes: YAML whitespace/comment edits must not change it; a derive-rule or Dictionary change must.
- [CI] CI runs Node 24, pnpm 10, no tsx (.github/workflows/ci.yml); `src/lib/content` imports are extensionless (`./schemas`), so native type stripping cannot run a CLI. CLI is S3; runner = `tsx`, added by CHY-9 in its CLI slice (CHAA-21 agreed, C1).

## Answered here (no human needed)
- [AC1] Q: function name? A: `importContent(dir, sink)` (`import` is a reserved word); C2 documents it as the ticket's `import(dir)`. Confidence 95%.
- [AC1] Q: who guarantees "nothing written" when a sink fails mid-write? A: the sink: `write` is atomic (memory: assign at the end; Postgres: one transaction; bundle: temp dir then rename). The importer never catches. Confidence 90%.
- [AC1] Q: do derive-time failures (a missing Char or reading for Hán Việt; a duplicate sentence id is already lint 8, CHAA-21 2026-11-03) also write nothing? A: yes; they come back as `LintError` with `check: 10, name: 'Derive'` (accepted by CHAA-21, C1 updated). Confidence 85%.
- [AC1] Q: lint notices (e.g. "check 7 skipped")? A: dropped by `importContent` so the result is exactly `{ sha }` as AC2 states; `pnpm lint:content` prints them. Confidence 85%.
- [AC2] Q: what is hashed? A: sha256 hex of the canonical JSON (sorted keys, entities sorted by key) of the whole `ImportedContent` — every derived value, the per-lesson thin entries and gate coverage included, no timestamp. A Dictionary or derive-rule change changes the sha, so a bundle URL never serves stale thin entries. Confidence 85%.
- [AC2] Q: where is `createdAt` of the content_versions row? A: assigned by the sink at write time (Postgres `default now()`), never hashed. Confidence 90%.
- [AC2] Q: what goes in `ImportedContent`? A: lessons (incl. Primer) with `gateCoverage` and `thin`; words with resolved `spoken`, `hanviet`, `taughtIn`, `listedIn`; sentences (lesson-inline + `content/sentences`) with resolved `spoken` and `seg`; chars; grammar points; questions flattened as `{ id, lessonId, role, body }` with role drill / dialogue / listen / gate from the section they sit in (content-schema.md:339); syllables. Confidence 85%: it is the union of what AC3 expects every sink to hold.
- [AC2] Q: missing `<dir>/dictionary.json`? A: empty Dictionary (every hanzi its own token, no thin entries beyond lesson words), no error, so lint fixture folders stay small. Confidence 80%.
- [AC1] Q: lesson-less words? A: imported, `taughtIn` absent. Confidence 90%.
- [AC1] Q: test fixture strategy? A: one frozen lint-clean folder `import/fixtures/ok/` and tests that copy it to a temp dir and mutate (bad pinyin, comment-only edit, Dictionary edit). It is built from CHY-9's lint/fixtures/clean + primer, plus sentences/ok.yaml and a 20-row dictionary.json; the executor stops and reports if `lintDir` rejects it. Confidence 80%.

- [r1 advisor, 2026-11-04] Applied 11 fix-in-place items against main 63d1735: fixture moved to Task 2 and built from CHY-9's `lint/fixtures/clean` + `primer` (no wait on CHY-10/CHY-11); refs passed as `fixtureRefs`; check-10 test deletes the `hanviet:` line of 你们 and `chars/们.yaml`; `only` is the C2 production list, with a test that a broken `lessons/hsk2/x.yaml` is ignored under it; `sortErrors` replaced by `return { errors }` plus a local comparator for check-10 errors; S1 signatures (`deriveBacklinks` takes lesson values, `deriveHanViet` takes a Record); schemas.ts and C1 anchors refreshed; prettier fixture step. Confidence 95%, each cited line hand-checked on main.
- [tester CHAA-32, 2026-11-05] `importContent` on a missing directory returns a sha and writes an empty `ImportedContent` (`lintDir` treats an absent root as an empty set, CHY-9). Decision: not guarded here; the importer stays a pure function of what lint loads, and S3's CLI must reject a content path that does not exist before calling it. Confidence 80%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
(none — frontier empty; the check-10 and runner questions to CHAA-21 are cross-lane, not Loc's)

## Locked (do not re-open)
- ADR 0002: sha in every bundle URL; Postgres keeps `content_versions`. Loc: Postgres sink tests run on PGlite (S3).
