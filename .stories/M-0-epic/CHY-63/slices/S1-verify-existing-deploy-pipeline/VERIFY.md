# CHY-63 S1 — verify
Re-run 2026-10-28 on PR #8 head `663df1c`, AC1/AC7 re-checked after the merge (`bfd6976`); nothing copied from SUMMARY.md. Q4-A: previews stay behind Vercel deployment protection.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Merge commits on main `02f2192` and `a903634`: Vercel status `success` on both. `vercel ls`: Production deploys `Ready` (24 s, 40 s). `curl https://chaiyo.vercel.app` → **200**. PR #8 merge commit `bfd6976` on main: Vercel status `success`, `ci` completed success, `curl https://chaiyo.vercel.app` → **200** (2026-10-28 after merge). |
| AC2 | ✅ | PR #8 `vercel[bot]` comment holds `https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app`. Plain `curl` → **302** (Vercel SSO, protection on per Q4-A); `vercel curl` with the bypass token → **200**. |
| AC3 | ✅ | Fresh `pnpm build` exit 0, prints `Using @sveltejs/adapter-vercel` and `✔ done`. Vercel status on PR head `663df1c`: `success`. `vite.config.ts:4,16`. |
| AC4 | ✅ | `vercel env ls`: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, each `Production, Preview`, Config, none in Development. `env pull` production: host = `ogczuwtlyetsugahwhui.supabase.co` ✓; `GET /auth/v1/settings` with the key → **200**; preview env pull holds both names. Repo: 0 `.env` paths in the diff, `.env.example` has 0 valued `PUBLIC_SUPABASE*` lines, 0 added lines with a key-shaped string (the one lockfile hit is a pre-existing sha512 integrity). |
| AC5 | ✅ | `README.md:35` `## Deploy` (13 lines). Claims checked: scope `stonghuulocs-projects` ✓ (`vercel ls`), `https://chaiyo.vercel.app` 200 ✓, alias shape = the PR #8 comment URL ✓, both env names ✓ (`vercel env ls`), `adapter-vercel` ✓ (`vite.config.ts:4`). |
| AC7 | ⚠️ | Browser, service worker unregistered (1), cache disabled: `/` fires `GET /_vercel/speed-insights/script.js`, script tag injected, **0 JS errors / 0 pageerrors**; only non-2xx is that script's local 404. After the merge, production serves the new bundle (script request 200, 0 JS errors, 3 headless visits); `hasData` still **false** after ~12 min of polling. See Δ AC7. |

### Δ AC7 — the script loads from the build, but production has not reported data

**Setup** — `pnpm build` + `vite preview` on `localhost:4199`, headless Chrome, 2026-10-28; Vercel project `prj_m3f49CtcHEusPIy4lzPqWtTT5LSu`.

| | Proven now | AC7 says |
|---|---|---|
| script request fires on `/` | 1 request, tag injected | installed |
| JS errors on load | 0 | installed without breaking the app |
| Speed Insights enabled on the project | yes (`speedInsights.id` set) | installed |
| production serves the new bundle | yes: `GET /_vercel/speed-insights/script.js` → 200 on `chaiyo.vercel.app`, 0 JS errors | reports data from production |
| `speedInsights.hasData` | **false** | true |

**The ⚠️ is scoped:** install, the 200 script load and error-free pages are proven on production; "reports data" is not: 3 headless visits (one forcing `visibilitychange`/`pagehide`) sent no vitals request and `hasData` stayed false for ~12 min (gap: false → true). Headless Chrome may not emit vitals; a real-browser visit is untested.

**Answer: no decision needed.** Open `https://chaiyo.vercel.app` once in a real browser, then re-check `hasData`. Owner: Loc.

## Residual risk
- AC1: none; proven on the PR #8 merge commit.
- AC2: learner-facing preview access is not provided; previews need a Vercel login (Q4-A). S2 carries the preview-leg proof for AC6.
- AC7: no per-route reporting (no `setRoute`); the vitals group by URL.
