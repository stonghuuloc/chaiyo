# CHY-24 S3 — discussion
ACs: AC1 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q8 A: a dev-only `/dev/ledger` route proves AC1 on iOS Safari in airplane mode, before the lesson screens (M-5). Q3 A: the page uses Asia/Ho_Chi_Minh, the `settings.tz` default, because no session reads `settings` yet.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: "I finish the Từ mới section of Bài 1" without a lesson screen? A: one button records the 10 Attempts the Từ mới runner will record (one run, `of` 10, one per Bài 1 word). Confidence 85%.
- [AC1] Q: "Từ mới shows as done" and "the Streak counts today" read from where? A: `state()`: `lessons['h1-01'].done` (CHY-20 S1) and `streak.last` = today in `tz` (CHY-21 S1). Confidence 90%.
- [AC1] Q: which store does the page use with no login? A: `supabaseStore(supabase)`: offline every push fails, and online without a session it fails on RLS/grants, so inputs stay pending either way and nothing reaches the server. A memory store would hide that the real path keeps data offline. Confidence 80%.
- [AC1] Q: can an agent prove airplane mode? A: Playwright's `setOffline` on Chromium proves the service worker + IndexedDB path; iOS Safari has its own storage and SW rules, so Loc's iPhone check stays the AC's proof (as /dev/audio's AC5 did, reports/CHY-16.md). Confidence 85%.
- [AC1] Q: Vietnamese UI text on a dev page? A: yes: the app's language; three short lines. Confidence 80%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Attempts are the truth; Progress is derived (STORY.md).
