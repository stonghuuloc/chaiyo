# CHY-6 S1 — spec
ACs: AC1, AC4  ·  Repo: chaiyo (`docs/adr/`, `docs/architecture.md`, `docs/content-schema.md`, `docs/diagrams/stack.html`)  ·  rev 1

## Behaviour
- [AC1] New `docs/adr/0002-lesson-content-as-static-bundles.md`, same shape as 0001: `# 0002 — <title>`, `Status: accepted (2026-11-01)`, `## Context`, `## Decision`, `## Consequences`.
- [AC1] Decision states **one** choice: lesson content reaches the phone as a static JSON bundle per lesson, served by Vercel from the app build (same origin), URL versioned by the import's `contentSha`, cached by the service worker. Postgres rows through Supabase is named as the option not chosen for lesson delivery. (DISCUSSION Q1, Q2)
- [AC1] Each lesson bundle carries: the lesson, its sentences, questions, grammar points, the full Word Page data (W1) of every word the lesson teaches, and thin Dictionary entries (hanzi, pinyin, Hán Việt, meaning) for every `seg` word of its sentences plus each char of those words. (Q4, Q6, Answered here)
- [AC1] Reasons listed (≥3, each with its number): 0 DB reads per lesson open vs reads over 7 content tables (`content-schema.md:316-329`: lessons, sentences, words, word_chars, chars, grammar_points, questions); offline reopen from the service worker with no second cache layer (`PRODUCT.md:27`); new `contentSha` = new URL, old cache expires with no invalidation code; Bài 1 ≈ 2.0 KB gzip, so a full re-download of 40 HSK1 lessons per import is cheap.
- [AC1] Names what Postgres is still used for: the 122k Dictionary (≈ 6.6 MB gzip, too big to bundle) for Dictionary search/lookup (X1) outside lesson text; `questions` + `content_versions` rows that Attempts reference (`question_id`, `content_sha`); and a full mirror of every content table in `content-schema.md` "Postgres" so Admin (A1 sentence text, A2 fail rate per lesson) stays SQL. (Q3)
- [AC1] Consequences name: content fixes ship as commit → CI import → Vercel deploy (no content-only release); the importer has two real sinks (bundle + Postgres); offline X1 works for every hanzi in an opened lesson's text and fails only outside it; Word Pages of words from unopened lessons need the network.
- [AC1] `content-schema.md:7` rule 1 reads: content lives in git as YAML, never edited in the app; the importer validates it and writes Postgres rows plus one JSON bundle per lesson (ADR 0002); Learners read the bundle, never write. (Q5)
- [AC4] `architecture.md` "## Open question (changes Catalog's Source adapter)" (`:46-48`) is gone; in its place one line points to `docs/adr/0002-lesson-content-as-static-bundles.md` and states the choice in ≤1 sentence and keeps "the Catalog interface is the same either way".
- [AC4] `architecture.md:3` lists ADR 0002 next to ADR 0001 as part of the locked stack.
- [AC4] `docs/diagrams/stack.html` no longer shows the question as open: the content → Vercel arrow is solid, its label reads `JSON BUNDLE` (not `BUNDLE · TBD`), its comment says `content -> vercel : json bundle (ADR 0002)`, the legend's "open question (TBD)" entry is removed (it was the only dashed arrow), and the `<desc>` (`:39`) ends "lesson content ships as a static JSON bundle per lesson from Vercel" instead of "how content is bundled is still open".

## Not this slice
- AC2, AC3 (content-schema open decisions 1–2) → S2.
- Catalog `search(query)` and "Supabase rows for Dictionary search" wording at `architecture.md:29` (no search screen since CHY-5) → parked, not an AC of CHY-6.
- A content → Postgres arrow in `stack.html` → parked.
- Building the bundle, sinks, service worker or Catalog (CHY-8, CHY-13, app tickets).

## Seam
`docs/adr/0002-*.md` (new) + 4 edits: `architecture.md:3`, `:46-48`, `content-schema.md:7`, `stack.html` arrow + label + legend + `<desc>`.

## Test contract
- [AC1] `ls docs/adr` → `0001-sveltekit-over-nuxt.md`, `0002-lesson-content-as-static-bundles.md`; 0002 has `Status: accepted`, `## Context`, `## Decision`, `## Consequences`.
- [AC1] read-through of 0002: exactly one choice in Decision; ≥3 numbered-fact reasons; a "Postgres is still used for" list naming Dictionary search/lookup (X1), Attempt FKs (`question_id`, `content_sha`) and the Admin mirror.
- [AC1] `rg -n "loads Postgres; Learners read it" docs/` → 0 hits; `rg -n "ADR 0002" docs/content-schema.md` → 1 hit on rule 1.
- [AC4] `rg -n "Open question" docs/architecture.md` → 0 hits; `rg -n "0002-lesson-content-as-static-bundles" docs/architecture.md` → ≥2 hits (`:3` and the pointer).
- [AC4] `rg -n "TBD|open question|still open" docs/diagrams/stack.html` → 0 hits; `rg -c 'stroke-dasharray="5,4"' docs/diagrams/stack.html` → 0; the diagram renders in a browser with the `JSON BUNDLE` label on the arrow (screenshot).
- [CHORE] `pnpm lint` exits 0 (run raw, not under rtk); `docs/` and `*.md` are prettierignored, so this only proves nothing else broke.

## Open assumptions
- [AC4] `stack.html` counted under AC4: `architecture.md:3` links it as the stack diagram, so leaving `BUNDLE · TBD` keeps the question visibly open. Cost if wrong: drop 1 task (3 SVG edits), no other change.
- [AC1] ADR file slug `lesson-content-as-static-bundles`; a different slug costs one rename + 2 links.
