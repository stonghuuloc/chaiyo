# CHY-10 S2 — discussion
ACs: AC2, AC3  ·  rev 2 (delta vs main 9b7ab62)

## Current behaviour (verified, with anchors)
- [AC2] `prototype/data/h1-01.js` (59 lines) holds 10 words, 9 sentences, 2 dialogue parts and 1 grammar point, and no questions.
- [AC2] `importContent('content', …)` without `only` returns `{ errors }` today and after S1: 93 errors in h2–h5 lessons and `words/关系.yaml` stay. The production scope `scopeFor('content', ['lessons/hsk1'])` (15 entries) has 14 errors at 9b7ab62: 11 in h1-01 (S1 fixes them) and 3 `parts[].pinyin` (CHY-12).
- [AC2] Hand walk of the S2 word, example and sentence rules over 9b7ab62 content (`resolveSpoken` for spoken; examples s-h1-01-10..19): all 10 words and 9 sentences match. The one exception is the `s-h1-01-18` citation check (`bú kèqi` today, `bù kèqi` after S1).
- [AC3] l2-warmup.html:35 reviews Bài 1 words as Bài 2's warm-up ("Ôn lại Bài 1"), and docs/content-schema.md rule 5 derives warm-ups.
- [AC3] No section screens exist: `src/routes/(app)/lesson/[id]/[section]/+page.svelte` is one heading; CHY-31..35 build them.
- [AC3] CHY-13 is merged: `pnpm fonts <bundleDir> <fontsDir>` (package.json:24) reads `manifest.json` and fails on any unmapped Han char. Its AC3 leaves "the real Bài 1 bundle once CHY-8 emits it" to a verify stage.

## Answered here (no human needed)
- [AC3] S2 proves AC3 at bundle level: per section, every field the prototype page reads exists in the imported bundle. CHY-31..35 own the in-app render. Source: Captain default 2026-11-03. 85%.
- [AC2] Parity compares citation pinyin, and spoken only where the prototype carries `say`/`spoken`. 85%.
- [AC2] CHAA-24 (CHY-12) keeps existing `senses` first and verbatim and appends generated ones, so `senses[0].vi` equals the prototype gloss (C4, 2026-11-03). 90%.
- [AC2] (rev 2) The test imports with `only: scopeFor('content', ['lessons/hsk1'])`, the C2 production scope. A whole-tree import can never pass while h2–h5 carry errors. 95%.
- [AC2] (rev 2) The test reads `buildBundle(sink.content, 'h1-01')`, the frozen C3 shape (PR #35), instead of rev 1's adapter over `ImportedContent`. C3 is frozen at rev 3, so the adapter has no consumer. 90%.
- [AC2] (rev 2) The test stubs `CHAIYO_VAULT` to a missing dir, so check 7 is skipped and the result is the same on the Mac and in CI. The S1 lint gate owns mnemonic equality. Vault edits by Loc would otherwise turn a parity test red on the Mac only. 85%.
- [AC2] (rev 2) Word `parts[].pinyin` vs prototype `chars`: exact when the prototype syllable is tone-marked, else equal after stripping tone marks. CHY-12's step-0 fix turns `bu`/`xi`/`qi` into `bù`/`xì`/`qì` (citation per char), while the prototype keeps the in-word neutral form. Exact equality would fail 3 rows after a correct fix. 85%.
- [AC2] (rev 2) `ex` pinyin is compared with the bundle sentence's `spoken` when the word has `say`, else with its `pinyin`. C2 always sets a sentence's `spoken` (derived when not authored), so rev 1's "`spoken ?? pinyin`" would compare 你's `nǐ hǎo` with the derived `ní hǎo` and fail. 90%, hand walk above.
- [AC3] (rev 2) The Gate row asserts ≥ 2 ids per word in `gateCoverage`, not "lists all 10 words". `gateCoverage` always has all 10 keys (derive/gate.ts), so a key check proves nothing. 95%.
- [AC3] (rev 2) S2's proof runs `scripts/build-content.sh` on the real content (manual, Mac). Exit 0 proves every Bài 1 Han char maps in face 0 (CHY-13 AC1 error otherwise). That closes CHY-13 AC3's real-bundle item and meets CHY-25's `vercel.json` condition. It stays out of CI, because CHY-8 S3 never imports `content/` in CI. 80%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 10.Q2 [AC3] | Bài 1 Khởi động | A — `warmup: {}`; S2 proves the row by word coverage | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |
| 1 | 10.Q3 [AC2] | questions diff source | A — transcribe the 19 into a fixture, prototype stays frozen | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- 10 word ids (CHY-6 S2). One JSON bundle per lesson (ADR 0002).
