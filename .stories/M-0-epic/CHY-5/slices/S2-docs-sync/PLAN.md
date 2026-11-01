# CHY-5 S2 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-5 (same PR #15)

## Anchors (verified 2026-10-31)
- `docs/screens.md:5-9` Decisions (`:7` mixed active recall, `:8` Lexicon in Từ điển tab, `:9` tab bar); `:13` "34 screens and sheets" (table really has 36 rows); `:15-52` inventory (`:24` T3, `:37-38` R1/R2, `:39-41` M1–M3, `:42-46` W1–X2); `:54` templates line
- `docs/screens.md:58-84` Flows (`:64` T1 → R1 → R2, `:77-79` X1, `:82` T3 line); `:100-107` tab briefs (`:106` T3); `:125-138` review/mock/lookup briefs (`:129-130` R1/R2, `:131-133` M1–M3, `:135` W2, `:136` W3); `:151-157` open decisions (`:157` item 5 R1); `:159-161` Next
- `CONTEXT.md:29` Progress "SRS card state"; `:36` Attempt "SRS review"; `:55-61` Mock Test; `:65` Streak "every SRS review due"; `:112-117` Dictionary; `:126-131` Lexicon "own review state"; `:142` Placement "fed into reviews as new cards"; `:158` Primer "no review cards"; `:161-166` Pinyin Table (`:163` Từ điển tab)
- Per-skill state source: `prototype/data/lexicon.js:7` `SKILLS` (the, nghe, viet); `:46` one review entry per skill per word; `:60` `session(all, only)` = mix or one skill; `:80` `review(hz, remembered, skill)`.
- Prototype model: `prototype/p1-session.html:114` `?skill=the|nghe|viet`, default = today's mix; `:122` card id `${skill}:${hz}`; `:148` `review(hz, ok, skill)`; `:274-285` done step = per-skill score + chips. `prototype/t3-practice.html:94-98` skill rows (Thẻ từ, Nghe, Viết chữ → K1; Nói, Viết đoạn → K2); `:107` "N từ đã học và đã lưu" → `t3-words.html`; `:123` Thi thử rows → `p2-skill.html?k=thi`. `prototype/p2-skill.html` → `m2-mock.html` (Exam/Practice).
- Links (`rg -o "[a-z0-9-]*\.html" prototype/<f>.html`): home-glass → p1-session, t3-practice, l0-hub, l1-hub; t3-words → w1-word; w1-word → p1-session, t3-words; x1-lookup → w1-word; l0-hub → w3-pinyin, l0-gate; p2-skill → m2-mock.
- 47 `prototype/*.html` = 35 screen files + 12 not-screens (SPEC lists both).

Docs only: "test first" = write the check script, see it fail on today's docs, then edit until it passes.

## Task 1 [AC1] [AC3] Check script (test first)
File: scratchpad `check-docs.py` (not committed; run in Task 6)
- Parse `docs/screens.md` inventory rows (lines starting `| <ID> |` inside `## Inventory`) → File cells; parse the "Not screens" list.
- Assert: each `prototype/*.html` basename occurs in a File cell or the Not-screens list; only `w1-word` (W1, W2, X2) and `t3-practice` (T3, M1) may occur in >1 File cell; no named file is missing on disk; 37 rows; `:9`-style tab line contains `Hôm nay · Lộ trình · Luyện tập · Tôi`.
- Assert AC3: `rg -n "Từ điển|Tra từ|Dictionary search|\bR1\b|\bR2\b" docs/screens.md CONTEXT.md` → 0 lines (case-sensitive; "từ điển Hán Việt" is lowercase).
- Assert every `[[X]]` in `CONTEXT.md` has a `## X` heading.
- Run now → fails (no File column, R1 present). Record the failing output.

## Task 2 [AC1] screens.md Decisions + inventory
File: `docs/screens.md:5-54`
- `:7` → "Practice is **per skill** (Thẻ từ, Nghe, Viết chữ): each word has a review state per skill; the app grades each answer and maps it to an FSRS rating. One mixed daily session (K1) clears every skill's due cards."
- `:8` → "The **Lexicon is a pushed list** (Từ của tôi, T3a) reached from Luyện tập; the Dictionary is a lookup source (X1), no search screen."
- `:9` tab bar → `Hôm nay · Lộ trình · Luyện tập · Tôi`.
- `:13` → "37 screens and sheets, built from 9 templates. File = the prototype page in `prototype/` that shows it."
- Header → `| ID | Screen | Template | Reached from | File | Core loop |`; every row gets its File cell per SPEC rows list; T3 row → `Luyện tập (practice hub: skills, Thi thử, Từ của tôi)`, Tab root, Tab, `t3-practice.html`, ✅; new T3a row after T3: `Từ của tôi (Lexicon)`, List, `T3, T4, L1, W1`, `t3-words.html`, ✅.
- Delete R1/R2 rows; insert after L9: `K1 | Luyện hôm nay (mixed daily session, or one skill) | Step flow | T1, T3, W1 | p1-session.html | ✅` and `K2 | Luyện kỹ năng (Nói, Viết đoạn, Thi thử intro) | Detail | T3, M1, M3 | p2-skill.html | |`.
- Reached-from fixes: M1 `T3 (Thi thử), T2, T1 at level end`; K2 `T3, M1, M3`; M2 `K2 (Thi thử intro)`; W1 `T3a, X1, A1`; W2 `T3a (saved untaught word)`; W3 `L0`; L8 File `l8-gate.html`, `l0-gate.html` (Primer pool).
- After the templates line, add `**Not screens** (in prototype/, not app screens):` list of the 12 files grouped as in SPEC.

## Task 3 [AC1] [AC3] screens.md Flows
File: `docs/screens.md:58-84`
- `:64` → `   cards due ────────────▶ K1 Luyện hôm nay (every skill mixed) ─▶ done step ─▶ T1`
- `:82` → `T3 Luyện tập ─▶ K1 (mix or one skill) · K2 Nói / Viết đoạn · M1 Thi thử ─▶ K2 intro ─▶ M2 ─▶ M3 · T3a Từ của tôi ─▶ W1 / W2`
- `:77-79` X1 block: taught → W1; untaught → "Thêm vào từ của tôi" in place (Lexicon "tự thêm", opens as W2 from T3a); X2 from W1/W2.
- Add `L0 ─▶ W3 Pinyin Table` to the L0 line `:69-70`.

## Task 4 [AC1] [AC3] screens.md briefs
File: `docs/screens.md:100-138`
- `:106` T3 → Job "Pick what to practise today"; Primary "Luyện hôm nay" → K1; Data "due count per skill, skill rows (Thẻ từ, Nghe, Viết chữ → K1; Nói, Viết đoạn → K2), Thi thử by level → K2, word count → T3a"; States "Nothing due → 'Xong hôm nay' · skill not open yet (Viết đoạn from HSK 3) · Offline: K1 works".
- Add T3a after T3: Job "See your own words"; Primary none (tap → W1/W2); Data "Lexicon: words taught and saved ('tự thêm'), filter by level/lesson/'tự thêm', review state per skill"; States "Empty → 'Học Bài 1 để có từ đầu tiên'".
- Rename section `### Review, Mock Test, lookup` → `### Practice, Mock Test, lookup`. Replace R1 row with K1: Job "Clear due cards with honest recall, per skill"; Primary "Answer → next"; Data "Due cards of every skill (or one, `?skill=`): Thẻ từ (hanzi→meaning), Nghe (audio→hanzi), Viết chữ (trace); answer grades that skill's FSRS state"; States "**Works fully offline**, syncs Attempts later · session cap with 'Ôn tiếp?' · missed card returns once ('gặp lại') · done step: score per skill, words met, next due → 'Về Hôm nay'". Replace R2 row with K2: Job "Practise one skill outside the mix"; Primary "Bắt đầu"; Data "Nói (read aloud, tone scoring), Viết đoạn (HSK 3+), Thi thử intro: level, lock reason, Exam/Practice choice, best Exam score"; States "Skill not built yet → 'sắp có' · Thi thử level locked → reason shown, demo paper for HSK 1".
- M1 Data: prefix "Thi thử block in T3: …" and drop "mode choice" (the choice lives in K2, `p2-skill.html:84-87`). M2 Data: add "HSK 1 = HSK 3.0 Level 1 paper, 40 questions (listening 4 × 5, reading 4 × 5)".

## Task 5 [AC3] screens.md open decisions + Next
File: `docs/screens.md:151-161`
- `:157` → `5. K1: daily new-card limit and session cap values.`
- `:161` → `… wireframes for the core loop: L1–L9, K1, W1, X1.`

## Task 6 [AC2] [AC3] CONTEXT.md
File: `CONTEXT.md`
- `:29` "SRS card state" → "review state per skill".
- `:36` "(gate test, mock test, SRS review, exercise)" → "(gate test, mock test, [[Practice]], exercise)".
- `:65` "cleared every SRS review due that day" → "cleared every skill's due [[Practice]] that day".
- `:114` Dictionary → append "It is looked up by tapping a hanzi (Tra nhanh, screen X1); there is no search screen. Words saved from it become "tự thêm" in the [[Lexicon]]."
- `:128` "each with the Learner's own review state" → "each with the Learner's own review state **per skill** (Thẻ từ, Nghe, Viết chữ)". Add `- **Related**:` [[Practice]] to `:131`.
- New `## Practice` after Lexicon (`:132`): "Luyện tập: a [[Learner]] clears due cards from the [[Lexicon]], one skill per card (Thẻ từ, Nghe, Viết chữ). The daily session mixes every skill's due cards; a Learner may also practise one skill alone. Each answer is an [[Attempt]] and updates only that skill's review state." + "**Not**: a lesson section, not a [[Mock Test]]." + "**Related**: [[Lexicon]], [[Attempt]], [[Streak]]".
- `:142` "fed into reviews as new cards" → "fed into [[Practice]] as new cards".
- `:158` "creates no review cards" → "creates no [[Practice]] cards".
- `:163` "always open in the Từ điển tab" → "opened from the [[Pinyin Primer]] hub".
- Verify: Task 1 script passes; reread each changed entry against SPEC lines AC2.

## Task 7 [CHORE] Commit + PR
- One commit per doc: `docs(screens): …(CHY-5)`, `docs(context): …(CHY-5)`; prettier on both (`rtk proxy pnpm lint` exit 0, CI chain raw per memory).
- Push to PR #15; refresh the PR body Story state + Verification row for S2.
