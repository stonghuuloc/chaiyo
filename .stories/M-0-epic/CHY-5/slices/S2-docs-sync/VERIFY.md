# CHY-5 S2 — verify
Head `31dd149` (= origin/CHY-5) · docs read on the pushed tree · check script = implementer's `check-docs.py` (scratchpad, not committed) · CI green on 31dd149

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | `docs/screens.md` names a prototype file for every screen: 37 inventory rows, 47/47 `prototype/*.html` placed (35 screen files + 12 Not screens), tab bar and flows follow the prototype |
| AC2 | ✅ | `CONTEXT.md` Lexicon per skill, Practice term, Dictionary lookup only; every `[[Term]]` resolves |
| AC3 | ✅ | `rg -n "Từ điển\|Tra từ\|Dictionary search\|\bR1\b\|\bR2\b" docs/screens.md CONTEXT.md` → 0 lines (exit 1) |

| SPEC line | Verdict | Observed |
|---|---|---|
| :5 Decisions | ✅ | `screens.md:9` "Tab bar (Hôm nay · Lộ trình · Luyện tập · Tôi)"; per-skill practice K1/K2; Lexicon = T3a; Dictionary no search screen |
| :6–9 inventory | ✅ | 37 rows, File column; W2/X2 → `w1-word`, M1 → `t3-practice` block, L8 → `l8-gate` + `l0-gate`; only w1-word (3×) and t3-practice (2×) repeat |
| :10 reached-from | ✅ | tester grepped each source page: K1←home-glass/t3-practice/w1-word; K2←t3-practice/m3-result; T3a←t3-practice/t4-me/l1-hub/w1-word; M2←p2-skill; W1←t3-words/x1-lookup/a1-reports; W3←l0-hub |
| :11 Not screens | ✅ | 12 files listed; 35 + 12 = 47 |
| :12 flows | ✅ | T1 → K1 → done → T1; T3 line verbatim from SPEC; X1 keeps W1/W2/X2; W3 under L0 |
| :13–14 briefs | ✅ | T3, T3a, K1, K2 rows present; M1 has no mode choice; K2 has Exam/Practice; M2 names the HSK 3.0 Level 1 paper (40 q) |
| :15–18 CONTEXT.md | ✅ | tester read Lexicon, Practice, Dictionary, Streak, Progress, Attempt, Placement Test, Pinyin Primer against SPEC |
| :19–21 AC3 | ✅ | rg above → 0; Pinyin Table "opened from the [[Pinyin Primer]] hub"; open decision 5 and Next name K1 |
| :22 LOCK | ✅ | `git diff --name-only 3209231..31dd149 -- ':!.stories'` = CONTEXT.md, docs/screens.md |
| Test contract | ✅ | check script: exit 1, 65 errors on 3209231 (negative control) → "OK: all checks pass", exit 0 on 31dd149 |

## Residual risk
- **The ⚠️ is scoped:** proven = the two docs in this slice's seam / not proven = other docs. `docs/content-schema.md:153` (R1) and `docs/diagrams/flow.html:43,120` (Từ điển tab) are still stale → PARKED.md.
- Reached-from on rows S2 did not touch (logout → P2) is unchecked → PARKED.md.
