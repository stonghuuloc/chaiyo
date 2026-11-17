# CHY-35 S1 — discussion
ACs: AC2, AC6 · Base: d090b0a0 · 2026-11-13

## Summary
Discuss-summary only: Loc approved the M-5 wave plan and its "If nobody answers" defaults (Q1–Q8). The one default that touches S1 is Q3 = A. No decision is left open for this slice; the frontier is empty.

## Locked (do not re-open)

| # | Decision | Source |
|---|---|---|
| L1 [AC6] | Q3 = A: stroke data from the default Hanzi Writer CDN; offline shows the AC6 copy | M-5 report §6 Q3, Loc go 2026-11-13 |
| L2 [AC2] | Seam = `HanziStrokes.svelte`, modes `animate` (CHY-32.S1) and `quiz` (CHY-35.S2) | M-5 report §5, slices.json |
| L3 [AC2] | Pen width 48, radStrokes patch for 再 见 气 | AC2 text; `prototype/l7-writing.html:88`, `prototype/step.js:99` |

## Facts verified on d090b0a0 and the npm tarballs

| Fact | Evidence |
|---|---|
| `hanzi-writer` absent from deps | `package.json:70-76` |
| hanzi-writer 3.7.3 = latest, MIT, zero runtime deps | `npm view hanzi-writer` (2026-11-13); tarball `package.json` |
| Stroke data is a separate package, hanzi-writer-data 2.0.1, Arphic Public License | tarball `ARPHICPL.TXT`, `COPYING.md` |
| [AC6] Default loader URL = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/<char>.json`, not exported | `dist/index.esm.js:2193-2224` (const, not in the export list at `index.esm.d.ts:440`) |
| [AC6] A `charDataLoader` may return a Promise; a rejection reaches `onLoadCharDataError` | `dist/index.esm.js:2286-2297, 2315-2322` |
| `CharacterJson.radStrokes?: number[]`, `HanziWriterOptions`, `CharDataLoaderFn` are exported types | `dist/types/index.esm.d.ts:52-57, 440` |
| Importing the ESM build in Node does not throw (no top-level DOM access) | `node -e "import('./index.esm.js')"` → ok |
| [AC2] Bài 1 chars with no `radStrokes`: exactly 再 气 见 (15 hanzi in `h1-01.yaml`) | script over the data tarball; 你 [0,1] 好 [0,1,2] 们 [0,1] have it |
| h1-02…h1-05 add 12 more chars with no `radStrokes`: 小 白 牛 老 师 哥 生 一 二 八 几 十 | same script; parked (no M-5 AC) |
| CI `security` job = gitleaks + `pnpm audit --prod --audit-level=high` + semgrep on `src` | `.github/workflows/ci.yml:76-89` |
| No colour literal allowed in `.svelte`/`.css`; `.ts` is allowed | `src/lib/styles/guard.test.ts:7-31`; precedent `src/lib/ui/celebrate.ts:1` |
| [AC2] Token colours = prototype `STROKE`: ink `#1d1814`, lantern-red `#c6301d`, ruled-line `#ddd5c8` | `src/lib/styles/tokens.css:10,19,23`; `prototype/step.js:102` |
| [AC6] Service worker ignores cross-origin GETs, so CDN fetches fail offline | `src/service-worker/index.ts:42` |
| Unit tests run in Node only (no DOM env); components are tested via `svelte/server` render | `vite.config.ts:47-55`; `src/lib/components/TalkingCast.test.ts:1-3` |
| Icons exist: `i-regular-play`, `i-regular-lightbulb`, `i-regular-arrow-counter-clockwise` | `src/lib/assets/icons.svg:3` |
| Dev pages are gated to dev + Vercel preview | `src/routes/dev/audio/+page.server.ts:1-12` |
| App routes are client-only (`ssr = false`) | `src/routes/+layout.ts:8` |

## Engineering choices (mine, no observable AC change)
- [AC6] Q3 = A cannot use the default loader as is: it is not exported and cannot patch `radStrokes`. S1 fetches the **same** URL (`@2.0.1`) with `fetch`, patches, and hands Hanzi Writer the result. Same CDN, same data version, so L1 holds.
- `hanzi-writer` goes in `dependencies` (runtime), so `pnpm audit --prod` covers it. Loaded with a dynamic `import()` inside the effect, so it stays out of the entry chunk.
- [AC6] The error state shows the AC6 copy in both modes and calls `onerror`. CHY-32.S1 decides what a word card shows instead; S1 does not decide it for them.
- Proof in a browser needs a page before S2's route exists → a gated `/dev/strokes` page (same gate as `/dev/audio`).

## Answered here
- None asked. Q3 is locked (L1).

## Parked
- P1: radStrokes for h1-02…h1-05 chars (12 listed above). No M-5 AC; M-5 writing covers Bài 1 only.
- P2: Arphic Public License credit line for the stroke data in Tài khoản/About. No AC; same bucket as the Solar/CVDICT credits in `NOTES.md:113,118`.
