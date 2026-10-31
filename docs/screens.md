# Screens

Screen inventory, flows and per-screen briefs. Visual rules: `DESIGN.md`. Domain terms: `CONTEXT.md` (capitalised terms below mean exactly what the glossary says).

Decisions this file rests on:
- A lesson is a **hub of 7 resumable sections**; each section is a full-screen step flow that saves on exit.
- Practice is **per skill** (Thẻ từ, Nghe, Viết chữ): each word has a review state per skill; the app grades each answer and maps it to an FSRS rating. One mixed daily session (K1) clears every skill's due cards; K2 covers the skills outside the mix.
- The **Lexicon is a pushed list** (Từ của tôi, T3a) reached from Luyện tập; the Dictionary is a lookup source (X1), no search screen.
- Phone-first PWA, one column ≤430px. Tab bar (Hôm nay · Lộ trình · Luyện tập · Tôi) shows on tab roots only; it is hidden inside lessons, practice, tests and every pushed screen.

## Inventory

37 screens and sheets, built from 9 templates. File = the prototype page in `prototype/` that shows it.

| ID | Screen | Template | Reached from | File | Core loop |
|---|---|---|---|---|---|
| P1 | Landing Page | Public page | URL | `p1-landing.html` | |
| P2 | Đăng nhập (login) | Public page | P1 | `p2-login.html` | |
| O1 | Chào mừng (first run: name, photo, Reminder time) | Step flow | P2, first login | `o1-welcome.html` | |
| O2 | Placement Test | Test runner | O1 | `o2-placement.html` | |
| O3 | Kết quả xếp lớp (placement result) | Result | O2 | `o3-result.html` | |
| T1 | Hôm nay | Tab root | Tab | `home-glass.html` | ✅ |
| T2 | Lộ trình (Roadmap) | Tab root | Tab, T1 | `t2-roadmap.html` | |
| T3 | Luyện tập (practice hub: skills, Thi thử, Từ của tôi) | Tab root | Tab | `t3-practice.html` | ✅ |
| T3a | Từ của tôi (Lexicon) | List | T3, T4, L1, W1 | `t3-words.html` | ✅ |
| T4 | Tôi (Learner Stats + menu) | Tab root | Tab | `t4-me.html` | |
| L0 | Nhập môn (Pinyin Primer hub, Bài 0) | Hub | T1 first lesson, T2 | `l0-hub.html` | ✅ |
| L0a | Primer section (Thanh điệu · Vận mẫu · Thanh mẫu · Quy tắc viết · Biến điệu) | Step flow | L0 | `l0-section.html` | ✅ |
| L1 | Bài học (lesson hub) | Hub | T1, T2 | `l1-hub.html` | ✅ |
| L2 | Khởi động (warm-up review) | Step flow | L1 | `l2-warmup.html` | ✅ |
| L3 | Từ mới (new words) | Step flow | L1 | `l3-words.html` | ✅ |
| L4 | Ngữ pháp (grammar) | Step flow | L1 | `l4-grammar.html` | ✅ |
| L5 | Hội thoại (dialogue) | Step flow | L1 | `l5-dialogue.html` | ✅ |
| L6 | Nghe & nói (listening + Speaking Answers) | Step flow | L1 | `l6-listen.html` | ✅ |
| L7 | Luyện viết (writing, Hanzi Writer) | Step flow | L1 | `l7-writing.html` | ✅ |
| L8 | Gate Test | Test runner | L1 | `l8-gate.html`, `l0-gate.html` (Primer pool) | ✅ |
| L9 | Kết quả bài kiểm tra (gate result) | Result | L8 | `l9-result.html` | ✅ |
| K1 | Luyện hôm nay (mixed daily session, or one skill) | Step flow | T1, T3, W1 | `p1-session.html` | ✅ |
| K2 | Luyện kỹ năng (Nói, Viết đoạn, Thi thử intro) | Detail | T3, M1, M3 | `p2-skill.html` | |
| M1 | Đề thi thử (Mock Test list for a level) | List | T3 (Thi thử), T2, T1 at level end | `t3-practice.html` (Thi thử block) | |
| M2 | Mock Test (Exam / Practice) | Test runner | K2 (Thi thử intro) | `m2-mock.html` | |
| M3 | Kết quả thi thử (mock result + review) | Result | M2 | `m3-result.html` | |
| W1 | Word Page | Detail | T3a, X1, A1 | `w1-word.html` | ✅ |
| W2 | Dictionary entry (thin, not taught yet) | Detail | T3a (saved untaught word) | `w1-word.html` (thin entry) | |
| W3 | Bảng pinyin (Pinyin Table) | Detail | L0 | `w3-pinyin.html` | |
| X1 | Tra nhanh (lookup popup over text) | Sheet | Tap any hanzi | `x1-lookup.html` | ✅ |
| X2 | Báo lỗi (Error Report) | Sheet | W1, W2, any lesson step | `w1-word.html` (sheet) | |
| U1 | Huy hiệu (Badges) | List | T4 | `u1-badges.html` | |
| U2 | Bạn bè (Friends + leaderboard) | List | T1 friends strip, T4 | `u2-friends.html` | |
| U3 | Public Profile (another Learner) | Detail | U2, search | `u3-profile.html` | |
| U4 | Cài đặt (settings: profile, Reminders, Xingshu toggle, hide profile, delete account) | Settings | T4 | `u4-settings.html` | |
| A1 | Admin: Error Reports inbox | List | T4 (Admin only) | `a1-reports.html` | |
| A2 | Admin: Usage Analytics | Detail | T4 (Admin only) | `a2-usage.html` | |

Templates: Public page · Tab root · Hub · Step flow · Test runner · Result · List · Detail · Sheet (Settings reuses List). Building these 9 well covers every screen.

**Not screens** (in `prototype/`, not app screens):
- Index pages: `bai0.html`, `bai1.html`, `onboard.html`.
- Superseded: `home.html` (replaced by T1's page).
- Content tool: `lessons.html` → `lesson.html`.
- Design boards: `palettes.html`, `logo-ideas.html`, `lesson-images.html`, `wireframes-core-loop.html`, `talk-sample.html`.
- Demo reset: `reset.html`.

## Flows

```
URL ─▶ P1 Landing ─▶ P2 Login ─┬─ first login ─▶ O1 Welcome ─┬─▶ O2 Placement ─▶ O3 Result ─┐
                               │                            └─ skip ────────────────────────┤
                               └─ returning ─────────────────────────────────────────────────▶ T1 Hôm nay

T1 Hôm nay ── one Next CTA, priority order:
   cards due ────────────▶ K1 Luyện hôm nay (every skill mixed) ─▶ done step ─▶ T1
   else current lesson ──▶ L1 Lesson hub (L0 Primer for a new Learner)
   else level finished ──▶ M1 Mock list
   else ─────────────────▶ "Xong hôm nay" (no action)

L0 Primer hub ─▶ 5 × L0a sections ─▶ L8 Gate Test (Primer pool) ─▶ L9 ─▶ L1 Bài 1
             ├─ "Đã biết pinyin" ─▶ L8 straight away (test-out)
             └─ W3 Pinyin Table

L1 Lesson hub ─▶ L2 … L7 (any order after L2, each resumable) ─▶ back to L1
              ├─ T3a Từ của tôi (link beside the word list)
              └─ all 6 sections done ─▶ L8 Gate Test ─▶ L9 Result
                                                      ├─ ≥80%: next lesson unlocks ─▶ L1 (next) / T1
                                                      └─ <80%: retry (fresh questions) or back to L1

Any hanzi in any text ─tap─▶ X1 Lookup ─┬─ taught word ─▶ W1 Word Page
                                         ├─ untaught ────▶ "Thêm vào từ của tôi" in place (Lexicon "tự thêm", opens as W2 from T3a)
                                         └─ "Báo lỗi" ────▶ X2 Error Report (from W1 / W2)

T2 Lộ trình ─▶ L1 (passed or current lesson; locked lessons show why) · ─▶ M1 Mock list per level
T3 Luyện tập ─▶ K1 (mix or one skill) · K2 Nói / Viết đoạn · M1 Thi thử ─▶ K2 intro ─▶ M2 ─▶ M3 · T3a Từ của tôi ─▶ W1 / W2
T4 Tôi ─▶ U1 Badges · U2 Friends ─▶ U3 Profile · U4 Settings · T3a Từ của tôi · A1/A2 (Admin)
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
| T3 | Pick what to practise today | "Luyện hôm nay" → K1 | Due count per skill, skill rows (Thẻ từ, Nghe, Viết chữ → K1; Nói, Viết đoạn → K2), Thi thử by level (M1 block) → K2 intro, word count → T3a | Nothing due → "Xong hôm nay" · skill not open yet (Viết đoạn from HSK 3) · Offline: K1 works |
| T3a | See your own words | none (tap → W1/W2) | Lexicon: words taught and saved ("tự thêm"), filter by level/lesson/"tự thêm", review state per skill | Empty → "Học Bài 1 để có từ đầu tiên" |
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

### Practice, Mock Test, lookup

| ID | Job | Primary action | Data | States |
|---|---|---|---|---|
| K1 | Clear due cards with honest recall, per skill | Answer → next | Due cards of every skill (or one, `?skill=`): Thẻ từ (hanzi→meaning), Nghe (audio→hanzi), Viết chữ (trace); answer grades that skill's FSRS state | **Works fully offline**, syncs Attempts later · session cap with "Ôn tiếp?" · missed card returns once ("gặp lại") · done step: score per skill, words met, next due → "Về Hôm nay" |
| K2 | Practise one skill outside the mix | "Bắt đầu" | Nói (read aloud, tone scoring), Viết đoạn (HSK 3+), Thi thử intro: level, lock reason, Exam/Practice choice, best Exam score | Skill not built yet → "sắp có" · Thi thử level locked → reason shown, demo paper for HSK 1 |
| M1 | Pick a Mock Test for a level | Start | Thi thử block in T3: generated tests + one "Official" (CTI sample), best Exam score each | Level not reached → visible but marked "Chưa tới cấp này" [open: allow anyway?] |
| M2 | Run an HSK 3.0-format exam | Answer / "Nộp" | Sections, timer (Exam), listening audio with play limits (Exam), Speaking Answers for HSKK parts; HSK 1 = HSK 3.0 Level 1 paper, 40 questions (listening 4 × 5, reading 4 × 5) | Exam: auto-submit at time-up, answers at end · Practice: no timer, answer after each question · Leave midway → confirm, Exam attempt discarded |
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
5. K1: daily new-card limit and session cap values.

## Next

Lesson content schema (words, grammar points, dialogue lines, questions, audio keys), then lo-fi wireframes for the core loop: L1–L9, K1, W1, X1.
