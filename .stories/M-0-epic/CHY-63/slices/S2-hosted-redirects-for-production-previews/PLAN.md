# CHY-63 S2 — plan
ACs: AC6  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-63 (new, off main `bfd6976`; new PR)

## Anchors (verified 2026-10-28)
- `supabase/config.toml:350-351` hosted `site_url` and `additional_redirect_urls` (3 entries today)
- `scripts/supabase-push.sh:22` `exec supabase config push --project-ref "$ref"` (guard loop `:11-21` reads `supabase/.env` itself)
- `package.json:21` `"supabase:push": "scripts/supabase-push.sh"`
- `README.md:45-46` `## Deploy` bullets (`Env vars`, `Speed Insights`); insert after `:46`
- Probe endpoints on `https://ogczuwtlyetsugahwhui.supabase.co/auth/v1/`: `verify` (discriminates), `authorize` (smoke only), `otp` (email)

## Task 1 [AC6] Red probe before the change
File: `supabase/config.toml:351` (unchanged yet)
- Change: none. Run the `/verify` probe for 5 URLs: prod root, branch alias, hash URL, `https://evil.example.com`, lookalike `https://chaiyo-ab12cd-evil-stonghuulocs-projects.vercel.app`.
- Test first (this is the failing test): alias and hash URL → `Location` = `https://chaiyo.vercel.app` (not themselves). Record it.
- Verify: python/curl, redirects not followed, print `status` + `Location` before `#`/`?` only.

## Task 2 [AC6] Add the wildcard entry
File: `supabase/config.toml:351`
- Change: `additional_redirect_urls = ["https://chaiyo.vercel.app", "https://chaiyo-*-stonghuulocs-projects.vercel.app/**", "http://localhost:5173", "http://127.0.0.1:5173"]`. Local block `:158` untouched.
- Test first: `rg -c 'chaiyo-\*-stonghuulocs-projects' supabase/config.toml` → 0 now, 1 after.
- Verify: `git diff --stat` = `supabase/config.toml` only.

## Task 3 [AC6] Guarded push (OUTWARD — Loc's go in the run)
File: `scripts/supabase-push.sh:22`
- Dry run: `echo n | pnpm supabase:push ogczuwtlyetsugahwhui`; read the diff. Only `additional_redirect_urls` may change; any other field (Google secret, SMTP, rate limit) → STOP, do not answer `y`.
- Push: `echo y | pnpm supabase:push ogczuwtlyetsugahwhui`.
- Verify: second `echo n | …` prints "Remote Auth config is up to date", no diff. Never run `supabase config push` directly.

## Task 4 [AC6] Green probe after the push
File: `supabase/config.toml:351`
- Change: none. Re-run Task 1's 5-URL `/verify` probe.
- Verify: prod root, alias, hash → `Location` = own URL; evil → `https://chaiyo.vercel.app`; lookalike → own URL (matches, recorded as the Q5-A residual).

## Task 5 [AC6] Google and magic-link legs (OUTWARD: one real email)
File: `supabase/config.toml:351`
- Google smoke: `GET /authorize?provider=google&redirect_to=<url>` ×3 (prod, alias, hash) → 302 to `accounts.google.com`, `redirect_to` echoed. Not an allow-list proof.
- Magic link: one `POST /otp?redirect_to=https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app` body `{"email":"stonghuuloc@gmail.com"}`; read the newest Resend email via the API (key loaded in-process from `supabase/.env`, never printed) and print only the link's `redirect_to`.
- Verify: link `redirect_to` = the preview URL. If it is the site_url, mark ⚠️ and keep Task 4 as the proof.

## Task 6 [AC6] README one line
File: `README.md:46` (insert after)
- Change: bullet in `## Deploy`: hosted Supabase allow-list covers previews via `https://chaiyo-*-stonghuulocs-projects.vercel.app/**`; edit `supabase/config.toml` and push with `pnpm supabase:push <ref>` only.
- Test first: `rg -c 'supabase:push' README.md` inside `## Deploy` → 0 now.
- Verify: `pnpm exec prettier --check README.md`; `pnpm lint`.

## Task 7 [AC6] Verify-stage record (not code)
File: `.stories/M-0-epic/CHY-63/slices/S2-hosted-redirects-for-production-previews/VERIFY.md:1`
- Write: AC6 ✅/⚠️ with `The ⚠️ is scoped:` (UI sign-in not provable before CHY-26; previews behind SSO), Residual risk = lookalike-team host matches; evidence = Task 1/4 probe tables.

## Mutation paths covered
- Hosted auth config has one write path: the guarded push. A wrong value is reverted by editing line 351 and pushing again; the dry-run diff check blocks collateral fields.
- `/otp` may create the `stonghuuloc@gmail.com` user on hosted: noted, not undone.

## Draft code (UNEXECUTED — adapt to what is on disk)
```python
# probe(url): GET .../auth/v1/verify?token=bogus&type=magiclink&redirect_to=<url>, no redirect following
# print(status, Location.split('#')[0].split('?')[0])
```
Contradictory probe results: report, do not edit the expectation to pass.

## Rollback
Revert the commit, then `pnpm supabase:push ogczuwtlyetsugahwhui` (dry run, read, `y`). The pushed hosted list returns to 3 entries.
