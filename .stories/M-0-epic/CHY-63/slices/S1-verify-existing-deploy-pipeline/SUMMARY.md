# CHY-63 S1 — summary
ACs: AC1, AC2, AC3, AC4, AC5, AC7  ·  Commits: 64e92a9, 205f8bc, 6b565fb  ·  PR: pending

## Shipped
- [AC7] `src/routes/+layout.ts:1-3` `injectSpeedInsights()`; `package.json:52` `@vercel/speed-insights ^2.0.0` (64e92a9). Bundle holds `_vercel/speed-insights/script.js` ✓. `hasData` check waits for the production deploy (Task 7).
- [AC5] `README.md:35-46` new `## Deploy` section (205f8bc). prettier ✓; 4 content hits ✓.
- [AC4] Vercel env `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` set for Production + Preview, Config type, no Development (Q1-B). `env pull` host = `ogczuwtlyetsugahwhui.supabase.co` ✓; `/auth/v1/settings` with the key → HTTP 200 ✓ (Q2-B). No value in the repo.
- [AC3] `vite.config.ts:4,16`; `pnpm build` exit 0, adapter line printed.
- [AC2] Preview proof waits for the PR (Task 5). [AC1] Production proof waits for the merge (Task 6).

## Deviated from plan
- Task 1 changed after pre-push review (6b565fb): `@vercel/speed-insights/sveltekit` imports `$app/stores`, which Kit 3 removed, so it throws in the browser. `+layout.ts:1-5` now uses the generic `injectSpeedInsights({ framework: 'sveltekit' })` under `browser` from `$app/env` (Kit 3 name). Route is not reported per page (no `setRoute`).
- Both names added in one call each with `--environment production,preview` (the planned syntax worked). Temp pull file deleted.

## Not done / follow-up
- AC1 and AC7 `hasData` need the merge; AC6 is S2.

## Verification run
`pnpm check` 0 · `pnpm lint` 0 · `pnpm test` 0 (no test files, `--passWithNoTests`) · `pnpm build` 0
