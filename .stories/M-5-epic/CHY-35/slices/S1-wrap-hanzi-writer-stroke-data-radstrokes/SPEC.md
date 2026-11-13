# CHY-35 S1 — spec
ACs: AC2, AC6  ·  Repo: chaiyo  ·  Base: d090b0a0  ·  rev 2

> **AC2** Given I am writing 你 / Then the stroke counter reads "nét 0/7" and rises with every correct stroke / And "Xem mẫu" animates the character, "Gợi ý" highlights the next stroke and "Viết lại" restarts the round / And the radical is red (patched in for characters whose Hanzi Writer data has no `radStrokes`, e.g. 再 见 气) and the pen width is 48
>
> **AC6** Given there is no network for the stroke data / Then I see "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại."

## Behaviour
- [AC2] In `quiz` mode for 你 (7 strokes in hanzi-writer-data 2.0.1), the counter reads `nét 0/–` until the data loads, then `nét 0/7`.
- [AC2] Each correct stroke raises the counter by 1: after stroke 1 → `nét 1/7`; after stroke 7 → `nét 7/7` and `oncomplete({ mistakes })` fires once. A wrong stroke does not move the counter; it raises `mistakes` by 1.
- [AC2] "Xem mẫu" cancels the quiz, animates all strokes of the character once, then restarts the quiz at `nét 0/N`, 0 mistakes. While it animates, the pad ignores input and "Xem mẫu" is disabled.
- [AC2] "Gợi ý" highlights stroke `done` (the next stroke to write). It is disabled after the quiz completes.
- [AC2] "Viết lại" restarts the quiz: counter `nét 0/N`, mistakes 0, the drawn strokes cleared, "Gợi ý" enabled again. `onprogress` reports `{ done: 0, total: N, mistakes: 0 }`.
- [AC2] Radical strokes draw in Lantern Red `#c6301d`; other strokes in Ink `#1d1814`; the outline in Ruled Line `#ddd5c8`. For 再 the data has no `radStrokes`, so S1 patches `[1, 2]`; 见 and 气 get `[0, 1, 2, 3]`. A character whose data has `radStrokes` (你 `[0, 1]`) keeps its own.
- [AC2] The learner's pen draws with Hanzi Writer `drawingWidth: 48`.
- [AC2] `outline` (default `true`) shows the faint outline; `outline={false}` hides it. Flipping it does not re-fetch: it shows/hides the outline and restarts the quiz at `nét 0/N`. S2 flips it per round.
- [AC2] Changing `char` mid-animation never restarts the new character's quiz from the old animation.
- [AC2] `animate` mode renders the pad only (no counter, no tools). `play()` animates the character once, the same animation as "Xem mẫu".
- [AC6] Stroke data loads from `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/<char>.json` (the URL Hanzi Writer's default loader uses, `dist/index.esm.js:2193-2195`).
- [AC6] If that fetch rejects (offline), returns a non-2xx status, or the `hanzi-writer` chunk fails to import, the pad is replaced by the text "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại.", the three tools are disabled, and `onerror()` fires once. Same in both modes.
- [LOCK] Q3 = A: no stroke data in `static/`, no service-worker rule for it (`src/service-worker/index.ts:42` already lets cross-origin GETs through).
- [CHORE] `hanzi-writer@3.7.3` (MIT, zero deps) is added to `dependencies`; the CI `security` job (`pnpm audit --prod --audit-level=high`, semgrep on `src`) stays green.

## Not this slice
- AC1 round captions, AC3 "Viết xong · N nét sai" + Attempt, AC4 skip, AC5 done list, the `/lesson/[id]/writing` route → S2.
- Word-card wiring and what a word card shows on load error → CHY-32.S1.
- radStrokes for later lessons, Arphic credit line → parked (P1, P2).

## Seam (wave 2+ builds against this — exact contract)
`src/lib/components/HanziStrokes.svelte`:
```ts
import type { CharacterJson } from 'hanzi-writer';
import type { StrokeMode, StrokeProgress } from './hanzi-strokes';

type Props = {
	char: string; // one hanzi; changing it rebuilds the writer
	mode: StrokeMode; // 'animate' | 'quiz'
	outline?: boolean; // default true; changing it toggles the outline + restarts the quiz (no re-fetch)
	load?: (char: string) => Promise<CharacterJson>; // default loadStrokes
	onprogress?: (p: StrokeProgress) => void; // quiz: on load, correct stroke, mistake, Viết lại, after Xem mẫu, outline flip
	oncomplete?: (p: { mistakes: number }) => void; // quiz: last stroke written, once per round
	onerror?: () => void; // stroke data or library failed to load
};
export function play(): Promise<void>; // via bind:this; animates once; resolves at once in the error state
```
`src/lib/components/hanzi-strokes.ts`:
```ts
import type { CharacterJson, HanziWriterOptions } from 'hanzi-writer';
export type StrokeMode = 'animate' | 'quiz';
export type StrokeProgress = { done: number; total: number; mistakes: number };
export const STROKE_DATA = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';
export const PEN_WIDTH = 48;
export const STROKE_COLORS: { ink: string; radical: string; outline: string };
export const RADICALS: Readonly<Record<string, readonly number[]>>; // 再 见 气
export function withRadicals(char: string, data: CharacterJson): CharacterJson;
export function loadStrokes(char: string, fetchFn?: typeof fetch): Promise<CharacterJson>;
export function writerOptions(
	mode: StrokeMode, outline: boolean, size: number, load: (char: string) => Promise<CharacterJson>
): Partial<HanziWriterOptions>;
```
The component is square and fills its parent's width; the consumer sizes the parent.

## Test contract
- [AC2] `withRadicals('再', d)` → `radStrokes [1, 2]`; 见, 气 → `[0, 1, 2, 3]`; `withRadicals('你', {…radStrokes: [0, 1]})` returns it unchanged; an unknown char with no entry stays without `radStrokes`.
- [AC2] `writerOptions('quiz', true, 280, load)` → `drawingWidth 48`, `radicalColor '#c6301d'`, `strokeColor '#1d1814'`, `outlineColor '#ddd5c8'`, `showOutline true`, `showCharacter false`; with `outline false` → `showOutline false`.
- [AC2] `STROKE_COLORS` equals `--color-ink`, `--color-lantern-red`, `--color-ruled-line` in `src/lib/styles/tokens.css`.
- [AC2] Server render of `quiz` mode contains "Xem mẫu", "Gợi ý", "Viết lại" and `nét 0/–`; `animate` mode contains none of them.
- [AC6] `loadStrokes('再', fakeFetch)` requests `STROKE_DATA + '再.json'` and resolves with `radStrokes [1, 2]`; a rejecting fetch → rejects; a 404 response → rejects.
- [AC6] `messages/vi.json` `strokes_load_error` = "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại." exactly.
- [AC2] Browser (`/dev/strokes`, agent-browser): 你 shows `nét 0/7`; one drag along stroke 1's median → `nét 1/7`; an off-target drag → still `nét 1/7`, mistakes 1; strokes 2…7 → `nét 7/7`, `oncomplete` once; outline toggle → `nét 0/7` without re-fetch; "Gợi ý", "Viết lại" (→ `nét 0/7`), "Xem mẫu" observed; 再 radical paths filled `#c6301d` = 2, others `#1d1814`; user stroke path `stroke-width` 48.
- [AC6] Browser: `agent-browser network route "https://cdn.jsdelivr.net/**" --abort`, reload → the AC6 copy is visible, tools disabled; unroute and change `char` without a reload → the new char loads (pad stays mounted under the error text).

## Open assumptions
- None. Q3 is locked (DISCUSSION L1); the loader choice is an engineering detail that keeps the same CDN URL and data version.
