# CHY-15 S1 — discussion
ACs: AC1-AC4 · 2026-11-07

## Answered here (≥80% rule, CREW.md)
- [AC3] Q: the ticket says key = sha256(hanzi + the hachiware voice id). Voice id or Cast id? A: Cast id. Confidence 95%: the importer already computes `key` with the Cast id (audio.ts:15, :54), and the provider voice map lives in the renderer (content-schema.md Audio key row). Re-pinning a voice must not change keys.
- [AC3] Q: recompute keys or trust the manifest? A: check, reusing `audioKey`. Confidence 85%: one rule implementation (architecture.md:27), and a hand-edited manifest fails loudly.
- [AC1] Q: partial failure? A: continue, then throw `RenderError`. Confidence 85%: a 1,666-clip render should not lose 1,000 clips to one bad entry, and re-runs are free (AC2).
- [CHORE] Q: CLI in S1? A: no, S2 (needs the real engine and bucket). Confidence 90%.
- Cast names: Hachiware = redpanda, Momonga = takin (Captain brief); backlog text not edited (WAVE-PLAN P3).

## Requests outside this lane (told to the Captain)
- CHY-8 follow-up slice (WAVE-PLAN Q5 A): bundle carries `audioKey` per sentence, word and chip, built with `audioKey` from audio.ts. The importer is not edited here.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Normal speed only; Cast id in the key; OmniVoice engine.
