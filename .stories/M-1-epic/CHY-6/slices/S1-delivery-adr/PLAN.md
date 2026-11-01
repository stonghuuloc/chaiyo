# CHY-6 S1 — plan
ACs: AC1, AC4  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-6 (off `main` @ 9e81b5c)

## Anchors (verified 2026-11-01)
- `docs/adr/0001-sveltekit-over-nuxt.md:1-21` — ADR shape: `# 0001 — …`, `Status: accepted (2026-10-19)`, `## Context`, `## Decision`, `## Consequences` (bullets).
- `docs/architecture.md:3` — "How the code is cut into modules on the locked stack (`docs/adr/0001-sveltekit-over-nuxt.md`, diagram `docs/diagrams/stack.html`). …"
- `docs/architecture.md:46-48` — `## Open question (changes Catalog's Source adapter)` + 1 paragraph; `:50` = `## Test surface` (stays).
- `docs/content-schema.md:7` — rule 1: "… An importer validates it and loads Postgres; Learners read it, never write it."
- `docs/content-schema.md:316-331` — `## Postgres` table list (unchanged; the ADR points at it for the mirror).
- `docs/diagrams/stack.html:39` — `<desc>` ending "; how content is bundled is still open."
- `docs/diagrams/stack.html:54-55` — `<!-- content -> vercel : open question -->` + `<line … stroke-width="1" stroke-dasharray="5,4" …>`.
- `docs/diagrams/stack.html:61-62` — label `<rect x="138" … width="76">` + `<text …>BUNDLE · TBD</text>`.
- `docs/diagrams/stack.html:191-197` — legend: `:192-193` dashed line + "open question (TBD)" text; `:194-195` "offline build" swatch at x=1084 / text x=1108.
- `stroke-dasharray="5,4"` appears only at `:55` and `:192` (`:110`, `:194` use `4,3` — not touched).
- `docs/content-schema.md:316-329` — the 7 tables a lesson open would read under rows: lessons, sentences, words, word_chars, chars, grammar_points, questions.
- Facts the ADR quotes: `prototype/data/h1-01.js` 2,024 B gzip; `dict.json` 4,233 entries / 228 KB gzip → 122k ≈ 6.6 MB gzip; `entries.json` avg 2,119 B raw; `PRODUCT.md:27` offline SRS; `PRODUCT.md:30` every hanzi tappable.

## Task 0 [CHORE] Branch
- `git switch -c CHY-6` from `main`; carry the uncommitted backlog edits (CHY-5 → Done, CHY-6 + 6.1/6.2) as the first commit `chore(backlog): CHY-5 done, CHY-6 slices (CHY-6)`.

## Task 1 [AC1] Write ADR 0002
File: `docs/adr/0002-lesson-content-as-static-bundles.md` (new; shape from `0001…md:1-21`)
- Test first: the [AC1] `ls` / `rg` lines of SPEC Test contract fail (file absent).
- Change: write the ADR from the draft below. Decision = one choice; Reasons = 4 numbered facts; "Postgres is still used for" = 3 items; Consequences = 4 bullets.
- Verify: `ls docs/adr` → 2 files; `rg -n "^Status: accepted|^## (Context|Decision|Consequences)" docs/adr/0002-*.md` → 4 hits.

## Task 2 [AC1] Reword content-schema rule 1
File: `docs/content-schema.md:7`
- Change: replace "An importer validates it and loads Postgres; Learners read it, never write it." with "An importer validates it and writes Postgres rows plus one JSON bundle per lesson (ADR 0002); Learners read the bundle, never write it."
- Verify: `rg -n "loads Postgres; Learners read it" docs/` → 0; `rg -n "ADR 0002" docs/content-schema.md` → 1 (`:7`).

## Task 3 [AC4] Replace the open question in architecture.md
File: `docs/architecture.md:46-48`, `:3`
- Change `:46-48` → `## Content delivery` + one line: "Decided in `docs/adr/0002-lesson-content-as-static-bundles.md`: one static JSON bundle per lesson, served by Vercel and cached by the service worker; Postgres keeps the Dictionary, Attempt foreign keys and an Admin mirror. The Catalog interface is the same either way."
- Change `:3` → "(`docs/adr/0001-sveltekit-over-nuxt.md`, `docs/adr/0002-lesson-content-as-static-bundles.md`, diagram …)".
- Verify: `rg -n "Open question" docs/architecture.md` → 0; `rg -c "0002-lesson-content-as-static-bundles" docs/architecture.md` → 2.

## Task 4 [AC4] Close the question in stack.html
File: `docs/diagrams/stack.html:39`, `:54-55`, `:61-62`, `:191-195`
- `:39` `<desc>`: "; how content is bundled is still open." → "; lesson content ships as a static JSON bundle per lesson from Vercel."
- `:54` comment → `<!-- content -> vercel : json bundle (ADR 0002) -->`; `:55` drop `stroke-dasharray="5,4"`, `stroke-width="1"` → `"1.2"` (matches the other solid arrows, e.g. `:58`).
- `:61-62` label text `BUNDLE · TBD` → `JSON BUNDLE` (11 chars, fits the 76-wide rect at 8px mono; keep rect).
- `:192-193` delete the legend line + "open question (TBD)" text; shift "offline build" swatch `x="1084"` → `x="900"` and its text `x="1108"` → `x="924"` so the legend has no hole.
- Verify: `rg -n "TBD|open question|still open" docs/diagrams/stack.html` → 0; `rg -c 'stroke-dasharray="5,4"' docs/diagrams/stack.html` → 0; open in agent-browser, screenshot, label `JSON BUNDLE` on the solid arrow, legend has no "open question" entry and "offline build" sits at x=900 with no hole.

## Task 5 [CHORE] Gate + commit
- `pnpm lint` raw (not under rtk; memory `rtk-hides-prettier-failure`) → exit 0.
- Run every SPEC Test contract line; paste results into SUMMARY.md.
- Commit `docs(adr): 0002 lesson content as static bundles; close architecture open question (CHY-6)`.

## Mutation paths covered
- Docs only, no write paths. The one "edit vs create" risk: `architecture.md:29` / `:27` already describe bundle + Postgres and stay unchanged; `:29`'s "Dictionary search" wording is parked, not edited.

## Draft ADR (UNEXECUTED — adapt to what's on disk; numbers must match Anchors)
```markdown
# 0002 — Lesson content as static JSON bundles

Status: accepted (2026-11-01)

## Context

Catalog needs one Source for lesson content. Two options: a static JSON bundle per lesson, or Postgres rows read through Supabase. SRS must work offline (`PRODUCT.md`), every hanzi is tappable for lookup, and content lives in git as YAML. Either option fits the same Catalog interface.

## Decision

Lesson content reaches the phone as **one static JSON bundle per lesson**, built by the importer in CI and served by Vercel with the app (same origin). The URL carries the import's `contentSha`; the service worker caches it. Postgres rows were not chosen for lesson delivery.

A lesson bundle holds the lesson, its sentences, questions and grammar points, the Word Page data of every word it teaches, and thin Dictionary entries (hanzi, pinyin, Hán Việt, meaning) for every word in its sentences' `seg` and each char of those words.

Reasons:
1. 0 database reads per lesson open, against reads over 7 content tables (lessons, sentences, words, word_chars, chars, grammar_points, questions).
2. Offline reopen comes from the service worker; rows would need a second cache in IndexedDB.
3. A new `contentSha` is a new URL, so old caches expire with no invalidation code.
4. Bài 1 is about 2.0 KB gzip, so re-downloading all 40 HSK1 lessons after an import is cheap.

Postgres is still used for:
- the Dictionary (about 122k entries, ≈ 6.6 MB gzip — too big to bundle), for Dictionary search/lookup (X1) outside lesson text;
- `questions` and `content_versions` rows, which Attempts reference by `question_id` and `content_sha`;
- a full mirror of the content tables in `docs/content-schema.md`, so Admin screens read sentence text and per-lesson fail rates with SQL.

## Consequences

- A content fix ships as commit → CI import → Vercel deploy; there is no content-only release.
- The importer has two real sinks: the bundle and Postgres.
- Offline, tap-to-lookup works for every hanzi in an opened lesson; outside lesson text it needs the network.
- A Word Page for a word from a lesson the Learner has not opened needs the network.
```

## Rollback
`git revert` of the slice commits; docs only, no migration, no data.
