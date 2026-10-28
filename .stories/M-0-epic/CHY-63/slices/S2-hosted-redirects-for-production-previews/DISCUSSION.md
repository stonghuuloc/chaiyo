# CHY-63 S2 — discussion
ACs: AC6

## Current behaviour (verified, with anchors)
- (not started — S1 is in flight)

## Answered here (no human needed)
- Q4 [AC6] Keep Vercel deployment protection on for previews? A: yes — previews return 302 to Vercel SSO without a login (PR #8 preview). Loc, 2026-10-28.
  The preview URL pattern still goes into the Supabase allow-list. S2 proves the preview leg with an `/authorize` redirect check while logged in as Loc; learner-facing preview sign-in is ⚠️ scoped.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| — | Q4 [AC6] | previews behind deployment protection | A — protection stays on; AC6 preview leg via /authorize redirect, learner sign-in scoped | Loc, 2026-10-28 |

## Open — needs an answer before spec
None recorded yet; S2 discuss starts after S1 is done.

## Locked (do not re-open)
- Hosted site_url = `https://chaiyo.vercel.app` (CHY-2 S2 Q4).
- Q4-A: previews stay behind Vercel deployment protection; AC6 preview leg proven via /authorize redirect, learner sign-in scoped.
