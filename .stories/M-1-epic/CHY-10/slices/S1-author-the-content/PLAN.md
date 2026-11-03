# CHY-10 S1 — plan
ACs: AC1  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-10

## Files touched
- create: `scripts/chars-from-vault.mjs` (one-off generator, precedent `scripts/lessons-to-yaml.mjs:1`)
- create: `content/chars/{你,好,您,们,对,不,起,没,关,系,谢,客,气,再,见}.yaml` (15)
- edit: `content/lessons/hsk1/h1-01.yaml` (lines 31, 39, 46, 48, 53)
- edit: `src/lib/content/content.test.ts` (lines 8-11, 28-29)
Out of lane, not edited: `content/words/*` (C4, CHY-12), `content/levels/hsk1.yaml`, `schemas.ts` (C6, CHY-11).

## Anchors (verified 2026-11-03)
- `content/lessons/hsk1/h1-01.yaml:31` — `s-h1-01-18 … pinyin: bú kèqi`; line 19 (`s-h1-01-06`) already has `pinyin: bù kèqi, spoken: bú kèqi`.
- `h1-01.yaml:39` `drills: []` · `:46` `questions: []` · `:48` `items: []` · `:52-53` `draw: 10`, `pool: []`.
- `src/lib/content/content.test.ts:8-11` `folders` has words, grammar, lessons; `:28-29` `toHaveLength(84)`.
- `src/lib/content/schemas.ts` Char (strict): hanzi, readings[{pinyin, hanviet, rare?}], radical, ids, strokes, mnemonic?{hinh, am, doiThat, tuongPhan, kind}. Question union at `schemas.ts:115` (choice, tone, typePinyin, order, fill, trueFalse, readAloud, freeAnswer).
- Vault: `~/Documents/second-brain/mandarin/meo.py` (anchors), `_readings.tsv`, `_hanviet.tsv`, `_ids.txt`, `chars/<c>.md` (strokes).
- Contracts read 2026-11-03: C1 (`pnpm lint:content`, check 8 cast ids, check 9), C2 (Hán Việt from Char readings), C4 (CHAA-24: words regenerated, `examples` kept).

## Task 1 [AC1] Generate the 15 Char files
File: `scripts/chars-from-vault.mjs` (new), output `content/chars/<hanzi>.yaml`
- Change: for each of the 15 chars read `meo.py <c>` (execFileSync python3), `_readings.tsv` (pinyin list), `_hanviet.tsv` (first Hán Việt per reading) and write YAML via the `yaml` package (already a devDependency). Hard-coded tables in the script: `radical`, `ids` (from `_ids.txt`: take the variant whose tag contains G and strip the tags, so 起 ⿺走巳 and 关 ⿱丷天; 不 and 见 are written atomic as `不` and `见`, because the vault's 不 entry `⿱一③` holds a placeholder code point), `strokes` (vault md; 系 7, 客 9), reading → hanviet pairs.
- Readings table (pinyin → hanviet; `rare` marked): 你 nǐ nhĩ · 好 hǎo hảo, hào hiếu · 您 nín nâm · 们 men môn · 对 duì đối · 不 bù bất · 起 qǐ khởi · 没 méi một, mò một (rare) · 关 guān quan · 系 xì hệ, jì hệ (rare) · 谢 xiè tạ · 客 kè khách · 气 qì khí · 再 zài tái · 见 jiàn kiến, xiàn hiện (rare).
- Radical (spelled from IDS): 你 亻 · 好 女 · 您 心 · 们 亻 · 对 寸 · 不 一 · 起 走 · 没 氵 · 关 丷 · 系 糸 · 谢 讠 · 客 宀 · 气 气 · 再 冂 · 见 见. Never a code point in U+2E80–U+2FDF.
- `mnemonic`: 13 chars, text verbatim from meo.py; kind from the vault label (你 好 们 起 没 气 见 → etymology; 您 对 不 关 谢 再 → invented). 系 and 客: no `mnemonic` key.
- Test first: extend `content.test.ts` (Task 2) so the 15 files fail to exist, then pass.
- Verify: `node scripts/chars-from-vault.mjs && pnpm test -- content`; once CHY-9 has merged and the branch is rebased, `pnpm lint:content` (check 1, 2, 6, 7).
- Draft code (UNEXECUTED): `const run = (c) => execFileSync('python3', [vault + '/meo.py', c], { encoding: 'utf8' })`; split lines on the four labels `HÌNH|ÂM|ĐỜI THẬT|TƯƠNG PHẢN`.

## Task 2 [AC1] Parse chars/ in the real-content test
File: `src/lib/content/content.test.ts:8-11,28-29`
- Change: add `['chars', 'Char']` to `folders`; `toHaveLength(99)` and the title "finds all 99 content files".
- Test first: run before Task 1, expect 84 ≠ 99 fails once the line is changed.
- Verify: `pnpm test -- src/lib/content/content.test.ts`.

## Task 3 [AC1] Author drills, dialogue and listenSpeak questions
File: `content/lessons/hsk1/h1-01.yaml:39,46,48`
| id | type | prompt → answer | tests |
|---|---|---|---|
| g01 | choice (hanzi) | vi "Chào thầy cô (lịch sự)", [你好, 您好, 你们好] → 1 | grammar h1-g01, words 您 |
| g02 | choice (hanzi) | vi "Chào cả nhóm bạn", [你好, 您好, 你们好] → 2 | grammar h1-g01, words 你们 |
| g03 | order | tiles [们, 你, 好] → s-h1-01-09 | grammar h1-g01 |
| d01 | choice (hanzi) | audio s-h1-01-03, [没关系。, 不客气。, 再见！] → 0 | words 没关系 |
| l01 | tone | audio 好, syllable 0 → 3 | words 好, tone true |
| l02 | choice (hanzi) | audio 你好, [你好, 你们, 您, 再见] → 0 | words 你好 |
| l03 | choice (vi) | audio s-h1-01-18, [Không có gì., Xin lỗi!, Cảm ơn!, Tạm biệt!] → 0 | words 不客气 |
| s01 | readAloud | sentence s-h1-01-06 | words 不客气, tone true |
| f01 | freeAnswer | vi "Bạn làm đổ trà của bạn mình. Nói gì?", rubric [Nói 对不起 (xin lỗi) bằng một câu ngắn] | words 对不起 |
- Ids carry the `q-h1-01-` prefix. Option text copies the prototype (`l4-grammar.html:118-125`, `l5-dialogue.html:127-134`, `l6-listen.html:90-235`).
- Test first: `pnpm test -- content` (schema) and, after the CHY-9 gate, `pnpm lint:content` (check 8: references resolve).
- Verify: `pnpm test -- content` and `pnpm lint:content`.

## Task 4 [AC1] Author the 20-question gate pool
File: `content/lessons/hsk1/h1-01.yaml:52-53` (`draw: 10` stays)
| id | type | prompt → answer | tests.words |
|---|---|---|---|
| x01 | choice | audio 谢谢, options [谢谢, 没关系, 不客气, 对不起] → 0 | 谢谢 |
| x02 | choice (vi) | hanzi 对不起, [xin lỗi, không sao, cảm ơn, tạm biệt] → 0 | 对不起 |
| x03 | choice | vi "không sao", [对不起, 没关系, 谢谢, 再见] → 1 | 没关系 |
| x04 | order | [们, 你, 好] → s-h1-01-09 | 你们, grammar h1-g01 |
| x05 | choice | audio 你们, [你好, 您, 你们, 谢谢] → 2 | 你们 |
| x06 | typePinyin | hanzi 再见 → zàijiàn | 再见 |
| x07 | choice (vi) | hanzi 好, [bạn, anh, chị · ông, bà, thầy cô (lịch sự) · tốt, khỏe, hay · cảm ơn] → 2 | 好 |
| x08 | typePinyin | hanzi 谢谢 → xièxie | 谢谢 |
| x09 | choice | audio 不客气, [谢谢, 没关系, 再见, 不客气] → 3 | 不客气 |
| x10 | choice | vi "Chào thầy cô (lịch sự)", [您好, 你好, 你们好, 好你] → 0 | 您, grammar h1-g01 |
| x11 | choice | audio 你, [您, 你, 好, 谢谢] → 1 | 你 |
| x12 | choice (vi) | hanzi 你, [ông, bà, thầy cô (lịch sự) · bạn, anh, chị · các bạn · xin chào] → 1 | 你 |
| x13 | choice (vi) | hanzi 您, same four options → 0 | 您 |
| x14 | choice | vi "các bạn", [你好, 你们, 您, 好] → 1 | 你们 |
| x15 | choice | vi "xin chào", [谢谢, 再见, 你好, 没关系] → 2 | 你好 |
| x16 | typePinyin | hanzi 你好 → nǐ hǎo | 你好 |
| x17 | typePinyin | hanzi 不客气 → bù kèqi | 不客气 |
| x18 | tone | audio 没关系, syllable 0 → 2 | 没关系, tone true |
| x19 | trueFalse | hanzi 您好, "Dùng 您好 để chào thầy cô." → true | 您, grammar h1-g01 |
| x20 | trueFalse | hanzi 再见, "再见 nghĩa là xin chào." → false | 再见 |
- Coverage: each of the 10 words appears at least twice; x01-x10 are the prototype's `l8-gate.html:155-166` questions (answer index fixed per row above; shuffle is runtime).
- Verify: `pnpm lint:content` (check 8: pool 20 ≥ 2 × draw 10, every word tested).

## Task 5 [AC1] Citation pinyin for s-h1-01-18
File: `h1-01.yaml:31`
- Change: `pinyin: bù kèqi, spoken: bú kèqi` (mirrors line 19).
- Test first: `pnpm test -- content`, then (after the CHY-9 gate) lint checks 3 and 4.
- Verify: same commands.

## Task 6 [AC1] Prove it
- Gate: execute reaches this task after CHY-9 merges (`pnpm lint:content` is not in package.json:6-23 yet) and rebases onto it. `pnpm lint:content` → 0 errors, exit 0; `pnpm test`, `pnpm check`, `pnpm lint` green on the same tree.
- Negative control: rename `content/chars/好.yaml` away, expect an error naming 好 (check 1 or the importer's C2 error), restore, rerun clean.

## Parked
- `content/cast.yaml` has no reader (C1) and no schema (C6); revisit if CHY-9 adds a Cast input.
- The count 99 in `content.test.ts` moves whenever another lane adds files under words/, lessons/ or chars/.

## Mutation paths covered
- Content is read by lint (C1) and the importer (C2) from the same files; no write path. CHY-12 regenerates `content/words/*` and keeps `examples`, `image`, `parts`, `components`, `spoken`, `hanviet` (C4), so none of the ids this lesson points at change.

## Rollback
`git revert` of this slice's commits; no migration.
