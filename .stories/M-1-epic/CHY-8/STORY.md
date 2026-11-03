# CHY-8 — Importer: derive + sinks

## Goal (business why, 1-2 sentences)
One command turns the validated content YAML into consistent, versioned content: derived fields filled in, written all-or-nothing to a test store, per-lesson JSON bundles and Postgres. The app then only ever sees content that passed lint and carries one `contentSha`.

## Context an agent can't derive from code
- Derived-field rules: `docs/content-schema.md` "Derived at import"; Postgres tables listed under "Postgres". Delivery: ADR 0002 (one JSON bundle per lesson, Postgres keeps questions, content_versions, Dictionary and an Admin mirror).
- Input is CHY-7's `parseContent` / Zod schemas (on main). The lint API is CHY-9's contract C1; this story only calls it.
- `supabase/` has config only: no content-table migrations exist yet. The Dictionary source for `seg` is `prototype/data/dict.json` today.
- Sibling lanes consume this story's contracts: C2 importer API + derived fields (CHY-10, 11, 13), C3 bundle format (CHY-13), C5 audio manifest.

## Locked decisions (BA/Loc already ruled — never re-open)
- ADR 0002: one static JSON bundle per lesson; Dictionary stays in Postgres; importer has two real sinks (bundle, Postgres) plus the in-memory test sink.
- CHY-6 S2 (Loc, 2026-11-02): `std: []` = vocabulary pattern; a lesson lists single chars and compounds it teaches.
- Scope (Loc, 2026-11-03, 8.Q1 A): AC8 Hán Việt per word and AC9 `seg` + thin Dictionary entries are in this story, added to the 7 ticket ACs. Hán Việt reads `Char.readings` from `content/chars/` (CHY-10 authors Bài 1's).
- Slice order: S1 → S4 → S2 → S3, so every pure derive exists before the pipeline wires it into sinks.
- Postgres sink tests run on PGlite (Captain, 80% rule, 2026-11-03). Primer syllable Prompt gains `spoken?` (CHY-11 edits schemas.ts; audio key = `spoken ?? text`).
- Audio key is normal speed only, `sha256(hanzi|voice)`; slow play is the client at 0.5x (content-schema).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Any lint error writes nothing | high | S2 |
| AC2 | Re-running the same files is a no-op | high | S2 |
| AC3 | Each sink receives the same content | high | S3 |
| AC4 | Sandhi derives spoken pinyin | high | S1 |
| AC5 | Author spoken override wins | high | S1 |
| AC6 | Backlinks and gate coverage are derived | high | S1 |
| AC7 | Audio manifest is emitted | high | S3 |
| AC8 | Hán Việt derived per word [LOCK, Loc 8.Q1 A] | high | S1 |
| AC9 | `seg` + thin Dictionary entries derived [LOCK, Loc 8.Q1 A] | high | S4 |

## Out of scope
- The 9 lint checks (CHY-9), authoring content (CHY-10/11/12), font subset (CHY-13), audio rendering, loading the 122k Dictionary into Postgres, app-side Catalog.
