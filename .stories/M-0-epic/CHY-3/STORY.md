# CHY-3 — App shell + tab bar

Backlog: `backlog/tasks/chy-3 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-3.N`

## Goal (business why, 1-2 sentences)
Four-tab app shell that shows the tab bar only on tab roots, so learners navigate tabs and focus inside lessons.

## Context an agent can't derive from code
- Visual + motion source of truth: `prototype/tabs.js` + `prototype/roots.css`.
- AC5 needs a session → depends on CHY-2 auth (queue runs CHY-2 first).
- AC4 names its own check: "on a real phone".

## Locked decisions (BA/Loc already ruled — never re-open)
- SPA app routes, `ssr=false`, behind auth.
- Tabs: Hôm nay · Lộ trình · Luyện tập · Tôi.
- All identifiers English (URLs, files, code); Vietnamese only in display text (Loc, 2026-10-29).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Each of 4 tab roots renders with its tab selected | high | S1 |
| AC2 | No tab bar on pushed screens | high | S1 |
| AC3 | Bar frosted, fixed, safe-area padded | high | S2 |
| AC4 | Tab select crossfades line→fill icon like prototype | high | S2 |
| AC5 | Unauthenticated app route redirects to login | high | S1 |
| AC6 | Offline + expired token stays in app, no login redirect | high | S1 |

## Out of scope
- Tab root content (later milestones).
- Login screen itself (CHY-26).
