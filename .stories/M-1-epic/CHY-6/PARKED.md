# CHY-6 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-11-01] architecture.md:29 Catalog still lists search(query) + 'Supabase rows for Dictionary search' though CHY-5 removed the search screen — no CHY-6 AC covers it
- [2026-11-01] stack.html has no content -> Postgres import arrow although Q3 keeps a full Postgres mirror — no AC covers it
- [2026-11-01] architecture.md:29 still says 'on the CDN'; ADR says Vercel same origin (Vercel is a CDN) — no AC
- [2026-11-01] architecture.md:3 lists ADR 0002 under 'locked stack' though it is a delivery decision — wording nit, no AC
- [2026-11-01] stack.html eyebrow still reads 'ARCHITECTURE · ADR 0001' (now 2 ADRs) — outside SPEC, no AC
- [2026-11-01] Catalog interface (architecture.md:29) says every result carries contentSha; Dictionary rows define none — decide current import sha vs optional (CodeRabbit PR #17)
- [2026-11-01] SW cache.put not awaited (src/service-worker/index.ts:36) — real bug, no CHY-6 AC → backlog CHY-69
