# CHY-63 S2 — spec
ACs: AC6  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC6] `[remotes.hosted.auth]` keeps `site_url = "https://chaiyo.vercel.app"` and `additional_redirect_urls` becomes exactly `["https://chaiyo.vercel.app", "https://chaiyo-*-stonghuulocs-projects.vercel.app/**", "http://localhost:5173", "http://127.0.0.1:5173"]` (Q5-A; today `config.toml:351` has the other 3). The root/local block is unchanged. Verified by: `rg -n '^additional_redirect_urls' supabase/config.toml` shows both lines; `git diff --stat` touches only `supabase/config.toml` (+ README line).
- [AC6] The hosted project accepts the change through the guarded push only. Verified by: `echo n | pnpm supabase:push ogczuwtlyetsugahwhui` prints a diff whose only changed field is `additional_redirect_urls`; after `echo y`, a second `echo n | …` prints "Remote Auth config is up to date" and no diff.
- [AC6] Allow-list proof on hosted (the redirect probe): `GET /auth/v1/verify?token=bogus&type=magiclink&redirect_to=<url>` returns 303 whose `Location` (before `#`) equals `<url>` for the production root, the branch alias `https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app` and the hash URL `https://chaiyo-mvy3rgtix-stonghuulocs-projects.vercel.app`, and equals `https://chaiyo.vercel.app` for `https://evil.example.com` (negative control). Today the alias and hash URL fall back to site_url (DISCUSSION probe), so the same command fails before the push and passes after.
- [AC6] Google leg smoke: `GET /auth/v1/authorize?provider=google&redirect_to=<url>` for the production root, the branch alias and the hash URL each returns 302 to `accounts.google.com` with `redirect_to` carried. It does not discriminate the allow-list (DISCUSSION: evil host also passes), so it proves only that the provider is enabled on hosted.
- [AC6] Magic-link leg: one `POST /auth/v1/otp?redirect_to=https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app` for `stonghuuloc@gmail.com` (the sandbox's only recipient). The delivered email's `/auth/v1/verify` link carries `redirect_to` equal to the preview URL, not the site_url. Verified by: Resend API `GET /emails` newest message, link query `redirect_to` printed, nothing else.
- [AC6] The learner-facing sign-in on a preview or on production through the UI is ⚠️ scoped: no login UI or callback route exists before CHY-26, and previews sit behind Vercel SSO (Q4-A). Verified by: `VERIFY.md` row says `The ⚠️ is scoped:` with proven and unproven parts.
- [AC6] README `## Deploy` gains one line: the hosted allow-list covers previews through the wildcard, changed only via `pnpm supabase:push`. Verified by: `rg -n 'supabase:push' README.md` hits inside `## Deploy`; `pnpm exec prettier --check README.md` exit 0.
- [LOCK] Q4-A previews stay behind deployment protection. Q5-A one wildcard entry; the lookalike-team host is Residual risk in `VERIFY.md`.
- [NFR] No secret is printed: the guard reads `supabase/.env` itself; evidence shows URLs, status codes and `redirect_to` values only. Verified by: `rg -n 'sb_secret_|re_[A-Za-z0-9]{10,}|eyJ' $(git diff origin/main --name-only)` → 0 matches.
- [CHORE] Branch `CHY-63` off `main` (`bfd6976`), new PR `CHY-63 <imperative description>`, `ci` green, no push to `main`.

### Outward actions (Loc approves, agent runs)
- [AC6] `pnpm supabase:push ogczuwtlyetsugahwhui` with `echo y` after the dry-run diff is read: changes the live hosted auth allow-list.
- [AC6] One real email through Resend to stonghuuloc@gmail.com; `POST /otp` may create the user row for that address on hosted (`shouldCreateUser` default).

## Not this slice
- S1's AC7 data check; login UI, `signInWithOAuth`/`signInWithOtp` calls and a callback route (CHY-26); a custom domain; a verified Resend sending domain.

## Seam
`supabase/config.toml:351`, guarded push `scripts/supabase-push.sh:22`, one README line. Nothing in `src/`.

## Test contract
- [AC6] Config grep shows the 4-entry list; dry-run diff = redirect list only; second push = no diff.
- [AC6] `/verify` probe: prod root, alias, hash → equal `<url>`; `evil.example.com` → site_url; red before the push, green after.
- [AC6] `/authorize` ×3 → 302 `accounts.google.com`; `/otp` email link `redirect_to` = preview URL.

## Open assumptions
- [AC6] The `/otp` email link keeps `redirect_to` when it is allow-listed. If GoTrue drops it, the email leg is ⚠️ and the `/verify` probe remains the allow-list proof; no config change either way (DISCUSSION `/verify` probe).
