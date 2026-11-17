# CHY-40 S1 — discussion
ACs: AC1, AC2, AC3, AC4 · Repo: chaiyo · Base: d090b0a0

## Locked (not re-opened)
- [LOCK] Template `pushed`, section `roadmap` (docs/adr/0008-responsive-desktop-layout.md:40).
- [LOCK] Audio = Yoyo clips at `SYLLABLE_BASE` (docs/adr/0006-pinyin-chart-plays-yoyo-recordings.md:11, :28; src/lib/audio/base.ts:7).
- [LOCK] Sheet = `src/lib/ui/Sheet.svelte` (ADR 0008:48). Esc + focus return come from `modal.ts` (src/lib/ui/modal.ts:23-26, :45).
- [LOCK] Q1 = A: "–" disabled ⇔ no clip; blank hanzi slot when no sample (AC2 text + ADR 0006:11).
- [LOCK] Epic Q1–Q8 defaults: none touches CHY-40 (report §6; CHY-40 card "Open: none").

## Verified in code (HEAD d090b0a0)
| Fact | Where |
|---|---|
| 405 rows `{syllable, initial, final}`, no hanzi field | content/syllables.yaml:2-406 |
| Grid source drops bia/fiao/tei (`NO_CLIP`) → 402 cells | src/routes/dev/audio/syllable-cells.server.ts:45-56; src/lib/audio-renderer/recorded.ts:28-30 |
| Cell clip = `audioKey(addTone(s,t),'redpanda')` played with `base: SYLLABLE_BASE` | syllable-cells.server.ts:51-55; SyllableGrid.svelte:40 |
| Same key twice → 0.5× (second tap slow), other key → 1× | src/lib/audio/player.ts:19,25 |
| `/dev/audio` gate is dev/preview only → learner page cannot import its `+page.server.ts` | src/routes/dev/audio/+page.server.ts:10 |
| App is client-rendered SPA (`ssr = false`) | src/routes/+layout.ts:8 |
| `(app)` group requires a session | src/routes/(app)/+layout.ts:5-10 |
| Every `(app)` page must declare `shell:` (test walks the tree) | src/lib/shell/layout.test.ts:54-60 |
| Sheet closes on scrim click; panel stops propagation | src/lib/ui/Sheet.svelte:18, :29 |
| Sheet title is an `<h2>` with the given string | Sheet.svelte:31 |
| `/lesson/h0-00` hub page does not exist yet (only `[section]/`, `gate/`) | src/routes/(app)/lesson/[id]/ |
| Prototype per-tone sample hanzi: 1,248 of 1,608 tones; 360 tones none | prototype/data/syllables.js:4 (counted) |
| Prototype ✕: `history.back()` if referrer, else Nhập môn hub | prototype/w3-pinyin.html:68 |

## Settled here (design facts, no owner decision)
- Sample hanzi have no app source → port `{py, hz}` per tone from `prototype/data/syllables.js` into a JSON next to the route (talk lane file, no shared file touched). ü keys: prototype `lv/lve/nv/nve` ↔ app `lü/lüe/nü/nüe`.
- Cell data cannot come from `/dev/audio/+page.server.ts` (404 in prod) → move the pure builder into the route's own module.

## Answered here

### Q1 [AC2] Owner: Loc — A tone that has a Yoyo clip but no sample hanzi: play it, or show "–" disabled?

**Setup** — cell `a`. Yoyo has a1–a4 (ADR 0006:11: 402 × 4 = 1,608 clips). The prototype has sample hanzi only for ā 阿, á 嗄; ǎ and à have none, so the prototype shows them as "–" disabled.

| | A — "no sound" = no clip | B — "no sound" = no sample hanzi (prototype) |
|---|---|---|
| `a` sheet | ā 阿 · á 嗄 · ǎ (blank hanzi) · à (blank hanzi), all 4 play | ā 阿 · á 嗄 · – · –, 2 play |
| `ban` sheet | bān 般 · bán (blank) · bǎn 版 · bàn 办 | bān 般 · – · bǎn 版 · bàn 办 |
| tones playable, whole chart | **1,608** | **1,248** |
| "–" disabled shown on real data | never (all 402 cells have 4 clips) → proven by fixture | 360 tones |

**Gap: 360 tones** the learner can or cannot hear. AC2 wording "a tone with no sound" reads as A; the prototype's look and "each with … a sample hanzi" read as B.

**Answered A** (coordinator for Loc, 2026-11-13): AC2 decides it literally — "–" disabled = no clip. A tone with a clip plays; a missing sample hanzi leaves the slot blank, no placeholder glyph. The "–" branch is proven by fixture. Prototype gaps do not bind.
