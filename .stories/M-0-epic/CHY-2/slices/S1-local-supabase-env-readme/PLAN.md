# CHY-2 S1 — plan
ACs: AC1, AC2, AC4  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-2

One branch `CHY-2` off `main`, one PR into protected `main`. `.stories/M-0-epic/CHY-2/` state files (uncommitted on `main` now: `STATE.md`, `state.json`, `slices/`) ride the PR via `git switch -c CHY-2` (working tree carries over).

## Anchors (verified 2026-10-27)
- `supabase/config.toml` port lines: `:10` api 54321 · `:29` db 54322 · `:31` shadow_port 54320 · `:41` pooler 54329 · `:91` studio 54323 · `:102` inbucket 54324 · `:385` analytics 54327. Untouched: `:376` `inspector_port = 8083` (0 listeners), `:104-105` smtp/pop3 commented. `:5` `project_id = "chaiyo"`.
- `.env.example:3` `PUBLIC_SUPABASE_ANON_KEY=` (empty); `:2` URL; `:5-8` R2 keys. `.gitignore:16-18` keeps only `.env.example`.
- `README.md:14-23` Develop pnpm block, `:25` `Node 22+ and pnpm. Copy `.env.example` to `.env` and fill in the Supabase project values.` (the line to replace).
- `.prettierignore:17` `/supabase/`, `:25` `/.stories/`; `eslint.config.js:13` ignores `supabase/`. README is prettier-checked (`.md` not ignored): drafts below follow `prettier.config.js` (tabs for code, `singleQuote`); run `pnpm exec prettier --check README.md .env.example`.
- `supabase` 2.101.0 `/opt/homebrew/bin/supabase`; Docker 28.5.2 up; 11 `supabase_*_Mantica` containers; Mantica holds 54321/22/23/24/27; `lsof`: a `dotnet` PID listens on 55323/55324, 563xx + 8083 free (checked in discuss).
- `git status` clean except CHY-2 story files; repo-local identity `43029756+stonghuuloc@users.noreply.github.com`; remote `git@stonghuuloc:stonghuuloc/chaiyo.git`; `main` HEAD 4fc08de.
- CI `ci.yml:1-26` untouched; protection (CHY-1 S2): PR required, 0 approvals, check `ci`, enforce_admins, CodeRabbit advisory.

## Task 1 [AC1] chaiyo own port block 563xx
File: `supabase/config.toml:10,29,31,41,91,102,385`.
- Change (line → value): `:10` `port = 56321` · `:29` `port = 56322` · `:31` `shadow_port = 56320` · `:41` `port = 56329` · `:91` `port = 56323` · `:102` `port = 56324` · `:385` `port = 56327`. Nothing else in the file.
- Test first (fails now): `rg -n '^\s*(shadow_)?port = 563(2[0-9])' supabase/config.toml | wc -l` → 0 (7 expected).
- Verify: same → `7`; `rg -n '^\s*\w*port\w* = ' supabase/config.toml` shows only 56320/56321/56322/56323/56324/56327/56329 plus `8083`; `rg -c '= 54[0-9]{3}$|= 55[0-9]{3}$' supabase/config.toml` → exit 1 (0 left).

## Task 2 [AC2] Rename the key to Publishable
File: `.env.example:3`.
- Change: `PUBLIC_SUPABASE_ANON_KEY=` → `PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (empty value). Update `:1` comment only if it names "anon" (it says "Settings → API"; leave).
- Test first (fails now): `rg -c 'PUBLISHABLE_KEY' .env.example` → rg exit 1.
- Verify: `rg -o '^[A-Z0-9_]+(?==)' -P .env.example | sort` → exactly `PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL, R2_ACCESS_KEY_ID, R2_ACCOUNT_ID, R2_BUCKET, R2_SECRET_ACCESS_KEY` (6); `rg '^[A-Z0-9_]+=.+' .env.example` → exit 1 (no values); `rg -c 'PUBLIC_|\$env|import\.meta\.env|process\.env' src vite.config.ts` → exit 1 (0 src readers); `rg -c 'ANON_KEY' .` over tracked non-story files → only this slice's docs. Do NOT print `.env`.

## Task 3 [AC4] README Develop: local Supabase setup
File: `README.md:25` (replace the single line; code block `:14-23` stays).
- Test first (fails now): `rg -c 'supabase start' README.md` → rg exit 1; `rg -c 'Supabase project values' README.md` → `1`.
- Change: replace `:25` with the draft below (unexecuted).
- Verify: `rg -c 'supabase start' README.md` ≥ 1; `rg -c 'Supabase project values' README.md` → exit 1 (0); `rg -n '^[1-5]\. ' README.md` → 5 numbered steps in order under `## Develop`; `rg -ci 'google' README.md` → no hit inside Develop; `pnpm exec prettier --check README.md` exit 0.

## Task 4 [AC1] Local proof: start, snapshot-diff, stop
No file edits. Run from repo root, only `supabase start` / `supabase stop`; other docker use = read-only `docker ps` / `lsof`.
- Test first (fails today): `supabase start` cannot bind 54321 while Mantica runs (Task 1 not applied) — skip running it; the failing check is Task 1's.
- Run: `docker ps --filter name=_Mantica -q | sort > /tmp/m-before.txt; wc -l < /tmp/m-before.txt` → `11`; `supabase start > /tmp/start.out 2>&1; echo "exit=$?"` → `exit=0`; `rg -n 'http://127.0.0.1:56321|sb_publishable_|http://127.0.0.1:56323' /tmp/start.out | cut -c1-60` → 3 hits (cut so the key value is never shown in full); `docker ps --filter name=_Mantica -q | sort | diff - /tmp/m-before.txt && echo same`; `docker ps --filter name=_chaiyo --format '{{.Names}}' | wc -l` ≥ 1; `lsof -nP -iTCP:54321 -sTCP:LISTEN | wc -l` ≥ 1 (Mantica still holds it); `git status --short supabase` → empty (the CLI's `.temp` must not show; if it does, report, do not hack).
- Stop: `supabase stop; echo "exit=$?"` → 0; `docker ps --filter name=_chaiyo -q | wc -l` → `0`; Mantica diff again → `same`, 11 IDs. Then `rm -f /tmp/m-before.txt /tmp/start.out`.
- If `start` fails on unset `env(OPENAI_API_KEY)` / `env(S3_*)` (`config.toml:95,394-400`): report the exact error, stop; that is the SPEC's open assumption, edit those lines only after reporting. If it fails binding a 563xx port: report which process holds it.

## Task 5 [AC1][AC2][AC4] Branch, commit, PR
Files: Tasks 1-3 + `.stories/M-0-epic/CHY-2/` (`STATE.md`, `state.json`, `slices/S1-*/DISCUSSION.md|SPEC.md|PLAN.md|…`).
- Change: `git switch -c CHY-2`; two signed commits (repo-local key, noreply email): `CHY-2 S1: local Supabase ports, publishable env key, README setup` (config.toml, .env.example, README.md) and `chore(story): CHY-2 S1 state` (`.stories/`); `git push -u origin CHY-2`; `gh pr create --repo stonghuuloc/chaiyo --base main --head CHY-2 --title "CHY-2 Local Supabase on own ports with env key and README setup" --body-file <body>` (body: `- [ ] S1 local Supabase + env + README (AC1, AC2, AC4)`, `- [ ] S2 auth providers local + hosted (AC3)`).
- Test first (fails now): `gh pr list --repo stonghuuloc/chaiyo --head CHY-2 --json number` → `[]`.
- Verify: `git log -2 --format='%G? %ae'` → both `G 43029756+stonghuuloc@users.noreply.github.com`; `git diff --name-only main | rg -c '^\.github/'` → exit 1; `gh pr view CHY-2 --repo stonghuuloc/chaiyo --json state,headRefName` → OPEN, `CHY-2`.

## Task 6 [AC4] `ci` green + CodeRabbit handled
- Verify: `gh pr checks CHY-2 --repo stonghuuloc/chaiyo --watch` → `ci` pass; `gh run list --repo stonghuuloc/chaiyo --branch CHY-2 --json event,conclusion` → `push` + `pull_request`, both `success`.
- CodeRabbit: wait up to ~5 min, then `gh api repos/stonghuuloc/chaiyo/pulls/<n>/reviews --jq '.[]|select(.user.login=="coderabbitai[bot]")|.state'` and `…/pulls/<n>/comments --jq '.[]|select(.user.login=="coderabbitai[bot]")|"\(.path):\(.line) \(.body[0:200])"'`. Each finding: correct and in-AC → fix on `CHY-2`, push, `ci` re-green; wrong/out-of-AC → reply with the evidence on the thread; never ignore silently. CodeRabbit is not a required check; a missing review after 5 min is reported, not a blocker.
- If `ci` red: read the failing step log, fix on `CHY-2`, push; never edit the spec to match.

## Task 7 [AC4] Merge; `ci` green on `main`
- Change: `gh pr merge CHY-2 --repo stonghuuloc/chaiyo --merge --delete-branch` (protection: allowed only with `ci` green).
- Verify: `git fetch && git rev-parse origin/main` = S; `gh api repos/stonghuuloc/chaiyo/commits/S/check-runs --jq '.check_runs[]|"\(.name) \(.conclusion) \(.head_sha)"'` → `ci success S` (poll `gh run watch`); `git switch main && git pull --ff-only && git branch -D CHY-2`; then `git ls-files supabase .env.example README.md` unchanged names, `rg -n '56321' supabase/config.toml` → 1 hit on `main`.

## Mutation paths covered
- Config consumers: only the CLI reads `config.toml`; no `src/`, CI or script reads a Supabase port (`rg -n '5432[0-9]' src scripts .github` → exit 1, run in Task 1 verify). Port edits are all 7 port keys the file defines; none can still collide with Mantica 543xx.
- Env consumers of the renamed key: none in `src/`; docs/README only (Task 2 verify `ANON_KEY` rg; also `rg -n 'ANON_KEY' README.md docs NOTES.md CONTEXT.md` → fix any hit in README only if it is a Develop step; other hits reported).
- Merge paths: PR only, `ci` required, no direct push to `main`.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk. A self-contradictory result must be reported, not hacked around)
README `:25` replacement:
```md
Node 22+ and pnpm. Local Supabase (Docker required):

1. Install the CLI: `brew install supabase/tap/supabase`
2. Start Docker.
3. `supabase start`. The first run pulls the images. chaiyo uses its own ports (API 56321, Studio http://127.0.0.1:56323), so it runs beside another local Supabase project. Stop it with `supabase stop`.
4. `cp .env.example .env`
5. Paste the printed Project URL into `PUBLIC_SUPABASE_URL` and the Publishable key into `PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
```
`.env.example:3`: `PUBLIC_SUPABASE_PUBLISHABLE_KEY=`.

## Rollback
Before merge: close the PR, `git push origin --delete CHY-2`. After: revert PR via a new `CHY-2` PR. Local: `supabase stop` leaves volumes; `supabase stop --no-backup` is not used. Mantica untouched throughout.
