# CHY-8 S1 — plan
ACs: AC4, AC5, AC6, AC8  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-8 (from origin/main 9007e33, 2026-11-03) · run `pnpm install` first (node_modules absent)

## Anchors (verified 2026-11-03 on main 9007e33)
- `docs/content-schema.md:319` spoken rule; `:321` taughtIn rule (first lesson that lists it in `words`); `:325` gate draw coverage.
- `src/lib/content/schemas.ts:22` `Char` (`readings[]` of `{ pinyin, hanviet, rare? }`) · `:42` `Word` (`pinyin`, `spoken?`, `hanviet?`, no `taughtIn` key) · `:70` `Sentence` (`hanzi`, `pinyin`, `spoken?`) · `:102-108` `QuestionBase` (`id`, `tests.words?`) · `:172` `Lesson` (`level`, `order`, `sections.words.ids`, `gate.pool`) · `:209` `Primer` (`kind: 'primer'`, no `sections.words`) · `:234-240` inferred types.
- `src/lib/content/parse.ts:16` `parseContent(type, file, text)`: how the real-content test loads h1-01.
- `vite.config.ts:40-49` vitest project `server` (`:44`), node env, `requireAssertions: true`; `:38` coverage thresholds lines 67 / functions 52 / branches 79 (new code must be tested).
- `src/lib/content/layout.test.ts:1-8` test style: `import { describe, expect, it } from 'vitest'`, `process.cwd()` for content paths.
- `content/lessons/hsk1/h1-01.yaml:14,19` sentences with authored `spoken` (`ní hǎo`, `bú kèqi`) · gate pool `[]`, draw 10 · `sections.words.ids` = 10 ids.
- `content/lessons/hsk2/h2-01.yaml:15,17,18` authored 一 and 3-3 cases used as fixtures.
- C1 agreement (CONTRACTS.md): export path `src/lib/content/derive/spoken.ts`, `deriveSpoken(pinyin: string, hanzi: string): string`.
- No `rg` on the Mac: use `grep`. Dependencies added: none.

## Task 0 [AC4][AC8] Shared pinyin splitter
Files: new `src/lib/content/derive/pinyin.ts`, new `src/lib/content/derive/pinyin.test.ts`
- Test first: erhua `yǒudiǎnr`/有点儿 aligns with no throw; `jǐnguǎn` (尽管) → `jǐn|guǎn`, `huáiniàn` (怀念) → `huái|niàn`, `wūrǎn` (污染) → `wū|rǎn` (the 3 real words that split two ways at equal count); an apostrophe (`Xī'ān`) is a syllable boundary, not a clause break; `splitSyllables('nǐ yǐjīng yǒu hǎo', 5)` → `['nǐ','yǐ','jīng','yǒu','hǎo']` grouped by clause; `'xiānsheng'` with 2 chars → `['xiān','sheng']`; `'yǐhòu, nǐ'` → 2 clauses; capital `Xiǎo` kept; count mismatch (`'yī gè'` with 1 char) → `aligned: false`.
- Change: export `splitSyllables(pinyin, charCount): { clauses: { syl: string; tone: 0|1|2|3|4; charIndex: number; erhua?: true }[][]; aligned: boolean }` and `withTone(syl, tone)`. Steps (2)–(4) of Task 1 live here, with the spelling rule: a syllable with no initial (`y`/`w` count as initials) may only start a letter run or follow an apostrophe, and coda `r` applies to `er` (an `er` syllable is never erhua: 女儿 `nǚ'ér` pairs 儿 with `ér`) and to a run-final erhua `r` after a non-`er` syllable (that syllable carries `erhua: true`, its text keeps the `r` for tone and sandhi, it consumes two chars (host + 儿) and the next syllable's `charIndex` skips 儿) (`yǒudiǎnr`: the `r` belongs to `diǎn`, and 儿 in the hanzi pairs with that syllable, so 有点儿 is 3 chars and 2 syllables yet aligned); the count rule and longest-first fallback only choose among splits that obey it; `spoken.ts` and `hanviet.ts` import them.
- Verify: `pnpm vitest --run src/lib/content/derive/pinyin.test.ts`

## Task 1 [AC4] `deriveSpoken`
Files: new `src/lib/content/derive/spoken.ts`, new `src/lib/content/derive/spoken.test.ts`
- Test first (`spoken.test.ts`): `it.each` the 4 AC rows (`nǐ hǎo`/你好 → `ní hǎo`; `bù kèqi`/不客气 → `bú kèqi`; `yī gè`/一个 → `yí gè`; `yī tiān`/一天 → `yì tiān`) and cases: `wǒ hěn hǎo`/我很好 → `wó hén hǎo`; glued `nǐ yǐjīng yǒu hǎo`/你已经有好 → `ní yǐjīng yóu hǎo`; comma barrier `nǐ hǎo, nǐ hǎo`/你好，你好 → `ní hǎo, ní hǎo`; `nǐmen hǎo`/你们好 unchanged; `yī` before a neutral syllable and `yī` last unchanged; `yīfu`/衣服 unchanged (衣 is not 一); `yībān`/一般 → `yìbān` (glued); `yī kè`/一刻 → `yí kè`; capitals `Yī gè`/一个 → `Yí gè`, `Bù qù`/不去 → `Bú qù`, capital marked vowel kept capital when changed (`Ǒu'ěr`/偶尔 → `Óu'ěr`; `withTone('m', 2)` returns `m`; `withTone('Ā', 2)` returns `Á`); erhua `yǒudiǎnr jǐnzhāng`/有点儿紧张 → `yóudiánr jǐnzhāng` (3-3-3 on original tones; the authored `yóudiǎnr` in h3-01.yaml is not a fixture); hanzi/pinyin count mismatch (`yī gè` with hanzi `一`) leaves 一 unchanged; and the authored s-h1-01-01, s-h1-01-06, s-h2-01-02, s-h2-01-04, s-h2-01-05 pairs (copied as literals).
- Change: pure module importing only `./pinyin`. Steps in order: (1) `chars` = CJK code points of `hanzi` (U+3400–U+9FFF); (2) split `pinyin` into clauses at punctuation (`, . ; : ! ? ， 。 ！ ？ ； ： 、` and quote marks, not the apostrophe) and into letter runs at spaces; (3) split each run into syllables with a syllable-shape pattern (optional initial `zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw]`, vowels with at most one tone mark, optional coda `ng|n|r`); when several splits exist keep the one whose total syllable count equals `chars.length` minus the 儿 chars paired with an erhua `r`; if none does, keep the longest-first split and set `aligned = false`; (4) tone per syllable = index of its marked vowel + 1, unmarked = 0 (neutral); (5) on the ORIGINAL tones, per clause: tone 3 followed by tone 3 → tone 2; if `aligned`, `chars[syl.charIndex] === '不'` and syllable `bù` (syllables are lower-cased before tone detection and before the 一/不 compare, so `Bù`, `Yī` and `Ā` at a sentence start behave like their lowercase forms; output keeps the original case) before tone 4 → `bú`; `chars[syl.charIndex] === '一'` and syllable `yī` before tone 4 → `yí`, before 1/2/3 → `yì`; (6) re-emit the string with only the changed vowels replaced, so capitals, spaces and punctuation survive byte for byte.
- Verify: `pnpm vitest --run src/lib/content/derive/spoken.test.ts`

## Task 2 [AC5] `resolveSpoken` authored override
Files: `src/lib/content/derive/spoken.ts` (add export), `src/lib/content/derive/spoken.test.ts`
- Test first: `resolveSpoken({ hanzi: '你好', pinyin: 'nǐ hǎo', spoken: 'nǐ hǎo' })` returns `nǐ hǎo` (override differs from the derived `ní hǎo`); the same item without `spoken` returns `ní hǎo`; a Sentence containing 你好 whose Word carries an override still derives its own value (two calls, independent).
- Change: `resolveSpoken = (x: { hanzi: string; pinyin: string; spoken?: string }) => x.spoken ?? deriveSpoken(x.pinyin, x.hanzi)`; structural type so it accepts both `Word` (`schemas.ts:42`) and `Sentence` (`:70`) without importing them.
- Verify: same filtered command.

## Task 3 [AC6] `deriveBacklinks`
Files: new `src/lib/content/derive/backlinks.ts`, new `src/lib/content/derive/backlinks.test.ts`
- Test first: two lessons h1-01 (order 1) and h1-02 (order 2) both list `你好`; `h1-02` also lists `再见` → `taughtIn['你好'] === 'h1-01'`, `listedIn['你好'] = ['h1-01','h1-02']`, `taughtIn['再见'] === 'h1-02'`; same result with the input array reversed; a level-2 lesson with order 1 sorts after level-1 lessons; a Primer in the input adds no entry; a word in no lesson has no key.
- Change: `deriveBacklinks(lessons: (Lesson | Primer)[]): { taughtIn: Record<string,string>; listedIn: Record<string,string[]> }`. Filter `kind !== 'primer'` (`schemas.ts:209`), sort by `level`, then `order`, then `id`; for each lesson push its id into `listedIn[wordId]` for every id in `sections.words.ids` (once per lesson); `taughtIn[id] = listedIn[id][0]`.
- Verify: `pnpm vitest --run src/lib/content/derive/backlinks.test.ts`

## Task 4 [AC6] `gateCoverage`
Files: new `src/lib/content/derive/gate.ts`, new `src/lib/content/derive/gate.test.ts`
- Test first: pool `[q1 tests 你好, q2 tests 你好 + 好, q3 tests grammar only]`, words `[你好, 好, 再见]` → `{ 你好: ['q1','q2'], 好: ['q2'], 再见: [] }`; every id in `sections.words.ids` is a key (AC6 "every lesson word appears"); real file: `parseContent('Lesson', 'lessons/hsk1/h1-01.yaml', text)` of `content/lessons/hsk1/h1-01.yaml` yields a key for each of its `sections.words.ids` (10 today; assert the keys only, never the values, because CHY-10 authors that pool). `deriveBacklinks` on the same parsed lesson gives `taughtIn['你好'] === 'h1-01'` (the AC6 scenario's Then; add this assertion in `backlinks.test.ts`).
- Change: `gateCoverage(lesson: Lesson): Record<string, string[]>` — seed each `sections.words.ids` entry with `[]`, then for each `gate.pool` question push `q.id` into every `q.tests.words` entry that is a lesson word (ids not in the lesson's words are ignored; lint 8 owns unknown ids). Never throws.
- Verify: `pnpm vitest --run src/lib/content/derive/gate.test.ts`

## Task 4b [AC8] `deriveHanViet`
Files: new `src/lib/content/derive/hanviet.ts`, new `src/lib/content/derive/hanviet.test.ts`
- Test first: also 尽管 `jǐnguǎn` → `tận quản` and 怀念 `huáiniàn` → `hoài niệm` (the equal-count split cases; chars as literals); chars `{ 你: [nǐ→nhĩ], 好: [hǎo→hảo, hào→hiếu], 爱: [ài→ái], 不: [bù→bất], 客: [kè→khách], 气: [qì→khí, rare: false] }` as literals. 你好/`nǐ hǎo` → `{ hanviet: 'nhĩ hảo' }`; 爱好/`ài hào` → `ái hiếu`; 不客气/`bù kèqi` → `bất khách khí` (neutral `qi`); a word with authored `hanviet: 'x'` → `x` without reading `chars`; chars without 你 → `{ missing: ['你'] }`; `好` with only the `hào` reading and syllable `hǎo` → `{ missing: ['好'] }`; hanzi 2 chars vs 1 syllable → `{ missing }`.
- Change: `deriveHanViet(word: Pick<Word,'hanzi'|'pinyin'|'hanviet'>, chars: Record<string, Char>): { hanviet: string } | { missing: string[] }`. Erhua: for an `erhua` syllable `deriveHanViet` strips the `r`, matches the host char's reading (哪 `nǎ`) and takes 儿's Hán Việt from `Char` 儿 `ér`; 女儿 `nǚ'ér` is not erhua (女 `nǚ`, 儿 `ér`). `splitSyllables` tests: `nǎr`/哪儿 → one syllable with `erhua`, `charIndex` 0, `aligned` true; 有点儿不对 `yǒudiǎnr bùduì` → `bù` has `charIndex` 3 and still becomes `bú` before `duì` (一/不 look up the hanzi by `charIndex`, never by syllable index); `nǚ'ér`/女儿 → 2 syllables, no `erhua`; in 有点儿紧张 `jǐn` has `charIndex` 3. `deriveHanViet` tests for both words. Uses `splitSyllables(word.pinyin, [...hanzi].length)`; exact match on NFC-normalised, lower-cased pinyin; neutral syllable (tone 0) matches first non-rare reading with the same letters after stripping marks.
- Verify: `pnpm vitest --run src/lib/content/derive/hanviet.test.ts`

## Task 5 [CHORE] Barrel for S2
File: new `src/lib/content/derive/index.ts`
- Change: `export { deriveSpoken, resolveSpoken } from './spoken'; export { deriveBacklinks } from './backlinks'; export { gateCoverage } from './gate'; export { deriveHanViet } from './hanviet';`. No other file edits; `schemas.ts`, `parse.ts`, docs untouched.
- Verify: `pnpm vitest --run src/lib/content/derive && pnpm check && pnpm lint` → all green, 0 new files outside `src/lib/content/derive/`.

## Mutation paths covered
- Pure functions over parsed values: no create/edit/patch writers, no disk, no YAML write-back. The only caller shapes are S2's importer (parsed `Lesson | Primer`, `Word`, `Sentence`) and CHY-9 check 4 (`deriveSpoken` with a Sentence's hanzi and pinyin). Both pass the same two strings.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' } as const;
const toneOf = (syl: string) => { for (const [i, c] of [...syl].entries()) for (const [v, m] of Object.entries(MARKS)) { const t = m.indexOf(c.toLowerCase()); if (t >= 0) return { t: t + 1, i, v }; } return null; };
const withTone = (syl: string, tone: 1 | 2 | 3 | 4) => { const m = toneOf(syl); if (!m) return syl; const up = [...syl][m.i] !== [...syl][m.i].toLowerCase(); return [...syl].map((c, k) => { if (k !== m.i) return c; const r = MARKS[m.v as keyof typeof MARKS][tone - 1]; return up ? r.toUpperCase() : r; }).join(''); };
export function deriveSpoken(pinyin: string, hanzi: string): string {
  const chars = [...hanzi].filter((c) => /[\u3400-\u9fff]/.test(c));
  // split into clauses/runs/syllables, pick the split whose count equals chars.length, then:
  // for k in clause: const s = clause[k]; orig = s.tone; next = clause[k + 1]?.tone (same clause only)
  //   if (orig === 3 && next === 3) out[k] = withTone(syl[k], 2)
  //   else if (aligned && chars[s.charIndex] === '不' && syl[k].toLowerCase() === 'bù' && next === 4) out[k] = withTone(syl[k], 2)
  //   else if (aligned && chars[s.charIndex] === '一' && syl[k].toLowerCase() === 'yī' && next) out[k] = withTone(syl[k], next === 4 ? 2 : 4)  // yí / yì ; next === 0 (neutral) unchanged
  return rebuilt;
}
```
A fixture that contradicts the AC4 table, or a doc rule that cannot be expressed, must be reported to the Captain, not bent to green. Authored `spoken` values in h2–h5 preview files that disagree with the rule (DISCUSSION, Current behaviour) are NOT fixtures.

## Rollback
git revert of this slice's commits, or delete `src/lib/content/derive/`. No dependency, no migration, no data change.
