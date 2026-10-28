# CHY-63 S1 — discussion
ACs: AC1, AC2, AC3, AC4, AC5, AC7

## Current behaviour (verified, with anchors)
- [AC1] `02f2192` and `a903634` both carry commit status `Vercel success`; `vercel ls` shows 3 Production deploys Ready (22–40 s builds).
- [AC2] `vercel[bot]` commented on PR #6 and #7; alias shape `https://chaiyo-git-chy-2-stonghuulocs-projects.vercel.app`; `vercel ls` shows 6 Preview deploys Ready.
- [AC3] `vite.config.ts:4` imports `@sveltejs/adapter-vercel`, `:16` calls `adapter()`; local `pnpm build` prints `Using @sveltejs/adapter-vercel`, exit 0.
- [AC4] TASK, not a question: `vercel env ls` on `stonghuulocs-projects/chaiyo` → "No Environment Variables found". `.env.example:2-3` lists both keys. Hosted ref = `ogczuwtlyetsugahwhui` (`config.toml:347`); local API = `http://127.0.0.1:56321` (`config.toml:10`).
- [AC4] `src/` has no `PUBLIC_*` / `$env` import and no Supabase client, so a deployed page cannot show the value today.
- [AC5] TASK: `README.md` has no Deploy section; Vercel appears in line 3 (stack) and line 22 (`pnpm build # Vercel adapter output`). Hosted push is documented at step 7 only.
- [AC7] Speed Insights: branch `CHY-63`, commit `64e92a9` adds `@vercel/speed-insights@2.0.0` + `injectSpeedInsights()` in `src/routes/+layout.ts:1-3`. `pnpm check/lint/test/build` exit 0 (test: no test files, `--passWithNoTests`). Build output `.vercel/output/static/_app/immutable/nodes/0.*.js` holds `_vercel/speed-insights/script.js`. Vercel project API: `speedInsights.id` set, `hasData: false` → enabled in dashboard, no data yet.
- [AC7] pnpm warns `unmet peer @sveltejs/kit "^1 || ^2": found 3.1.0`; build and bundle are unaffected.

## Answered here (no human needed)
- [AC1] Q: does a push to main deploy? A: yes — two merge SHAs with `Vercel success`; S1 verify re-curls `https://chaiyo.vercel.app` for 200.
- [AC2] Q: do PRs get a preview URL? A: yes — bot comment on #6 and #7.
- [AC3] Q: is adapter-vercel in use? A: yes — `vite.config.ts:4`.
- Protected main: no direct push; AC1 evidence for this story comes from the merge of the CHY-63 PR.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC4] | Vercel environments for `PUBLIC_SUPABASE_*` | B — Production + Preview, both `https://ogczuwtlyetsugahwhui.supabase.co`; no Development | Loc, 2026-10-28 |
| 1 | Q2 [AC4] | proof of "points at hosted" | B — `vercel env pull` compare + `GET <url>/auth/v1/settings` with the key → 200 | Loc, 2026-10-28 |
| 1 | Q3 [AC7] | Speed Insights | A — added as backlog CHY-63 AC7 and S1 | Loc, 2026-10-28 |

## Open — needs an answer before spec
None. Q1–Q3 answered 2026-10-28 (below); the frontier is empty.

## Answered here — Q1–Q3 keep their numbers
- Q1 [AC4] Which environments? B: Production + Preview (4 entries); Development unset (`.env` carries local).
- Q2 [AC4] How proven? B: compare host to `ogczuwtlyetsugahwhui` + live `/auth/v1/settings` 200 with the key; key never printed.
- Q3 [AC7] Speed Insights an AC? A: AC7 "Vercel Speed Insights is installed and reports data from production".

## Locked (do not re-open)
- Hosted site_url = `https://chaiyo.vercel.app` (CHY-2 S2 Q4).
