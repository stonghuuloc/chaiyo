# CHY-5 — Sync docs with the final prototype

Backlog: `backlog/tasks/chy-5 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-5.N`

## Goal (business why, 1-2 sentences)
Make the docs describe the approved prototype so nobody builds removed Từ điển or R1/R2 screens.

## Context an agent can't derive from code
- Prototype decisions: tab 3 = Luyện tập, no Dictionary search, one mixed session `p1-session.html`, memory per skill.
- CONTEXT.md lives at repo root; screens.md at `docs/screens.md`.

## Locked decisions (BA/Loc already ruled — never re-open)
- The prototype is the source of truth, not the docs.
- Screens with a brief but no prototype get a prototype (Loc 2026-10-30) → AC4, slice S1, before the docs sync.
- Screen codes stay (P1, X1…); new practice screens are K1 `p1-session`, K2 `p2-skill` (Loc 2026-10-30).
- `CONTEXT.md` keeps Dictionary as lookup source only, no search (Loc 2026-10-30).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | screens.md tabs + inventory match prototype files 1:1 | medium | S2 |
| AC2 | CONTEXT.md terms use per-skill memory + mixed session | medium | S2 |
| AC3 | No T3 Từ điển, R1, R2, Tra từ in either doc | medium | S2 |
| AC4 | P1 Landing, X1 Tra nhanh, M2 Mock Test runner, M3 mock result each have a prototype file | medium | S1 |

## Out of scope
- Rewriting other docs (NOTES.md, DESIGN.md, PRODUCT.md).
