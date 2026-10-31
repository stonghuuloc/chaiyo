# Chaiyo — Domain Glossary

> The canonical terms for this context. If code or conversation drifts from these, the drift is the bug.

## Chaiyo

The app's name. How a foreign learner says 加油 jiāyóu ("go for it!"), with the joke on the learner's own accent. Also Thai ไชโย "hooray", so "Chaiyo!" can be the cheer when a [[Learner]] passes a [[Gate Test]]. Logo and tagline not decided yet.

- **Not**: a translated name.
- **Related**: [[Gate Test]]

## Learner

A person with an account. Anyone can sign up; the app is unlisted, not invite-only. Every learning surface — lessons, Dictionary, audio, tests — belongs to a signed-in Learner.

- **Not**: a Guest — there is no Guest. A visitor who is not signed in sees only the [[Landing Page]].
- **Lifecycle**: Active → Pending deletion (hidden, restorable for 7 days) → Deleted (everything the Learner owns is erased; nothing is kept in anonymous form).
- **Related**: [[Landing Page]]

## Landing Page

The single public page. It introduces the app and leads to sign-up / log-in. It shows no lesson content, Dictionary, or audio.

- **Not**: a preview of lessons — content stays behind login.
- **Related**: [[Learner]]

## Progress

Everything a [[Learner]] has achieved and owns: which lessons are passed, unlocked or locked, gate scores, review state per skill, and which words sit in their Lexicon. Private to that Learner — no other Learner can see it.

- **Not**: a processing pipeline (grading jobs, scoring queues) — those are mechanisms, not something a Learner owns.
- **Related**: [[Learner]], [[Attempt]]

## Attempt

One answer by a [[Learner]] to one question, anywhere in the app (gate test, mock test, [[Practice]], exercise): what was asked, what they answered, whether it was correct, how long it took, when. Attempts are only ever added, never changed or removed. [[Progress]], [[Learner Stats]] and [[Usage Analytics]] are all derived from Attempts.

- **Not**: a test session — a gate test is many Attempts.
- **Related**: [[Progress]], [[Learner Stats]], [[Usage Analytics]]

## Learner Stats

What a [[Learner]] sees about their own learning: streak, words known, accuracy per tone, weakest grammar points. Shown inside the app.

- **Not**: [[Usage Analytics]] — Learner Stats are about one Learner, for that Learner.
- **Related**: [[Attempt]], [[Progress]]

## Usage Analytics

What the app owner sees across all Learners: where they drop off, which lessons fail most at the gate, who is still active. Not shown to Learners.

- **Not**: [[Learner Stats]]; also not click or page-view tracking.
- **Related**: [[Attempt]]

## Mock Test

A full practice exam for one HSK level, matching the official HSK 3.0 format (sections, question types, counts, timing). Most Mock Tests are generated from the app's own words and grammar for that level; the official CTI sample paper appears as one extra Mock Test marked "Official".

- **Not**: a gate test — a gate test checks one lesson; a Mock Test covers a whole HSK level. Not an HSK 2.0 paper.
- **Modes**: **Exam** (default) — official section timing, auto-submit at time-up, listening audio plays only as often as the official format allows, answers revealed at the end; only Exam results earn [[Badge]]s. **Practice** — untimed, free replay, answer shown after each question.
- **Related**: [[Attempt]], [[Badge]]

## Streak

The number of consecutive days on which a [[Learner]] did real study. A day counts when, before midnight in the Learner's own timezone, they cleared every skill's due [[Practice]] that day or finished at least one lesson section (warm-up, new words, grammar, dialogue, listening/speaking, writing, or gate test).

- **Not**: days the app was opened; not a count of [[Attempt]]s.
- **Related**: [[Streak Freeze]], [[Learner Stats]], [[Progress]]

## Streak Freeze

A saved day that keeps a [[Streak]] alive when the [[Learner]] misses a day. A Learner earns one for every 7 consecutive counted days, holds at most 2, and one is spent automatically on each missed day. A frozen day keeps the Streak but does not add to it. A missed day with no Freeze left resets the Streak to 0.

- **Not**: bought — there is no currency in the app. Not a free weekly grace day.
- **Related**: [[Streak]]

## Reminder

A once-a-day nudge to study, sent at the time the [[Learner]] picks (default 20:00 their local time) by push notification, email, Telegram, or any mix — the Learner turns each channel on or off. It is not sent if that day already counts toward the [[Streak]].

- **Not**: a progress report or marketing message.
- **Related**: [[Streak]], [[Learner]]

## Public Profile

The part of a [[Learner]]'s [[Progress]] that every other Learner can see: display name, photo, HSK level, current lesson, [[Streak]], words known, and badges. The display name and photo default to the Learner's Google name and photo, and the Learner can change both. A Learner can hide their Public Profile.

- **Not**: the full Progress — gate scores, mistakes, and weak tones stay private. Contact details (email, phone) are never shown to anyone.
- **Related**: [[Learner]], [[Progress]], [[Friend]]

## Friend

Another [[Learner]] you have chosen to follow, so their [[Public Profile]] appears in your own crew list and leaderboard. Being a Friend unlocks nothing extra; it narrows whose Public Profiles you watch.

- **Not**: a permission — non-Friends see the same Public Profile.
- **Related**: [[Public Profile]]

## Badge

A permanent award a [[Learner]] earns once, on reaching a milestone from a fixed list: Streak length, finishing an HSK level, words known, passing a [[Mock Test]], or a skill run (e.g. 50 tone-3 answers right in a row). A Badge is never taken away, even when the [[Streak]] resets. Badges appear on the [[Public Profile]].

- **Not**: points, XP, or a league rank — the app has none.
- **Related**: [[Public Profile]], [[Streak]], [[Mock Test]]

## Hán Việt

The Sino-Vietnamese reading of a Chinese character (学 → học, 爱 → ái). Shown with every character and word, and part of every Vietnamese explanation.

- **Not**: a Vietnamese meaning — 爱 reads "ái" but means "yêu". A "từ điển Hán Việt" may give meanings only, with no readings.
- **Related**: [[Dictionary]], [[Word Page]]

## Dictionary

Every Chinese word the app can look up (about 122k), each with a thin entry: hanzi, pinyin, [[Hán Việt]], Vietnamese meaning, and which lesson teaches it, if any. Shared by all Learners. It is looked up by tapping a hanzi (Tra nhanh, screen X1); there is no search screen. Words saved from it become "tự thêm" in the [[Lexicon]].

- **Not**: the [[Lexicon]] — the Dictionary covers all words; the Lexicon covers only the words a Learner has met.
- **Related**: [[Word Page]], [[Lexicon]]

## Word Page

The rich page for a word the lessons teach: radicals, stroke order, example sentences, picture, audio, and links to every lesson it appears in. The same content for every Learner.

- **Not**: a [[Dictionary]] entry — only words taught in a lesson have a Word Page.
- **Related**: [[Lexicon]], [[Dictionary]]

## Lexicon

The set of words a [[Learner]] has met in lessons or saved from the [[Dictionary]], each with the Learner's own review state **per skill** (Thẻ từ, Nghe, Viết chữ). A word taught in a lesson opens its [[Word Page]]; a word only saved from the Dictionary ("tự thêm") shows its Dictionary entry until a lesson teaches it, then gains the Word Page and keeps its review history. Part of the Learner's [[Progress]].

- **Not**: the [[Dictionary]]; not content of its own — the Lexicon is a Learner's view over shared entries.
- **Related**: [[Word Page]], [[Dictionary]], [[Progress]], [[Practice]]

## Practice

Luyện tập: a [[Learner]] clears due cards from the [[Lexicon]], one skill per card (Thẻ từ, Nghe, Viết chữ). The daily session mixes every skill's due cards; a Learner may also practise one skill alone. Each answer is an [[Attempt]] and updates only that skill's review state.

- **Not**: a lesson section, not a [[Mock Test]].
- **Related**: [[Lexicon]], [[Attempt]], [[Streak]]

## Speaking Answer

A spoken [[Attempt]]: the [[Learner]] records themselves answering a speaking task. A **read-aloud** task has a known sentence, and every syllable is scored against it. A **free answer** (describe a picture, answer a question) has no fixed sentence; pronunciation and fluency are scored, and content and grammar are graded against a rubric. The recording is deleted once scored; only the scores are kept.

- **Not**: a stored recording — the app keeps no audio of Learners.
- **Related**: [[Attempt]], [[Mock Test]]

## Placement Test

An optional test a new [[Learner]] takes to skip ahead. It runs in blocks of 10 questions, one block per level, starting at HSK1. A block passes at 80% or more; the test moves up a level after each passed block and stops at the first failed block. The Learner may also stop after any passed block. Every question offers "Không biết", which counts as wrong, so guessing is never needed. Every lesson below the reached level unlocks. Those lessons' words enter the [[Lexicon]] as not yet reviewed and are fed into [[Practice]] as new cards, about 20 per day, so a placed Learner is not buried under hundreds of due cards. A weak result later never sends the Learner back down.

- **Not**: a [[Mock Test]] — a Placement Test is short and spans levels; a Mock Test is a full exam for one level.
- **Related**: [[Progress]], [[Lexicon]], [[Mock Test]]

## Gate Test

The test at the end of a lesson that decides whether the next lesson unlocks. Passing needs at least 80%. A [[Learner]] who fails can retry as often as they like; each retry draws fresh questions on the same words and grammar. The best score is kept in [[Progress]].

- **Not**: a [[Mock Test]] — a Gate Test covers one lesson and controls unlocking.
- **Related**: [[Progress]], [[Attempt]]

## Pinyin Primer

Bài 0 · Nhập môn: the lesson before HSK1 Bài 1 that teaches reading and hearing pinyin, with no hanzi words. Five sections: the four tones and the neutral tone, finals, initials (in the standard textbook order: b p m f · d t n l · g k h · j q x · zh ch sh r · z c s), spelling rules, and tone changes (3-3, 不, 一). Sounds are taught by their standard features (tone contour, place and manner of articulation, mouth shape), never by comparison to Vietnamese sounds. It ends in a [[Gate Test]] of tone and pinyin questions that unlocks Bài 1. A [[Learner]] who already reads pinyin may take that Gate Test straight away, without doing the sections. Passing the HSK1 block of the [[Placement Test]] also passes it.

- **Not**: a lesson with words — nothing enters the [[Lexicon]], and it creates no [[Practice]] cards. Not the [[Pinyin Table]], which is reference, not a lesson.
- **Related**: [[Gate Test]], [[Pinyin Table]], [[Roadmap]]

## Pinyin Table

The grid of every Mandarin syllable (initial × final), where tapping a cell plays it in all four tones. Reference only, opened from the [[Pinyin Primer]] hub.

- **Not**: a lesson or test — nothing is graded there.
- **Related**: [[Pinyin Primer]], [[Dictionary]]

## Cast

The cast v2 creatures who act out words in pictures and speak in lesson dialogues. Only Cast members who talk in the original (red panda, takin) speak lines or the talking listening prompts; the others (baby panda, sika deer fawn) appear in pictures only. Each speaking Cast member always has the same voice, so a Learner can tell speakers apart by ear. [[Mock Test]]s do not use the Cast; they use plain adult exam voices.

- **Not**: Learners or avatars — the Cast exists only inside lesson content.
- **Related**: [[Word Page]], [[Mock Test]]

## Admin

A [[Learner]] flagged as the app owner. Being Admin unlocks only [[Usage Analytics]] and the [[Error Report]] inbox. Lesson content is never edited inside the app; it is written and reviewed outside it, then published.

- **Not**: a content editor.
- **Related**: [[Usage Analytics]], [[Error Report]]

## Error Report

A note a [[Learner]] sends from a [[Dictionary]] entry or lesson to say something is wrong (a bad meaning, wrong pinyin, broken audio). Reports land in the [[Admin]] inbox.

- **Related**: [[Admin]], [[Dictionary]]

## Roadmap

The ordered path of every lesson from the [[Pinyin Primer]] (Bài 0) through HSK1 to HSK5, grouped into topics, showing which lessons a [[Learner]] has passed, which one is current, and which are still locked behind a [[Gate Test]].

- **Not**: the home screen — home shows only a short slice of the Roadmap around the current lesson.
- **Related**: [[Progress]], [[Gate Test]], [[Placement Test]], [[Pinyin Primer]]
