# CHY-8 S4 — plan
ACs: AC9  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-8 (after S1 lands on it) · run `pnpm install` first

## Anchors (verified 2026-11-03 on main 9007e33)
- `docs/content-schema.md:323` seg rule · `:105` `seg?: string[]` in the Sentence type · `:325`-`:326` Dictionary link (S3).
- `src/lib/content/schemas.ts:70-79` `Sentence` (`seg` at `:77`) · `:81` `GrammarPoint` (`pattern`) · `:115` `Question` union: `choice` (`options`, `optionKind`), `order` (`tiles`), `fill` (`options`) · `:172` `Lesson` (`titleHanzi`, `sections.grammar.drills`, `sections.dialogue.questions`, `sections.listenSpeak.items`, `gate.pool`) · `:22` `Char`.
- `src/lib/content/parse.ts:4-9` `ContentError { file, path, message }`: the error shape `parseDictionary` returns.
- `prototype/data/dict.json`: 4,233 rows `[hz, pinyin, toneless, hanviet, meaning, level, senses, others]`, one row per hz, 866 one-char rows, longest word 4 chars; row shape in `scripts/build-dict.py:1-8` header.
- `src/lib/content/derive/index.ts` (created by S1 Task 5): this slice appends exports.
- `vite.config.ts:40-49` vitest node project (`:44`), `requireAssertions: true`; coverage thresholds at `:38`.
- Dependencies added: none (`zod` is already a dependency).

## Task 1 [AC9] Dictionary file + `parseDictionary`
Files: new `content/dictionary.json` (`cp prototype/data/dict.json content/dictionary.json`), new `src/lib/content/derive/dictionary.ts`, new `src/lib/content/derive/dictionary.test.ts`
- Test first: real file parses to 4,233 entries; 你们 → pinyin `nǐ men`, hanviet `nhĩ môn`, meaning starts `các bạn`; a row `['你','nǐ','ni',5,'x',1,[],[]]` (numeric hanviet) → 1 error `{ file, path: '[0][3]' }`; `readFileSync('content/dictionary.json')` equals `readFileSync('prototype/data/dict.json')`.
- Change: `ThinEntry = { hanzi; pinyin; hanviet; meaning }`; zod row schema `z.tuple([z.string(), z.string(), z.string(), z.string(), z.string(), z.number(), z.array(z.string()), z.array(z.unknown())])`; `parseDictionary(file: string, rows: unknown): { ok: true; value: Map<string, ThinEntry> } | { ok: false; errors: ContentError[] }` using the same path formatter style as `parse.ts`.
- Verify: `pnpm vitest --run src/lib/content/derive/dictionary.test.ts`

## Task 2 [AC9] `segment` + `deriveSeg`
Files: new `src/lib/content/derive/seg.ts`, new `src/lib/content/derive/seg.test.ts`
- Test first: 你们好！ with dict `{你们, 好}` → `['你们','好','！']`; with dict `{你, 们, 好}` → `['你','们','好','！']`; lesson words {你, 好} vs dict 你好吗 on `你好吗` → one 3-char token; real case `二十分钟` (s-h2-01-06) with lesson word 分钟 and dict 二, 十, 十分, 分钟 → `['二','十','分钟']`; authored `seg: ['你','好']` returned untouched; unknown 熊 → `['熊']`; `你 / 您 + 好` → each of `' '`, `/`, `+` its own token; property: every sentence of every file under `content/lessons/**` (`parseContent('Lesson', …)`, real dict) satisfies `seg.join('') === hanzi`.
- Change: `segment(text: string, lessonWords: ReadonlySet<string>, dict: ReadonlyMap<string, ThinEntry>): string[]`: DP over code-point positions; `best[i]` = (fewest tokens, then most chars inside lesson-word tokens) for the suffix from i; candidates at i are lengths 1…max that are in `lessonWords` or `dict`, plus the 1-char fallback; rebuild tokens from the stored choice. `deriveSeg(s: Pick<Sentence,'hanzi'|'seg'>, lessonWords, dict) = s.seg ?? segment(s.hanzi, …)`.
- Verify: `pnpm vitest --run src/lib/content/derive/seg.test.ts`

## Task 3 [AC9] `bundleHanzi` + `thinEntries`
Files: new `src/lib/content/derive/thin.ts`, new `src/lib/content/derive/thin.test.ts`
- Test first (literal fixture dict with 你们, 你, 们, 好, 谢谢, 谢, 您, 你好, not the real file): a lesson literal with sentences 你们好！/谢谢！, a `choice` (`optionKind: 'hanzi'`, options 你好/您好), a `choice` with `optionKind: 'vi'` (options ignored), an `order` (tiles 们/你/好), a `fill` (options), grammar `pattern: '你 / 您 / 你们 + 好'`, `titleHanzi: '你好'` → `bundleHanzi` returns exactly the hanzi strings above; `thinEntries` over them returns entries for 你们, 好, 谢谢, 你, 们, 您, 你好 (chars 你 们 好 谢 您 from one-char rows), sorted by hanzi, no duplicate `好`; lesson-word map `{ 你好 → pinyin 'nǐ hǎo', hanviet 'nhĩ hảo' }` beats a Dictionary row with a different pinyin; token 熊 with no row → no entry.
- Change: `bundleHanzi(lesson: Lesson, grammar: GrammarPoint[]): string[]` walks `lesson.sentences`, every `Question` in `sections.grammar.drills`, `sections.dialogue.questions`, `sections.listenSpeak.items`, `gate.pool` (`choice` with `optionKind === 'hanzi'`, `fill` options, `order` tiles), each `grammar[].pattern`, `lesson.titleHanzi`; Primer input returns `[]`. `thinEntries(texts: string[], ctx: { lessonWords: ReadonlyMap<string, ThinEntry>; dict: ReadonlyMap<string, ThinEntry> }): ThinEntry[]`: segment each text (`segment(text, new Set(lessonWords.keys()), dict)`), keep tokens containing a CJK code point (U+3400–U+9FFF), add `lessonWords.get(t) ?? dict.get(t)`, then each distinct CJK char of those tokens via `dict.get(char)` (lesson map first), dedupe by hanzi, sort by `hanzi`.
- Verify: `pnpm vitest --run src/lib/content/derive/thin.test.ts`

## Task 3b [AC9] `lessonWordEntries`
Files: `src/lib/content/derive/thin.ts`, `src/lib/content/derive/thin.test.ts`
- Test first: Words 你们 (`pinyin: 'nǐmen'`, `senses: [{ vi: 'các bạn' }]`, no `hanviet`) and chars 你(nǐ→nhĩ), 们(men→môn) → `{ hanzi: '你们', pinyin: 'nǐmen', hanviet: 'nhĩ môn', meaning: 'các bạn' }`; authored `hanviet: 'x'` wins; chars missing → `hanviet: ''`; id with no Word skipped; polyphone ids `行-hang`, `行-xing` → first kept.
- Change: `lessonWordEntries(lesson: Lesson, words: ReadonlyMap<string, Word>, chars: Record<string, Char>): Map<string, ThinEntry>` using S1 `deriveHanViet`.
- Verify: `pnpm vitest --run src/lib/content/derive/thin.test.ts`

## Task 4 [CHORE] Barrel
File: `src/lib/content/derive/index.ts`
- Change: append `export { parseDictionary, type ThinEntry } from './dictionary'; export { segment, deriveSeg } from './seg'; export { bundleHanzi, thinEntries, lessonWordEntries } from './thin';`.
- Verify: `pnpm vitest --run src/lib/content/derive && pnpm check && pnpm lint` → green; `git status` shows only `content/dictionary.json` and `src/lib/content/derive/*`.

## Mutation paths covered
- Pure functions over parsed values; the one data change is the new `content/dictionary.json` copy. Callers: S2 (loads the file once and calls `lessonWordEntries`) and S3 (feeds `bundleHanzi` output into the bundle). An authored `seg` takes the same `deriveSeg` path as a derived one.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
export function segment(text: string, lessonWords: ReadonlySet<string>, dict: ReadonlyMap<string, ThinEntry>): string[] {
  const cps = [...text];
  const max = Math.max(1, ...[...lessonWords].map((w) => [...w].length), ...[...dict.keys()].map((w) => [...w].length));
  const out: string[] = [];
  for (let i = 0; i < cps.length; ) {
    let n = Math.min(max, cps.length - i);
    while (n > 1 && !lessonWords.has(cps.slice(i, i + n).join('')) && !dict.has(cps.slice(i, i + n).join(''))) n--;
    out.push(cps.slice(i, i + n).join(''));
    i += n;
  }
  return out;
}
```
The draft above is the greedy sketch; the Task 2 plan (DP, fewest tokens) replaces it, because greedy mis-cuts `二十分钟` (advisor probe). A fixture that contradicts the spec must be reported, not bent to green.

## Rollback
git revert of this slice's commits; removes `content/dictionary.json` and the three derive files. No dependency, no migration; `prototype/data/dict.json` is untouched.
