# M-4 Login + onboarding — wave plan
Design lead CHAA (M-4 design wave) · 2026-11-11 · base main 18af4bb · issue LOC-43 (CHY-26 LOC-63, CHY-27 LOC-64, CHY-28 LOC-65, CHY-29 LOC-66)

M-4 gives the app its front door: Login (P2) with Google and an email link, Welcome (O1), the Placement Test (O2/O3) and the Landing Page (P1). Four stories, nine slices. **CHY-26 S1 runs first** because every other slice needs a signed-in learner or the `(onboard)` route group it creates, and because a session is what unblocks the browser Ledger sync proof (CHY-26 S3). CHY-28 S1 (bank, curriculum, run rules) is pure code and runs beside it. CHY-29 is low priority and rides in the last wave.

## Stories and slices
| Story | Slice | ACs | Needs first | Kind |
|---|---|---|---|---|
| CHY-26 Login | S1 login screen, magic link, callback routing | AC1, AC2, AC3, AC6 | main | build + local Supabase + Loc on preview |
| CHY-26 | S2 expired banner, restore sheet, email code | AC4, AC5 | CHY-26 S1; Q1 (assumed A) | build |
| CHY-26 | S3 signed-in Ledger sync proof | CHY-24 AC2, AC5 (carried) | CHY-26 S1 | proof + 1 small fix; Loc on iPhone |
| CHY-27 Welcome | S1 name, photo and reminder steps | AC1, AC2, AC4 | CHY-26 S1 | build |
| CHY-27 | S2 push permission, save profile, placement offer | AC3, AC5, AC6 | CHY-27 S1, CHY-28 S1-S2; Q2 (assumed A) | build + SQL |
| CHY-28 Placement | S1 bank, curriculum and run rules | AC1 (data), AC2 | main; Q3 (assumed A) | build, pure TS + clip render |
| CHY-28 | S2 placement screen and exit confirm | AC1 (screen), AC3 | CHY-28 S1, CHY-26 S1 | build |
| CHY-28 | S3 result screen and Study placement | AC4, AC5 | CHY-28 S2, CHY-26 S3 | build |
| CHY-29 Landing | S1 landing copy, CTA and Lighthouse | AC1-AC3 | CHY-26 S1 | build |

## What M-4 gets from M-0..M-3 (checked on main 18af4bb, not from backlog text)
| Need | On main? | Evidence | Used by |
|---|---|---|---|
| Auth providers: Google + email link + code; hosted redirect allow-list for previews | yes | supabase/config.toml:340-344, :246-252, :351; supabase/templates/magic-link.html:47-59 | CHY-26 |
| Login screen | **no**: one-line stub | src/routes/login/+page.svelte:1-5 | CHY-26 S1 |
| Session guard for app routes | yes | src/lib/shell/guard.ts:6-10, src/routes/(app)/+layout.ts:1-8 | CHY-26 S1 copies it for `(onboard)` |
| Supabase client | yes, implicit flow | src/lib/supabase.ts:1-4; auth-js 2.118.0 GoTrueClient.ts:209 | all |
| Learner tables + RLS + explicit grants | yes | supabase/migrations/20261110000000_learner_tables.sql (profiles, settings with `tz` only, attempts), 20261110000100_learner_grants.sql | CHY-26, CHY-27 |
| A column for onboarding, pending deletion, reminder time or channels | **no** | learner_tables.sql:1-13 | CHY-26 S1/S2, CHY-27 S2 add them |
| Storage bucket for photos | **no** (`[storage]` on, no bucket; PGlite harness has no storage schema) | supabase/config.toml:109-115; src/lib/db/migrate.ts:5-17 | CHY-27 S2 (Q2) |
| Study placement rule (blocks of 10, 80 %, unlocks, Lexicon) | yes | src/lib/study/progress.ts:49-66 | CHY-28 S3 |
| Ledger (IndexedDB, Supabase store, `syncWhenOnline`) | yes; browser sync never shown with a session | src/lib/ledger/*; reports/CHAA-168.md | CHY-26 S3, CHY-28 S3 |
| An app-wide Ledger | **no** (only `/dev/ledger`) | src/routes/dev/ledger/+page.svelte:20 | CHY-28 S3 adds `src/lib/learner` |
| Curriculum (lessons per level, words) | **no**: Catalog CHY-25 designed only, `src/lib/catalog` absent; content has 6 lessons | content/lessons/hsk1..5; src/lib/study/fixtures/curriculum.ts (tests only) | CHY-28 (Q3) |
| Placement bank | prototype only (DRAFT) | prototype/data/placement.js | CHY-28 S1 |
| Word clip key rule (Azure, ADR 0007) | yes | src/lib/content/import/audio.ts:21-34, 94-105 | CHY-28 S1 |
| UI primitives (Button, Sheet, Toast) | yes | src/lib/ui/*.svelte | all UI slices |
| Onboarding art | git-ignored PNGs only (2.2-2.6 MB) | ~/Documents/Projects/chaiyo/assets/onboard, assets/avatars | CHY-26 S1 commits WebP copies |
| Playwright | not a dependency; testers run it from ~/.capy/work (CHY-24 S3 precedent). Launch with `channel: 'chromium'`: the default headless shell reports `Notification.permission` "denied" even when granted; Chromium reports Asia/Ho_Chi_Minh as "Asia/Saigon" (advisor r1, Playwright 1.65) | package.json; reports/CHAA-168.md | all local proofs |

## Dependencies
```
 main ──▶ CHY-26 S1 ──┬──▶ CHY-26 S2 (Q1)
  │        (login,     ├──▶ CHY-26 S3 (sync proof)
  │        (onboard),  ├──▶ CHY-27 S1 ──────────────▶ CHY-27 S2 (Q2)
  │        art)        ├──▶ CHY-29 S1                    ▲  ▲
  │                    └──────────┐                      │  │
  └──▶ CHY-28 S1 (Q3) ───────────▶ CHY-28 S2 ──▶ CHY-28 S3  │
            └─────────── CURRICULUM ─────────────────────────┘
```
CHY-28 S3 needs CHY-26 S3 (`CHY-26 S3 ──▶ CHY-28 S3`: sync after a record in `src/lib/ledger/ledger.ts`). CHY-27 S2 needs `/placement` (CHY-28 S2) for its "Kiểm tra trình độ" row and `CURRICULUM` (CHY-28 S1) for its AC6 Study check.

## Contracts
- **C-M4-1 Account state lives on `settings`** (owner-only, learner_tables.sql:46-51; `profiles` is readable by every learner, :65-66): `onboarded_at timestamptz` (CHY-26 S1, 20261112000000), `delete_at timestamptz` (CHY-26 S2, 20261112000100), `reminder_time time default '21:00'`, `remind_push / remind_email / remind_telegram boolean` (CHY-27 S2, 20261113000000). No trigger creates a settings row; CHY-27 S2's upsert is the first writer, and readers treat "no row" as "not onboarded". New columns ride the existing table grant (learner_tables.sql:72-73); a new table would grant explicitly (CREW.md).
- **C-M4-2 `(onboard)` route group** (CHY-26 S1 owns `src/routes/(onboard)/+layout.ts`, the `requireSession` guard, no tab bar): `/welcome` (CHY-27), `/placement`, `/placement/result` (CHY-28).
- **C-M4-3 Navigation**: every `goto` or `href` to an app route uses `resolve()`; redirects pass `{ replace: true }` (Kit 3.1 deprecates `replaceState`; lint `svelte/no-navigation-without-resolve`). `resolve()` takes route ids with their groups (kit types/index.d.ts:2979-2985; src/lib/shell/tabs.ts:4): `/(app)/(tabs)/today`, `/(app)/(tabs)/roadmap`, `/(onboard)/welcome`, `/(onboard)/placement`, `/(onboard)/placement/result`, `/login`, `/auth/callback`. A route id type-checks only once its route exists, so a slice links only to routes already on its base. Specs write the resulting URL (`/today`) in prose; test rows on `landing()` assert the route id. `'restore'` (CHY-26 S2) is not a route id: `hrefFor` turns it into `resolve('/login') + '?s=restore'`; `?s=expired` is built the same way.
- **C-M4-4 Landing rule** (CHY-26): `landing(settingsRow, now)` → restore sheet (`delete_at` > now) · `/today` (`onboarded_at` set) · `/welcome`. Google, the link and the code all end in `afterSignIn`.
- **C-M4-5 Placement handoff**: `sessionStorage['chaiyo.placement'] = { cleared, attempts }` written by `/placement` when the run ends, read and removed by `/placement/result` after it records the Attempts. An exit writes nothing.
- **C-M4-6 Learner Ledger**: one IndexedDB per learner, `chaiyo-ledger-<uid>` (`/dev/ledger`: `chaiyo-ledger-dev-<uid>`), opened once per uid by `learnerLedger` (CHY-28 S3), dropped on `SIGNED_OUT`.
- **C-M4-7 Hosted rollout**: the preview talks to the hosted project, so before each hosted proof the Captain checks `supabase migration list --linked` on the Mac and pushes the slice's migration (`supabase db push --linked`). This includes the four M-3 migrations if M-3 P5 shows they are missing.

## Waves
| Wave | Runs together | Starts when |
|---|---|---|
| A | CHY-26 S1 (L1 Auth), CHY-28 S1 (L3 Placement) | Loc approves this plan (Q4) |
| B | CHY-26 S2 (L1), CHY-26 S3 (L1b Ledger proof), CHY-27 S1 (L2 Welcome), CHY-28 S2 (L3) | wave A merged |
| C | CHY-27 S2 (L2), CHY-28 S3 (L3), CHY-29 S1 (L4 Landing) | wave B merged (CHY-27 S2 needs CHY-28 S2) |
Critical path: 3 waves (CHY-26 S1 → CHY-28 S2 → CHY-27 S2, or CHY-28 S1 → S2 → S3). One slice at a time (project rule) is 9 in a row.

## Lanes and file ownership (no two lanes write one file in a wave)
| Lane | Slices | Owns (writes) |
|---|---|---|
| L1 Auth | CHY-26 S1, S2 | `src/lib/auth/**` (new); `src/routes/login/**`, `src/routes/auth/callback/**`, `src/routes/(onboard)/+layout.ts` and the `/welcome` stub (S1, handed to L2 after wave A); `static/onboard/{welcome,start-b0,placed}.webp`, `static/brand/logo-224.webp` (S1); `supabase/migrations/20261112000000_onboarded.sql`, `20261112000100_pending_deletion.sql`; `src/lib/db/{onboarded,pending-deletion}.test.ts`; `supabase/config.toml:158` (S1) |
| L1b Ledger proof | CHY-26 S3 | `src/routes/dev/ledger/{+page.svelte,finish.ts,ledger-page.test.ts}`; `src/lib/ledger/{ledger.ts,ledger.test.ts}` (sync after a record, needed by CHY-28 S3) |
| L2 Welcome | CHY-27 S1, S2 | `src/routes/(onboard)/welcome/**` (from wave B), `src/lib/welcome/**` (new); `supabase/migrations/20261113000000_reminders.sql`, `src/lib/db/reminders.test.ts` (S2); `CONTEXT.md:79` (S2) |
| L3 Placement | CHY-28 S1-S3 | `src/lib/placement/**`, `src/lib/curriculum/**`, `src/lib/learner/**` (S3), `src/lib/ui/celebrate.ts` (S3, new file), `src/routes/(onboard)/placement/**`, `scripts/{build-curriculum,placement-clips}.ts`; `package.json` scripts +2 (S1) |
| L4 Landing | CHY-29 S1 | `src/routes/+page.svelte`, `src/routes/+page.ts`, `src/routes/landing.test.ts`, `static/onboard/avatars/*.webp` |
- Shared file: `messages/vi.json`. Each story adds keys under its own prefix (`login_*`, `welcome_*`, `placement_*`, `landing_*`; only L4 changes existing values, `landing_title` and `landing_lede`). It is append-only JSON, so the lane that merges second rebases and keeps both blocks (the M-1/M-3 `package.json` rule). `messages/en.json` is untouched (it holds no keys today).
- Not touched by any M-4 lane: `src/lib/study/**`, `src/lib/ledger/**` apart from L1b's two files (any other defect found by CHY-26 S3 is a fix wave), `src/lib/content/**`, `src/service-worker/**`, earlier migrations.

## Locked facts (no question needed; sources)
- No password, no Guest; only the Landing Page is public (CONTEXT.md "Learner", "Landing Page").
- Email = link + 6-digit code (CHY-2 S2 Q2-C, Loc 2026-10-28).
- Pending deletion 7 days, restorable (CONTEXT.md "Learner").
- Placement: blocks of 10, 80 % per block, ~20 new cards a day, never demoted; placed words get thẻ từ cards only (CONTEXT.md; M-3 Q11 A).
- `settings.tz` set once from the device at first run (M-3 Q3 A): CHY-27 S2 writes it.
- AC beats the design doc: Reminder default 21:00 (CHY-27 AC2) over CONTEXT.md:79's 20:00; CHY-27 S2 syncs the doc.

## Questions for Loc
Each SPEC assumes the recommendation and does not block on the answer.

### Q1 [CHY-26 S2] Does the "Mở email của bạn" screen take the 6-digit code from the email?
The email already carries a link and a code (your CHY-2 pick, "hoặc nhập mã này trong ứng dụng", supabase/templates/magic-link.html:47-59). The AC'd sent screen has no code field, so today the email promises something the app cannot take.
| | A — code field + link | B — link only |
|---|---|---|
| email | unchanged | drop the code box (template lines 47-59) |
| Chaiyo installed on the iPhone home screen (CHY-61) | type **6** digits in the app → signed in in the app | the link opens Safari → signed in in Safari; the installed app stays signed out |
| link opened in Gmail's in-app browser | code still works in the app | signed in inside Gmail's browser only |
| work in CHY-26 S2 | 1 field + `verifyOtp`, 2 local test rows | 1 template edit |
rec: **A**. It keeps your CHY-2 choice true and is the only way an installed web app on iOS signs in by email.

### Q2 [CHY-27 S2] Where does a photo the learner uploads live?
AC5: "my profile stores … the photo". There is no bucket, and the PGlite test harness has no `storage` schema (src/lib/db/migrate.ts:5-17). Sizes below are illustrative for a 256 × 256 JPEG at quality 0.8.
| | A — data URL in `profiles.photo_url` | B — Supabase Storage bucket `avatars` | C — R2 through a server route |
|---|---|---|---|
| bytes per photo | ~15-25 KB JPEG → ~20-33 KB of text in the row | ~15-25 KB file; ~100 B URL in the row | same as B |
| a Friends list of **30** learners (CHY-52) | ~0.6-1 MB of rows in one query | 30 cached image requests | same as B |
| work in CHY-27 S2 | 1 check constraint (≤ 100,000 chars) | bucket + 3 storage policies in a migration + a `storage` stub in migrate.ts | a Vercel route holding R2 keys + JWT check |
| change later | 1 migration moves rows into Storage | — | — |
rec: **A**. Smallest change for M-4 with no new infrastructure; switch to B when the Friends screen (CHY-52) is designed, if its list size makes the rows heavy.

### Q3 [CHY-28] Which curriculum do the Placement result and Study's placement use?
Study needs lessons per level with their word ids; the result screen shows lesson numbers and "+N từ". Catalog (CHY-25) is not built, and `content/lessons` holds 6 lessons.
| | A — generated from `content/lessons` now | B — the prototype outline (prototype/data/roadmap.js) | C — wait for the HSK 1 syllabus (CHY-59) |
|---|---|---|---|
| lessons | 6: Bài 0-5, one per level | 136: HSK 1 Bài 1-40, HSK 2 41-67, HSK 3 68-93, HSK 4 94-115, HSK 5 116-136 | — |
| result, 2 levels cleared | "HSK 3 · Bài 3", "Bài 0–2", "+22 từ" | "HSK 3 · Bài 68", "Bài 0–67", "+800 từ" | — |
| words added to the Lexicon | **22** real word ids | 0 (the outline has counts, no ids), so AC5 "words join the Lexicon" cannot be shown | — |
| grows when content grows | yes, `pnpm curriculum` + drift test | no, hand-edited outline | — |
| CHY-28 S3 ships | wave C | wave C, AC5 partly | after CHY-59 |
rec: **A**. Real ids and real numbers; the numbers grow by themselves as CHY-59 adds lessons.

### Q4 [M-4] Run each wave as parallel lanes?
| | A — lanes per wave (A: 2, B: 4, C: 3) | B — one slice at a time |
|---|---|---|
| waves to finish M-4 | **3** | 9 slices in a row |
| crew threads at the peak (wave B) | 4 implementers + 1 tester + 1 reviewer | 1 + 1 + 1 |
| shared file | `messages/vi.json` (append-only keys per story, second merger rebases) | none |
rec: **A**, as M-3 Q10. If wave B's 4 lanes are too many for one tester, run CHY-26 S3 after CHY-26 S2 in the same lane (still 3 waves).

## Parked (not M-4 work; recorded so nobody rediscovers them)
| # | Finding | Evidence | Owner |
|---|---|---|---|
| P1 | A signed-in visitor on the Landing Page is not sent to Home (docs/screens.md:104 wants it); doing it needs the auth client on a page CHY-29 ships with no JavaScript | CHY-29 S1 DISCUSSION | Loc: a later small slice if wanted |
| P2 | A learner pending deletion can still open `(app)` routes by URL; the guard checks only the session | src/lib/shell/guard.ts:6-10 | CHY-53 (delete account) |
| P3 | A learner who closes the tab during Welcome reaches `(app)` by URL with no settings row; only the next sign-in offers Welcome again | C-M4-4 | CHY-45 (Home) |
| P4 | An open `/dev/ledger` tab keeps its Ledger across a sign-out (dev only) | advisor r1 CHY-26 | none (dev page) |
| P5 | Resend click tracking rewrites magic links through awstrack.me | .stories/M-0-epic/CHY-63/PARKED.md | Captain: check before Loc's AC6 tap |
| P6 | Push on iPhone works only in an installed web app (Safari tab has no `Notification`); Welcome shows the blocked text there | CHY-27 S2 DISCUSSION | CHY-61 / CHY-48 |
| P7 | The placement bank is marked DRAFT in the prototype; CHY-28 ships it unchanged, version `placement-1` | prototype/data/placement.js:2 | Loc: content review any time (data only) |
| P8 | Hosted M-3 migrations were never confirmed on the hosted project (M-3 P5) | M-3 WAVE-PLAN P5 | Captain: C-M4-7 before wave A's hosted proofs |
