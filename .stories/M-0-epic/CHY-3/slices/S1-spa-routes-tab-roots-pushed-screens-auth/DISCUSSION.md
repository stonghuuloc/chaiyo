# CHY-3 S1 — discussion
ACs: AC1, AC2, AC5

## Current behaviour (verified, with anchors)
- [AC1] `src/routes/` has only the Landing Page (`+page.svelte`, `+page.ts` prerender+ssr). No tab root routes exist.
- [AC1] `src/routes/+layout.ts:7` sets `ssr = false` for all app pages already (locked SPA decision is wired).
- [AC2] No pushed-screen routes exist. Lesson section, mixed practice, Gate Test, Word Page belong to CHY-32/42/36/32.
- [AC5] No Supabase JS client in `package.json`; no session code in `src/`. CHY-2 proved auth via config + CLI only.
- [AC5] No `/login` route. Login screen is CHY-26 (out of scope).

## Answered here (no human needed)
- [AC1] S1 ships a plain 4-link bar with `aria-current` on the selected tab; frost + crossfade are S2 (AC3, AC4).
- [AC1] Tab 3 = Luyện tập (STORY.md lock). `docs/screens.md:9` still says Từ điển — stale doc, CHY-5 syncs docs.
- [AC5] Return-to-target after login: no. CHY-26 AC "Login lands on Home or Welcome" decides the landing.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | tab root URLs | A — `/today` `/roadmap` `/practice` `/me` | Loc, 2026-10-29 |
| 1 | Q1 [AC1] | identifiers | all English (URLs, files, code); only display text is Vietnamese | Loc, 2026-10-29 |
| 1 | Q2 [AC5] | guard source | A — real Supabase session via `@supabase/supabase-js`; signed out → `/login` empty shell | Loc, 2026-10-29 |
| 1 | Q3 [AC2] | pushed screens | A — 4 empty routes at final English URLs + generic case | Loc, 2026-10-29 |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- SPA app routes, `ssr=false`, behind auth.
- Tabs: Hôm nay · Lộ trình · Luyện tập · Tôi.
- All identifiers English; Vietnamese only in display text (Loc, 2026-10-29).
