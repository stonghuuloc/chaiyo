# CHY-28 — Placement Test (O2/O3)

## Goal (business why, 1-2 sentences)
Let a learner who already knows some Chinese skip what they know: one silent easy-to-hard run that stops at the first failed level, a result that says where they start, and Study unlocking the passed levels from the stored Placement Attempts.

## Context an agent can't derive from code
- The prototype is the spec for the run: `prototype/o2-placement.html:46-83` (silent grading, stop when a level can no longer reach 8/10, `MAX_MISS = 3`), `prototype/data/placement.js` (DRAFT bank: 5 levels × 6 "Chọn nghĩa" + 4 "Nghe và chọn chữ", order RRLRLRRLRL, own 3 distractors per item), `prototype/o3-result.html:41-84` (result copy). Checked on 2026-11-11: `questions()` yields 10 items per level, 6 read + 4 listen, and the 200 option strings are all distinct.
- Study already applies placement (CHY-20 S2, on main): an Attempt with `step: { kind: 'placement', level, run, of }` closes its run at `of` answers; a closed run with `right × 100 ≥ 80 × of` and `level === placed + 1` sets `placed = level`, marks every lesson of level ≤ `level` passed + unlocked, adds their words to the Lexicon with no cards, and unlocks the first lesson of `level + 1` (src/lib/study/progress.ts:49-66). A run that never reaches `of` answers changes nothing.
- No curriculum exists outside test fixtures: Catalog (CHY-25) is designed but not built (`src/lib/catalog` absent), and `content/lessons` holds 6 lessons: h0-00 (Primer, `kind: primer`), h1-01 (10 words), h2-01 (12), h3-01 (13), h4-01 (15), h5-01 (15). WAVE-PLAN Q3 picks the source; this design assumes A (generated from those YAML files).
- Listening items need clips. Lesson audio is raw Azure per ADR 0007 (words: redpanda, `poetry-reading`, folder `words/`, key = `audioKey(hanzi, 'redpanda', WORD_STYLE, 'words')`, src/lib/content/import/audio.ts:21-34, 94-105). The prototype's edge-tts `audio/pl/*.mp3` are not used.
- CHY-28 owns the `placement_*` keys in messages/vi.json; Welcome copy (CHY-27) uses `welcome_*`, Login (CHY-26) `login_*`.
- There is no app-wide Ledger yet: only `/dev/ledger` opens one (src/routes/dev/ledger/+page.svelte:20). S3 adds the learner's Ledger.

## Locked decisions (BA/Loc already ruled — never re-open)
- Placement: blocks of 10, 80 % per block, about 20 new cards a day, never demoted (CONTEXT.md "Placement Test"; M-3 WAVE-PLAN locked facts).
- Placed words get thẻ từ cards only, 20 a day (M-3 Q11 A); Study is the only place the rules live (docs/architecture.md:30).
- Attempts are append-only; Progress is derived (docs/architecture.md:41).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | 5 levels × 10 items, silent, "Không biết" = wrong | high | S1 (bank, rules), S2 (screen) |
| AC2 | 3rd miss in a level stops the run | high | S1 |
| AC3 | ✕ asks "Thoát bài kiểm tra?"; Thoát saves nothing | high | S2 |
| AC4 | Result headline, CTA and confetti by levels cleared | high | S3 |
| AC5 | Placement Attempts stored; Study unlocks levels, adds words | high | S3 |

## Out of scope
- Retake entry on T4 (CHY-50), the Roadmap's "qua bằng kiểm tra" label (CHY-49), Home's lesson card (CHY-45), Chuyên đề screens, a lesson hub route.
