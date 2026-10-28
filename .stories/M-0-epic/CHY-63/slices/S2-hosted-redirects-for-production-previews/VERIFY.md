# CHY-63 S2 — verify
Re-run 2026-10-28 on PR #9 head `6b253f8` against hosted `ogczuwtlyetsugahwhui`. Q4-A: previews stay behind Vercel SSO. Q5-A: one wildcard.

| AC | Verdict | Evidence |
|---|---|---|
| AC6 | ⚠️ | Allow-list on hosted works: `/verify` probe with `<origin>/auth/callback` → prod, alias, hash → themselves; `evil.example.com` → site_url; guarded dry run "Remote Auth config is up to date". Not proven: the email link's `redirect_to` and a real learner sign-in. See Δ AC6. |

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
| magic-link email | sent once (`/otp` 200) with `redirect_to=<alias>/auth/callback`; link not read (Resend key send-only, 401) | link returns learner |
| learner sign-in in the UI | none: no login UI or callback route (CHY-26); previews need a Vercel login | learner returns signed in |

**The ⚠️ is scoped:** allow-list behaviour and the production `site_url` are proven by the redirect probe and the empty second dry run; the email link's `redirect_to` and a real UI sign-in (production or preview) are not proven (gap: 2 legs).

**Answer: open the email from 2026-10-28 in stonghuuloc@gmail.com and tell me the link's `redirect_to`, or accept the gap until CHY-26.** Owner: Loc.

## Residual risk
- Q5-A accepted: `https://chaiyo-ab12cd-evil-stonghuulocs-projects.vercel.app/auth/callback` (illustrative lookalike-team host) matches the wildcard → itself.
- A slashless preview origin (`https://chaiyo-git-…vercel.app`) falls back to site_url (probe: bare → site_url); callers must send a path.
- Branch aliases longer than 63 characters are shortened by Vercel; whether the shortened host keeps the `-stonghuulocs-projects` suffix is unchecked.
