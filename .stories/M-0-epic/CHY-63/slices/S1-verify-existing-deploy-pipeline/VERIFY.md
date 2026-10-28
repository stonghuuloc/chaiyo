# CHY-63 S1 — verify
Re-run 2026-10-28 on PR #8 head `663df1c`; nothing copied from SUMMARY.md. Q4-A: previews stay behind Vercel deployment protection.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Merge commits on main `02f2192` and `a903634`: Vercel status `success` on both. `vercel ls`: Production deploys `Ready` (24 s, 40 s). `curl https://chaiyo.vercel.app` → **200**. Scope: this proves push-to-main → production; PR #8's own merge is not yet proven (main is still `02f2192`). |
| AC2 | ✅ | PR #8 `vercel[bot]` comment holds `https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app`. Plain `curl` → **302** (Vercel SSO, protection on per Q4-A); `vercel curl` with the bypass token → **200**. |
| AC3 | ✅ | Fresh `pnpm build` exit 0, prints `Using @sveltejs/adapter-vercel` and `✔ done`. Vercel status on PR head `663df1c`: `success`. `vite.config.ts:4,16`. |
| AC4 | ✅ | `vercel env ls`: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, each `Production, Preview`, Config, none in Development. `env pull` production: host = `ogczuwtlyetsugahwhui.supabase.co` ✓; `GET /auth/v1/settings` with the key → **200**; preview env pull holds both names. Repo: 0 `.env` paths in the diff, `.env.example` has 0 valued `PUBLIC_SUPABASE*` lines, 0 added lines with a key-shaped string (the one lockfile hit is a pre-existing sha512 integrity). |
| AC5 | ✅ | `README.md:35` `## Deploy` (13 lines). Claims checked: scope `stonghuulocs-projects` ✓ (`vercel ls`), `https://chaiyo.vercel.app` 200 ✓, alias shape = the PR #8 comment URL ✓, both env names ✓ (`vercel env ls`), `adapter-vercel` ✓ (`vite.config.ts:4`). |
| AC7 | ⚠️ | Browser, service worker unregistered (1), cache disabled: `/` fires `GET /_vercel/speed-insights/script.js`, script tag injected, **0 JS errors / 0 pageerrors**; only non-2xx is that script's local 404. Production reports no data yet (`hasData: false`). See Δ AC7. |

### Δ AC7 — the script loads from the build, but production has not reported data

**Setup** — `pnpm build` + `vite preview` on `localhost:4199`, headless Chrome, 2026-10-28; Vercel project `prj_m3f49CtcHEusPIy4lzPqWtTT5LSu`.

| | Proven now | AC7 says |
|---|---|---|
| script request fires on `/` | 1 request, tag injected | installed |
| JS errors on load | 0 | installed without breaking the app |
| Speed Insights enabled on the project | yes (`speedInsights.id` set) | installed |
| production serves the new bundle | no: live `chaiyo.vercel.app` still serves a pre-PR #8 deploy | reports data from production |
| `speedInsights.hasData` | **false** | true |

**The ⚠️ is scoped:** install and error-free load are proven in a browser; "reports data from production" is not, and cannot be before PR #8 merges and `https://chaiyo.vercel.app` gets one visit (gap: `hasData` false → true).

**Answer: no decision needed.** After the merge, visit production once and re-check `hasData`. Owner: Loc (the merge).

## Residual risk
- AC1: PR #8's own merge deploy is unproven until it lands.
- AC2: learner-facing preview access is not provided; previews need a Vercel login (Q4-A). S2 carries the preview-leg proof for AC6.
- AC7: no per-route reporting (no `setRoute`); the vitals group by URL.
