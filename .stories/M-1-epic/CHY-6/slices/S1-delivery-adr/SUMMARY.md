# CHY-6 S1 — summary
ACs: AC1, AC4  ·  Commits: 4ac220e (backlog chore), d7fad99 (docs)  ·  PR: pending  ·  Team mode: impl-S1 + test-S1

## Shipped
- [AC1] `docs/adr/0002-lesson-content-as-static-bundles.md` (new): one choice (static JSON bundle per lesson, Vercel, `contentSha` URL, service worker), 4 numbered reasons, "Postgres is still used for" Dictionary search/lookup (X1), `question_id`/`content_sha`, Admin mirror; 4 consequences.
- [AC1] `docs/content-schema.md:7` rule 1: importer writes Postgres rows plus one JSON bundle per lesson (ADR 0002); Learners read the bundle.
- [AC4] `docs/architecture.md:46-48` "Open question" → `## Content delivery` pointer to ADR 0002 (keeps "Catalog interface is the same either way"); `:3` lists ADR 0002.
- [AC4] `docs/diagrams/stack.html`: arrow solid, label `JSON BUNDLE`, comment cites ADR 0002, legend "open question (TBD)" entry removed, `<desc>` updated.

## Deviated from plan
- None (implementer and tester both report source matched plan anchors).

## Not done / follow-up
- Parked (no AC): `architecture.md:29` `search(query)` wording; content → Postgres arrow in `stack.html`; "on the CDN" vs Vercel wording; ADR 0002 under "locked stack"; `stack.html` eyebrow "ADR 0001".

## Verification run (tester, on d7fad99)
| Check | Result |
|---|---|
| `ls docs/adr` | 0001, 0002 ✓ |
| `rg "^Status: accepted\|^## (Context\|Decision\|Consequences)" docs/adr/0002-*.md` | 4 hits ✓ |
| `rg "loads Postgres; Learners read it" docs/` | 0 ✓ |
| `rg "ADR 0002" docs/content-schema.md` | 1 (`:7`) ✓ |
| `rg "Open question" docs/architecture.md` | 0 ✓ |
| `rg -c "0002-lesson-content-as-static-bundles" docs/architecture.md` | 2 ✓ |
| `rg "TBD\|open question\|still open" docs/diagrams/stack.html` | 0 ✓ |
| `rg -c 'stroke-dasharray="5,4"' docs/diagrams/stack.html` | 0 ✓ |
| stack.html screenshot (agent-browser) | solid arrow, `JSON BUNDLE`, no legend hole ✓ |
| `rtk proxy pnpm lint` | exit 0 ✓ |
