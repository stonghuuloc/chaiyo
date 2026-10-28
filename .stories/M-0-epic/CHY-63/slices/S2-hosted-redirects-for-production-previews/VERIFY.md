# CHY-63 S2 — verify
Re-run 2026-10-28 on PR #9 head `6b253f8` against hosted `ogczuwtlyetsugahwhui`. Q4-A: previews stay behind Vercel SSO. Q5-A: one wildcard.

| AC | Verdict | Evidence |
|---|---|---|
| AC6 | ⚠️ | Allow-list on hosted works: `/verify` probe with `<origin>/auth/callback` → prod, alias, hash → themselves; `evil.example.com` → site_url; guarded dry run "Remote Auth config is up to date". Email leg proven (link kept the preview `/auth/callback`). Not proven: a real learner sign-in. See Δ AC6. |

### Δ AC6 — hosted accepts preview URLs, but "learner returns signed in" is not proven end to end

**Setup** — hosted `ogczuwtlyetsugahwhui`, `supabase/config.toml:351` (4 entries incl. `https://chaiyo-*-stonghuulocs-projects.vercel.app/**`), pushed with `echo y`; `GET /auth/v1/verify?token=bogus&type=magiclink&redirect_to=<url>`.

| | Proven now | AC6 says |
|---|---|---|
| Site URL = production domain | `https://chaiyo.vercel.app` (`:350`, push diff empty) | production domain |
| production in allow-list | root → itself (303) | included |
| branch alias `chaiyo-git-chy-63-…/auth/callback` | → itself (303) | included via pattern |
| hash URL `chaiyo-mvy3rgtix-…/auth/callback` | → itself (303) | included via pattern |
| non-matching `evil.example.com/auth/callback` | → `https://chaiyo.vercel.app` (fallback) | not included |
| Google leg, 3 hosts | `/authorize` 302 → `accounts.google.com` ×3 (smoke; not an allow-list proof) | Google sign-in returns learner |
| magic-link email | sent once (`/otp` 200); the delivered link's target is `…/auth/v1/verify?…&type=magiclink&redirect_to=https://chaiyo-git-chy-63-stonghuulocs-projects.vercel.app/auth/callback` (token not recorded; Loc pasted it, Resend click tracking wraps it via `awstrack.me`) | link returns learner |
| learner sign-in in the UI | none: no login UI or callback route (CHY-26); previews need a Vercel login | learner returns signed in |

**The ⚠️ is scoped:** allow-list behaviour, the production `site_url` and the email link's `redirect_to` are proven; a real UI sign-in (production or preview) is not (CHY-26; previews also need a Vercel login) (gap: 1 leg).

**Answer: accept the UI sign-in gap until CHY-26?** Owner: Loc.

## Residual risk
- Resend click tracking rewrites magic links through `awstrack.me` (parked, no AC).
- Q5-A accepted: `https://chaiyo-ab12cd-evil-stonghuulocs-projects.vercel.app/auth/callback` (illustrative lookalike-team host) matches the wildcard → itself.
- A slashless preview origin (`https://chaiyo-git-…vercel.app`) falls back to site_url (probe: bare → site_url); callers must send a path.
- Branch aliases longer than 63 characters are shortened by Vercel; whether the shortened host keeps the `-stonghuulocs-projects` suffix is unchecked.
