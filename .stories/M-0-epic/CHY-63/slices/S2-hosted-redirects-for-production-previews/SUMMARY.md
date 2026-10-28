# CHY-63 S2 — summary
ACs: AC6  ·  Commits: 43d0569  ·  PR: pending

## Shipped
- [AC6] `supabase/config.toml:351` hosted `additional_redirect_urls` now has `https://chaiyo-*-stonghuulocs-projects.vercel.app/**` (4 entries). Dry run diff changed only that line; `echo y` pushed it; a second dry run: "Remote Auth config is up to date".
- [AC6] `/verify` probe before (bare origins): alias, hash URL, evil, lookalike → site_url. After, with a path (`/auth/callback`): prod, alias, hash, lookalike → themselves; `evil.example.com` → site_url.
- [AC6] `/authorize?provider=google` ×3 (prod, alias, hash) → 302 `accounts.google.com`, `redirect_to` echoed.
- [AC6] `README.md:47` documents the allow-list and the push path.

## Deviated from plan
- The wildcard needs a path: a bare preview origin (`https://chaiyo-git-…vercel.app`, no `/`) still falls back to site_url after the push. The green probe uses `<origin>/auth/callback`; the bare-origin gap goes in `VERIFY.md` and README.
- The magic-link email was sent once (`POST /otp` → 200), but the Resend key in `supabase/.env` returns 401 on `GET /emails` (send-only), so the link's `redirect_to` was not read back.

## Not done / follow-up
- Email link `redirect_to` unchecked; learner UI sign-in waits for CHY-26.

## Verification run
`pnpm lint` exit 0 · guarded dry run diff = 1 changed field · second dry run no diff · probes above
