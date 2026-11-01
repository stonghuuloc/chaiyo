# CHY-6 — ADR: content delivery + schema open decisions

Backlog: `backlog/tasks/chy-6 - *.md` · Milestone m-1 Content pipeline · slice ↔ Backlog sub-task `CHY-6.N`

## Goal (business why, 1-2 sentences)
Decide in writing how lesson content reaches the phone and close the schema's open decisions, so Catalog's Source adapter and the content schema (CHY-7+) can be built.

## Context an agent can't derive from code
- `docs/architecture.md:46` design already recommends the bundle for lessons + Word Pages, Postgres for Dictionary search + Attempt FKs; "either answer fits the same Catalog interface".
- `docs/content-schema.md:350` open decision 2 already marked decided 2026-10-26 (own `h<L>-gNN` ids + `std` GF 0025-2021 items).
- Only ADR today: `docs/adr/0001-sveltekit-over-nuxt.md` (format to copy).

## Locked decisions (BA/Loc already ruled — never re-open)
- Grammar point ids = own `h<L>-gNN`; each point carries `std` GF 0025-2021 item numbers (2026-10-26, content-schema.md:350).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | ADR 0002 states one delivery choice, reasons, other option's uses | high | S1 |
| AC2 | Open decision 1 (single chars in compounds) decided; Bài 1 consistent | high | S2 |
| AC3 | Open decision 2 (grammar ids) decided; GrammarPoint + h1-g01 consistent | high | S2 |
| AC4 | architecture.md open question replaced by ADR pointer | high | S1 |

## Out of scope
- Open decisions 3 (Cast voice, waits on VoiceStudio spike) and 4 (MockSection, P2).
- Building the Source adapter or schemas (CHY-7+).
