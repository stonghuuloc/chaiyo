# CHY-19 S2 — discussion
ACs: AC4, AC5, AC6 · design lead CHAA-103 · 2026-11-09

## Answered here (≥80% rule, CREW.md)
- [AC4] Q: how does a saved ("tự thêm") word reach Study? A: a second input kind, `WordSaved = { kind: 'saved', word, at }`; `apply` takes `Attempt | WordSaved`. It adds the word with `saved: true` and no card, and emits nothing. Confidence 80%: CONTEXT.md "Attempt" is "one answer to one question", which a save is not. Where saves are stored is WAVE-PLAN Q6 (CHY-24); every Q6 answer stores a save time, so `WordSaved` carries `at` and the Ledger folds it with Attempts by `at` (C-M3-2).
- [AC4] Q: what makes 奶茶 have "no recorded clip"? A: `saved: true`. A nghe Attempt on a saved word emits nothing and makes no card; the nghe lane lists only cards that exist. Confidence 85%: the prototype drops nghe for every word that is not taught (prototype/data/lexicon.js:47); only taught words have clips (content-schema.md:331 keys audio on Words and Sentences).
- [AC4] Q: is a saved word in the thẻ từ session before any review? A: yes, as a new card after the due ones, as the prototype does (lexicon.js:57: thẻ từ takes `new` cards). Viết chữ and nghe take no new cards. The 20-a-day cap is CHY-20. Confidence 85%.
- [AC5] Q: "due today" in which timezone, cut where? A: `session(state, { now, tz, only })`: a card is due when the calendar date of its `due` in `tz` is ≤ the date of `now` in `tz`. Dates come from `localDate` (`formatToParts`, en-US; PLAN Task 2), so a DST change cannot move a card across days. Which tz the app passes is WAVE-PLAN Q3. Confidence 85%.
- [AC5] Q: order inside a skill? A: due ascending, ties in Lexicon insertion order, then new cards (thẻ từ only) in Lexicon order. The fixture's due cards tie, so the Bài 1 order shows. Confidence 80%.
- [AC5] Q: interleave rule? A: the prototype's (lexicon.js:60-71): round-robin over the skills in order thẻ từ, nghe, viết chữ; in each lane take the first card whose word differs from the last card out, else the lane's first card. Neighbours share a skill only when one skill has cards left (each round visits lanes in a fixed order). Confidence 85%. The two rules can conflict, e.g. thẻ từ [你, 好] and nghe [你]: the port then emits 你·the, 你·nghe, 好·the (same word twice) although 你·nghe, 好·the, 你·the keeps both rules. The AC fixture never hits this (checked by run). A better interleave is parked to CHY-42.
- [AC5] Q: "≈ 3 phút": does Study return the string? A: no. `minutes(cards)` returns the number, `max(1, round(Σ seconds / 60))` with 10 / 15 / 35 s (lexicon.js:8-10, :72); the Vietnamese string is the Luyện tập screen's (CHY-41). The test asserts `minutes = 3` and `165` seconds. Confidence 80%.
- [LOCK] Q (advisor r1): the lock says Study is "tested only through `apply`/`rollover` with Attempt sequences" (docs/architecture.md:30), but S2 feeds `WordSaved` and asserts on `session`/`minutes`. A: read the lock as "only through Study's exports, with input sequences"; Task 4 rewrites that sentence of :30 to say so. This touches a locked line, so it goes to Loc. The rewording is needed under every Q6 answer, because Study takes `WordSaved` and S2 tests `session`/`minutes` either way. Confidence 80%.
- [AC6] Q: `only` order? A: lanes always run thẻ từ, nghe, viết chữ; `only` filters them. Confidence 90%.
- [CHORE] Q: docs? A: docs/architecture.md:30 Study row gains `session`, `minutes` and the `WordSaved` input, so the module table matches the code. Confidence 90%.

## Open — needs an answer before execute
None in this file. WAVE-PLAN Q3 (which tz) and Q6 (where saves are stored) change callers, not this slice: `session` takes `tz` as an argument and `WordSaved` is an input type.

## Locked (do not re-open)
- One card per word per skill; tested through Attempts only (STORY.md).
