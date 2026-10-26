# CHY-1 — Git repo + CI checks

Backlog: `backlog/tasks/chy-1 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-1.N`

## Goal (business why, 1-2 sentences)
Put chaiyo under git and run the existing pnpm scripts in CI so every push and PR is checked.

## Context an agent can't derive from code
- Folder has no `.git` today; `.gitignore` already exists — verify it, don't assume.
- No GitHub remote exists yet; creating it is an outward action Loc must name.

## Locked decisions (BA/Loc already ruled — never re-open)
- CI runs exactly `pnpm check`, `lint`, `test`, `build` on push + PR.
- Repo is public; generated PNG + mp3 live on R2, not git (Loc, 2026-10-26).
- Personal GitHub only: stonghuuloc, remote via ssh alias stonghuuloc, noreply author email, signed with ~/.ssh/id_ed25519 — never the CoverGo work account/key (Loc, 2026-10-26).
- Repo private until the end of S2 (after S3) (Loc, 2026-10-26).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Repo initialised: 1 commit, clean status, no ignored paths | high | S1 |
| AC2 | node_modules, .env, paraglide, .svelte-kit never show in status | high | S1 |
| AC3 | GitHub Actions runs check/lint/test/build on push and PR | high | S2 |
| AC4 | CI green on main with a green check | high | S2 |
| AC5 | CodeRabbit (free, public repo) reviews every PR | high | S2 |
| AC6 | Ignored PNG + mp3 uploaded to R2; pull script restores them | high | S3 |
| AC7 | No retired cast name in committed files | high | S1 |

## Out of scope
- Deploy (Vercel) pipeline.
- New scripts beyond the four existing ones.
