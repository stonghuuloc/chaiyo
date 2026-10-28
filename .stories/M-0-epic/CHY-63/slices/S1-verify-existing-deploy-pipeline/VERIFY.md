# CHY-63 S1 — verify
Re-run 2026-10-28 on PR #8 head `663df1c`, AC1/AC7 re-checked after the merge (`bfd6976`); nothing copied from SUMMARY.md. Q4-A: previews stay behind Vercel deployment protection.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Merge commits on main `02f2192` and `a903634`: Vercel status `success` on both. `vercel ls`: Production deploys `Ready` (24 s, 40 s). `curl https://chaiyo.vercel.app` → **200**. PR #8 merge commit `bfd6976` on main: Vercel status `success`, `ci` completed success, `curl https://chaiyo.vercel.app` → **200** (2026-10-28 after merge). |
| AC2 | ✅ | PR #8 `vercel[bot]` comment holds `https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app`. Plain `curl` → **302** (Vercel SSO, protection on per Q4-A); `vercel curl` with the bypass token → **200**. |
| AC3 | ✅ | Fresh `pnpm build` exit 0, prints `Using @sveltejs/adapter-vercel` and `✔ done`. Vercel status on PR head `663df1c`: `success`. `vite.config.ts:4,16`. |
| AC4 | ✅ | `vercel env ls`: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, each `Production, Preview`, Config, none in Development. `env pull` production: host = `ogczuwtlyetsugahwhui.supabase.co` ✓; `GET /auth/v1/settings` with the key → **200**; preview env pull holds both names. Repo: 0 `.env` paths in the diff, `.env.example` has 0 valued `PUBLIC_SUPABASE*` lines, 0 added lines with a key-shaped string (the one lockfile hit is a pre-existing sha512 integrity). |
| AC5 | ✅ | `README.md:35` `## Deploy` (13 lines). Claims checked: scope `stonghuulocs-projects` ✓ (`vercel ls`), `https://chaiyo.vercel.app` 200 ✓, alias shape = the PR #8 comment URL ✓, both env names ✓ (`vercel env ls`), `adapter-vercel` ✓ (`vite.config.ts:4`). |
| AC7 | ✅ | Production real-browser visit: `GET /_vercel/speed-insights/script.js` → 200 and `POST /_vercel/speed-insights/vitals` → 200 (headless, SW unregistered, cache off, forced `visibilitychange`+`pagehide`); Vercel project API `speedInsights.hasData` → **true** (2026-10-28). 0 JS errors. |

### AC7 — closed: production reports data

Earlier `hasData: false` was ingest lag plus too few events: the SDK was healthy (script 200, vitals POST 200 from production with the service worker cleared). After Loc's real-browser visit and this POST, `hasData` flipped to true. The brief empty/`forbidden` API responses during polling were an expired CLI token (refreshed by `vercel whoami`), not a data problem.

## Residual risk
- AC1: none; proven on the PR #8 merge commit.
- AC2: learner-facing preview access is not provided; previews need a Vercel login (Q4-A). S2 carries the preview-leg proof for AC6.
- AC7: no per-route reporting (no `setRoute`); the vitals group by URL.
