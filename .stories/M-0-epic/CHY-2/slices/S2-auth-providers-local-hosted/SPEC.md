# CHY-2 S2 — spec
ACs: AC3  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC3] Local `site_url` is `http://127.0.0.1:5173` and `additional_redirect_urls` is exactly `["http://127.0.0.1:5173", "http://localhost:5173"]` (today `:154` is `…:3000`, `:158` is `["https://127.0.0.1:3000"]`; dev server = `vite dev`, Vite default 5173). Verified by: `rg -n '^(site_url|additional_redirect_urls)' supabase/config.toml` shows those two values and no `3000`.
- [AC3] `[auth.external.google]` exists, `enabled = true`, `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`, `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`. No literal credential is in the file. `skip_nonce_check` stays `false` (OAuth redirect flow, not an ID-token flow). No other `[auth.external.*]` block is enabled (apple `:317-330` stays `enabled = false`). Verified by: `rg -n -A4 '^\[auth.external.google\]' supabase/config.toml` shows the block; `rg -c '^enabled = true' ` inside external blocks = 1 (google only).
- [AC3] `supabase/.env.example` exists and lists exactly 2 names, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, each with an empty right-hand side. `supabase/.env` is git-ignored (`.gitignore:16` `.env`). Verified by: `rg -o '^[A-Z0-9_]+(?==)' -P supabase/.env.example` → those 2; `rg '^[A-Z0-9_]+=.+' supabase/.env.example` → 0 matches; `git check-ignore supabase/.env` → exit 0.
- [AC3] The magic-link email carries both a link and a code (Q2-C): `[auth.email.template.magic_link]` points at `./supabase/templates/magic-link.html`, which contains `{{ .ConfirmationURL }}` and `{{ .Token }}` and has a Vietnamese subject. `otp_length = 6` (`:227`) and `otp_expiry = 3600` (`:229`) stay. Verified by: `rg -c '\{\{ \.ConfirmationURL \}\}|\{\{ \.Token \}\}' supabase/templates/magic-link.html` → 2; a request for a never-seen address lands in Inbucket with one `/auth/v1/verify?token=` link and one 6-digit code.
- [AC3] Hosted project `chaiyo` (Q1-A, new project) has Google and email enabled with the same client env, `site_url` = `https://<name>.vercel.app` (the domain Loc claims, Q4/Q7-A), and the redirect list = that domain + `http://localhost:5173` + `http://127.0.0.1:5173`. The hosted-only values live in a `[remotes.<name>]` override keyed by the hosted `project_id`; the root block keeps the local values. Verified by: `supabase config push` run twice: the first prints a diff containing those fields, the second prints no auth diff; hosted settings read back equal the override.
- [AC3] Hosted config is pushed from `config.toml` (Q6-B), never from the dashboard. A guard runs before every push: if `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` or `_SECRET` is empty or unset, it exits non-zero, prints which name is empty (never the value) and does not call `supabase config push`. The exact mechanism is the plan's. Verified by: with both names empty the guard exits ≠ 0 and the push command is not invoked (0 calls to a stub `supabase`); with both set it invokes it exactly once.
- [AC3] The hosted project sends email with Supabase's default sender (Q5-A): no `[auth.email.smtp]` block is enabled (`:232-240` stays commented). Verified by: `rg -n '^\[auth\.email\.smtp\]' supabase/config.toml` → 0 matches.
- [AC3] README gains a Google + hosted step: how to create the Google OAuth web client with both callbacks, copy `supabase/.env.example` → `supabase/.env`, `supabase login` + `link`, and run the guarded push. It states the default sender's 2 emails/hour cap (`:194`). Verified by: `rg -n -i 'google|config push|supabase/.env' README.md` hits inside `## Develop`; `pnpm exec prettier --check README.md` exit 0.
- [LOCK] Auth providers = Google + email magic link, nothing else (STORY.md; DISCUSSION "Locked").
- [LOCK] Q1-A new hosted project `chaiyo`; Q2-C link + code in one email; Q3-A new GCP project "chaiyo", one web client with local + hosted callbacks; Q5-A default sender, Resend parked; Q6-B `config push`; Q7-A Loc claims the `.vercel.app` domain during S2 (DISCUSSION "Resolved").
- [CHORE] `supabase/.temp/cli-latest` is tracked although `.temp` is git-ignored (`supabase/.gitignore`); untrack it with `git rm --cached`. Verified by: `git ls-files supabase` lists no `.temp` path.
- [CHORE] S1's uncommitted `slices/S1-local-supabase-env-readme/VERIFY.md` and the CHY-63 task file ride this branch's story-state commit. Verified by: `git ls-files .stories | rg -c VERIFY.md` ≥ 1 after the commit.
- [CHORE] PR flow as S1: branch `CHY-2` off `main`; PR `CHY-2 <imperative description>`; required check `ci` green; `coderabbitai[bot]` comments handled; no push to `main`.
- [NFR] No secret value is printed, logged or committed: reports show names and lengths only; `supabase/.env` and root `.env` are never read into output. Verified by: `git diff main --stat` has no `.env` path; `rg -n 'GOCSPX|\.apps\.googleusercontent\.com' $(git diff --name-only main)` → 0 matches.
- [NFR] Mantica stays stopped and untouched; only `supabase start`/`stop` for chaiyo, project-scoped by `project_id = "chaiyo"` (`config.toml:5`). Verified by: `docker ps --filter name=_Mantica -q` count identical before/after.

### Loc tasks (outward)
- [CHORE] Create GCP project "chaiyo" + OAuth consent screen + one OAuth web client with redirect URIs `http://127.0.0.1:56321/auth/v1/callback` and `https://<ref>.supabase.co/auth/v1/callback`.
- [CHORE] Create the hosted Supabase project `chaiyo` (free plan, 2-project limit) and note its `<ref>`.
- [CHORE] Create an empty Vercel project named `chaiyo` to claim the `<name>.vercel.app` domain; tell the agent the domain.
- [CHORE] Run `supabase login` and `supabase link --project-ref <ref>` (the agent has no access token); put the OAuth client id + secret into `supabase/.env`.

## Not this slice
- CHY-63: Vercel deploy, `PUBLIC_SUPABASE_*` env in Vercel, preview URLs and the preview URL pattern in the allow-list.
- CHY-26: login UI, `signInWithOAuth`/`signInWithOtp` calls, `@supabase/*` dependency. Tables/RLS → CHY-23.
- Resend / custom SMTP (parked, needs a domain). Apple and every other provider.

## Seam
`supabase/config.toml` (`[auth]`, `[auth.email.template.magic_link]`, `[auth.external.google]`, `[remotes.*]`), `supabase/templates/magic-link.html`, `supabase/.env.example`, one guarded-push script + `package.json` script, `README.md`. Nothing in `src/` or `.github/`.

## Test contract
- [AC3] Config greps: site_url/redirects = the 5173 values; google block enabled with the 2 `env()` refs; exactly 1 enabled external provider; no smtp block; template file has link + token placeholders.
- [AC3] Guard test with a stub `supabase` on `PATH`: empty/unset names → exit ≠ 0, 0 stub calls, output names the empty variable; both set → exit 0, 1 stub call with `config push --project-ref <ref>`.
- [AC3] Local stack up (`supabase start`, exit 0): `curl -sI '…:56321/auth/v1/authorize?provider=google'` → 302 `Location` host `accounts.google.com` with `client_id` equal to the value in `supabase/.env`.
- [AC3] Local `POST …:56321/auth/v1/otp` for a fresh address → Inbucket (56324) mailbox holds 1 message with one verify link and one 6-digit code.
- [AC3] Hosted: same authorize check against `https://<ref>.supabase.co` → `accounts.google.com` with the real client id; one OTP request (cap 2/hour) → mail received; settings read back equal the override; second push shows no auth diff.
- [AC3] Loc manual check (not a gate for "enabled"): one real Google sign-in against the hosted callback shows no `redirect_uri_mismatch`; the consent screen names "chaiyo".

## Open assumptions
- [AC3] Assumed `supabase config push` honors `[remotes.<name>]` overrides for a non-branch production project (docs confirm `[remotes]` only for branching). If wrong, the fallback is Q8-C (DISCUSSION): drop `[remotes.hosted]` and use one shared root block, `site_url = https://<name>.vercel.app` + redirects vercel.app, `http://localhost:5173`, `http://127.0.0.1:5173` (local `site_url` then equals the Vercel domain; local sign-in still returns to 5173 through the redirect list); the Task 9 diff settles it before any push is confirmed.
- [AC3] Assumed a first-time address receives the `magic_link` template, not `confirmation`, because `enable_confirmations = false` (`:221`). If wrong, cost = the same template body on `[auth.email.template.confirmation]` (1 block, 1 line).
- [AC3] Assumed local proof can use a placeholder client id/secret in `supabase/.env` (the authorize check only needs the id echoed in the redirect); Loc's real client replaces it for the hosted proof. If wrong, local proof waits for Loc task 1.
- [AC3] Assumed hosted read-back = a second `config push` with no auth diff (the CLI exposes no `config get`). If wrong, cost = one Management API GET needing `SUPABASE_ACCESS_TOKEN` from Loc.
