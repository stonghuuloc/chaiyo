# CHY-17 S2 — plan
ACs: AC3, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-17 (stacked on CHY-16, then S1 of this story)

## Anchors (verified 2026-11-07 on main fd2b67a)
- `src/lib/content/import/audio.ts:15` `audioKey`; `:29` `addTone`. `content/syllables.yaml` rows `{ syllable, initial, final }` (405). `package.json:58` `yaml` dependency.
- `src/routes/+layout.ts:8` `ssr = false`: the app is a client-rendered SPA, so the grid's data must come from a server `load` (`+page.server.ts`), which still runs on the server under `ssr = false`.
- `vite.config.ts:56` — vitest 'server' project includes `src/**/*.{test,spec}.{js,ts}`, so tests in `src/routes/dev/audio/` run.
- No rune page exists on main; follow the Svelte 5 docs (svelte MCP) and `DESIGN.md` tokens.
- Not on main yet: `src/lib/audio/**` (CHY-16 S1: `play`) and `src/routes/dev/audio/**` (CHY-16 S2: route, dev guard). Re-read both on the stacked base before Task 2.

## Task 1 [AC3] Cells with keys (server)
Files: `src/routes/dev/audio/syllable-cells.server.ts` (new), `syllable-cells.server.test.ts` (new)
- Test first: 405 cells, `ba` has 4 keys, `ba`[2] = `audioKey('bǎ','narrator')`, `lü`[0] = `audioKey('lǖ','narrator')`, 1,620 distinct keys.
- `loadSyllableCells(): { syllable, initial, keys: [string, string, string, string] }[]`: `yaml` parse of `content/syllables.yaml`, `addTone` + `audioKey` from `../../../lib/content/import/audio`.
- Verify: `pnpm exec vitest --run src/routes/dev/audio/syllable-cells.server.test.ts --maxWorkers=2`.

## Task 2 [AC3] Syllable grid and tone buttons
Files: `src/routes/dev/audio/SyllableGrid.svelte` (new), L3's `+page.svelte` (+2 lines: import, `<SyllableGrid {cells} />`), L3's `+page.server.ts` (create with `load`, or add `cells` to its return), L3's `+page.ts` load if it exists (`return { ...data, … }`, 1 line)
- The server `load` starts with `if (!dev) error(404)` (`dev` from `$app/env`), whatever L3's guard is.
- Grid grouped by `initial`, `aria-pressed` selection, four tone buttons with contour text and `data-clip`, `Last played` line, `play(keys[t-1])` from `$lib/audio`.
- Verify: dev server (`pnpm dev`), open `/dev/audio`, tap `ba` → 1…4 with the network panel: four distinct `<key>.mp3` requests; `pnpm check`.

## Task 3 [AC4] Random 20
Files: `src/routes/dev/audio/syllable-cells.ts` (new), `syllable-cells.test.ts` (new), `SyllableGrid.svelte`
- Test first: `pickCells(seed, n, cells)` per SPEC (deterministic, 20 distinct, in range, seeds differ, n = 1620 returns all).
- `pickCells`: mulberry32(seed) Fisher-Yates over the 1,620 (syllable, tone) pairs, take n. Component: "Random 20" button, seed from `?seed=` or `Math.random`, 20 rows (▶, right, wrong), header counts, `wrong:` line at 20 marks.
- Verify: `pnpm exec vitest --run src/routes/dev/audio --maxWorkers=2`; in the browser the same `?seed=` twice shows the same labels; tap all ▶ → `played 20/20`.

## Task 4 [CHORE] Gates
Files: none
- `pnpm check && pnpm lint && pnpm test --maxWorkers=2` green on the stacked tree.

## Task 5 [AC3] [AC4] Live proof (Mac or cloud with the real `R2_PUBLIC_URL`)
Files: none (run)
- Tester per SPEC: network proof for `ba1`-`ba4`, S1's `probe.py` (pasted in S1 VERIFY.md) on them, an unseeded Random 20 with 20 plays; Loc marks the 20 rows by ear. Results into VERIFY.md.

## Mutation paths covered
- Select another cell mid-way (selection moves, old tone buttons disappear); re-draw Random 20 (counts reset); same seed twice; mark a row right then wrong (counts follow the last mark); `lü` rows (ü handled by `addTone`).

## Rollback
`git revert`; the 2-line mount and the `load` key in L3's files go with it. Nothing else reads these files.
