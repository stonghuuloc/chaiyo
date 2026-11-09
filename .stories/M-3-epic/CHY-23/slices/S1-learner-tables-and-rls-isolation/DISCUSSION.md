# CHY-23 S1 — discussion
ACs: AC1, AC2, AC3, AC6 · design lead CHAA-103 · 2026-11-09

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: "an empty Postgres database" in CI? A: PGlite with a Supabase shim (`src/lib/db/migrate.ts`): roles `anon`, `authenticated`, `service_role`; no default grants (hosted default since 2026-10-30); schema `auth` with `users (id uuid)` and `auth.uid()` copied from Supabase (`request.jwt.claim.sub`, else `request.jwt.claims ->> 'sub'`). Then every `supabase/migrations/*.sql` in name order. Plus `supabase db reset` on the Mac for the real stack. Confidence 85%: vanilla Postgres cannot run the content migration either (`to authenticated` needs the role), and CI has no Supabase.
- [AC2] Q: does "only her own rows" cover profiles and follows? A: settings, attempts, follows: own rows only. Profiles: every authenticated learner reads profiles that are not `hidden`, plus their own; that is the Public Profile (CONTEXT.md "Public Profile": every other Learner can see it, and it can be hidden). Writes are own-row only on all four. Confidence 85%.
- [AC3] Q: Postgres does not raise on an UPDATE of a row the policy hides. A: test it as "0 rows changed and Nam's row unchanged", and add the case that does raise: Linh moving her own settings row to Nam's id → 42501. Insert as Nam → 42501 on attempts, settings, profiles and follows. Confidence 85%: checked on PGlite 0.5.15 (STORY Context); a trigger cannot see hidden rows either.
- [AC6] Q: which columns? A: C-M3-1: `learner_id, id, question_id, content_sha, skill, word, correct, answer, ms, at, received_at`; `question_id`, `content_sha`, `ms`, `at` are `not null`. No FK on `question_id` or `content_sha`: Practice review cards are built at runtime, not authored (docs/content-schema.md:172), so their question ids are not rows of `questions`; the importer only upserts questions and never prunes them (postgres-sink.ts:196-207), so lesson Attempts still resolve without a FK. Confidence 85%.
- [AC6] Q: `skill` and `word` are not in the AC. A: they are part of "which skill it practised" (CONTEXT.md "Attempt") and Study needs them to rebuild a card on replay (CHY-24). `skill` ∈ the/nghe/viet, and both are null or both set. Confidence 85%.
- [AC1] Q: settings columns? A: `learner_id`, `tz` (IANA name, default `Asia/Ho_Chi_Minh`, the learner's day for Streak and "due today", WAVE-PLAN Q3), `updated_at`. Reminder fields belong to their stories. Confidence 85%.
- [AC1] Q: profiles columns? A: `learner_id`, `display_name` (default ''), `photo_url`, `hidden` (default false), `created_at`. Level, Streak and words known are derived from Attempts, so they are not stored here. Confidence 80%.
- [AC1] Q: follows? A: `(follower_id, followee_id)` PK, `check (follower_id <> followee_id)`, select/insert/delete by the follower only. Confidence 85%.
- [AC1] Q (advisor r1): grants? A: the migration ends with `revoke all on profiles, settings, follows, attempts from anon, authenticated;` and `grant select, insert, update, delete on profiles, settings, follows, attempts to authenticated;`. Hosted Supabase no longer grants new tables, the local CLI 2.101.0 still does, so only explicit grants give one behaviour on both (vendor changelog 45329, read 2026-11-09). `service_role` gets nothing here: no M-3 AC uses it (parked for CHY-47). Confidence 90%.
- [NFR] Q: how is a learner's id filled? A: `default auth.uid()` on every `learner_id` / `follower_id`, so the Ledger never sends it; the policies use `(select auth.uid())` (Supabase's advice: evaluated once per statement). Confidence 85%.

## Open — needs an answer before execute
None in this file. WAVE-PLAN Q3 decides how `settings.tz` is set, not the column.

## Locked (do not re-open)
- Append-only Attempts with `question_id` + `content_sha`; content select-only (STORY.md).
