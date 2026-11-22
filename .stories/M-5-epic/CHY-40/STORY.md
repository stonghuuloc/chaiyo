# CHY-40 — Bảng pinyin (W3)

## Goal (business why, 1-2 sentences)
A learner can open a table of every pinyin syllable at any time, tap a cell and hear its 4 tones, so a sound can be looked up without leaving the course.

## Context an agent can't derive from code
- Prototype of record: `prototype/w3-pinyin.html` (`?open=ba`), data `prototype/data/syllables.js` (INITIALS × FINALS, per-tone `{py, hz}`).
- The prototype's tone gaps came from its edge-tts clips, "one char per tone picked by primary reading" (NOTES.md:103). The app plays Yoyo instead: 402 syllables × 4 tones = 1,608 clips (docs/adr/0006-pinyin-chart-plays-yoyo-recordings.md:11). So "no sample hanzi" and "no sound" are no longer the same set (DISCUSSION Q1).
- Mirror of the `/dev/audio` syllable grid (CHY-17): `src/routes/dev/audio/SyllableGrid.svelte`, `syllable-cells.server.ts`.

## Locked decisions (BA/Loc already ruled — never re-open)
- W3 Pinyin Table is a Hub/Detail screen: template `pushed`, sidebar from 1024px lights Lộ trình (docs/adr/0008-responsive-desktop-layout.md:40).
- Chart audio = Yoyo recordings under `SYLLABLE_BASE` (ADR 0006:11, :28).
- Sheet = `src/lib/ui/Sheet.svelte`: bottom sheet < 1024px, centred dialog ≥ 1024px, same focus trap, Esc closes (ADR 0008:48).
- Q1 = A (2026-11-13): "–" disabled only for a tone with no clip; a clip without sample hanzi plays with a blank hanzi slot (AC2 text, ADR 0006:11).
- Epic M-5 Q1–Q8 defaults approved by Loc; none touches CHY-40 (report §6 "Open: none").

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Finals × initials + ∅ row; non-syllables empty; no scores | high | S1 |
| AC2 | Tap "ba" → sheet, 4 tones, contour + hanzi; "–" disabled | high | S1 |
| AC3 | `?open=ba` opens the sheet; `?open=xyz` does not | high | S1 |
| AC4 | Đóng / Esc / outside closes, focus returns; ✕ back or Nhập môn | high | S1 |

## Out of scope
- Nhập môn hub itself (`/lesson/h0-00`, CHY-31 / CHY-37), any entry link into `/pinyin` from other screens, tone-accuracy tracking (CHY-37).
