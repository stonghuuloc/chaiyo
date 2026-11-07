# CHY-15 — Audio Renderer CLI → R2

## Goal (business why, 1-2 sentences)
Turn the importer's audio manifest into one mp3 per entry on R2, so the player (CHY-16) has a clip for every sentence, word and syllable, and re-runs and new content only render what is missing.

## Context an agent can't derive from code
- The ticket names Hachiware and Momonga. **Hachiware = `redpanda`, Momonga = `takin`**, third voice `narrator` (WAVE-PLAN, CHY-14 DISCUSSION).
- The manifest already carries each entry's key: `src/lib/content/import/audio.ts:15` `audioKey(text, voice) = sha256(text + '|' + voice)`, where `voice` is the Cast id (`redpanda`, `takin`, `narrator`), not a provider voice id, and `text` is `hanzi`, or the Word `id` when it is split (audio.ts:59-61). The renderer reuses `audioKey` and keeps no second copy of the rule.
- What the engine is asked to say: `reading ?? hanzi` (audio.ts:5-13; `reading` is set only for split Words).
- Engine is **OmniVoice** (local on Loc's Mac, voice design by text prompt, CC BY-NC weights, accepted). Azure and CosyVoice are dropped. How voices are pinned is CHY-14 S2's ADR 0003 (CHAA-55). redpanda = "female, teenager, moderate pitch".
- Manifest file: `<out>/<sha>/audio-manifest.json` = `{ sha, entries }` (bundle-sink.ts:44-45), from `pnpm import:content content --sink bundle --only lessons/hsk1` (1,666 entries on main).
- The clip bucket is new and public via r2.dev with CORS GET for the app origin (Loc, Q4 A; custom domain before launch). `chaiyo-assets` stays private.

## Locked decisions (BA/Loc already ruled — never re-open)
- Key `sha256(hanzi|voice)`, normal speed only; slow play is the client at 0.5× (content-schema.md:331).
- Engine OmniVoice, local; no commercial use (NOTES.md:3).

## AC index
| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | First render uploads every clip | high | S1 |
| AC2 | Re-running uploads nothing new | high | S1 |
| AC3 | Key is sha256 of hanzi and voice, normal speed only | high | S1 |
| AC4 | Only the new entry is rendered | high | S1 |
| AC5 | Bài 1 clips play from the R2 public URL | high | S2 |

## Out of scope
- Bundle `audioKey` per sentence/word/chip (WAVE-PLAN Q5 A): a CHY-8 follow-up slice outside M-2, requested in S1 DISCUSSION.
- Player, service worker, `/dev/audio` (CHY-16). Syllable batch render and `missing:` check (CHY-17).
