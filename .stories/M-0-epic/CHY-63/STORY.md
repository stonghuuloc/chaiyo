# CHY-63 — Vercel deploy (preview + production)

Backlog: `backlog/tasks/chy-63 - *.md` · Milestone m-0 Foundations · slice ↔ Backlog sub-task `CHY-63.N`

## Goal (business why, 1-2 sentences)
Production on main and a preview per PR on Vercel, so hosted Supabase auth has a real production site_url and every PR can be previewed.

## Context an agent can't derive from code
- Vercel project `chaiyo` (scope `stonghuulocs-projects`), linked to GitHub during CHY-2 S2. AC1–3 need verifying, not building.
- Hosted Supabase auth is code in `supabase/config.toml` `[remotes.hosted]`. Push ONLY via `pnpm supabase:push <ref>` (dry run first, `echo n | …`). Never `supabase config push`.
- Preview URL shapes: branch alias `https://chaiyo-git-<branch>-stonghuulocs-projects.vercel.app` (seen: `chaiyo-git-chy-2-…`); per-deploy `https://chaiyo-<hash>-stonghuulocs-projects.vercel.app`.

## Locked decisions (BA/Loc already ruled — never re-open)
- Hosted site_url = `https://chaiyo.vercel.app` (CHY-2 S2 Q4).
- Q4-A: previews stay behind Vercel deployment protection; AC6 preview leg proven via /authorize redirect, learner sign-in scoped.

## Facts (read-only, 2026-10-28)
| AC | Now | Evidence |
|----|-----|----------|
| AC1 | true | commit status `Vercel success` on `02f2192`, `a903634`; `vercel ls` Production deploys Ready; `https://chaiyo.vercel.app` 200 (CHY-2) |
| AC2 | true | `vercel[bot]` comment with preview alias on PR #6, #7; `vercel ls` Preview deploys Ready |
| AC3 | true | `vite.config.ts:4` imports `@sveltejs/adapter-vercel`, `:16` `adapter()`; `package.json:26` `^7.0.0`; all Vercel builds Ready |
| AC4 | MISSING | `vercel env ls` → "No Environment Variables found"; `.env.example:2-3` has both keys; `src/` reads no `PUBLIC_*` yet |
| AC5 | MISSING | README only names Vercel in the stack line and `pnpm build # Vercel adapter output` (`README.md:22`); no Deploy section |
| AC6 | partial | `config.toml:350-351`: site_url = prod ✓; redirects = prod root + localhost ×2; no preview pattern |
| AC7 | partial | commit `64e92a9` wires `injectSpeedInsights()` (`src/routes/+layout.ts:1-3`); Vercel project API `speedInsights.hasData: false` |

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | main push deploys to production, URL returns 200 | high | S1 |
| AC2 | PR gets a preview deployment URL | high | S1 |
| AC3 | build uses adapter-vercel, finishes with no errors | high | S1 |
| AC4 | PUBLIC_SUPABASE_* set in Vercel production, no repo secrets | high | S1 |
| AC5 | README Develop/Deploy documents the Vercel deploy | high | S1 |
| AC6 | hosted site_url + redirects cover prod and preview URLs | high | S2 |
| AC7 | Speed Insights installed, reports data from production | med | S1 |

## Out of scope
- Custom domain.
- Login screen UI (CHY-26); Supabase client in `src/`.
