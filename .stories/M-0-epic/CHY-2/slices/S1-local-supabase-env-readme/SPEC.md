# CHY-2 S1 — spec
ACs: AC1, AC2, AC4  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC1] `supabase start`, run in the repo root with Docker up and Mantica's 11 `supabase_*_Mantica` containers running, exits 0. Verified by: `echo $?` → 0 on the run.
- [AC1] The output prints the Project URL `http://127.0.0.1:56321`, a Publishable key line (`sb_publishable_…`) and the Studio URL `http://127.0.0.1:56323` (Q2: the Publishable line is AC1's "anon key"; the AC text predates CLI 2.101). Verified by: the captured output contains those 3 items; key value is not pasted into any file or report.
- [AC1] `supabase/config.toml` binds chaiyo to the 563xx block: api 56321, db 56322, shadow 56320, studio 56323, inbucket 56324, analytics 56327, pooler 56329 (Q1-A; the other 7 `port`-type lines are untouched: `inspector_port = 8083` stays, `smtp_port`/`pop3_port` stay commented). Verified by: `rg -n '^\s*\w*port\w* = ' supabase/config.toml` shows exactly those values and no 543xx/553xx.
- [AC1] Mantica is untouched: the same 11 `supabase_*_Mantica` container IDs are running before and after start, and Mantica's ports 54321/54322/54323/54324/54327 still answer. Verified by: `docker ps --filter name=_Mantica -q | sort` identical before/after (11 lines each); `lsof` shows the 5 ports still held by Mantica.
- [AC1] chaiyo's stack is separate: `docker ps --filter name=_chaiyo` lists ≥1 `supabase_*_chaiyo` container while started; no container outside `_chaiyo` is created, stopped or removed. Verified by: before/after container-ID diff = only `_chaiyo` additions.
- [AC1] Verify ends with `supabase stop` (chaiyo only, project-scoped by `project_id = "chaiyo"` at `config.toml:5`); it is part of verify so S1 leaves nothing running. Verified by: after stop, `docker ps --filter name=_chaiyo -q` is empty and the Mantica ID list is unchanged (11).
- [AC2] `.env.example` lists exactly these 6 keys: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (renamed from `…_ANON_KEY`, Q2-B), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. That set = (names `src/` reads = 0) ∪ (existing documented keys: the 2 Supabase + 4 R2 read by `scripts/assets_*.py`). Verified by: a `rg` of `PUBLIC_|\$env|import\.meta\.env|process\.env` over `src` + `vite.config.ts` → 0 hits, and `rg -o '^[A-Z0-9_]+(?==)' .env.example` → those 6 names.
- [AC2] `.env.example` holds no secret values: every `KEY=` line has an empty right-hand side. Verified by: `rg '^[A-Z0-9_]+=.+' .env.example` → 0 matches.
- [AC4] README `## Develop` lists, in order, local Supabase setup: (1) install the CLI (`brew install supabase/tap/supabase`), (2) have Docker running, (3) `supabase start`, (4) `cp .env.example .env`, (5) paste the printed Project URL into `PUBLIC_SUPABASE_URL` and the Publishable key into `PUBLIC_SUPABASE_PUBLISHABLE_KEY`; it also names the local ports (Studio 56323). Verified by: reading README `## Develop`: 5 steps present, commands copy-paste runnable, no Google step.
- [AC4] The README's old line ("fill in the Supabase project values", `README.md:25`) is replaced, not duplicated. Verified by: `rg -c 'Supabase project values' README.md` → 0.
- [AC4] CI is unchanged and green: `.github/workflows/ci.yml` not in the diff; `ci` conclusion `success` on the PR head. Verified by: `git diff --name-only main` contains no `.github/`; PR check list shows `ci` ✓.
- [LOCK] Auth providers = Google + email magic link, nothing else (STORY.md); S1 does not enable any.
- [LOCK] `supabase/config.toml` and `.env.example` already exist — audited and edited, not recreated (STORY.md).
- [CHORE] PR flow: work on branch `CHY-2` (exact ticket id); PR `CHY-2 <imperative description>` into protected `main`; required check `ci` green; CodeRabbit (`coderabbitai[bot]`) review comments addressed (fixed or answered) before merge; no direct push to `main`.
- [CHORE] Loc tasks for S1: none. The agent runs `supabase start`/`stop` itself and never touches Mantica containers.

## Not this slice
- AC3 → S2: Google OAuth client + credentials, enabling Google + magic link, `site_url` (`config.toml:154`, port 3000 vs dev 5173), hosted project, Google env placeholders and the README Google step (Q3; AC4's Gherkin mentions "set the Google credentials" — S2 extends the README).
- Learner tables, RLS, migrations, `seed.sql` → CHY-23. Login UI → CHY-26. `@supabase/*` dependency → first src reader (CHY-26).
- CI changes, Mantica config changes, hosted-project limits (2 projects, 500 MB, 1-week pause).

## Seam
`supabase/config.toml` (port lines), `.env.example`, `README.md` `## Develop`. Nothing in `src/` or `.github/`.

## Test contract
- [AC1] Record Mantica container IDs → `supabase start` → exit 0, output has Project URL 56321, Publishable key line, Studio URL 56323 → Mantica IDs unchanged → `supabase stop` → `_chaiyo` list empty, Mantica IDs still 11.
- [AC1] `rg` over `config.toml` port lines matches the 7-value 563xx block; no 543xx/553xx value left.
- [AC2] `rg` for env reads in `src/`+`vite.config.ts` → 0; extracted `.env.example` key names == the 6 listed; `rg '^[A-Z0-9_]+=.+'` → 0.
- [AC4] README `## Develop` read-through: 5 steps in order; `rg -c 'Supabase project values' README.md` → 0; a fresh clone following the steps reaches `supabase start` exit 0.
- [AC4] `git diff --name-only main` has no `.github/` path; PR `ci` check green; `coderabbitai[bot]` comments resolved.

## Open assumptions
- [AC1] Assumed unset `env(OPENAI_API_KEY)` / `env(S3_*)` (`config.toml:95,394-400`) do not make `start` fail (CLI only warns). Unproven until the run; if wrong, cost = ≤5 `env()` lines in `config.toml` get a literal/blank value. No Q-block: it is a fact the run settles, not a decision.
- [AC1] Assumed the first `start` pulls only images not already cached by Mantica's identical-version stack, so run time is minutes, not a blocker. If wrong, only wall time changes.
- [AC4] Assumed AC4's "set the Google credentials" is deferred to S2 per Q3 (Director ≥80% ruling in DISCUSSION.md). If wrong, cost = 2 empty env lines + 1 README step, and AC4 would not be fully met in S1.
