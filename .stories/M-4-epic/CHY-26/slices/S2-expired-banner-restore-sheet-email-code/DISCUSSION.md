# CHY-26 S2 — discussion
ACs: AC4, AC5 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- CHY-2 S2 Q2-C: link + 6-digit code in one email. WAVE-PLAN Q1 asks whether the app takes the code; this slice assumes A.

## Answered here (≥80% rule, CREW.md)
- [AC4] Q: how does the app learn the link expired? A: GoTrue redirects to the callback with `error_code=otp_expired` (hash for the implicit flow; query is also read). It uses the same code for a reused link, so the local proof reuses a link instead of waiting the 3600 s `otp_expiry`. Confidence 85%.
- [AC4] Q: where does the prefilled email come from? A: `localStorage` written at send. The expired link carries no email, and a link opened in another browser simply shows an empty field with the banner. Confidence 85%.
- [AC5] Q: where does "pending deletion" live? A: `settings.delete_at` (erase instant), beside `onboarded_at`: owner-only, so other learners cannot see who is leaving (`profiles` is readable by all, learner_tables.sql:65-66). Nothing sets it before CHY-53; tests set it with SQL. The settings row is owner-updatable (:50-51), so restore needs no function or new grant. Confidence 85% (advisor r1 moved it from `profiles`).
- [AC5] Q: "5 ngày" by ceil, floor or round? A: ceil: an account erased in 4 d 23 h reads "5 ngày", never "0 ngày" on its last day. Confidence 85%.
- [AC5] Q: what does "Để sau … leaves me on the login screen" do with the session? A: sign out. Keeping the session would let the guard put the learner into `(app)` on the next tap, which contradicts "leaves me on the login screen". The scrim and Escape do the same, so no path leaves a half-signed-in screen. Confidence 85%.
- [AC5] Q: a `delete_at` already in the past? A: normal landing; the erase job (CHY-53) deletes the auth user, which cascades (learner_tables.sql:2). Confidence 80%.
- [AC5] Q: after restore, Home or the landing rule? A: the landing rule, which is Home for anyone who could request deletion (Settings sits behind onboarding). Confidence 85%.
- [AC4] Q: why move the post-sign-in routine into `afterSignIn`? A: the code field (Task 4) and the callback must land the same way; one function keeps one rule. Confidence 90%.
- [DESKTOP] Q: the code field on desktop? A: it sits in the right column under the "sent" text, above the resend button, so a 1024px tall window keeps resend visible. Confidence 85%.
- [DESKTOP] Q: how does the 1024px art shrink? A: `flex: 0 1 560px`, so it narrows to 464 at 1024 (944 of room - 80 gap - 400) and is 560 from 1200; the 3:2 ratio is kept. Confidence 85%.
- [LOCK] Q: link or code first on the sent view? A: the AC2 texts and resend countdown stay as built; the code field and its button sit between them and the resend button. Confidence 85%.
- Loc 2026-11-11: Q1 = A (code field), Q2 = A, Q3 = A.

## Open — needs an answer before execute
None: WAVE-PLAN Q1 is assumed A.

## Locked (do not re-open)
- Pending deletion 7 days, restorable (CONTEXT.md "Learner"); link + code email (CHY-2 S2 Q2-C).
