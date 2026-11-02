# CHY-6 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-11-01] architecture.md:29 Catalog still lists search(query) + 'Supabase rows for Dictionary search' though CHY-5 removed the search screen — no CHY-6 AC covers it
- [2026-11-01] stack.html has no content -> Postgres import arrow although Q3 keeps a full Postgres mirror — no AC covers it
- [2026-11-01] architecture.md:29 still says 'on the CDN'; ADR says Vercel same origin (Vercel is a CDN) — no AC
- [2026-11-01] architecture.md:3 lists ADR 0002 under 'locked stack' though it is a delivery decision — wording nit, no AC
- [2026-11-01] stack.html eyebrow still reads 'ARCHITECTURE · ADR 0001' (now 2 ADRs) — outside SPEC, no AC
- [2026-11-01] Catalog interface (architecture.md:29) says every result carries contentSha; Dictionary rows define none — decide current import sha vs optional (CodeRabbit PR #17)
- [2026-11-01] SW cache.put not awaited (src/service-worker/index.ts:36) — real bug, no CHY-6 AC → backlog CHY-69
- [2026-11-02] docs/diagrams/content-classes.html:98 shows GrammarPoint 'std?' (optional) while content-schema.md:102 types std: number[] (required) — AC3 names the type and h1-g01, not the diagram
- [2026-11-02] content/grammar/h3-g01.yaml:4 std [130] is a level-2 GF item (data/sources/hsk30-grammar.csv) on a level-3 point — allowed (no item above the lesson level); h3-01 passes the lesson-level decision-2 lint because h3-g02 (#200) and h3-g03 (#205) carry level-3 items; no action
- [2026-11-02] content/lessons/hsk5/h5-01.yaml:39 lists 17 words, above lint 8's 8-15 bound — no CHY-6 AC
