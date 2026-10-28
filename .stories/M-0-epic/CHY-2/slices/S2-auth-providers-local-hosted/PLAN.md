# CHY-2 S2 — plan
ACs: AC3  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-2

One branch `CHY-2` off `main`, one PR into protected `main` (S1's branch and PR #5 are merged; `origin/CHY-2` still shows in `git branch -a` — Task 1 prunes it first). Story files uncommitted on `main` now (`STATE.md`, `state.json`, `epic.json`, `PARKED.md`, `slices/S1-*/VERIFY.md`, `slices/S2-*/`, `backlog/tasks/chy-63 …`) ride the branch via `git switch -c CHY-2`.

Order: Tasks 1-5 and 7 are local and need nothing from Loc. Task 8 is one blocking Loc checklist. Tasks 9+ (hosted) run only after it.

## Anchors (verified 2026-10-28, `main` @ e7d3163)
- `supabase/config.toml`: `:5` `project_id = "chaiyo"` · `:10` api 56321 · `:102` `[inbucket]` section = Mailpit on 56324 · `:150` `[auth]` · `:154` `site_url = "http://127.0.0.1:3000"` · `:158` `additional_redirect_urls = ["https://127.0.0.1:3000"]` · `:194` `email_sent = 2` · `:214-229` `[auth.email]` (`:221` `enable_confirmations = false`, `:227` otp_length 6, `:229` otp_expiry 3600) · `:232-240` smtp, all commented · `:242-244` commented `[auth.email.template.invite]` · `:317-330` `[auth.external.apple]` (`enabled = false`, `:328` skip_nonce_check false). No `[auth.external.google]`, no `[remotes.*]`, no `supabase/templates/`.
- `supabase/.env.example` absent. `.gitignore:16` `.env` (matches `supabase/.env`, confirmed by `git check-ignore -v`). `supabase/.gitignore` lists `.branches`, `.temp`. `git ls-files supabase` → `.gitignore`, `.temp/cli-latest`, `config.toml`.
- `README.md:14` `## Develop`; `:25` `Node 22+ and pnpm. Local Supabase (Docker required):`; `:27-31` steps 1-5; `:33` `## Generated files`.
- `package.json:6-21` scripts (last: `:20` `assets:pull`); `scripts/build-icons.sh:1-4` = bash style (`#!/usr/bin/env bash`, `set -euo pipefail`, `cd "$(dirname "$0")/.."`).
- `.prettierignore:17` `/supabase/`; `eslint.config.js:13` ignores `supabase/`. README and `package.json` are prettier-checked.
- `.github/workflows/ci.yml`: `ci` runs check, lint, test, build on push + PR; protection: PR required, `ci` required, CodeRabbit advisory. `gh` at `/opt/homebrew/bin/gh` (S1 used it; S1 `VERIFY.md` AC4 row cites `gh api …/check-runs`).
- `supabase config push --help`: "Pushes local config.toml to the linked project", flag `--project-ref`. `[remotes.<name>]` + `project_id` documented for branching only (supabase.com/docs/guides/deployment/branching/configuration).

## Task 1 [AC3][CHORE] Branch, prune, untrack `.temp`
File: `supabase/.temp/cli-latest` (tracked), `supabase/.gitignore:3`.
- Change: `git fetch --prune`; `git switch -c CHY-2`; `git rm --cached supabase/.temp/cli-latest` (file stays on disk).
- Test first (fails now): `git ls-files supabase | rg -c '\.temp'` → `1`.
- Verify: same → rg exit 1 (0); `git branch --show-current` → `CHY-2`; `git branch -a | rg -c 'origin/CHY-2$'` → report (0 after prune, else a stale remote ref to mention to Loc, not delete).

## Task 2 [AC3] Local auth config: site_url, redirects, Google, magic-link template
File: `supabase/config.toml:154,158`; insert after `:229`/`:244`; insert before `:317`.
- Change: `:154` `site_url = "http://127.0.0.1:5173"`; `:158` `additional_redirect_urls = ["http://127.0.0.1:5173", "http://localhost:5173"]`; add an uncommented `[auth.email.template.magic_link]` (`subject`, `content_path = "./supabase/templates/magic-link.html"`) after the commented invite block `:242-244`; add `[auth.external.google]` (`enabled = true`, `client_id`/`secret` as `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)` / `…_SECRET`, `skip_nonce_check = false`) before `:317`. Apple stays disabled; `[auth.email.smtp]` stays commented.
- Test first (fails now): `rg -c '5173' supabase/config.toml` → rg exit 1; `rg -c '^\[auth.external.google\]' supabase/config.toml` → exit 1; `rg -c '^\[auth.email.template.magic_link\]' supabase/config.toml` → exit 1.
- Verify: `rg -n '^(site_url|additional_redirect_urls)' supabase/config.toml` → the two 5173 lines, no `3000`; `rg -n -A4 '^\[auth.external.google\]' supabase/config.toml` → the 2 `env()` refs; `rg -c 'GOCSPX|googleusercontent' supabase/config.toml` → exit 1; `rg -n '^\[auth\.email\.smtp\]' supabase/config.toml` → exit 1; `rg -n -B1 '^enabled = true' supabase/config.toml` over `[auth.external.*]` → google only.

## Task 3 [AC3] Template file + `supabase/.env.example`
Files (new): `supabase/templates/magic-link.html`, `supabase/.env.example`.
- Change: template body has a sign-in link `{{ .ConfirmationURL }}` and the code `{{ .Token }}` in Vietnamese (S1/CONTEXT copy rules: no new product names). `.env.example`: the 2 names, empty values, a 3-line header saying "copy to `supabase/.env`; never the root `.env`".
- Test first (fails now): `ls supabase/templates supabase/.env.example 2>&1 | rg -c 'No such file'` → `2`.
- Verify: `rg -c '\{\{ \.ConfirmationURL \}\}|\{\{ \.Token \}\}' supabase/templates/magic-link.html` → `2`; `rg -o '^[A-Z0-9_]+(?==)' -P supabase/.env.example` → exactly the 2 names; `rg '^[A-Z0-9_]+=.+' supabase/.env.example` → exit 1; `git check-ignore supabase/.env.example` → exit 1 (not ignored: `.gitignore:18` `!.env.example` matches at any depth).

## Task 4 [AC3] Empty-secret guard for `config push`
Files (new): `scripts/supabase-push.sh`; edit `package.json:20`.
- Change: `scripts/supabase-push.sh <project-ref>` — `set -euo pipefail`; `cd` to root; source `supabase/.env` when present; for each of the 2 names, abort with exit 1 and `<NAME> is empty` (name only) when unset/empty; then `exec supabase config push --project-ref "$1"`. `package.json` gets `"supabase:push": "scripts/supabase-push.sh"`. No other knob.
- Test first (fails now): `test -x scripts/supabase-push.sh` → exit 1.
- Verify (isolated copy so a real `supabase/.env` never leaks in): `t=$(mktemp -d); mkdir -p $t/scripts $t/bin $t/supabase; cp scripts/supabase-push.sh $t/scripts/; printf '#!/bin/sh\necho called >> '"$t"'/calls\n' > $t/bin/supabase; chmod +x $t/bin/* $t/scripts/*`; empty: `PATH=$t/bin:$PATH $t/scripts/supabase-push.sh ref; echo exit=$?; test -f $t/calls; echo calls=$?` → `exit=1`, `calls=1` (no file), stderr names the variable; set: `printf 'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=x\nSUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=y\n' > $t/supabase/.env; PATH=$t/bin:$PATH $t/scripts/supabase-push.sh ref; wc -l < $t/calls` → `exit=0`, `1`; one-empty case → exit 1; `rm -rf $t`; `pnpm exec prettier --check package.json` exit 0.

## Task 5 [AC3] README Google + hosted step
File: `README.md:31` (insert after step 5; `:33` heading stays).
- Test first (fails now): `rg -c -i 'google' README.md` → rg exit 1; `rg -c 'supabase:push' README.md` → exit 1.
- Change: append the draft below (unexecuted). Prose is a numbered continuation, no new heading.
- Verify: `rg -n -i 'google|supabase:push|supabase/.env' README.md` → hits between `:25` and the `## Generated files` heading; `pnpm exec prettier --check README.md` exit 0; `rg -c 'Resend SMTP' README.md` ≥ 1.

## Task 6 [AC3] Local proof (placeholder Google client)
No tracked-file edits. Mantica stays stopped, never started. Only `supabase start` / `stop`.
- Setup: `printf 'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=chaiyo-local-test.apps.googleusercontent.com\nSUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=local-test\n' > supabase/.env` (gitignored, throwaway; never `cat` it). `docker ps --filter name=_Mantica -q | sort > /tmp/m-before.txt`.
- Test first (fails now, config from `main`): with Task 2 reverted nothing to run; the failing check is Task 2's `rg` set. Skip.
- Run: `supabase start > /tmp/start.out 2>&1; echo exit=$?` → `exit=0`. Authorize: `loc=$(curl -s -o /dev/null -D - 'http://127.0.0.1:56321/auth/v1/authorize?provider=google' | rg -i '^location:')`; `echo "$loc" | rg -c 'accounts.google.com'` → `1`; client id match: `[ "$(echo "$loc" | rg -o 'client_id=[^&[:space:]]+' | cut -d= -f2)" = "$(rg -o -P '(?<=^SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=).+' supabase/.env)" ] && echo match`. OTP: `K=$(supabase status -o env 2>/dev/null | rg -o -P '(?<=^(ANON_KEY|PUBLISHABLE_KEY)=").+(?=")' | head -n 1)`; `a=s2-$(date +%s); curl -s -o /dev/null -w '%{http_code}\n' -H "apikey: $K" -H 'Content-Type: application/json' -d "{\"email\":\"$a@example.com\"}" http://127.0.0.1:56321/auth/v1/otp` → `200`; mailbox (Mailpit): `id=$(curl -s "http://127.0.0.1:56324/api/v1/search?query=to:$a@example.com" | python3 -c 'import sys,json;print(json.load(sys.stdin)["messages"][0]["ID"])')` → 1 message; `curl -s "http://127.0.0.1:56324/api/v1/message/$id"` → the `HTML` field has one `/auth/v1/verify?token=` and one `\b[0-9]{6}\b` outside URLs (counts only, never the token).
- Stop: `supabase stop; echo exit=$?` → 0; `docker ps --filter name=_chaiyo -q | wc -l` → `0`; Mantica ID list unchanged (`diff` → silent). `rm -f supabase/.env /tmp/m-before.txt /tmp/start.out`.
- Failures: authorize returns no `Location` (maybe apikey needed) → retry with `-H "apikey: $K"` and note it; `start` rejects an `enabled` provider with an empty id → report the error; the placeholder is non-empty so this should not occur.

## Task 7 [AC3] Commit, push, open PR
Files: Tasks 1-5 + `.stories/M-0-epic/` (state, `epic.json`, `PARKED.md`, `slices/S1-*/VERIFY.md`, `slices/S2-*/`) + `backlog/tasks/chy-63 - Vercel-deploy-preview-production.md`.
- Change: two signed commits (repo-local identity `43029756+stonghuuloc@users.noreply.github.com`): `CHY-2 S2: Google + magic-link auth config, guarded config push, README` (config.toml, templates/, supabase/.env.example, scripts/, package.json, README.md, the `git rm --cached` of `.temp/cli-latest`) and `chore(story): CHY-2 S2 state` (`.stories/`, backlog). `git push -u origin HEAD:CHY-2`; `gh pr create --repo stonghuuloc/chaiyo --base main --head CHY-2 --title "CHY-2 Google and magic-link auth providers, local and hosted" --body-file <body>` (body: `- [x] S1 …` already merged; `- [ ] S2 auth providers local + hosted (AC3)`; `Tested:` and `Revert:` lines).
- Test first (fails now): `gh pr list --repo stonghuuloc/chaiyo --head CHY-2 --json number` → `[]`.
- Verify: `git log -2 --format='%G? %ae'` → `G` + noreply; `git diff --name-only main | rg -c '^\.github/|(^|/)\.env$'` → exit 1; `rg -n 'GOCSPX|googleusercontent' $(git diff --name-only main)` → exit 1; `gh pr view CHY-2 --repo stonghuuloc/chaiyo --json state` → OPEN.

## Task 8 [AC3][CHORE] BLOCKING — Loc outward checklist
The agent stops here until Loc replies with the 4 values below. Nothing hosted runs before.
1. GCP: project "chaiyo" → OAuth consent screen (app name `chaiyo`) → OAuth client, type Web, redirect URIs exactly `http://127.0.0.1:56321/auth/v1/callback` and `https://<ref>.supabase.co/auth/v1/callback`. Paste the client id + secret into `supabase/.env` as `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `…_SECRET` (copy from `supabase/.env.example`). Never into root `.env`, chat or git.
2. Supabase dashboard: create project `chaiyo` (free plan). Tell the agent the `<ref>` (the `<ref>` in the callback above comes from this step; add the hosted callback to the GCP client after).
3. Vercel dashboard: create an empty project named `chaiyo` to claim `<name>.vercel.app`. Tell the agent the exact domain.
4. Terminal: `supabase login`, then `supabase link --project-ref <ref>` in the repo root.
5. Resend: create an API key and put it in `supabase/.env` as `RESEND_API_KEY` (Q13-A, sandbox sender `onboarding@resend.dev`).
- Verify (agent): `rg -c '^SUPABASE_AUTH_(EXTERNAL_GOOGLE_(CLIENT_ID|SECRET))|RESEND_API_KEY)=.+' supabase/.env` → `3` (count only); `test -f supabase/.temp/project-ref && echo linked`; `supabase projects list 2>&1 | rg -c 'chaiyo'` → ≥ 1.

## Task 9 [AC3] Hosted config: `[remotes]` override, guarded push, read-back
Files: `supabase/config.toml` (new `[remotes.hosted]` block after the `[auth.external.google]` block).
- Change (draft below): `[remotes.hosted]` `project_id = "<ref>"`; `[remotes.hosted.auth]` `site_url = "https://<name>.vercel.app"`, `additional_redirect_urls = ["https://<name>.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"]`. Commit and push to the PR branch.
- Test first (fails now): `rg -c '^\[remotes\.' supabase/config.toml` → rg exit 1.
- Run: `pnpm supabase:push <ref>` — the CLI prints a diff and asks to confirm. Read the diff: it must contain `site_url`, the redirect list, google enabled; any other changed field (rate limit, otp, confirmations) is reported before answering. Answer `y` only if the diff matches the spec. Then run it again: expect no auth diff.
- Verify hosted: `curl -sI 'https://<ref>.supabase.co/auth/v1/authorize?provider=google' | rg -i '^location:' | rg -c 'accounts.google.com'` → `1` and the client id equals `supabase/.env`'s (match check as Task 6); ONE OTP request (no retries) with `PUBLIC_SUPABASE_PUBLISHABLE_KEY` of the hosted project → `200`; Loc confirms the mail arrived with link + code (the agent cannot read Loc's inbox). Settings read-back = second push with no auth diff.
- If `[remotes]` is ignored for this project (diff shows `site_url` = 5173, or the push rejects the block), take the Q8-C path: answer `n` to the push; remove the `[remotes.hosted*]` blocks from `config.toml`; set the root `site_url = "https://<name>.vercel.app"` and `additional_redirect_urls = ["https://<name>.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"]`; push again through the guard (`pnpm supabase:push <ref>`). The diff must show exactly those values and no other auth change; anything else → answer `n` and report.

## Task 10 [AC3] `ci` green + CodeRabbit handled
- Verify: `gh pr checks CHY-2 --repo stonghuuloc/chaiyo --watch` → `ci` pass; `gh run list --repo stonghuuloc/chaiyo --branch CHY-2 --json event,conclusion` → `push` + `pull_request` both `success`.
- CodeRabbit: wait ~5 min, then `gh api repos/stonghuuloc/chaiyo/pulls/<n>/reviews --jq '.[]|select(.user.login=="coderabbitai[bot]")|.state'` and `…/pulls/<n>/comments --jq '.[]|select(.user.login=="coderabbitai[bot]")|"\(.path):\(.line) \(.body[0:200])"'`. Correct + in-AC → fix on `CHY-2`, push, `ci` re-green; wrong/out-of-AC → reply with evidence; missing review after 5 min is reported, not a blocker. `ci` red → read the failing step, fix, never edit the spec to match.

## Task 11 [AC3] Merge; `main` green
- Change: `gh pr merge CHY-2 --repo stonghuuloc/chaiyo --merge --delete-branch`.
- Verify: `git fetch --prune && git rev-parse origin/main` = S; `gh api repos/stonghuuloc/chaiyo/commits/S/check-runs --jq '.check_runs[]|"\(.name) \(.conclusion) \(.head_sha)"'` → `ci success S`; `git switch main && git pull --ff-only && git branch -D CHY-2`; `rg -n '^\[auth.external.google\]' supabase/config.toml` → 1 hit on `main`; `git ls-files supabase` → no `.temp`.

## Mutation paths covered
- Config readers: only the CLI reads `config.toml` and `supabase/.env` (`env()` substitution); `rg -n 'supabase/.env|5173|56321' src scripts .github` → 0 readers outside `scripts/supabase-push.sh`. Edit path: `site_url`/redirects are root values for local and `[remotes.hosted.auth]` values for hosted; a push never touches root values for the hosted project when the override is honored (settled by Task 9 diff).
- `config push` pushes the whole `config.toml`, not just auth: every toml field that differs from the hosted project's current value shows in the diff (rate limit `:194`, `enable_confirmations :221`, otp `:227-229`). Task 9 reviews the diff before `y`.
- Secrets: the guard is the only push entry point (README names `pnpm supabase:push`); a bare `supabase config push` still bypasses it, so the README also warns against it.
- Ignore rule: `.gitignore:16-18` ignores `.env`/`.env.*` but re-includes `.env.example` at any depth (`git check-ignore -v supabase/.env.example` → matched by the `!` line), so the new example file is tracked and `supabase/.env` stays ignored.
- Merge path: PR only, `ci` required.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk. A self-contradictory result must be reported, not hacked around)
`supabase/config.toml` additions:
```toml
[auth.email.template.magic_link]
subject = "chaiyo — đăng nhập"
content_path = "./supabase/templates/magic-link.html"

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = false

[remotes.hosted]
project_id = "<ref>"

[remotes.hosted.auth]
site_url = "https://<name>.vercel.app"
additional_redirect_urls = ["https://<name>.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"]
```
`supabase/templates/magic-link.html`:
```html
<p>Nhấn để đăng nhập chaiyo: <a href="{{ .ConfirmationURL }}">Đăng nhập</a></p>
<p>Hoặc nhập mã: <strong>{{ .Token }}</strong></p>
<p>Link và mã dùng một lần, hết hạn sau 1 giờ.</p>
```
`scripts/supabase-push.sh`:
```bash
#!/usr/bin/env bash
# Guarded `supabase config push`: refuses when a Google credential is empty (an empty env() overwrites the live secret).
set -euo pipefail
cd "$(dirname "$0")/.."
ref=${1:?usage: scripts/supabase-push.sh <project-ref>}
if [ -f supabase/.env ]; then set -a; . supabase/.env; set +a; fi
for name in SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET; do
	if [ -z "${!name:-}" ]; then echo "$name is empty; refusing to push" >&2; exit 1; fi
done
exec supabase config push --project-ref "$ref"
```
README addition after `:31`:
```md
6. Google sign-in (once): in Google Cloud create a Web OAuth client with redirect URIs `http://127.0.0.1:56321/auth/v1/callback` and `https://<ref>.supabase.co/auth/v1/callback`. `cp supabase/.env.example supabase/.env` and fill the client id and secret there, never in the root `.env`. Restart with `supabase stop && supabase start`.
7. Hosted project (once): `supabase login`, `supabase link --project-ref <ref>`, then `pnpm supabase:push <ref>`. Never run `supabase config push` directly: with an empty Google secret it overwrites the live one. Hosted email uses Supabase's default sender, through Resend SMTP.
```
## Rollback
Before merge: close the PR, `git push origin --delete CHY-2`; hosted: set the previous values back in the toml and push through the guard (the Task 9 diff records old → new), or revert in the dashboard. A wiped Google secret cannot be read back; Loc re-pastes it from GCP. After merge: revert PR via a new `CHY-2` PR. Local: `supabase stop` (volumes kept). Mantica untouched throughout.
