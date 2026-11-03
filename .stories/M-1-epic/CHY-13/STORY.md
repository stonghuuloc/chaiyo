# CHY-13 — Kaishu font subset per lesson bundle

## Goal (business why, 1-2 sentences)
Each lesson ships its own small Kaishu woff2 holding exactly the hanzi that lesson renders, so no character shows as tofu and the font download stays in the single-digit KB.

## Context an agent can't derive from code
- Today the subset is hand-run: `scripts/build-lesson-media.py:61-65` (pyftsubset on `assets/ukai.ttc`, face 0 = CN) then `scripts/stamp-arphic-notice.py`; it reads `prototype/data/<id>.js`, not the real content. The committed `ukai-h1-01.woff2` (6,640 B, 21 hanzi + 。！) came from that path.
- Prototype `ukai-h0-00.woff2` is 357,668 B with 1,241 hanzi although `h0-00.js` holds 34: the old subset was far too wide.
- Source font `assets/ukai.ttc` (17 MB) is tracked in git; license text ships at `static/licenses/ARPHICPL.TXT`; Arphic §2a requires the modification notice in name ID 10.
- Input is the lesson bundle (C3, owner CHY-8: ADR 0002 one JSON bundle per lesson incl. thin Dictionary entries). The bundle format is not written yet.
- `src/lib/styles/fonts.css:62-67` declares one static face for `ukai-h1-01`; no lesson screen reads a bundle yet (lesson routes are placeholders, Catalog is CHY-25).

## Locked decisions (BA/Loc already ruled — never re-open)
- ADR 0002: one static JSON bundle per lesson, built by the importer in CI, same origin.
- Kaishu = AR PL UKai CN, Xingshu only as a learner toggle (PRODUCT.md:46).
- Rule (Loc, 2026-11-03): decide yourself at 80% or more confidence; list the call in DISCUSSION.md.

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | One woff2 per lesson with exactly its chars | low | S1 |
| AC2 | Adding a char to a lesson regenerates its subset | low | S1 |
| AC3 | No tofu in Bài 1 | low | S1 |

## Out of scope
- The importer and bundle format (CHY-8), lint, authoring content, per-lesson `@font-face` loading in the app (Catalog / lesson screens), Xingshu font.
