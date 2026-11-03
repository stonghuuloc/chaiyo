# CHY-7 — Content YAML layout + Zod schemas

## Goal (business why, 1-2 sentences)
Every content type in `docs/content-schema.md` gets a Zod schema, so malformed YAML is rejected with the exact file and field path before the importer (CHY-8+) writes anything.

## Context an agent can't derive from code
- Source of truth for types and folder layout: `docs/content-schema.md` (Files, Types) on main after CHY-6 (#18) and CHY-70 (#20).
- `scripts/check-lesson.py` is the existing Python contract linter for preview lessons; the 9 contract lint checks belong to CHY-9, not here.
- `zod` is not a dependency yet; `yaml` and `vitest` are.

## Locked decisions (BA/Loc already ruled — never re-open)
- CHY-6 S2 (Loc, 2026-11-02): grammar point `std: []` = vocabulary pattern, exempt from the exact-level check; `why?` is optional; a lesson lists both single chars and compounds it teaches (你 and 你好); chars listed = only chars the lesson teaches on its own.
- ADR 0002: one static JSON bundle per lesson; Dictionary stays in Postgres.
- Catalog (Loc, 2026-11-03): `contentSha` optional (bundle results only); `search(query)` → `entry(hanzi)`, no free-text search.
- Frame (Loc, 2026-11-03): one slice, AC1–4.

## AC index

| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | content/ folder layout matches the schema doc Files | high | S1 |
| AC2 | Each of 8 types has a Zod schema accepting valid YAML | high | S1 |
| AC3 | Invalid YAML returns typed errors with file + field path | high | S1 |
| AC4 | pnpm test has one valid + one invalid test per type | high | S1 |

## Out of scope
- Importer, contract lint checks (CHY-9), Postgres rows, bundle build, audio.
