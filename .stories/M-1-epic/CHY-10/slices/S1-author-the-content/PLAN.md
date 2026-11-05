# CHY-10 S1 — plan
ACs: AC1  ·  Spec rev 2  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-10 off main 9b7ab62 (CHY-9 lint + `tsx`, CHY-11 Primer, CHY-13 `pnpm fonts`, CHY-8 S1/S2/S4 merged) · run `pnpm install` first

## Files touched
- create: `scripts/chars-from-vault.ts` (one-off generator run with `tsx`; it imports the check 7 reader, so the mnemonics cannot drift from what lint compares)
- create: `content/chars/{你,好,您,们,对,不,起,没,关,系,谢,客,气,再,见}.yaml` (15)
- edit: `content/lessons/hsk1/h1-01.yaml` (lines 31, 39, 46, 48, 53)
Not edited (other lanes): `content/words/*` (C4, CHY-12), `content/levels/hsk1.yaml`, `content/lessons/hsk1/h0-00.yaml` and `content/syllables.yaml` (CHY-11), `schemas.ts` (C6), `src/lib/content/lint/**` (CHY-9), `src/lib/content/import/**` (CHY-8), `src/lib/content/content.test.ts` (it already parses `chars/`).

## Anchors (verified 2026-11-05 on main 9b7ab62)
- `content/lessons/hsk1/h1-01.yaml:31` `s-h1-01-18 … pinyin: bú kèqi` (no `spoken`); line 19 (`s-h1-01-06`) already has `pinyin: bù kèqi, spoken: bú kèqi`. `:39` `drills: []` · `:46` `questions: []` · `:48` `items: []` · `:52` `draw: 10` · `:53` `pool: []`.
- `package.json:18` `"lint:content": "tsx scripts/lint-content.ts"` (no `--only` flag; `scripts/lint-content.ts:11` calls `lintDir(dir)`). `pnpm import:content` arrives with PR #35 (CHY-8 S3).
- `pnpm -s lint:content content` at 9b7ab62, default vault: 107 errors in 9 files. 11 are in `lessons/hsk1/h1-01.yaml` (`gate.pool` has 0 questions, and each of the 10 `sections.words.ids` is not tested). 3 are `words/{不客气,对不起,没关系}.yaml parts[…].pinyin #3`. The other 93 are h2–h5 lessons (92) and `words/关系.yaml` (1). `lintDir` on the 15-entry Bài 1 scope: 14 = the 11 + the 3.
- `src/lib/content/content.test.ts:10-15` `folders` = words, grammar, chars, sentences; the file count is glob-derived.
- `src/lib/content/schemas.ts` Char (strict): hanzi, readings[{pinyin, hanviet, rare?}], radical, ids, strokes, mnemonic?{hinh, am, doiThat, tuongPhan, kind: 'etymology'|'invented'}. `Question` union: `choice` (prompt, options, answer, `optionKind` hanzi|pinyin|vi|hanviet|image), `tone` (prompt, syllable, answer 1–5), `typePinyin`, `order` (tiles, answer = sentence id), `fill`, `trueFalse` (prompt, statement, answer), `readAloud` (sentence), `freeAnswer` (prompt, rubric); base `why?`, `ask?`, `section?`, `tests`.
- Lint on disk: check 2 reads `data/sources/polyphones.yaml` (Bài 1 rows: 好 [hǎo, hào], 没 [méi, mò], 见 [jiàn, xiàn], 系 [xì, jì]). Check 7 (`lint/checks/7-mnemonic.ts`) compares the four text fields, after trim, with `loadVaultMnemonics(vault)` (`lint/refs.ts`; vault = `CHAIYO_VAULT` or `~/Documents/second-brain/mandarin`, refs.ts:81). Chars missing any of the four anchors are skipped: 13 of the 15 have all four, and 系 and 客 have none. Check 8 (`8-references.ts`): `prompt.ref` of a non-`vi`, non-`syllable` prompt must be a word or sentence id; pool ≥ 2 × draw; every lesson word in some pool `tests.words`.
- Vault: `meo.py <c>` prints the char's lesson tag (`[L001-我你他她它您]` for 你). The `[từ nguyên]` / `[mẹo tự dựng]` label sits on the HÌNH line inside that lesson (`_lesson-contract.md:103`). `_readings.tsv`, `_hanviet.tsv`, `_ids.txt`, `chars/<c>.md` (strokes).

## Task 1 [AC1] Generate the 15 Char files
File: `scripts/chars-from-vault.ts` (new), output `content/chars/<hanzi>.yaml`
- Change: `loadVaultMnemonics(process.env.CHAIYO_VAULT ?? join(homedir(), 'Documents/second-brain/mandarin'))` gives the four texts. The script writes each file with `YAML.stringify` (the `yaml` devDependency). Hard-coded tables:
  - Readings (pinyin → Hán Việt; rare marked): 你 nǐ nhĩ · 好 hǎo hảo, hào hiếu · 您 nín nâm · 们 men môn · 对 duì đối · 不 bù bất · 起 qǐ khởi · 没 méi một, mò một (rare) · 关 guān quan · 系 xì hệ, jì hệ (rare) · 谢 xiè tạ · 客 kè khách · 气 qì khí · 再 zài tái · 见 jiàn kiến, xiàn hiện (rare).
  - Radical (spelled from IDS): 你 亻 · 好 女 · 您 心 · 们 亻 · 对 寸 · 不 一 · 起 走 · 没 氵 · 关 丷 · 系 糸 · 谢 讠 · 客 宀 · 气 气 · 再 冂 · 见 见. Never a code point in U+2E80–U+2FDF.
  - `ids` from `_ids.txt`: take the variant whose tag contains G and strip the tags (起 ⿺走巳, 关 ⿱丷天). 不 and 见 are written atomic as `不` and `见`, because the vault's 不 entry `⿱一③` holds a placeholder code point.
  - `strokes` from the vault md; 系 7 and 客 9 (standard count).
  - `kind` per char: the executor reads the HÌNH line of the char in its own vault lesson. `[từ nguyên]` gives `etymology`; anything else gives `invented`. The PR body lists char → lesson → label so the reviewer can check each one.
  A char with no `loadVaultMnemonics` entry (系, 客) gets no `mnemonic` key.
- Test first: run `pnpm test -- src/lib/content/content.test.ts` before Task 1. It has no `chars/` rows yet; after Task 1 it lists 15.
- Verify: `pnpm exec tsx scripts/chars-from-vault.ts && pnpm test -- src/lib/content/content.test.ts && pnpm -s lint:content content | rg '^chars/'`. The last command prints nothing (checks 1, 2, 3, 6, 7).
- Draft code (UNEXECUTED): `const m = loadVaultMnemonics(vault)?.get(c); const file = { hanzi: c, readings, radical, ids, strokes, ...(m && { mnemonic: { ...m, kind } }) }`.

## Task 2 [AC1] Author drills, dialogue and listenSpeak questions
File: `content/lessons/hsk1/h1-01.yaml:39,46,48`
| id | type | prompt → answer | tests |
|---|---|---|---|
| g01 | choice, optionKind hanzi | vi "Chào thầy cô (lịch sự)", [你好, 您好, 你们好] → 1 | grammar h1-g01, words 您 |
| g02 | choice, optionKind hanzi | vi "Chào cả nhóm bạn", [你好, 您好, 你们好] → 2 | grammar h1-g01, words 你们 |
| g03 | order | tiles [们, 你, 好] → s-h1-01-09 | grammar h1-g01 |
| d01 | choice, optionKind hanzi | audio s-h1-01-03, [没关系。, 不客气。, 再见！] → 0 | words 没关系 |
| l01 | tone | audio 好, syllable 0 → 3 | words 好, tone true |
| l02 | choice, optionKind hanzi | audio 你好, [你好, 你们, 您, 再见] → 0 | words 你好 |
| l03 | choice, optionKind vi | audio s-h1-01-18, [Không có gì., Xin lỗi!, Cảm ơn!, Tạm biệt!] → 0 | words 不客气 |
| s01 | readAloud | sentence s-h1-01-06 | words 不客气, tone true |
| f01 | freeAnswer | vi "Bạn làm đổ trà của bạn mình. Nói gì?", rubric [Nói 对不起 (xin lỗi) bằng một câu ngắn] | words 对不起 |
- Ids carry the `q-h1-01-` prefix. Option text copies the prototype (`l4-grammar.html:118-125`, `l5-dialogue.html:127-134`, `l6-listen.html:90-235`).
- Test first: `pnpm -s lint:content content | rg '^lessons/hsk1/h1-01'` before the edit shows the 11 errors. After the edit the count still shows 11, because the pool is still empty, and no new error appears.
- Verify: `pnpm test -- src/lib/content/content.test.ts` (schema) and the same `rg` (checks 5, 8, 9).

## Task 3 [AC1] Author the 20-question gate pool
File: `content/lessons/hsk1/h1-01.yaml:52-53` (`draw: 10` stays)
| id | type | prompt → answer | tests.words |
|---|---|---|---|
| x01 | choice, hanzi | audio 谢谢, [谢谢, 没关系, 不客气, 对不起] → 0 | 谢谢 |
| x02 | choice, vi | hanzi 对不起, [xin lỗi, không sao, cảm ơn, tạm biệt] → 0 | 对不起 |
| x03 | choice, hanzi | vi "không sao", [对不起, 没关系, 谢谢, 再见] → 1 | 没关系 |
| x04 | order | tiles [们, 你, 好] → s-h1-01-09 | 你们 (+ grammar h1-g01) |
| x05 | choice, hanzi | audio 你们, [你好, 您, 你们, 谢谢] → 2 | 你们 |
| x06 | typePinyin | hanzi 再见 → zàijiàn | 再见 |
| x07 | choice, vi | hanzi 好, [bạn, anh, chị · ông, bà, thầy cô (lịch sự) · tốt, khỏe, hay · cảm ơn] → 2 | 好 |
| x08 | typePinyin | hanzi 谢谢 → xièxie | 谢谢 |
| x09 | choice, hanzi | audio 不客气, [谢谢, 没关系, 再见, 不客气] → 3 | 不客气 |
| x10 | choice, hanzi | vi "Chào thầy cô (lịch sự)", [您好, 你好, 你们好, 好你] → 0 | 您 (+ grammar h1-g01) |
| x11 | choice, hanzi | audio 你, [您, 你, 好, 谢谢] → 1 | 你 |
| x12 | choice, vi | hanzi 你, [ông, bà, thầy cô (lịch sự) · bạn, anh, chị · các bạn · xin chào] → 1 | 你 |
| x13 | choice, vi | hanzi 您, the same four options → 0 | 您 |
| x14 | choice, hanzi | vi "xin lỗi", [谢谢, 对不起, 没关系, 再见] → 1 | 对不起 |
| x15 | choice, hanzi | vi "xin chào", [谢谢, 再见, 你好, 没关系] → 2 | 你好 |
| x16 | typePinyin | hanzi 你好 → nǐ hǎo | 你好 |
| x17 | typePinyin | hanzi 不客气 → bù kèqi | 不客气 |
| x18 | tone | audio 没关系, syllable 0 → 2 | 没关系 (tone true) |
| x19 | trueFalse | hanzi 好, "好 nghĩa là tốt, khỏe, hay." → true | 好 |
| x20 | trueFalse | hanzi 再见, "再见 nghĩa là xin chào." → false | 再见 |
- x01–x10 are the `l8-gate.html:155-166` questions in order. The answer index is fixed per row, and the runtime shuffles. Every `prompt.ref` is a word id; x04's answer is a sentence id.
- Coverage (hand count; `gateCoverage` must equal it): 谢谢 x01 x08 · 对不起 x02 x14 · 没关系 x03 x18 · 你们 x04 x05 · 再见 x06 x20 · 好 x07 x19 · 不客气 x09 x17 · 您 x10 x13 · 你 x11 x12 · 你好 x15 x16. That is exactly 2 per word, 20 in total.
- Verify: `pnpm -s lint:content content | rg '^lessons/hsk1/h1-01'` prints nothing (check 8: pool 20 ≥ 2 × 10, every word tested, every ref known).

## Task 4 [AC1] Citation pinyin for s-h1-01-18
File: `h1-01.yaml:31`
- Change: `pinyin: bù kèqi, spoken: bú kèqi` (mirrors line 19).
- Test first: none needed. Check 4 is clean before and after, because `deriveSpoken('bù kèqi', '不客气。')` = `bú kèqi` (measured at 9b7ab62). S2's citation comparison is the test that consumes this change.
- Verify: `pnpm -s lint:content content | rg '^lessons/hsk1/h1-01'` still prints nothing (checks 3, 4).

## Task 5 [AC1] Prove it
- Lane gate: `pnpm -s lint:content content | rg '^(lessons/hsk1/h1-01\.yaml|chars/)'` prints nothing. The total is 11 below the same tree without S1 (96 at 9b7ab62). Then run `pnpm test`, `pnpm check` and `pnpm lint` (prettier + eslint cover `scripts/chars-from-vault.ts`; `/content/` is in .prettierignore), all green on the same tree.
- Negative controls (restore after each): delete the `hào` reading from `chars/好.yaml` and expect `#2 Polyphones  Char 好 lacks reading(s): hào`. Change one word of `chars/你.yaml` `mnemonic.hinh` and expect `#7 … mnemonic.hinh differs from the vault` (Mac only, vault present). Moving `chars/好.yaml` away is no control: all 10 words carry authored `hanviet`, so no check reads the char file for them.
- Scoped gate (after PR #35 is on main): `pnpm -s import:content content --sink memory --only lessons/hsk1`.
  - CHY-12's step-0 fix is on main: exit 0, and the last line is a 64-hex sha.
  - It is not yet: exit 1, and the only lines are the 3 `words/…  parts[…].pinyin  #3` errors.
  The PR still merges in the second case. AC1 is ticked on the first run that exits 0 (DISCUSSION "Answered here").

## Parked
- `content/cast.yaml` has no reader (C1) and no schema (C6).

## Mutation paths covered
- Content is read by lint (C1) and the importer (C2) from the same files; there is no write path. CHY-12 regenerates `content/words/*` and keeps `examples`, `image`, `parts`, `components`, `spoken` and authored `hanviet` (C4), so none of the ids this lesson points at change. The generator writes only `content/chars/` and is run once.

## Rollback
`git revert` of this slice's commits; no migration.
