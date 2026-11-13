# CHY-40 S1 — plan
ACs: AC1, AC2, AC3, AC4 · Spec rev 1 · Repo: chaiyo · Branch: CHY-40-S1
Base: .@0836423e

Lane: talk. New files only under `src/routes/(app)/pinyin/` + `scripts/pinyin-chart.ts`. Two shared files get small, isolated edits: `messages/vi.json` (one key block after `shell_skip`) and `src/lib/shell/layout.test.ts` (two table rows).

## Anchors (verified 2026-11-13, re-verified on 0836423e: vi.json rewritten by #148, shell_skip still :45)
- `content/syllables.yaml:2-406` — 405 rows `{ syllable, initial, final }`; 22 initials, 36 finals, no duplicate (initial, final).
- `src/lib/audio-renderer/recorded.ts:28-30` — `NO_CLIP` = bia, fiao, tei.
- `src/routes/dev/audio/syllable-cells.server.ts:40-56` — `loadSyllableClips`: filter `NO_CLIP`, key = `audioKey(addTone(s, t), 'redpanda')`.
- `src/lib/content/import/audio.ts:1` — imports `node:crypto` → `audioKey` is NOT client-safe; `:21-34` `audioKey`; `:62` `addTone`.
- `scripts/placement-clips.ts:1-28` + `src/lib/placement/clips.test.ts:6-15` — repo pattern: script writes a committed JSON of keys, a test re-derives them with `audioKey`.
- `src/lib/audio/player.ts:17-25` — `play(key, { base })`; same key twice → `playbackRate 0.5`.
- `src/lib/audio/base.ts:7` — `SYLLABLE_BASE`.
- `src/routes/dev/audio/SyllableGrid.test.ts:10-14` — player stub via `createPlayer({ base, createAudio })`.
- `src/lib/ui/Sheet.svelte:7` — props `{ open, title, onclose, children }`; `:18` scrim click → `onclose`; `:27` `use:modal`.
- `src/lib/ui/modal.ts:23-26` Esc → `onclose`; `:18,45` focus returns to the element focused at mount.
- `src/routes/(app)/word/[id]/+page.ts:1-3` — `load` returning `shell` pattern.
- `src/lib/shell/layout.test.ts:28-35, 43-46` — template/section tables; `:54-60` every `(app)` page must declare `shell:`.
- `src/routes/(onboard)/placement/+page.svelte:95-107` — top bar ✕ pattern (`grid-cols-[44px_1fr_44px]`, `#i-regular-x`).
- `src/routes/landing.test.ts:1-10` — SSR render test pattern (`render` from `svelte/server`).
- `messages/vi.json:45` — `"shell_skip"` (insert point); params use `{name}` (`:36`).
- `prototype/w3-pinyin.html:17-45` styles, `:62-90` behaviour; `prototype/primer.js:6` `CONTOUR` paths; `prototype/data/syllables.js:4` `SYL[<display>].tones[t].hz` (display keys spell ü, e.g. `"lü"` at :4198).

## Task 1 [AC1] [AC2] Chart data: generator + committed JSON
Files: new `scripts/pinyin-chart.ts`, new `src/routes/(app)/pinyin/chart.json`. Mirrors `scripts/placement-clips.ts:1-28` and `syllable-cells.server.ts:40-56`.
- Read `content/syllables.yaml` (`yaml.parse`), drop `NO_CLIP` rows → 402 rows.
- Per row and tone 1–4: `text = addTone(syllable, t)`, `key = audioKey(text, 'redpanda')`, `hanzi = SYL[syllable]?.tones[t]?.hz ?? null` (import `../prototype/data/syllables.js`).
- Write `[{ syllable, initial, final, tones: [{ text, key, hanzi }, ×4] }]`, tab-indented, trailing newline. No manifest output: the clips are already staged (ADR 0006).
- Run: `pnpm exec tsx scripts/pinyin-chart.ts` → prints `pinyin-chart: 402 cells, 1608 clips, 1248 hanzi`.
- Test first: Task 2's parity test.

## Task 2 [AC1] [AC3] [AC4] `chart.ts` — grid lookup, deep-link match, ✕ target
File: new `src/routes/(app)/pinyin/chart.ts`.
- Export types `Tone = { text: string; key: string | null; hanzi: string | null }`, `ChartCell = { syllable; initial; final; tones: Tone[] }`.
- `INITIALS` (22, `''` first) and `FINALS` (36) in prototype order (`prototype/data/syllables.js:2-3`, ü spelled `ü`).
- `cellAt(cells, initial, final): ChartCell | null`; `findCell(cells, open: string | null): ChartCell | null` (exact match on `syllable`).
- `backTarget(hasPrevious: boolean): 'back' | 'h0-00'`.
- `playTone(tone: Tone, player): Promise<boolean>` → `tone.key ? player(tone.key, { base: SYLLABLE_BASE }).catch(() => false) : Promise.resolve(false)` — the one handler every tone button binds [AC2].
- `CONTOUR: Record<1|2|3|4, string>` = `prototype/primer.js:6` paths.
- Test first: new `chart.test.ts` —
  - `Given_ChartJson_Then_KeysMatchAudioKey`: 402 cells; each tone `key === audioKey(addTone(s,t),'redpanda')`; cell set = yaml minus `NO_CLIP` (clips.test.ts:6-15 pattern).
  - `Given_Grid_Then_22x36_With402Cells`; `cellAt('', 'i')?.syllable === 'yi'`; `cellAt('l','ü')?.syllable === 'lü'`; `cellAt('b','ia') === null`.
  - `Given_ChartJson_Then_1248Hanzi_And_ba_Is_八拔把爸`.
  - `Given_Open_When_FindCell_Then_ExactMatchOnly`: `'ba'` hit; `'xyz'`, `'bia'`, `'BA'`, `''`, `null` → null.
  - `Given_HasPrevious_When_BackTarget_Then_BackElseH000`.
  - `Given_StubPlayer_When_PlayToneTwice_Then_SrcUnderSyllableBase_Rate1Then05` (createPlayer stub, SyllableGrid.test.ts:10-14); `Given_KeyNull_When_PlayTone_Then_PlayerNotCalled` [AC2].
- Verify: `pnpm exec vitest --run src/routes/\(app\)/pinyin/chart.test.ts`

## Task 3 [AC1] [AC2] [AC3] [AC4] `PinyinChart.svelte` — table + tone sheet
File: new `src/routes/(app)/pinyin/PinyinChart.svelte`. No `$app/*` import, so it renders in node tests.
- Props `{ cells: ChartCell[]; open: string | null; player?: (key, opts?) => Promise<boolean> }`, default `player = play` (`#lib/audio/index.js`).
- `let shown = $state(findCell(cells, open))` (the cell whose content the sheet renders) and `let isOpen = $state(shown !== null)` — SSR and first paint already show the deep-linked sheet [AC3]. `shown` is replaced only on the next open, never cleared on close, so the panel keeps its title and tones during the Sheet outro (Sheet.svelte:13 keeps it mounted). Add `// svelte-ignore state_referenced_locally` as in `welcome/+page.svelte:35`.
- Table (`aria-label={m.pinyin_grid_label()}`): `<thead>` corner cell + 36 `<th scope="col">`; `<tbody>` 22 rows, `<th scope="row">` = initial or `∅`; cell → `<td><button data-s={syllable}>` or `<td class="none"></td>` (hatched, no button) [AC1]. Sticky header row and first column; buttons `min-h-11` [NFR]. Styles ported from `prototype/w3-pinyin.html:17-29` onto tokens.
- `onclick` cell → `shown = cell; isOpen = true` (opener = that button, modal.ts:18).
- `<Sheet open={isOpen} title={shown?.syllable ?? ''} onclose={close}>` [AC2]: hint `m.pinyin_hint()`; `Đóng` button `m.pinyin_close()` → `close`; grid of 4 tone buttons:
  - `tone.key` set → `<button aria-label={m.pinyin_tone_label({ tone, pinyin: tone.text })} onclick={() => playTone(tone, player)}>` with `<span>{tone.text}</span>`, contour `<svg viewBox="0 0 44 24" aria-hidden="true"><path d={CONTOUR[t]} /></svg>`, `<span class="hz">{tone.hanzi ?? ''}</span>` [LOCK Q1=A].
  - `tone.key === null` → `<button disabled aria-label={m.pinyin_tone_none({ tone })}>–` + contour + empty hanzi span.
- `close()`: `isOpen = false; table.querySelector(`[data-s="${shown?.syllable}"]`)?.focus()` — focus returns to the cell in the deep-link case too, where the modal's opener is `<body>` [AC4]. Esc and scrim already call `onclose` (modal.ts:23-26, Sheet.svelte:18).
- Test first: new `PinyinChart.test.ts` (SSR, landing.test.ts:1-10 pattern; real `chart.json`, plus one fixture cell):
  - `Given_Cells_When_Render_Then_402CellButtons_And_EmptyTds_And_EmptySetRowHeader` [AC1]; `Then_NoScoreText` (no `%`, no "điểm") [AC1].
  - `Given_Open_ba_When_Render_Then_DialogTitled_ba_With_Hint_And_4Tones_八拔把爸_4Contours` [AC2][AC3].
  - `Given_Open_xyz_When_Render_Then_NoDialog` [AC3].
  - `Given_Open_a_When_Render_Then_ToneButtonsEnabled_With_EmptyHanzi_For_ǎ_à` [AC2 LOCK].
  - `Given_FixtureTone3KeyNull_When_Render_Then_Tone3DisabledDash` [AC2].
  - Tone buttons: SSR cannot click; `playTone` is tested in Task 2, the button→`playTone` wiring in Task 6.2 [AC2].
- Verify: `pnpm exec vitest --run src/routes/\(app\)/pinyin/`

## Task 4 [AC3] [AC4] Route: `+page.ts`, `+page.svelte`, shell rows
Files: new `src/routes/(app)/pinyin/+page.ts`, new `+page.svelte`; edit `src/lib/shell/layout.test.ts:28-35, 43-46`.
- `+page.ts` = the SPEC seam: `load = ({ url }) => ({ shell: { template: 'pushed', section: 'roadmap' } satisfies Shell, open: url.searchParams.get('open') })`.
- `+page.svelte`: top bar (placement/+page.svelte:95-107 pattern): ✕ `aria-label={m.pinyin_back()}`, title `m.pinyin_title()`; then `<PinyinChart cells={chart} open={data.open} />` (chart imported from `./chart.json`).
- `let hasPrevious = false; afterNavigate(({ from }) => { hasPrevious ||= from !== null; })`.
- ✕ → `backTarget(hasPrevious) === 'back' ? history.back() : goto(resolve('/(app)/lesson/[id]', { id: 'h0-00' }))`. If `pnpm check` rejects that RouteId (no `+page` in `lesson/[id]/` on d090b0a0 until CHY-31 lands), use `resolve('/lesson/h0-00' as Pathname)` and say so in SUMMARY — do not create a page in the shell lane's folder.
- `layout.test.ts`: add `['routes/(app)/pinyin/+page.ts', 'pushed']` to `:28-35` and `['routes/(app)/pinyin/+page.ts', 'roadmap']` to `:43-46`.
- Test first: add the two rows (red until `+page.ts` exists); `chart.test.ts` adds `Given_Url_open_ba_When_Load_Then_open_ba_And_PushedRoadmap`.
- Verify: `pnpm exec vitest --run src/lib/shell/layout.test.ts src/routes/\(app\)/pinyin/`

## Task 5 [CHORE] Copy keys
File: `messages/vi.json`, insert after `:45` (`shell_skip`) — one contiguous block, so a parallel lane's append at EOF does not conflict:
`pinyin_title` "Bảng pinyin" · `pinyin_back` "Quay lại" · `pinyin_grid_label` "Bảng âm tiết pinyin" · `pinyin_corner` "Thanh mẫu · vận mẫu" · `pinyin_hint` "Chạm một thanh để nghe. Chạm lần nữa để nghe chậm." · `pinyin_close` "Đóng" · `pinyin_tone_label` "Nghe thanh {tone}: {pinyin}" · `pinyin_tone_none` "Thanh {tone}: chưa có âm".
- Verify: `pnpm check` (paraglide compile + svelte-check) clean.

## Task 6 [AC1] [AC2] [AC3] [AC4] Browser proof (verify stage input)
`coverdash`/dev server, signed in, agent-browser at 390×844 and 1440×900:
1. `/pinyin` → 22×36 table, header + ∅ column sticky while scrolling; hatched empty cells [AC1].
2. Tap `ba` → sheet "ba"; tap bá twice → `audio.playbackRate` 1 then 0.5; network shows `${SYLLABLE_BASE}/<key>.mp3` 200 [AC2]. Tap `a` → ǎ plays, hanzi slot blank [LOCK].
3. Close via Đóng, Esc, scrim — each: `document.activeElement.dataset.s === 'ba'` [AC4].
4. Reload `/pinyin?open=ba` → sheet open; Esc → focus on `ba`. `/pinyin?open=xyz` → no dialog [AC3][AC4].
5. Client-side entry (no in-app link ships in this slice): open `/roadmap`, then `eval` `document.body.insertAdjacentHTML('beforeend','<a id="t" href="/pinyin">t</a>'); document.getElementById('t').click()` — SvelteKit's router intercepts the same-origin click, so `afterNavigate` gets `from = /roadmap`. ✕ → URL `/roadmap`. Then a fresh tab typed `/pinyin` (full load, `from = null`) → ✕ → URL `/lesson/h0-00` [AC4].
6. 1440×900: sidebar visible, Lộ trình active; sheet centred [LOCK].

## Mutation paths covered
- Sheet opened by: cell tap (Task 3 onclick) · deep link on load (Task 3 initial state) · reopened on another cell after a close (`shown` replaced). Closed by: Đóng · Esc · scrim — all route to the one `close()` (Task 3), so focus return is tested once per path in Task 6.3/6.4.
- `/pinyin` entered by: in-app link (`from` set) · direct load/reload (`from` null) — Task 4 + Task 6.5.
- `open` param: valid · unknown · `NO_CLIP` name · wrong case · empty · absent — Task 2.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// scripts/pinyin-chart.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { addTone, audioKey } from '../src/lib/content/import/audio';
import { NO_CLIP } from '../src/lib/audio-renderer/recorded';
import { SYL } from '../prototype/data/syllables.js';

const rows = parse(readFileSync('content/syllables.yaml', 'utf8')) as { syllable: string; initial: string; final: string }[];
const cells = rows.filter((r) => !NO_CLIP[r.syllable]).map((r) => ({
	...r,
	tones: [1, 2, 3, 4].map((t) => {
		const text = addTone(r.syllable, t);
		return { text, key: audioKey(text, 'redpanda'), hanzi: SYL[r.syllable]?.tones?.[t]?.hz ?? null };
	})
}));
writeFileSync('src/routes/(app)/pinyin/chart.json', JSON.stringify(cells, null, '\t') + '\n');
console.log(`pinyin-chart: ${cells.length} cells, ${cells.length * 4} clips, ${cells.flatMap((c) => c.tones).filter((t) => t.hanzi).length} hanzi`);
```
If a fixture or count contradicts this plan (e.g. hanzi ≠ 1,248, cells ≠ 402), stop and report — do not adjust the test to pass.

## Rollback
`git revert` this slice's commits. No migration, no shared runtime module changed; `/dev/audio` untouched.
