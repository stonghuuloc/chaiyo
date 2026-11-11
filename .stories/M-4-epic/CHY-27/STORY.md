# CHY-27 — Welcome first run (O1)

## Goal (business why, 1-2 sentences)
On first sign-in, confirm the name and photo friends will see, pick a Reminder time and channels, then choose Bài 0 or the Placement Test, and save it all to the learner's profile and settings so later screens (Friends, Reminders, Settings) read real values.

## Context an agent can't derive from code
- The prototype is the spec: `prototype/o1-welcome.html:78-146` (three steps: profile, reminder, offer; progress bar + back; `TIMES` 07:00 / 12:30 / 21:00 with 21:00 selected; email on, push and Telegram off by default; real `Notification.requestPermission()`, anything but "granted" → denied state).
- Storage today: `profiles` has `display_name`, `photo_url` (supabase/migrations/20261110000000_learner_tables.sql:1-7); `settings` has only `tz` (:9-13). No column holds a reminder time or channel; CHY-26 S1 adds `settings.onboarded_at` (owner-only), which this story writes.
- Google sign-in fills `session.user.user_metadata` with `full_name`/`name` and `avatar_url`/`picture`; an email-link learner has none, so the name starts empty.
- M-3 Q3 A: `settings.tz` is set once from the device at first run, so Welcome writes it.
- CONTEXT.md:79 says the Reminder default is 20:00; this story's AC2 selects 21:00. AC beats the doc, so CONTEXT.md is synced here.
- Push delivery, VAPID keys, the Telegram bot and Email sending are CHY-48 (Reminder channels); Welcome stores the learner's choices only.
- `/welcome` is a stub in the `(onboard)` group after CHY-26 S1; `/placement` exists after CHY-28 S2.

## Locked decisions (BA/Loc already ruled — never re-open)
- Display name and photo default to the Google values and can be changed (CONTEXT.md "Public Profile").
- A Reminder is once a day at the learner's time, by push, email, Telegram or any mix (CONTEXT.md "Reminder").
- M-3 Q3 A: `settings.tz` from the device at first run.

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Name and photo prefilled from Google; Tiếp needs a name | high | S1 |
| AC2 | Presets 07:00/12:30/21:00, 21:00 selected; custom 06:15 | high | S1 |
| AC3 | Push prompt granted → on; denied → off, disabled, message | high | S2 |
| AC4 | No channel → warning hint, can still continue | high | S1 |
| AC5 | Name, photo, time, channels saved to profile and settings | high | S2 |
| AC6 | Học từ đầu → Home at Bài 0; Kiểm tra → Placement | high | S2 |

## Out of scope
- Sending Reminders or connecting Telegram (CHY-48), Settings U4 (CHY-53), Home content (CHY-45), forcing unfinished learners back to Welcome (no AC).
