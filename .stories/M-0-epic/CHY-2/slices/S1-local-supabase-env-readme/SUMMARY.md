# CHY-2 S1 — summary
ACs: AC1, AC2, AC4  ·  Commits: 7ff4016 (code), story-state commits on CHY-2  ·  PR: #5

## Shipped
- [AC1] `supabase/config.toml` ports → 56320/56321/56322/56323/56324/56327/56329; `inspector_port = 8083` untouched. `rg -n '^\s*(shadow_)?port = 563(2[0-9])'` → 7 hits; only commented `smtp_port`/`pop3_port` keep 543xx.
- [AC2] `.env.example`: `PUBLIC_SUPABASE_ANON_KEY` → `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. 6 key names match spec; `rg '^[A-Z0-9_]+=.+'` → 0; `src` + `vite.config.ts` env readers → 0.
- [AC4] README `## Develop`: 5 numbered local-Supabase steps replace the "Supabase project values" line. `prettier --check README.md` → clean.
- [AC1] Local proof: `supabase start` → `exit=0`; output had Project URL `http://127.0.0.1:56321`, `sb_publishable_…` key line, Studio `http://127.0.0.1:56323`; 10 `_chaiyo` containers; port 56321 held. `supabase stop` → `exit=0`; 0 `_chaiyo` containers.

## Deviated from plan
- `[analytics] enabled = false` in chaiyo `config.toml` (line 384). Reason: with Mantica's stack plus covergo containers the Docker VM (7.75 GiB) was ~5 GiB used; logflare analytics was OOM-killed ("Killed" x4), vector went unhealthy, and `start` exited 1 three times (storage unhealthy twice, analytics/vector once). Loc approved.
- Added `supabase/.gitignore` (copied verbatim from Mantica: `.branches`, `.temp`, dotenvx files). `supabase/.temp/cli-latest` is already tracked and the CLI rewrites it on each run; restored it with `git checkout`, not committed, not untracked.
- Task 4 check changed: Mantica was stopped by Loc's decision (`supabase stop`, volumes kept) and not restarted; check was 0 `_Mantica` containers before start and after stop (0 / 0) instead of the 11-ID diff. Mantica `config.toml` analytics also set to false (uncommitted, in the Mantica repo).
- `prettier --check .env.example` has no parser; README only.

## Not done / follow-up
- AC3 → S2.
- `supabase/.temp/cli-latest` is tracked; untracking it is out of scope.

## Verification run
- `supabase start` exit=0, `supabase stop` exit=0 (see above).
- `git log -n 1` → `G 43029756+stonghuuloc@users.noreply.github.com`.
