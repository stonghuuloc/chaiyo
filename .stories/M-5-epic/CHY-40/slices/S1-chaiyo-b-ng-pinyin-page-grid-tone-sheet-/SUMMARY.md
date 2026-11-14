# CHY-40 S1 — summary
ACs: AC1, AC2, AC3, AC4  ·  Branch: CHY-40-S1  ·  PR: none (coordinator pushes)

## Shipped
- [AC1] `PinyinChart.svelte` renders a 22×36 table (∅ row, sticky header and first column); 402 `button[data-s]`, 390 hatched `td.none`. Tests: `PinyinChart.test.ts` `Given_Cells_When_Render_Then_402CellButtons…`, `Then_NoScoreText`. ✓
- [AC1] `scripts/pinyin-chart.ts` → `chart.json` (402 cells, 1608 clips, 1248 hanzi). Test: `chart.test.ts` `Given_ChartJson_Then_KeysMatchAudioKey`, `…1248Hanzi_And_ba_Is_八拔把爸`. ✓
- [AC2] `Sheet` titled with the syllable, hint, 4 tone buttons (pinyin, contour, hanzi); `playTone` → `player(key, { base: SYLLABLE_BASE })`. Tests: `…Open_ba…`, `…PlayToneTwice…Rate1Then05`, `…KeyNull…PlayerNotCalled`. ✓
- [AC2][LOCK] clip without hanzi plays (blank slot); no clip → disabled `–`. Tests: `…Open_a…`, `…FixtureTone3KeyNull…`. ✓
- [AC3] `+page.ts` seam + `findCell` exact match; deep link opens on first paint. Tests: `…Url_open_ba_When_Load…`, `…ExactMatchOnly`, `…Open_xyz_Then_NoDialog`. ✓
- [AC4] one `close()` for Đóng, Esc, scrim; focus returns to the cell `button`. `backTarget(hasPrevious)`. ✓ (browser)
- [LOCK] `layout.test.ts`: two rows (`pushed`, `roadmap`).
- [CHORE] 8 `pinyin_*` keys in `messages/vi.json`.

## Deviated from plan
- `vi.json` keys appended at the END of the file, not after `shell_skip`: `docs/copy-voice.md` rule 8 ("add new keys only by appending") beats PLAN. Expect a trivial EOF conflict at merge.
- ✕ fallback: `resolve('/(app)/lesson/[id]', …)` fails `pnpm check` (no `+page` in `lesson/[id]/` yet). Used `goto(`${resolve('/')}lesson/h0-00`)` with an eslint-disable comment, as PLAN allowed.
- Hatched empty cell uses `color-mix(… var(--color-faint-pencil) 35% …)`: `guard.test.ts` bans `rgb(` literals in components.
- Browser proof used a test user created in local Supabase (`chy40s1@test.local`); not committed.

## Not done / follow-up
- Clip files do not exist at `/audio/pinyin-chart/…` on the dev origin (404 locally); the request URL is correct, a real 200 needs `PUBLIC_AUDIO_BASE_URL` set to the R2 bucket. Not checked.
- ✕ on a fresh tab requests `/lesson/h0-00` (404 until CHY-31 lands).

## Verification run
See the worker_done report: check, lint (raw), filtered + full test, build, browser per AC.
