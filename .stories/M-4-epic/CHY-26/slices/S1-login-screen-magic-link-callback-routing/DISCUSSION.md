# CHY-26 S1 — discussion
ACs: AC1, AC2, AC3, AC6 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- CHY-2 S2 Q2-C: the email holds a link and a 6-digit code. The code field is S2 (WAVE-PLAN Q1).

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: implicit or PKCE flow? A: keep auth-js's default implicit flow (GoTrueClient.ts:209). PKCE stores a code verifier in the browser that asked, so a link opened in another browser (Gmail's in-app browser, a laptop) fails to exchange; implicit carries the tokens in the link. Confidence 85%.
- [AC1] Q: one callback for both methods? A: yes, `/auth/callback` for Google and the link. It is the path CHY-63 put on the hosted allow-list, and one page owns the landing rule. Confidence 95%.
- [AC1] Q: how does the app know "has finished onboarding"? A: a new nullable `settings.onboarded_at`; no row or null → Welcome. CHY-27 S2 writes it. Not on `profiles`: every signed-in learner can read non-hidden profiles (learner_tables.sql:65-66), while `settings` is owner-only (:46-51). Not `user_metadata`: that splits the Learner's data from RLS-guarded tables. Confidence 85% (advisor r1 moved it from `profiles`).
- [AC1] Q: why filter the read by `learner_id` when RLS already limits it? A: the filter states intent and keeps `maybeSingle()` safe if a policy ever widens. Confidence 90%.
- [AC1] Q: what if the settings read fails right after sign-in? A: go to `/today`. The learner is signed in; `onboarded_at` stays null, so the next sign-in offers Welcome again. Confidence 80%.
- [AC1] Q: where do Welcome and Placement live? A: a new `(onboard)` group with the same `requireSession` guard and no tab bar. This slice adds the group and a `/welcome` stub so AC1 has a target; CHY-27 S1 replaces the stub. Confidence 85%.
- [AC1] Q: how are the Google rows proven? A: Playwright cannot complete a Google sign-in (bot checks), so the landing rule is unit-tested once for both methods (both end on the same callback) and Loc taps Google on the preview (AC6). Confidence 90%.
- [AC2] Q: countdown from what? A: from `sentAt` with a 1 s re-render, not a decrementing counter, so a background tab that skipped ticks shows the right number on return. Labels match the prototype tick (prototype/p2-login.html:96-114): 60 at send, 1 at 59 s, enabled at 60 s. Confidence 90%.
- [AC2] Q: does the server agree with 60 s? A: hosted `max_frequency` is 1 min (config.toml:355), so an early resend would fail there anyway; locally it is 1 s, so the local test proves the client lock alone. Confidence 85%.
- [AC3] Q: which email rule? A: the prototype's regex (p2-login.html:60). It rejects "tong.loc@" and "a@b", accepts any TLD of 2+ characters. Supabase still validates server-side. Confidence 90%.
- [AC1] Q: legal links "Điều khoản · Quyền riêng tư"? A: left out: no such pages exist and a `#` link is placeholder UI. Confidence 80%.
- [AC6] Q: why add local `/**` redirect globs? A: GoTrue accepts any path on `site_url`'s host (local `site_url` is http://127.0.0.1:5173, config.toml:154), so only `localhost:5173` needs the glob; the 127 glob is kept for symmetry with the hosted list. Confidence 85%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Email link + code (CHY-2 S2 Q2-C); no password; only the Landing Page is public.
