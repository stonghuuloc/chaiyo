# CHY-63 S1 — plan
ACs: AC1, AC2, AC3, AC4, AC5, AC7  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-63

Branch = story key; one PR for the story, S1 and S2 land as commits on it.

## Anchors (verified 2026-10-28)
- `vite.config.ts:4` imports `@sveltejs/adapter-vercel`; `:16` `adapter: adapter()`
- `package.json:52` `"@vercel/speed-insights": "^2.0.0"`
- `src/routes/+layout.ts:1-3` `injectSpeedInsights()` (commit `64e92a9`)
- `.env.example:2-3` the two `PUBLIC_SUPABASE_*` names, empty values
- `README.md:22` `pnpm build # Vercel adapter output`; `README.md:35` `## Generated files` (insert `## Deploy` above it)
- `.vercel/project.json:1` project `prj_m3f49CtcHEusPIy4lzPqWtTT5LSu`, name `chaiyo` (git-ignored, linked)
- Hosted ref `ogczuwtlyetsugahwhui` (`supabase/config.toml:347`)

## Task 1 [AC7] Speed Insights wiring (DONE in `64e92a9`)
File: `src/routes/+layout.ts:1`
- Change: none left. `package.json:52` + `pnpm-lock.yaml` already committed.
- Proof: `pnpm build && rg -l '_vercel/speed-insights/script.js' .vercel/output/static/_app/immutable/nodes` → ≥1 file.

## Task 2 [AC5] README `## Deploy` section
File: `README.md:35` (insert a new section above `## Generated files`)
- Change: add `## Deploy`: project + scope; main → Production, PR → Preview; the two names set for Production + Preview to the hosted URL (value source: Supabase dashboard Settings → API); preview URL shapes `https://chaiyo-git-<branch>-stonghuulocs-projects.vercel.app` and `https://chaiyo-<hash>-stonghuulocs-projects.vercel.app`; `adapter-vercel` at `vite.config.ts:4`; Speed Insights via `src/routes/+layout.ts`, switch on in Project → Speed Insights. No values, no keys.
- Test first: `rg -n '^## Deploy' README.md` → 0 now, 1 after.
- Verify: `rg -c -i 'adapter-vercel|PUBLIC_SUPABASE_URL|speed insights' README.md` ≥ 3; `pnpm exec prettier --check README.md`.

## Task 3 [AC4] Set Vercel env vars (OUTWARD — needs Loc's go)
File: `.env.example:2-3` (names only; unchanged)
- Change: after Loc approves, for each name run `vercel env add <NAME> --environment production,preview --no-sensitive` with the value piped on stdin (URL = `https://ogczuwtlyetsugahwhui.supabase.co`; key from `supabase projects api-keys --project-ref ogczuwtlyetsugahwhui`, never echoed). Development stays unset (Q1-B).
- Test first: `npx vercel@latest env ls` → "No Environment Variables found" now.
- Verify: `vercel env ls` lists 4 entries (2 names × Production, Preview), none Development; `vercel env pull` to a temp file, host = `ogczuwtlyetsugahwhui`, then delete the file; `curl -s -o /dev/null -w '%{http_code}' -H "apikey: $KEY" https://ogczuwtlyetsugahwhui.supabase.co/auth/v1/settings` → 200 (Q2-B).
- No-secret check: `rg -n '^PUBLIC_SUPABASE[A-Z_]*=.' .env.example` → 0; `git diff main --name-only | rg '(^|/)\.env$'` → 0.

## Task 4 [AC3] Prove the adapter build
File: `vite.config.ts:4`
- Change: none.
- Proof: `pnpm build 2>&1 | rg -n 'Using @sveltejs/adapter-vercel|✔ done'`, exit 0; then the Vercel build of the PR head is `Ready` (`npx vercel@latest ls | head`).

## Task 5 [AC2] Prove the preview on the CHY-63 PR
File: `.vercel/project.json:1`
- Change: none. Needs the PR open (push/PR is a separate go).
- Proof: `gh api repos/stonghuuloc/chaiyo/issues/<pr>/comments --jq '.[]|select(.user.login=="vercel[bot]")|.body' | rg -o 'https://chaiyo-git-[^ )"]*'` → 1 URL; `curl` on it → 200. `unset GH_TOKEN GITHUB_TOKEN` first.

## Task 6 [AC1] Prove production on the merge SHA
File: `.vercel/project.json:1`
- Change: none. After Loc merges the PR.
- Proof: `gh api repos/stonghuuloc/chaiyo/commits/<merge-sha>/status --jq .state` → `success`; `vercel ls` newest Production `Ready`; `curl -s -o /dev/null -w '%{http_code}' https://chaiyo.vercel.app` → `200`.

## Task 7 [AC7] Prove production reports data
File: `src/routes/+layout.ts:1`
- Change: none. After Task 6: open `https://chaiyo.vercel.app` once.
- Proof: Vercel API `GET /v9/projects/prj_m3f49CtcHEusPIy4lzPqWtTT5LSu` → `speedInsights.hasData` `true`; token from the CLI `auth.json`, only the boolean is printed.

## Mutation paths covered
- Env add: create path only. A wrong value is fixed with `--force` per environment; `vercel env ls` after each add.
- Preview env without `--git-branch` applies to all preview branches; Task 3 proves via 4 entries.

## Draft code (UNEXECUTED — adapt to what is on disk)
```sh
# Task 3, per name (value on stdin, nothing echoed)
printf %s "$VALUE" | npx vercel@latest env add PUBLIC_SUPABASE_URL --environment production,preview --no-sensitive
```
If `env add` still prompts or a self-contradictory result appears, report it; do not work around it.

## Order and outward gates
- 2 (README) → commit. 3 needs Loc's go. 5/6/7 need the PR pushed and merged (separate go).

## Rollback
README: `git revert` the commit. Env: `vercel env rm <NAME> production` / `preview`. Speed Insights: revert `64e92a9`.
