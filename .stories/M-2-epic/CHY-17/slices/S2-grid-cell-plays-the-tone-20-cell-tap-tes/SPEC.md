# CHY-17 S2 — spec
ACs: AC3, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a; stacks on CHY-16 S1/S2 and CHY-17 S1)

## Behaviour
- [AC3] The `/dev/audio` page has a "Syllables" section: one button per row of `content/syllables.yaml` (405), grouped under a heading per initial (`∅` for rows with an empty initial), in file order. The label is the unmarked syllable (`ba`, `lü`).
- [AC3] Tapping a cell selects it (`aria-pressed="true"`, one cell at a time) and shows four tone buttons `1` `2` `3` `4`, each with its contour text: high and level, rising, falling then rising, falling.
- [AC3] Tapping tone t of syllable s calls CHY-16's `play(key)` once at normal speed with `key = audioKey(addTone(s, t), 'narrator')` and sets `Last played: <s><t> · <marked text> · <first 8 hex of key>` (`ba3 · bǎ · …`). The button has `data-clip="<s><t>"`.
- [AC3] For `ba` tones 1-4 the browser requests exactly four distinct URLs `<R2_PUBLIC_URL>/<key>.mp3`, keys of `bā`, `bá`, `bǎ`, `bà`, narrator.
- [AC3] The 405 × 4 keys are computed by the route's server `load` from the importer's `audioKey`/`addTone`; the browser never hashes.
- [AC4] A "Random 20" button draws 20 distinct (syllable, tone) pairs from the 1,620 with a seeded PRNG (mulberry32). The seed is shown; `?seed=N` reproduces the draw. A draw with the same seed is identical; two seeds differ.
- [AC4] The draw renders 20 rows: label (`ba3`), contour text, ▶ (plays that clip like AC3), "right", "wrong". Header: `played k/20 · right r · wrong w`. A row counts as played once `play(key)` resolves `true`; the 20 distinct 200 `audio/mpeg` requests stay the proof of "every one plays".
- [AC4] When all 20 rows are marked right or wrong, the page shows `wrong: <labels>` (`wrong: none` when 0) as selectable text. Loc's verdicts are not stored.
- [NFR] Nothing in this section runs outside dev: it lives under L3's guarded route; no nav link, no prerender.
- [CHORE] New pure module `syllable-cells.ts` (`pickCells`, contour texts) and server module `syllable-cells.server.ts` (`loadSyllableCells`) have vitest files; `pnpm check`, `pnpm lint`, `pnpm test --maxWorkers=2` stay green.

## Not this slice
- AC1, AC2 (the 1,641 clips, the `missing:` check) → S1. The real Pinyin Table and Primer screens → CHY-40, CHY-37. `audioKey` for cells in the bundle → CHY-8 follow-up (DISCUSSION "Request").
- The `/dev/audio` route, dev guard, the `play` lib → CHY-16 (S1 lib, S2 route).

## Seam
`src/routes/dev/audio/SyllableGrid.svelte` (new) mounted by L3's `+page.svelte`; data from `syllable-cells.server.ts` through the route's `load`.

## Test contract
- [AC3] vitest `syllable-cells.server.test.ts`: `loadSyllableCells()` returns 405 cells; `ba` has 4 keys; key[2] of `ba` = `audioKey('bǎ','narrator')`, key[0] of `lü` = `audioKey('lǖ','narrator')`; 405 × 4 keys are all distinct.
- [AC4] vitest `syllable-cells.test.ts`: `pickCells(7, 20, cells)` twice → equal; 20 distinct pairs; each pair is a real (syllable, tone 1-4); seeds 7 and 8 differ; asking for 1,620 returns every pair once.
- [AC3] Live (tester, dev server, `R2_PUBLIC_URL` = the real bucket): tap `ba` then 1, 2, 3, 4 with network logging → four 200 `audio/mpeg` requests matching the four keys; `Last played` shows `ba1`…`ba4`; S1's F0 probe on those 4 clips → level, rising, dip, falling. Loc confirms by ear.
- [AC4] Live: `/dev/audio` with no seed: "Random 20" draws one and shows it; record it in VERIFY.md; tester taps all ▶ → header `played 20/20`, 20 distinct 200 requests; Loc marks 20 rows by ear; the `wrong:` line is copied into VERIFY.md. `?seed=<it>` reproduces the 20 labels.
- [NFR] `rg -n "syllables|SyllableGrid" src/routes` shows no nav link; with the route's dev guard, a production build returns 404 for `/dev/audio` (L3's test, re-run).
- [CHORE] `pnpm check && pnpm lint && pnpm test --maxWorkers=2` green.

## Open assumptions
- [AC3] CHY-16 S1 is on main: `play(key, { slow }): Promise<boolean>` from `$lib/audio` (player.ts:10), true when playback started, quiet failure otherwise. Its default `base` is `/audio`; S2 passes the `R2_PUBLIC_URL` base through `createPlayer({ base })` (one line).
- [AC3] Hard gate: S2 executes only after CHY-16 S2 (`/dev/audio` + guard) is merged or stacked; the Captain amends WAVE-PLAN wave E (it names CHY-16 S1 only). Cost if ignored: no route to mount on.
