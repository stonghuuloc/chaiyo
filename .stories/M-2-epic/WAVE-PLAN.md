# M-2 Audio — wave plan
Design lead CHAA-49 · 2026-11-06 · base main 23f1db9 · issue LOC-39 (parent LOC-38)

M-2 turns the importer's audio manifest into clips on R2, plays them in the app, and makes the red panda talk. Five stories, nine proposed slices. **CHY-14 runs first**: it is the only M-2 story with no open dependency, and CHY-15's engine call, `content/cast.yaml` and the R2 cost all hang on its ADR. CHY-15 S1 and CHY-16 S1 can start beside it because they need no engine (fakes and a fixture clip).

## Stories and proposed slices
| Story | Slice | ACs | Needs first | Kind |
|---|---|---|---|---|
| CHY-14 TTS spike | S1 test set, two renders, listening sheet | AC1-AC3 | Q1-Q3 answered | spike: Loc listens (AC3) |
| CHY-14 | S2 ADR 0003, cast voice map, decision 3 | AC4-AC5 | S1 `results.json`; CHY-12 S2 merged (`content/**`) | decision: Loc names the winner |
| CHY-15 Audio Renderer | S1 `render(manifest)` core: keys, skip, counts, with a fake engine + fake bucket | AC1-AC4 | C5 (on main) | build |
| CHY-15 | S2 real engine + R2 upload + public URL | AC5 | CHY-14 S2, Q4 | build, needs infra (Q4) |
| CHY-16 Audio player | S1 `play(key, { slow })`: 1×/0.5× toggle, `preservesPitch`, quiet failure, iOS unlock | AC1, AC2, AC4 | a fixture mp3 (prototype/talk/nihao.mp3) | build |
| CHY-16 | S2 offline from the service-worker cache + iOS Safari on device | AC3, AC5 | CHY-15 S2 clips, Q5, Q6 | build |
| CHY-17 Pinyin syllable clips | S1 render 1,641 syllable clips + `missing:` check | AC1, AC2 | CHY-15 S2 | build (cost: Q3 table) |
| CHY-17 | S2 cell plays the tone; 20-cell tap test | AC3, AC4 | CHY-16 S1, Q6 | Loc listens (AC4) |
| CHY-18 Talking Cast | S1 frames by loudness, bob, replay, reduced motion | AC1-AC4 | CHY-16 S1, Q6 | build |

Slices other than CHY-14's are frame-level proposals; each story's own design run confirms its split.

## Dependencies
```
 M-1 (on main)                      M-2
 C5 audio manifest ─────────────┬──▶ CHY-15 S1 (fakes) ──┐
 (audio.ts:46-97,               │                        ▼
  bundle-sink.ts:44-45)         │    CHY-14 S1 ──▶ CHY-14 S2 ──▶ CHY-15 S2 ──┬──▶ CHY-16 S2
 C2 import CLI ─────────────────┘      ▲ Q1 Q2 Q3      ▲ CHY-12 S2  ▲ Q4      ├──▶ CHY-17 S1 ──▶ CHY-17 S2
 C3 lesson bundle ── (no audio keys: Q5) ─────────────────────────────────────┘                ▲
                                     CHY-16 S1 ──────────────────────────────────────▶ CHY-18 S1 │ CHY-16 S1
```
- **C5** (frozen): entries `{ key, kind, ref, voice, hanzi, reading?, split? }`, `key = sha256(text|voice)`. On main 23f1db9, `pnpm import:content content --sink bundle --only lessons/hsk1` exits 0 and writes 1,666 entries: 1,641 syllable, 15 sentence, 10 word; voices narrator 1,659, takin 4, redpanda 3. CHY-15 reads `<out>/<sha>/audio-manifest.json`.
- **C2** (frozen): CHY-15 S2 and CHY-17 S1 get the manifest from that command; the renderer never imports content itself.
- **C3** (frozen rev 3): lesson bundles carry no audio key (h1-01.json sentences: `id, hanzi, pinyin, spoken, vi, speaker, lessonId, seg`). Q5 decides where the client gets one.
- **C1** (lint): lint keeps the Cast list as a constant (lint/types.ts:46-48) and never reads `content/cast.yaml`, so CHY-14 S2 can fill it without touching `lint/**`.

## Waves
| Wave | Runs together | Starts when |
|---|---|---|
| A | CHY-14 S1 (Mac), CHY-15 S1, CHY-16 S1 | Loc approves this plan; CHY-14 S1 execute also needs Q1-Q3 |
| B | CHY-14 S2, CHY-18 S1 | S1 `results.json` + CHY-12 S2 merged; CHY-16 S1 merged |
| C | CHY-15 S2 | CHY-14 S2 merged + Q4 |
| D | CHY-16 S2, CHY-17 S1 | CHY-15 S2 merged |
| E | CHY-17 S2 | CHY-17 S1 + CHY-16 S1 merged |
Critical path: 14 S1 → 14 S2 → 15 S2 → 17 S1 → 17 S2, 5 of 9 slices. Run one slice at a time (project rule) and it is 9.

## Lanes and file ownership (no two lanes write one file)
| Lane | Slices | Owns (writes) |
|---|---|---|
| L1 | CHY-14 S1 | `scripts/tts-spike.ts`, `spike/**`, `package.json` +1 (`tts:spike`), `.gitignore` +1, `.prettierignore` +1, `.env.example` Azure + VoiceStudio block |
| L1 | CHY-14 S2 | `docs/adr/0003-tts-engine.md`, `docs/architecture.md` :18 :28 :44, `docs/content-schema.md:372`, `content/cast.yaml` |
| L2 | CHY-15 S1-S2 | `src/lib/audio-renderer/**`, `scripts/render-audio.ts`, `package.json` +1, `.env.example` R2 public block, `docs/content-schema.md:29` (P2) |
| L3 | CHY-16 S1-S2 | `src/lib/audio/**`; in S2 the audio branch of `src/service-worker/**` and the `/dev/audio` route (Q6) |
| L4 | CHY-17 S1-S2 | `scripts/check-syllable-clips.ts`; the syllable grid section of `/dev/audio` (after L3 merges it) |
| L5 | CHY-18 S1 | `src/lib/components/TalkingCast.svelte` + test, talk frames copied from `prototype/talk/redpanda-*.png` (tracked in git) |
- Shared, one-line additions: `package.json` scripts and `.env.example`; the lane that rebases second resolves (M-1 rule).
- Not touched by any M-2 lane while CHY-12 S2 (CHAA-34) runs: `content/**` (except CHY-14 S2's `cast.yaml`, after that merge), `src/lib/content/lint/**`, `src/lib/content/schemas.ts`. If CHY-15 wants a Zod schema for `cast.yaml`, it files a schema change request with the Captain.
- `src/service-worker/**` is also LOC-10/CHY-25 territory: CHY-16 S2 rebases on whichever lands first.
- L2 vs L3 keep separate folders on purpose: the renderer uses `node:crypto`/`node:fs`, the player runs in the browser.

## Questions for Loc
### Q1 [CHY-14] Which engine stands for "VoiceStudio" in the spike?
VoiceStudio (AGPL-3.0 app, runs local on Apple Silicon) hosts many engines. The spike renders 30 items with one of them.
| | A — OmniVoice (default) | B — CosyVoice 3 | C — IndexTTS 2.5 |
|---|---|---|---|
| weights licence | CC-BY-NC | Apache-2.0 | bilibili Model Use License |
| commercial use | **no** | yes | yes, below a revenue cap |
| voices without a reference clip | yes (voice design, saved profile + seed) | no (needs 1 clip per voice) | no (needs 1 clip per voice) |
| install | bundled | one-click, 5.4 GB | one-click, ≥ 12 GB free |
Chaiyo is "me + friends, not commercial" today (NOTES.md:3).
rec: **A** — no reference audio to source, and the ADR records "commercial: no". Pick B if Chaiyo may charge money or run ads within a year.

### Q2 [CHY-14] Which three VoiceStudio voices does the spike use?
Azure side is fixed to the prototype voices Loc has heard (build-lesson-media.py:15): redpanda Xiaoxiao (female), takin Xiaoyi (young female), narrator Yunxi (male).
| voice | A — voice-design prompt (Q1 A) | B — reference clip (Q1 B/C) |
|---|---|---|
| redpanda | "young woman, bright and warm, mid pitch, standard Mandarin" | ≥ 10 s recording by a consenting speaker |
| takin | "girl about 10, cheeky, high pitch" | same |
| narrator | "adult man, calm, clear standard Mandarin" | same |
| clips Loc must source | **0** | **3** (cloning Azure voices is not allowed) |
rec: **A** with these prompts; Loc adjusts by ear in VoiceStudio Design, saves 3 profiles, and the ids go into `spike/sentences.yaml`.

### Q3 [CHY-14] Which Azure Speech tier, and will you create it?
→ Ask Loc: "Create an Azure Speech resource (region southeastasia), then put AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the chaiyo .env on the Mac." Azure bills every character of the SSML except the `<speak>` and `<voice>` tags, and each hanzi counts as 2 (learn.microsoft.com, text-to-speech "Billable characters").
| | A — F0 free | B — S0 pay-as-you-go |
|---|---|---|
| price | 0.5M chars/month free | $15-16 per 1M chars |
| CHY-14 spike, one engine render (110 hanzi × 2 + 27 punctuation + 94 phoneme markup = 341) | $0, < 0.1% of the month | **< $0.01** |
| HSK1 manifest today (1,666 entries; 1,641 syllables ≈ 5.4k chars as text, ≈ 77k if each is a `<phoneme>` over a carrier hanzi; estimate) | $0, 1-16% of one month | $0.08-$1.20 |
| later pronunciation scoring (CHY-57) | same resource | same resource |
rec: **A** now. Upgrade to S0 only when one month's render passes 0.5M chars.

### Q4 [CHY-15] How do clips get a public URL?
CHY-15 AC5 opens "the R2 public URL" for a Bài 1 key. Today the only bucket, chaiyo-assets, is private (.env.example:4). HSK1 today is about 1,666 clips × ≈ 12 KB ≈ **20 MB**, inside R2's free 10 GB; R2 egress is free.
| | A — new bucket + r2.dev URL | B — new bucket + custom domain | C — same origin via Vercel rewrite |
|---|---|---|---|
| setup | 1 toggle | a domain on Cloudflare DNS | 1 rewrite in vercel.json |
| production use | Cloudflare rate-limits r2.dev, dev only | yes | yes, but clips count against Vercel bandwidth |
| service worker (CHY-16 S2) | cross-origin: needs CORS + range handling | same as A | same origin, simplest |
rec: **B** if you own a domain on Cloudflare; else A for CHY-15 and B before launch. Either way set CORS `GET` for the app origin.

### Q5 [CHY-16, CHY-8] Where does the app get a clip's key?
Bài 1 bundle h1-01.json has no key on its 15 sentences or 10 words. The manifest dedupes by key: s-h1-01-10, s-h1-01-11 and s-w-1 are all 你好！|narrator, so a lookup by ref finds s-h1-01-10 only.
| | A — bundle carries `audioKey` per sentence, word, chip | B — browser recomputes sha256 |
|---|---|---|
| where the key rule lives | importer only (architecture.md:27) | importer + a copy in the client |
| Bài 1 bundle size | +25 keys × 64 B ≈ **+1.6 KB** raw | +0 |
| work | C3 rev 4: one importer follow-up slice (bundle.ts) | ~20 lines in `src/lib/audio` |
rec: **A** — one implementation of the rule; it needs a CHY-8 follow-up slice, which is not an M-2 lane, so you assign it.

### Q6 [CHY-16, CHY-17, CHY-18] How does M-2 prove ACs that name M-5 screens?
CHY-16 AC3/AC5 need "a Bài 1 lesson step", CHY-17 AC3/AC4 "the Pinyin Table", CHY-18 "listening steps". Those are M-5 (CHY-30, CHY-34, CHY-40), and CHY-40 depends on CHY-17, so CHY-17 AC3 cannot pass inside M-2 as written.
| | A — one dev-only route `/dev/audio` | B — move the ACs to M-5 |
|---|---|---|
| ACs proven in M-2 | **all 5** | 0 of 5 (unit tests only) |
| iOS Safari on device (CHY-16 AC5) | yes, on the dev page | waits for M-5 |
| extra code | 1 route, not in nav, not prerendered | none |
rec: **A**.

### Q7 [M-2] Run wave A as three parallel lanes?
| | A — L1 + L2 + L3 in parallel (story-team multi-slice wave) | B — one slice at a time |
|---|---|---|
| slices on the critical path | **5** | 9 |
| crew threads in wave A | 3 implementers + 1 tester + 1 reviewer | 1 + 1 + 1 |
rec: **A**. The lanes share no file (map above).

## Parked (not M-2 work; recorded so nobody rediscovers them)
| # | Finding | Evidence | Owner |
|---|---|---|---|
| P1 | `deriveSpoken` turns 一 in dates into yí: 一月一号 → "yí yuè yí hào"; a teacher says "yī yuè yī hào" | derive/spoken.ts:18 rule "一 by next tone", run on main 23f1db9 | CHY-8 follow-up, or authors use `spoken`. The engine reads hanzi, so audio is not affected |
| P2 | content-schema.md:29 diagram says key `sha256(text|voice|rate)`; :331 and C5 say no rate | the two lines | CHY-15 S1 (it cites the key) |
| P3 | Backlog CHY-14, CHY-15, CHY-18 still say Hachiware / Momonga | chy-14 :48-49, :62; chy-15 :31, :47-48; chy-18 :22-64 | Captain, when each story frames |
| P4 | CONTRACTS C3 note "at 477935b the hsk1 scope still has 14 lint errors" is stale: main 23f1db9 imports with exit 0 | my run, sha 7915681c… | Captain (CONTRACTS.md) |
