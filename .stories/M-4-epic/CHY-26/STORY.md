# CHY-26 — Login (P2)

## Goal (business why, 1-2 sentences)
Let a learner sign in with Google or an email link, with no password, and land on Welcome (first time) or Home (returning), so every learning surface has a signed-in Learner and the Ledger can sync to Supabase.

## Context an agent can't derive from code
- Auth is configured, the screen is not: Google + email magic link (supabase/config.toml:340-344, :246-252), `/login` is a one-line stub (src/routes/login/+page.svelte:1-5), and the (app) guard already redirects a signed-out visitor to `/login` (src/lib/shell/guard.ts:6-10, src/routes/(app)/+layout.ts:1-8).
- The app client is `createClient(URL, KEY)` with auth-js 2.118.0 defaults (src/lib/supabase.ts:1-4): `flowType: 'implicit'` (auth-js GoTrueClient.ts:209), `detectSessionInUrl: true`. A link error comes back in the URL as `error`, `error_code`, `error_description`; auth-js returns it from `_initialize` and leaves the URL as it is (GoTrueClient.ts:691-708, 3865-3874).
- The magic-link email carries a link AND a 6-digit code ("hoặc nhập mã này trong ứng dụng", supabase/templates/magic-link.html:47-59); Loc chose both in CHY-2 S2 Q2-C (2026-10-28).
- Hosted: `site_url` https://chaiyo.vercel.app, redirect allow-list `https://chaiyo-*-stonghuulocs-projects.vercel.app/**` (supabase/config.toml:350-351), so callers send a path such as `/auth/callback` (CHY-63 note in the backlog task). Hosted mail goes through Resend (:357-364), email `max_frequency` 1 min (:355); local mail lands in Mailpit on 56324 (:99-102), local `max_frequency` 1 s (:225).
- No table records onboarding or pending deletion. `profiles` is readable by every signed-in learner when not hidden (supabase/migrations/20261110000000_learner_tables.sql:65-66), so account state goes on the owner-only `settings` row (:9-13, policies :46-51), which no trigger creates: a learner has no `settings` row until something inserts it.
- CHY-24 S3 proved the offline Ledger with no session; every push failed on RLS, so sync to Supabase from the browser was never shown (CHY-24 S3 DISCUSSION; reports/CHAA-168.md). S3 here closes that gap.
- Previews sit behind Vercel deployment protection, and an agent cannot complete a Google sign-in or read Loc's inbox, so the hosted proofs (AC6, AC1 Google rows) are Loc's taps.

## Locked decisions (BA/Loc already ruled — never re-open)
- No password, no Guest; only the Landing Page is public (CONTEXT.md "Learner", "Landing Page").
- Email = link + 6-digit code (CHY-2 S2 Q2-C).
- Pending deletion lasts 7 days, restorable, then everything is erased (CONTEXT.md "Learner").

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Google or email link lands on Welcome (new) or Home | high | S1 |
| AC2 | Link sent screen; resend locked 60 s, counts down | high | S1 |
| AC3 | "tong.loc@" shows "Email chưa đúng", sends nothing | high | S1 |
| AC4 | Expired link: email form, prefilled, banner | high | S2 |
| AC5 | Pending deletion: restore sheet, Khôi phục → Home, Để sau → login | high | S2 |
| AC6 | Google and link sign-in work on a Vercel preview | high | S1 |
| CHY-24:AC2 | Signed in, 10 offline Attempts sync exactly once | high | S3 |
| CHY-24:AC5 | Second device of the same learner merges them | high | S3 |

## Out of scope
- Welcome (CHY-27), Placement (CHY-28), Landing copy (CHY-29), Settings → delete account (CHY-53) and the erase job, Home's content (CHY-45), PWA install (CHY-61).
