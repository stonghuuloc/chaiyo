# CHY-2 — Supabase project + local dev

Backlog: `backlog/tasks/chy-2 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-2.N`

## Goal (business why, 1-2 sentences)
Local + hosted-dev Supabase with env wiring so learners can sign in with Google or an email magic link.

## Context an agent can't derive from code
- `supabase/config.toml` and `.env.example` already exist — audit, don't recreate.
- Hosted project + Google OAuth client need Loc's accounts (outward action).
- `supabase start` needs Docker running; Loc owns starting Docker.

## Locked decisions (BA/Loc already ruled — never re-open)
- Auth providers = Google + email magic link. Nothing else.

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | `supabase start` exits 0, prints API URL, anon key, Studio | high | S1 |
| AC2 | .env.example lists every env key src/ reads, no secrets | high | S1 |
| AC3 | Google + magic link enabled locally and on hosted project | high | S2 |
| AC4 | README Develop section lists Supabase setup steps | high | S1 |

## Out of scope
- Learner tables + RLS (CHY-23).
- Login screen UI (CHY-26).
