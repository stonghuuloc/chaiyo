# CHY-10 S1 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `pnpm lint:content` (C1, CHY-9) on `content/` prints 0 errors and exits 0 with Bài 1 in the set. Verified by: running it on the final tree.
- [AC1] `content/chars/` holds exactly 15 files, one per char of the 10 `sections.words.ids` words: 你 好 您 们 对 不 起 没 关 系 谢 客 气 再 见. Each parses as `Char` and has `readings` (every vault reading, tone-marked pinyin, Hán Việt), `radical`, `ids`, `strokes`.
- [AC1] Reading rules (C2, CHY-8): a toned syllable matches a reading with the same tone-marked `pinyin`; an unmarked neutral syllable (不 bu in 对不起, 系 xi in 没关系, 谢 xie in 谢谢, 气 qi and 们 men) matches the first non-rare reading with the same letters. So `rare: true` only on 没 mò, 见 xiàn, 系 jì. 好 lists hǎo → hảo and hào → hiếu.
- [AC1] `mnemonic` on 13 chars is the vault `meo.py` text verbatim (HÌNH → hinh, ÂM → am, ĐỜI THẬT → doiThat, TƯƠNG PHẢN → tuongPhan; `[từ nguyên]` → etymology, `[tự dựng]`/`[mẹo tự dựng]` → invented). 系 and 客 have no `mnemonic` (10.Q4 A).
- [AC1] `h1-01.yaml` `grammar.drills` holds 3 questions, `dialogue.questions` 1, `listenSpeak.items` 5, `gate.pool` 20 (draw 10); ids `q-h1-01-g01..g03`, `d01`, `l01..l03`, `s01`, `f01`, `x01..x20`.
- [AC1] The first 10 gate questions carry the prototype's `l8-gate.html` questions (same hanzi, options, answers). The other 10 cover 你, 您, 你好, 你们, 好, 不客气, 没关系, 再见 with choice, typePinyin, tone and trueFalse types.
- [AC1] Every one of the 10 `sections.words.ids` appears in some question's `tests.words` in the gate pool; 你 and 好 also appear in `tests.words` of a drill/dialogue/listenSpeak question or are tokens of h1-g01's pattern (decision 1; 你 好 are pattern tokens).
- [AC1] `s-h1-01-18` is `pinyin: bù kèqi, spoken: bú kèqi` (citation + override, as `s-h1-01-06`); the 9 other `pinyin` values stay citation. The dialogue keeps the prototype speakers (10.Q1 A): R·T·T·R and R·T·T.
- [AC1] `topic` stays `Chào hỏi`; `content/levels/hsk1.yaml` and `content/words/*` are not edited (C4).
- [AC1] `content.test.ts` parses `chars/` as `Char` (84 + 15 = 99 files, 0 errors).

## Not this slice
- AC2 (importer diff vs prototype) and AC3 (sections render) → S2.
- `content/cast.yaml`: C1 has no Cast input and no Cast schema exists (schema changes are C6, CHY-11), so nothing can read it; parked. `scene.cast` stays [panda, fawn].
- Word senses, POS, examples → CHY-12 (C4). Mnemonics for 系 and 客 → vault lessons, later.
- `ask` and `why` question fields (explanations the prototype shows) → CHY-11's schema additions, not authored here.

## Seam
`content/lessons/hsk1/h1-01.yaml` plus `content/chars/*.yaml`; no product code.

## Test contract
- [AC1] `pnpm lint:content` → 0 errors, exit 0. Gate: `lint:content` is not a script on main yet, so execute runs it after CHY-9 merges and the branch rebases onto it; until then `content.test.ts` is the check. Negative control: move `content/chars/好.yaml` away, expect an error naming 好 (check 1 or the importer's C2 error), then restore it.
- [AC1] `pnpm test -- content` → 99 files parse, 0 errors; new `chars/*.yaml` rows appear in the vitest list.
- [AC1] `python3 ~/Documents/second-brain/mandarin/meo.py 你 好 …` text equals each file's `mnemonic` after the label mapping (lint 7 does this once CHY-9 lands).

## Open assumptions
- [AC1] Radical is spelled from IDS (你 亻), not the vault's traditional Kangxi form (人). Wrong pick costs 15 one-line values; no lint check reads `radical`. Settled in DISCUSSION.md "Answered here".
- [AC1] Check 2's "common readings" is CHY-9's definition (C1); this spec lists every vault reading and marks the three minor ones rare.
