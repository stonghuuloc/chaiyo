# CHY-35 — Section: Luyện viết (Hanzi Writer)

## Goal (business why, 1-2 sentences)
A learner writes each character of the lesson twice, traced then from memory, so the strokes stick. The Hanzi Writer wrapper (S1) is also the stroke animation the Từ mới word card reuses (CHY-32.S1).

## Context an agent can't derive from code
- Source of truth for the screen: `prototype/l7-writing.html` (pen 48, outline only in round 1, tools Xem mẫu / Gợi ý / Viết lại) and the loader + radStrokes table in `prototype/step.js:98-102`.
- `hanzi-writer` is not in `package.json` on d090b0a0. Epic M-5 report §7: it lands in S1 and must pass the CI `security` job (`.github/workflows/ci.yml:76-89`).
- Wave plan (M-5 report §8): S1 wave 1 (no deps), S2 wave 4 after CHY-35.S1, CHY-30.S2 (Ledger.record), CHY-25.S1 (catalog).

## Locked decisions (BA/Loc already ruled — never re-open)
- Q3 = A (Loc, 2026-11-13, M-5 wave plan): stroke data loads from the default Hanzi Writer CDN; offline shows the AC6 copy. No stroke data in `static/`, no service-worker caching for it.
- Seam (M-5 report §5): `HanziStrokes.svelte` with an `animate` mode (CHY-32.S1) and a `quiz` mode (CHY-35.S2).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | 2 rounds per char, "1/6"; round 1 outline, round 2 none | high | S2 |
| AC2 | "nét 0/7" counter; Xem mẫu, Gợi ý, Viết lại; red radical; pen 48 | high | S1 |
| AC3 | "Viết xong · 2 nét sai" + Attempt with 2 mistakes | high | S2 |
| AC4 | Skip 你 → 好 round 1, no Attempt for 你 | high | S2 |
| AC5 | Done lists only practised chars | high | S2 |
| AC6 | No stroke data → "Chưa tải được nét chữ…" | high | S1 |

## Out of scope
- The section route, rounds, Attempts, skip, done screen (S2). Word card animation wiring (CHY-32.S1). Offline stroke data (Q3 = A).
