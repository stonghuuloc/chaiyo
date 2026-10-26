# Screens

Screen inventory, flows and per-screen briefs. Visual rules: `DESIGN.md`. Domain terms: `CONTEXT.md` (capitalised terms below mean exactly what the glossary says).

Decisions this file rests on:
- A lesson is a **hub of 7 resumable sections**; each section is a full-screen step flow that saves on exit.
- SRS review uses **mixed active recall**: the card type rotates and the app grades the answer, then maps it to an FSRS rating.
- The **Lexicon lives in the Từ điển tab** next to Dictionary search.
- Phone-first PWA, one column ≤430px. Tab bar (Hôm nay · Lộ trình · Từ điển · Tôi) shows on tab roots only; it is hidden inside lessons, reviews, tests and every pushed screen.

## Inventory

34 screens and sheets, built from 9 templates.

| ID | Screen | Template | Reached from | Core loop |
|---|---|---|---|---|
| P1 | Landing Page | Public page | URL | |
| P2 | Đăng nhập (login) | Public page | P1 | |
| O1 | Chào mừng (first run: name, photo, Reminder time) | Step flow | P2, first login | |
| O2 | Placement Test | Test runner | O1 | |
| O3 | Kết quả xếp lớp (placement result) | Result | O2 | |
| T1 | Hôm nay | Tab root | Tab | ✅ |
| T2 | Lộ trình (Roadmap) | Tab root | Tab, T1 | |
| T3 | Từ điển: Của tôi (Lexicon) / Tra từ (Dictionary search) | Tab root | Tab | ✅ |
| T4 | Tôi (Learner Stats + menu) | Tab root | Tab | |
| L0 | Nhập môn (Pinyin Primer hub, Bài 0) | Hub | T1 first lesson, T2 | ✅ |
| L0a | Primer section (Thanh điệu · Vận mẫu · Thanh mẫu · Quy tắc viết · Biến điệu) | Step flow | L0 | ✅ |
| L1 | Bài học (lesson hub) | Hub | T1, T2 | ✅ |
| L2 | Khởi động (warm-up review) | Step flow | L1 | ✅ |
| L3 | Từ mới (new words) | Step flow | L1 | ✅ |
| L4 | Ngữ pháp (grammar) | Step flow | L1 | ✅ |
| L5 | Hội thoại (dialogue) | Step flow | L1 | ✅ |
| L6 | Nghe & nói (listening + Speaking Answers) | Step flow | L1 | ✅ |
| L7 | Luyện viết (writing, Hanzi Writer) | Step flow | L1 | ✅ |
| L8 | Gate Test | Test runner | L1 | ✅ |
| L9 | Kết quả bài kiểm tra (gate result) | Result | L8 | ✅ |
| R1 | Ôn tập (SRS review session) | Step flow | T1, T3 | ✅ |
| R2 | Xong phần ôn (review summary) | Result | R1 | ✅ |
| M1 | Đề thi thử (Mock Test list for a level) | List | T2, T1 at level end | |
| M2 | Mock Test (Exam / Practice) | Test runner | M1 | |
| M3 | Kết quả thi thử (mock result + review) | Result | M2 | |
| W1 | Word Page | Detail | T3, X1, L3 | ✅ |
| W2 | Dictionary entry (thin, not taught yet) | Detail | T3, X1 | |
| W3 | Bảng pinyin (Pinyin Table) | Detail | T3, L0 | |
| X1 | Tra nhanh (lookup popup over text) | Sheet | Tap any hanzi | ✅ |
| X2 | Báo lỗi (Error Report) | Sheet | W1, W2, any lesson step | |
| U1 | Huy hiệu (Badges) | List | T4 | |
| U2 | Bạn bè (Friends + leaderboard) | List | T1 friends strip, T4 | |
| U3 | Public Profile (another Learner) | Detail | U2, search | |
| U4 | Cài đặt (settings: profile, Reminders, Xingshu toggle, hide profile, delete account) | Settings | T4 | |
| A1 | Admin: Error Reports inbox | List | T4 (Admin only) | |
| A2 | Admin: Usage Analytics | Detail | T4 (Admin only) | |

Templates: Public page · Tab root · Hub · Step flow · Test runner · Result · List · Detail · Sheet (Settings reuses List). Building these 9 well covers every screen.

## Flows

```
URL ─▶ P1 Landing ─▶ P2 Login ─┬─ first login ─▶ O1 Welcome ─┬─▶ O2 Placement ─▶ O3 Result ─┐
                               │                            └─ skip ────────────────────────┤
                               └─ returning ─────────────────────────────────────────────────▶ T1 Hôm nay

T1 Hôm nay ── one Next CTA, priority order:
   reviews due ──────────▶ R1 Review ─▶ R2 Summary ─▶ T1
   else current lesson ──▶ L1 Lesson hub (L0 Primer for a new Learner)
   else level finished ──▶ M1 Mock list
   else ─────────────────▶ "Xong hôm nay" (no action)

L0 Primer hub ─▶ 5 × L0a sections ─▶ L8 Gate Test (Primer pool) ─▶ L9 ─▶ L1 Bài 1
             └─ "Đã biết pinyin" ─▶ L8 straight away (test-out)

L1 Lesson hub ─▶ L2 … L7 (any order after L2, each resumable) ─▶ back to L1
              └─ all 6 sections done ─▶ L8 Gate Test ─▶ L9 Result
                                                      ├─ ≥80%: next lesson unlocks ─▶ L1 (next) / T1
                                                      └─ <80%: retry (fresh questions) or back to L1

Any hanzi in any text ─tap─▶ X1 Lookup ─┬─ taught word ─▶ W1 Word Page
                                         ├─ untaught ────▶ W2 Dictionary entry (save → Lexicon "tự thêm")
                                         └─ "Báo lỗi" ────▶ X2 Error Report

T2 Lộ trình ─▶ L1 (passed or current lesson; locked lessons show why) · ─▶ M1 Mock list per level
T3 Từ điển ─▶ W1 / W2 · W3 Pinyin Table · "Ôn ngay" ─▶ R1
T4 Tôi ─▶ U1 Badges · U2 Friends ─▶ U3 Profile · U4 Settings · A1/A2 (Admin)
```

## Per-screen briefs

Columns: **Job** (why the screen exists) · **Primary action** (exactly one) · **Data** · **States** beyond the normal one. "Offline" means: what still works without network.

### Public and onboarding

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| P1 | Say what the app is (Vietnamese-first, Hán Việt, cast) and get a sign-up | "Bắt đầu học" → P2 | Static copy, 2–3 sample illustrations (no lesson content) | Signed-in visitor → redirect to T1 |
| P2 | Sign in | "Tiếp tục với Google" (secondary: magic link by email) | — | Magic link sent · link expired · Pending-deletion account → "Khôi phục tài khoản?" within 7 days |
| O1 | Confirm display name + photo (default from Google), pick Reminder time and channels, offer placement | "Kiểm tra trình độ" (secondary: "Học từ đầu") | Google name/photo | Push permission denied → keep email/Telegram |
| O2 | Find the starting level fast | Answer → next | Blocks of 10 questions per level (HSK1 up); every question has "Không biết" | Block passes at ≥80% → next level; stops at first failed block · "Dừng ở đây" after any passed block · Quit midway → nothing unlocks, can retake from T4 |
| O3 | Say where they start and what got unlocked | "Bắt đầu Bài N" → L1 | Level reached, lessons unlocked, words added to Lexicon, "~20 từ mới vào ôn mỗi ngày" | Failed HSK1 → start at Bài 0 (Pinyin Primer), no shame copy · Passed HSK1 block → Bài 0 counts as passed |

### Tab roots

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| T1 | Tell the Learner the one thing to do now | Next CTA (see flow) | Due count, current lesson + section, Streak/Freeze, week strip, Roadmap slice, 3 Friends | **Done (prototype).** Scene per state: reviews due · lesson next · day done · Streak at risk · Freeze used. Offline: reviews CTA works, lesson CTA shows "cần mạng" if section not cached |
| T2 | Show the whole path HSK1→5 and where you are | Open current lesson | Levels → topics → lessons with passed / current / locked, best gate score; Mock Tests per level | Locked lesson tap → "Qua Bài N-1 để mở" · Placement-unlocked lessons marked as such · ~350 lessons: virtualised list, jump to current |
| T3 | Find any word; see and review your own words | Search field (Tra từ) / "Ôn ngay" (Của tôi) | Lexicon: words with SRS state, filter by level/lesson/"tự thêm"; Dictionary: 122k entries, search by hanzi, pinyin (with or without tones), Hán Việt, Vietnamese | Empty Lexicon → "Học Bài 1 để có từ đầu tiên" · No search result · Offline: Lexicon works, Dictionary search needs network unless cached |
| T4 | Own stats + door to everything personal | none (menu) | Learner Stats: Streak, words known, accuracy per tone, weakest grammar points; links U1–U4, A1–A2 for Admin | Not enough Attempts for tone stats → hide that block |

### Lesson (core loop)

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| L0 | Teach reading and hearing pinyin before any hanzi | "Tiếp tục: <section>" (secondary: "Đã biết pinyin? Làm bài kiểm tra") | 5 sections with progress, link to W3, gate best score | Gate open from the start (test-out) · Passed via placement → shown as passed |
| L0a | One pinyin topic: short cards, then drills | Tap to hear → "Tiếp"; answer → next | Primer cards (title, explain, syllables, minimal pairs), drills | Every syllable plays on tap (2nd tap = 0.5×) · No Lexicon writes |
| L1 | Show the 7 sections, progress in each, resume point | "Tiếp tục: <section>" | Lesson title/topic, scene image, sections with done/in-progress/not-started, words list preview, gate best score | Gate locked until L2–L7 done · Passed lesson → "Ôn lại" mode, gate retake allowed · Download for offline (audio + images) |
| L2 | Warm up on due/previous words before new material | Answer → next | Due Lexicon items + previous lesson's words | Nothing due → short recap of previous lesson · Skippable when lesson is Bài 1 |
| L3 | Teach 8–15 new words one at a time | "Tiếp" after each word's mini-check | Per word: hanzi (Kaishu, stroke-order animation), pinyin with sandhi, Hán Việt, meaning, picture, audio (one button; 2nd tap = 0.5×), radicals, 1 example | Words enter Lexicon on section finish · Audio missing → text-only + Error Report link |
| L4 | Explain grammar points, then drill | Answer → next | Numbered HSK 3.0 grammar points, Vietnamese explanation, pattern, examples, drills | Long explanation → collapsible "Xem thêm" |
| L5 | Play the dialogue with the Cast voices; check comprehension | Play / "Tiếp" | Lines (speaker, hanzi, pinyin toggle, Vietnamese toggle, audio per line), questions | Every hanzi tappable (X1) · Pinyin/meaning hidden by default after HSK2 [open: confirm] |
| L6 | Listening questions + Speaking Answers | Record / answer | Audio clips, read-aloud sentences, free-answer prompts; scores per syllable/tone | Mic denied → skip speaking, section still completes, Stats note · Scoring failure/offline → "Thử lại" (recording never stored) |
| L7 | Write the lesson's characters | Trace → next | Hanzi Writer stroke data per character | Touch only; on desktop mouse works · Skip a character allowed |
| L8 | Decide unlock: ≥80% passes | Answer → next, then "Nộp bài" | Fresh question draw over the lesson's words + grammar | Quit midway → no score saved · Offline → cannot start (needs fresh draw + server-side result) [open: confirm] |
| L9 | Show score, what was wrong, what unlocked | Pass: "Học Bài N+1" · Fail: "Làm lại" | Score, per-question review, best score | Pass also counts toward Streak, may award Badge (toast) |

### Review, Mock Test, lookup

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| R1 | Clear due reviews with honest recall | Answer → next | Due cards; card type rotates: hanzi→meaning (choice), audio→hanzi (choice), meaning→type pinyin, hanzi→Hán Việt; app maps correctness + time to an FSRS rating | **Works fully offline**, syncs Attempts later · Session cap (e.g. 30) with "Ôn tiếp?" · Wrong answer shows the Word Page summary |
| R2 | Close the loop | "Về Hôm nay" | Count reviewed, accuracy, next due time, Streak counted today | All due cleared → day counts toward Streak |
| M1 | Pick a Mock Test for a level | Start | Generated tests + one "Official" (CTI sample), best Exam score each, mode choice | Level not reached → visible but marked "Chưa tới cấp này" [open: allow anyway?] |
| M2 | Run an HSK 3.0-format exam | Answer / "Nộp" | Sections, timer (Exam), listening audio with play limits (Exam), Speaking Answers for HSKK parts | Exam: auto-submit at time-up, answers at end · Practice: no timer, answer after each question · Leave midway → confirm, Exam attempt discarded |
| M3 | Score per section, review answers | "Xem lại đáp án" | Section scores vs HSK pass mark, per-question review | Exam pass → Badge |
| W1 | Everything about one taught word | Play audio | Hanzi, pinyin, Hán Việt, meaning, radicals, stroke order (animated), examples with audio, picture, lessons it appears in, my review state | Not in my Lexicon yet → still viewable (same for every Learner) · "Báo lỗi" |
| W2 | Thin entry for an untaught word | "Thêm vào từ của tôi" | Hanzi, pinyin, Hán Việt, meaning, "Dạy ở Bài N" if any | Saved → shows "tự thêm"; becomes W1 once its lesson is reached |
| W3 | Hear any syllable | Tap a cell → 4 tones play | Syllable grid (initials × finals), plain | Offline → cells whose audio is cached still play |
| X1 | Look up a tapped hanzi without losing your place | "Xem chi tiết" → W1/W2 | Word under the tap (longest dictionary match, user can shrink to single char), pinyin, Hán Việt, meaning, audio | **Must never cover the tapped text**: anchors above or below it · Multi-char ambiguity → chip row to pick 学 / 学生 |
| X2 | Report a content error in 2 taps | "Gửi" | Auto context (word/lesson/step id), category chips (nghĩa sai · pinyin sai · âm thanh lỗi · khác), optional note | Sent → toast · Offline → queue and send later |

### Tôi children and Admin

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| U1 | Show earned and locked Badges | none | Badge list from the fixed set, earned date | None earned → show next 3 reachable |
| U2 | Watch Friends' progress | "Theo dõi" (search Learners) | Followed Learners' Public Profiles, leaderboard by Streak / words known this week | No Friends → search + share link [open: invite link?] · Hidden profiles never appear |
| U3 | See another Learner's Public Profile | Follow / Unfollow | Name, photo, HSK level, current lesson, Streak, words known, Badges | Hidden profile → "Hồ sơ đang ẩn" |
| U4 | Control account | Per-row toggles | Display name/photo, Reminder time + channels (push/email/Telegram link), Kaishu/Xingshu toggle, hide Public Profile, delete account | Delete → 7-day Pending deletion with restore notice · Telegram link flow (bot deep link) |
| A1 | Triage Error Reports | Mark resolved | Reports with context link, category, note, reporter | Empty inbox |
| A2 | See where Learners drop off | none | Active Learners, gate fail rate per lesson, drop-off per section, Reminder effectiveness | Few users → raw numbers, no charts that imply scale |

## Open decisions

1. L5: hide pinyin/Vietnamese by default from which level?
2. L8: can a Gate Test run offline (pre-drawn questions, graded on sync)?
3. M1: may a Learner take a Mock Test above their unlocked level?
4. U2: share/invite link for Friends, or search only?
5. R1: daily new-card limit and session cap values.

## Next

Lesson content schema (words, grammar points, dialogue lines, questions, audio keys), then lo-fi wireframes for the core loop: L1–L9, R1–R2, W1, X1.
