# CHY-5 S2 — spec
ACs: AC1, AC2, AC3  ·  Repo: chaiyo (`docs/screens.md`, `CONTEXT.md`)  ·  rev 1

## Behaviour
- [AC1] `docs/screens.md` "Decisions" (`:5-9`) state the prototype model: tab bar Hôm nay · Lộ trình · **Luyện tập** · Tôi; practice = one mixed daily session (K1) plus per-skill practice (K2), each word reviewed per skill (Thẻ từ, Nghe, Viết chữ); the Lexicon is a pushed list (`t3-words.html`) reached from Luyện tập; the Dictionary is a lookup source only, no search screen.
- [AC1] Inventory table gains a **File** column. Every row names the prototype file that shows it; a screen that lives inside another file names the host and the part: W2 → `w1-word.html` (thin entry), X2 → `w1-word.html` (sheet), M1 → `t3-practice.html` (Thi thử block), L8 → `l8-gate.html` + `l0-gate.html` (Primer pool).
- [AC1] Inventory rows, in order, with their files (35 screen files, every one in exactly one row's File cell):
  P1 `p1-landing` · P2 `p2-login` · O1 `o1-welcome` · O2 `o2-placement` · O3 `o3-result` · T1 `home-glass` · T2 `t2-roadmap` · **T3 Luyện tập** `t3-practice` · **T3a Từ của tôi (Lexicon)** `t3-words` · T4 `t4-me` · L0 `l0-hub` · L0a `l0-section` · L1 `l1-hub` · L2 `l2-warmup` · L3 `l3-words` · L4 `l4-grammar` · L5 `l5-dialogue` · L6 `l6-listen` · L7 `l7-writing` · L8 `l8-gate`, `l0-gate` · L9 `l9-result` · **K1 Luyện hôm nay** `p1-session` · **K2 Luyện kỹ năng** `p2-skill` · M1 `t3-practice` (block) · M2 `m2-mock` · M3 `m3-result` · W1 `w1-word` · W2 `w1-word` (thin entry) · W3 `w3-pinyin` · X1 `x1-lookup` · X2 `w1-word` (sheet) · U1 `u1-badges` · U2 `u2-friends` · U3 `u3-profile` · U4 `u4-settings` · A1 `a1-reports` · A2 `a2-usage`.
  The count line says 37 screens and sheets.
- [AC1] "Reached from" follows the prototype links (`rg -o "[a-z0-9-]*\.html"` per file): K1 ← T1, T3, W1; K2 ← T3; T3a ← T3, T4, L1, W1; M1 ← T3; K2 ← T3, M1 (Thi thử intro), M3 (thi lại); M2 ← K2; W1 ← T3a, X1, A1; W2 ← T3a (a saved untaught word); W3 ← L0. X1 keeps "Tap any hanzi" (prototype: `x1-lookup.html` sample text).
- [AC1] A **Not screens** list under the table names the other 12 files and why: index pages `bai0`, `bai1`, `onboard`; `home` (superseded by `home-glass`); content tool `lessons` → `lesson`; design boards `palettes`, `logo-ideas`, `lesson-images`, `wireframes-core-loop`, `talk-sample`; demo reset `reset`. 35 + 12 = 47 `.html` files in `prototype/`.
- [AC1] Flows block: T1's first CTA goes to K1 Luyện hôm nay → back to T1; the T3 line becomes `T3 Luyện tập ─▶ K1 (mix or one skill) · K2 Nói / Viết đoạn · M1 Thi thử ─▶ K2 intro ─▶ M2 ─▶ M3 · T3a Từ của tôi ─▶ W1 / W2`; the X1 line keeps W1 / W2 / X2; W3 is reached from L0.
- [AC1] Briefs: T3 brief = Luyện tập (due count per skill, "Luyện hôm nay" CTA, skill rows, Thi thử by level, link to Từ của tôi); new T3a brief = the Lexicon list (filter by level/lesson/"tự thêm", per-skill review state); K1 brief takes R1's job (clear due reviews, per-skill card types, offline, session cap) and R2's close-the-loop result as its done step; K2 brief = one skill (Nói, Viết đoạn) or the Thi thử intro with Exam/Practice choice.
- [AC1] M1/M2/M3 briefs keep their content, except the Exam/Practice choice moves from M1 to K2 (`p2-skill.html:84-87`); M1 Data notes it is the Thi thử block in T3, and M2 Data notes the HSK 3.0 Level 1 paper (40 questions, 8 part types).
- [AC2] `CONTEXT.md` Lexicon (`:126-131`): each word carries **one review state per skill** (Thẻ từ, Nghe, Viết chữ), not one per word; "tự thêm" wording kept.
- [AC2] `CONTEXT.md` gets a **Practice** term (Luyện tập): the daily mixed session over every skill's due cards, plus practice of a single skill; its Attempts update only that skill's review state. Not: a lesson section, not a [[Mock Test]].
- [AC2] `CONTEXT.md` Dictionary (`:112-117`) says it is looked up by tapping a hanzi (Tra nhanh, screen X1) and has **no search screen**; it stays the source of "tự thêm" words.
- [AC2] Every other "SRS review" / "review cards" phrase reads in [[Practice]] terms: [[Progress]] `:29` "review state per skill"; [[Attempt]] `:36` list says "practice" for "SRS review"; [[Streak]] `:65` "cleared every skill's due practice that day"; [[Placement Test]] `:142` "fed into Practice as new cards, about 20 per day"; [[Pinyin Primer]] `:158` "creates no Practice cards". `:177` "reviewed outside it" (content review) stays.
- [AC3] Neither doc contains "Từ điển" as a tab or screen name, "Tra từ", an `R1` or `R2` screen code, or "Dictionary search". `CONTEXT.md:109` "từ điển Hán Việt" (a generic phrase) stays.
- [AC3] Pinyin Table (`CONTEXT.md:163`): "opened from the [[Pinyin Primer]] hub", not "the Từ điển tab".
- [AC3] Open decisions and "Next" (`screens.md:151-161`): item 5 names K1, not R1; "Next" names K1, not R1–R2.
- [LOCK] Screen codes stay; K1/K2 are new; Dictionary stays a term (STORY.md Locked). NOTES.md, DESIGN.md, PRODUCT.md untouched.

## Not this slice
- App code (`src/`) and app tickets CHY-29, CHY-38, CHY-56.
- Writing briefs for screens the prototype does not show (Nói scoring, Viết đoạn).

## Seam
`docs/screens.md`, `CONTEXT.md`. Nothing else changes.

## Test contract
- [AC3] `rg -n "Từ điển|Tra từ|Dictionary search|\bR1\b|\bR2\b" docs/screens.md CONTEXT.md` → only `CONTEXT.md` "từ điển Hán Việt" (lowercase generic phrase, case-sensitive match excludes it).
- [AC1] script check: every `prototype/*.html` basename appears exactly once in screens.md as a File cell or in the Not screens list, except `w1-word` (W1, W2, X2) and `t3-practice` (T3, M1), which may repeat; 47 files covered, 0 missing, 0 unknown names.
- [AC1] inventory has 37 rows; tab bar line reads Hôm nay · Lộ trình · Luyện tập · Tôi.
- [AC2] read-through: Lexicon, Practice, Dictionary, Streak, Progress entries match the behaviour lines above; every `[[Term]]` link in CONTEXT.md resolves to a `## Term` heading.

## Open assumptions
- [AC1] Code **T3a** for Từ của tôi, after the L0a pattern; a different code costs one rename.
