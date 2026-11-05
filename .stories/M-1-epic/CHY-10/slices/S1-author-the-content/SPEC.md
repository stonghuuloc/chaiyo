# CHY-10 S1 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 2 (delta vs main 9b7ab62; CHY-8 S3 contract = PR #35 SPEC/PLAN)

## Behaviour
- [AC1] Bài 1 scope = the files `scopeFor('content', ['lessons/hsk1'])` lists (CHY-8 S3, the C2 production scope): `lessons/hsk1` (h1-01 and the Primer h0-00), `chars`, `sentences`, `syllables.yaml`, the 10 `words/<id>.yaml` of `sections.words.ids` and `grammar/h1-g01.yaml`. After S1, the files this lane owns (`lessons/hsk1/h1-01.yaml`, `chars/*`) have 0 lint errors. The full `pnpm lint:content content` run cannot reach 0 in this story: 93 of its 107 errors at 9b7ab62 sit in h2–h5 lessons (92) and `words/关系.yaml` (1), outside Bài 1 (DISCUSSION "Answered here").
- [AC1] The scoped run is fully clean (`pnpm -s import:content content --sink memory --only lessons/hsk1` exits 0 and prints a sha) once CHY-12 has added the tone marks to 3 `parts[].pinyin` (不客气 `qi`, 对不起 `bu`, 没关系 `xi`; CHY-12 S2 SPEC [AC4], the step-0 hand fix). S1 never edits `content/words/*` (C4). Until that fix is on main, the scoped run reports exactly those 3 `#3 Tone marks` lines and nothing else.
- [AC1] `content/chars/` holds exactly 15 files, one per char of the 10 words: 你 好 您 们 对 不 起 没 关 系 谢 客 气 再 见. Each parses as `Char` with `readings` (tone-marked pinyin, or `men` for 们, a neutral syllable that check 3 accepts; every reading has a Hán Việt, check 1), `radical`, `ids` and `strokes`, and contains no code point in U+2E80–U+2FDF (check 6).
- [AC1] Readings (C2 `deriveHanViet`; check 2 table `data/sources/polyphones.yaml`): a toned syllable matches the reading with the same tone-marked pinyin; an unmarked syllable matches the first non-`rare` reading with the same letters. So 好 lists `hǎo → hảo` and `hào → hiếu`, 没 `méi`, `mò` (rare), 见 `jiàn`, `xiàn` (rare), 系 `xì`, `jì` (rare). These four are the only Bài 1 chars in the polyphone table, and each carries every reading it lists.
- [AC1] `mnemonic` on 13 chars equals the vault text that check 7 compares against (`loadVaultMnemonics`: `meo.py` `index()` HÌNH/ÂM/ĐỜI THẬT/TƯƠNG PHẢN). `kind` is `etymology` when the char's own HÌNH line in its vault lesson carries `[từ nguyên]`, else `invented` (no lint check reads `kind`). 系 and 客 have no `mnemonic`: the vault has no lesson for them, and `loadVaultMnemonics` skips them (10.Q4 A).
- [AC1] `h1-01.yaml` gets 29 questions: `grammar.drills` 3 (`q-h1-01-g01..g03`), `dialogue.questions` 1 (`d01`), `listenSpeak.items` 5 (`l01..l03`, `s01`, `f01`), `gate.pool` 20 (`x01..x20`; `draw: 10` stays). Every question parses under the `Question` union on main (every `choice` carries `optionKind`). Every `prompt.ref` names a word id or a sentence id (check 8).
- [AC1] Gate pool: x01–x10 carry the 10 questions of `l8-gate.html:155-166` (same prompt, option texts and answer). x11–x20 test 你, 您, 对不起, 你好, 不客气, 没关系, 好 and 再见 with choice, typePinyin, tone and trueFalse. In the derived `gateCoverage` (C2), each of the 10 words lists exactly 2 pool question ids (PLAN Task 3 table).
- [AC1] 你 and 好 sit inside 你好/你们 and stay as their own words. Both are tokens of h1-g01's `你 / 您 / 你们 + 好` (check 8 decision 1, already clean at 9b7ab62). 好 is also in `tests.words` of listenSpeak `l01`, as docs/content-schema.md:370 states.
- [AC1] `s-h1-01-18` becomes `pinyin: bù kèqi, spoken: bú kèqi` (citation + override, the same as `s-h1-01-06`). `deriveSpoken('bù kèqi', '不客气。')` = `bú kèqi`, so check 4 stays clean. The 9 other `pinyin` values stay citation. Dialogue speakers stay as in the prototype (10.Q1 A): R·T·T·R and R·T·T (check 9: ≥ 2 voices per part).
- [AC1] Not edited: `topic` (`Chào hỏi`), `content/levels/hsk1.yaml`, `content/words/*` (C4), `content/lessons/hsk1/h0-00.yaml` and `content/syllables.yaml` (CHY-11), `src/lib/content/content.test.ts` (main already parses `chars/` as `Char`, content.test.ts:13).

## Not this slice
- AC2 (importer vs prototype) and AC3 (section coverage) → S2.
- The 3 `parts[].pinyin` tone marks and every other `content/words/*` field → CHY-12 (C4). h2–h5 lesson errors and `words/关系.yaml` → their own stories.
- `content/cast.yaml`: lint keeps the cast ids as a constant (C1), and there is no Cast schema; parked. `scene.cast` stays [panda, fawn].
- Question `why`/`ask` (on main via C6, optional): not authored. The prototype gate shows no explanation, and `ask` is the "sentence shown next to the audio" (content-schema.md:158), not the prototype's prompt label.
- Mnemonics for 系 and 客 → vault lessons, later.

## Seam
`content/lessons/hsk1/h1-01.yaml` plus `content/chars/*.yaml`, written once by `scripts/chars-from-vault.ts`; no product code.

## Test contract
- [AC1] Lane gate (runs on main today): `pnpm -s lint:content content | rg '^(lessons/hsk1/h1-01\.yaml|chars/)'` prints nothing, and the error total is 11 lower than on the same tree without S1 (107 → 96 at 9b7ab62).
- [AC1] Scoped gate (needs PR #35 on main): `pnpm -s import:content content --sink memory --only lessons/hsk1`. When CHY-12's 3-line fix is on main, it exits 0 and prints a 64-hex sha. Before that, it exits 1 with exactly the 3 `words/…  parts[…].pinyin  #3 Tone marks` lines.
- [AC1] Negative controls, each restored afterwards: delete the `hào` reading from `chars/好.yaml` and expect `chars/好.yaml  readings  #2 Polyphones  Char 好 lacks reading(s): hào`. On the Mac (vault present), change one word of `chars/你.yaml` `mnemonic.hinh` and expect `chars/你.yaml  mnemonic.hinh  #7 …  Char 你 mnemonic.hinh differs from the vault`.
- [AC1] `pnpm test -- src/lib/content/content.test.ts`: the 15 `chars/*.yaml` rows appear and parse with 0 errors.

## Open assumptions
- [AC1] Radical is spelled from IDS (你 亻), not the vault's Kangxi form (人). A wrong pick costs 15 one-line values, and no lint check reads `radical`.
- [AC1] CHY-12 S2's promote rewrites `pinyin`, `level`, `pos` and generated senses of the 9 in-list Bài 1 words (你好 is not in the HSK 3.0 level-1 list and is never touched). It keeps ids, hand `senses`, `examples`, `parts`, `components`, `spoken` and authored `hanviet` (C4), so no S1 reference moves. Its new `content/sentences/hsk1.yaml` joins the Bài 1 scope (checks 3, 4, 6, 8). A bad generated sentence then turns the scoped gate red, and fixing it is CHY-12's work.
