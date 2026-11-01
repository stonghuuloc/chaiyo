# CHY-5 S2 — summary
ACs: AC1, AC2, AC3  ·  Commits: e7a92da, cdccc4a  ·  PR: #15  ·  Mode: team (impl + tester)

## Shipped
- [AC1] `docs/screens.md` Decisions: tab bar Hôm nay · Lộ trình · Luyện tập · Tôi; practice per skill (K1 mix, K2 one skill); Lexicon = pushed list T3a; Dictionary = lookup only. ✓
- [AC1] Inventory: 37 rows with a File column; R1/R2 replaced by K1 `p1-session` and K2 `p2-skill`; new T3a `t3-words`; Reached-from follows the prototype links. A "Not screens" list names the other 12 files; 35 + 12 = 47 `prototype/*.html`. ✓
- [AC1] Flows: T1 → K1 → T1; T3 line = K1 · K2 · M1 → K2 intro → M2 → M3 · T3a → W1/W2; W3 under L0. Briefs: T3, T3a, K1, K2 rewritten; Exam/Practice choice moved from M1 to K2; M2 names the HSK 3.0 Level 1 paper. ✓
- [AC2] `CONTEXT.md`: Lexicon review state per skill; new **Practice** term; Dictionary looked up by tap (X1), no search screen; "SRS review" wording replaced in Progress, Attempt, Streak, Placement Test, Pinyin Primer. ✓
- [AC3] 0 hits for `Từ điển|Tra từ|Dictionary search|\bR1\b|\bR2\b` in both docs; Pinyin Table opened from the Primer hub; open decision 5 and "Next" name K1. ✓

## Deviated from plan
- Not screens: the `home.html` line does not name `home-glass.html`, so each file occurs once (check script rule).

## Not done / follow-up
- Reached-from on rows this slice does not touch (logout → P2 from T4/U4) → PARKED.md.

## Verification run
- Check script (scratchpad `check-docs.py`): 65 errors on 3209231 → "OK: all checks pass" on cdccc4a.
- Tester, independent: 37 rows; 47/47 files, only w1-word (3×) and t3-practice (2×) repeat; every Reached-from link found in the source page; every `[[Term]]` resolves; diff = 2 files.
- Lead read the Flows and briefs against SPEC :12–14 (tester checked CONTEXT.md entries only).
- CI chain raw on cdccc4a: lint, check, test, build → exit 0.
