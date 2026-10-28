# CHY-63 S1 — spec
ACs: AC1, AC2, AC3, AC4, AC5, AC7  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC1] After the CHY-63 PR merges to `main`, the merge SHA carries commit status `Vercel: success`, `vercel ls` lists a new Production deploy `Ready`, and `curl -s -o /dev/null -w '%{http_code}' https://chaiyo.vercel.app` prints `200`. Verified by: those three outputs on the CHY-63 merge SHA (the 2 earlier merges `02f2192`, `a903634` are precedent, not proof).
- [AC2] The CHY-63 PR gets a `vercel[bot]` comment holding a preview URL, and that URL returns 200. Verified by: `gh api repos/stonghuuloc/chaiyo/issues/<pr>/comments` shows the bot comment; `curl` on its URL → 200.
- [AC3] `vite.config.ts` imports `@sveltejs/adapter-vercel` (`:4`) and passes `adapter()` (`:16`); `pnpm build` exits 0 and prints `Using @sveltejs/adapter-vercel`; the Vercel build of the PR head is `Ready`. Verified by: `pnpm build` exit code + `vercel ls` row for the PR head.
- [AC4] Vercel env `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist in exactly Production and Preview (Q1-B; Development unset), stored non-sensitive (the publishable key is public by design). `PUBLIC_SUPABASE_URL` host equals `ogczuwtlyetsugahwhui.supabase.co`. Verified by: `vercel env ls` shows 2 names × {Production, Preview} = 4 entries and no Development entry.
- [AC4] The key belongs to the hosted project: `GET https://ogczuwtlyetsugahwhui.supabase.co/auth/v1/settings` with the key as `apikey` returns 200 (Q2-B). Verified by: the status code and the host comparison; the key value is never printed or logged.
- [AC4] The repo holds no secret value: `.env.example:2-3` keeps empty right-hand sides, no `.env` path is in the diff. Verified by: `rg -n '^PUBLIC_SUPABASE[A-Z_]*=.' .env.example` → 0 matches; `git diff main --name-only | rg '(^|/)\.env$'` → 0.
- [AC5] `README.md` has a `## Deploy` section (before `## Generated files`) that states: Vercel project `chaiyo` under scope `stonghuulocs-projects`; main → Production, every PR → Preview; the two `PUBLIC_SUPABASE_*` names set for Production + Preview with the hosted URL; the preview URL shapes; `adapter-vercel` in `vite.config.ts`; Speed Insights via `injectSpeedInsights()` in `src/routes/+layout.ts`, enabled under Project → Speed Insights. Verified by: `rg -n '^## Deploy' README.md` → 1; `rg -c -i 'adapter-vercel|PUBLIC_SUPABASE_URL|speed insights' README.md` ≥ 3; `pnpm exec prettier --check README.md` exit 0.
- [AC7] `@vercel/speed-insights` is a dependency (`package.json`) and `src/routes/+layout.ts` calls `injectSpeedInsights()` from `@vercel/speed-insights/sveltekit` (commit `64e92a9`). Verified by: `.vercel/output/static/_app/immutable/nodes/0.*.js` contains `_vercel/speed-insights/script.js` after `pnpm build`.
- [AC7] Production reports data: after the merge deploys and `https://chaiyo.vercel.app` is visited once, the Vercel project API shows `speedInsights.hasData: true` (today `false`). Verified by: `GET https://api.vercel.com/v9/projects/prj_m3f49CtcHEusPIy4lzPqWtTT5LSu` → `hasData` true.
- [NFR] No secret value is printed, logged or committed: evidence shows names, host and status codes only; `supabase/.env` and root `.env` are never read into output. Verified by: `git diff main` has no key-shaped string (`rg -n 'sb_publishable_|eyJ' $(git diff main --name-only)` → 0).
- [CHORE] Branch `CHY-63` off `main`; PR title `CHY-63 <imperative description>`; required check `ci` green; no push to `main`. The story-state files and backlog files ride this PR.

### Outward actions (Loc approves, agent runs or asks)
- [AC4] `vercel env add PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production + Preview (writes to Loc's Vercel project; 4 entries).
- [AC7] None to enable: Speed Insights is already on in the dashboard (`speedInsights.id` set). Only a production visit is needed.

## Not this slice
- AC6: hosted `additional_redirect_urls` preview pattern and sign-in return → S2.
- Custom domain; Supabase client in `src/`; login UI (CHY-26).

## Seam
`README.md` (new `## Deploy`), Vercel project env (outward), plus evidence collection. Code is already in `64e92a9`: `src/routes/+layout.ts`, `package.json`, `pnpm-lock.yaml`.

## Test contract
- [AC1] `vercel ls` + commit status + `curl` 200 on the merge SHA.
- [AC2] PR comment from `vercel[bot]`; `curl` on the preview URL → 200.
- [AC3] `pnpm build` exit 0 with the adapter line; Vercel build of PR head `Ready`.
- [AC4] `vercel env ls` = 4 entries; `/auth/v1/settings` with the key → 200; `.env.example` greps → 0 values.
- [AC5] README greps and `prettier --check` as in Behaviour.
- [AC7] bundle grep finds `script.js`; `hasData` is `true` after one production visit.

## Open assumptions
- [AC7] `hasData` flips within minutes of a production visit. If it does not after 2 visits, AC7 stays ⚠️ in verify and S1 is not `done`; the code needs no change (DISCUSSION Q3-A).
