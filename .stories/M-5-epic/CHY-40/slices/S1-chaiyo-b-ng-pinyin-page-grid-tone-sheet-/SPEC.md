# CHY-40 S1 — spec
ACs: AC1, AC2, AC3, AC4 · Repo: chaiyo · Base: d090b0a0 · rev 1

## Behaviour
- [AC1] Signed in, opening `/pinyin` shows a table: 36 finals as column headers (a … ün, prototype order), 22 initials as row headers, the first row headed "∅" (no initial).
- [AC1] Exactly 402 cells hold a button labelled with the syllable as spelled in `content/syllables.yaml` (∅ × i → "yi", l × ü → "lü"). Every other (initial, final) pair is an empty, hatched, non-focusable cell — including bia, fiao and tei (`NO_CLIP`, syllable-cells.server.ts:45).
- [AC1] The page records nothing: it imports no Ledger/Study module, shows no score, percent or progress.
- [AC2] Tapping cell "ba" opens `Sheet` titled "ba" with the line "Chạm một thanh để nghe. Chạm lần nữa để nghe chậm." and 4 tone buttons in order 1–4.
- [AC2] Each tone button shows the marked pinyin (`addTone`: bā bá bǎ bà), a tone contour SVG (tone 1 level, 2 rising, 3 dip, 4 falling) and the sample hanzi (ba: 八 拔 把 爸).
- [AC2] Tapping a tone plays its Yoyo clip `${SYLLABLE_BASE}/<key>.mp3` at 1×; tapping the same tone again plays it at 0.5×; a different tone resets to 1× (player.ts:19,25).
- [AC2] [LOCK] Q1 = A: a tone with a clip but no sample hanzi still plays; its hanzi slot is blank, no placeholder glyph (e.g. `a`: ǎ, à). 1,608 of 1,608 real tones play.
- [AC2] [LOCK] Q1 = A: a tone with no clip (`key: null`) shows "–" in place of the pinyin, keeps its contour, is `disabled`, and plays nothing. On real data this never occurs; a fixture proves it.
- [AC3] `/pinyin?open=ba` loads with the table and the "ba" sheet already open (same content as a tap on "ba").
- [AC3] `?open=` matches a cell's syllable exactly (case-sensitive, ü spelled `ü`). No match (`xyz`, `bia`, `BA`, empty) → the table with no sheet, no error.
- [AC4] With the sheet open, each of: tapping "Đóng", pressing Escape, tapping the scrim outside the panel → the sheet closes and focus is on the cell button it was opened from (deep-link case included).
- [AC4] The top bar ✕ ("Quay lại"): if the learner reached `/pinyin` by in-app navigation → `history.back()` to that screen; if `/pinyin` was the first page of the tab (typed URL, reload, external link) → navigate to Nhập môn `/lesson/h0-00`.
- [LOCK] Template `pushed`, section `roadmap`: no tab bar below 1024px, sidebar with Lộ trình lit from 1024px (ADR 0008:40).
- [LOCK] Sheet = `src/lib/ui/Sheet.svelte` (bottom sheet < 1024px, centred ≥ 1024px).
- [NFR] Works at 390×844 and 1440×900: table scrolls inside its own container, header row and ∅ column stay visible (sticky), cell buttons ≥ 44px tall.
- [CHORE] All copy via paraglide `m.*` keys in `messages/vi.json`.

## Not this slice
- The Nhập môn hub page `/lesson/h0-00` (CHY-31 shell lane / CHY-37). This slice only navigates to its URL.
- Any link INTO `/pinyin` from another screen (Primer sections, roadmap). Consumers use the seam below.
- Changing `/dev/audio` or `content/syllables.yaml`.
- Offline caching of chart clips.

## Seam
Route contract other lanes build against (exact):

```ts
// src/routes/(app)/pinyin/+page.ts — the whole file
import type { Shell } from '#lib/shell/template.js';

export const load = ({ url }: { url: URL }) => ({
	shell: { template: 'pushed', section: 'roadmap' } satisfies Shell,
	open: url.searchParams.get('open') // string | null
});
// Link from any (app) screen:
//   resolve('/(app)/pinyin') + '?open=' + encodeURIComponent(syllable)
// syllable = content/syllables.yaml `syllable` (e.g. 'ba', 'yi', 'lü'); unknown → table, no sheet.
```

## Test contract
- [AC1] vitest `chart.test.ts`: `INITIALS.length === 22`, `FINALS.length === 36`, 402 non-null cells, `cellAt('', 'i')?.syllable === 'yi'`, `cellAt('b','ia') === null`, every cell's keys equal `audioKey(addTone(s,t),'redpanda')` (parity with `content/syllables.yaml` minus `NO_CLIP`).
- [AC1] vitest SSR render of `PinyinChart.svelte` (real cells): 402 cell `<button`s in `<tbody>`, row header "∅", no `%`/"điểm" text; route sources import no `#lib/ledger` / `#lib/study`.
- [AC2] vitest SSR render of `PinyinChart` with `open: 'ba'`: dialog title "ba", hint copy, 4 tone buttons bā/八 … bà/爸, 4 contour `<svg`s.
- [AC2] vitest: `PinyinChart` with `open: 'a'` → ǎ and à buttons enabled with an empty hanzi span; fixture `cells` with tone 3 `key: null` → that button `disabled`, text "–".
- [AC2] vitest: `playTone(tone, player)` (`chart.ts`, the handler `PinyinChart` binds to every tone button) calls `player(tone.key, { base: SYLLABLE_BASE })`; with `createPlayer` stubbed (SyllableGrid.test.ts:10-14) two calls on one tone → `src` = `${SYLLABLE_BASE}/<key>.mp3`, `playbackRate` 1 then 0.5; `key: null` → player not called. The button→handler wiring itself is proven only in the browser step.
- [AC3] vitest: `load({ url: new URL('http://x/pinyin?open=ba') }).open === 'ba'`; `findCell('ba')` non-null; `findCell('xyz')`, `findCell('bia')`, `findCell(null)` → null.
- [AC3] vitest SSR render of `PinyinChart` with `open: 'ba'` → dialog titled "ba"; with `'xyz'` → no `role="dialog"`.
- [AC4] vitest: `backTarget(false) === 'h0-00'`, `backTarget(true) === 'back'` (`chart.ts`).
- [AC3][AC4] agent-browser on the dev server, 390×844 and 1440×900: tap ba → sheet; tap tone twice (rate 1 then 0.5 in `audio.playbackRate`); Đóng / Esc / scrim each close with `document.activeElement` = cell "ba"; `?open=ba` reload → sheet open, Esc → focus on "ba"; ✕ after a client-side navigation /roadmap → /pinyin → back on /roadmap; ✕ on a fresh tab → URL `/lesson/h0-00`.
- [LOCK] `layout.test.ts` row `['routes/(app)/pinyin/+page.ts', 'pushed']` and section `roadmap`.

## Open assumptions
- none. Q1 answered A (DISCUSSION.md "Answered here").
