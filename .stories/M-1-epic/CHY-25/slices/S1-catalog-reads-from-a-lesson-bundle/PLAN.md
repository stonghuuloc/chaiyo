# CHY-25 S1 — plan
ACs: AC2, AC3, AC4, AC7  ·  Spec rev 2  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-25 off main 0836423e · run `pnpm install` first
Base: ~/Documents/Projects/chaiyo@0836423e

## Files touched
- create: `src/lib/catalog/index.ts` (types, `CatalogError`, `createCatalog`)
- create: `src/lib/catalog/catalog.test.ts`
- create: `src/lib/catalog/fixtures/source.ts` (test-only; excluded from coverage by `vite.config.ts:45`)
No product code outside `src/lib/catalog/`; no schema, content, lint or route edit.

## Anchors (re-verified 2026-11-13 on main 0836423e (only package.json deps bump drifted; :16 anchor unchanged); every anchored file is byte-identical to 23f1db9 except the fixture h1-01, whose gate `tests` gained `grammar`)
- `src/lib/content/import/bundle.ts:6-16` `Bundle` type (`sha`, `lesson`, `sentences`, `questions`, `grammar`, `words`, `chars`, `gateCoverage`, `thin`); `:18-57` `buildBundle(content, id)`, `words` = content order.
- `src/lib/content/import/sink.ts:19` `ImportedWord = Word & { taughtIn?; listedIn }`; `:21` `ImportedSentence = Sentence & { lessonId?; seg }`; `:52-70` `createMemorySink()` with synchronous `content`/`versions`.
- `src/lib/content/import/import.ts:52` `importContent(dir, sink, opts?: { refs?, only? })` returns `{ sha } | { errors }`; `import/index.ts:1-5` is the barrel.
- `src/lib/content/import/bundle.test.ts:3-15` the `loadOk()` pattern (`fixtureRefs`, memory sink); `src/lib/content/lint/fixtures/refs.ts:3` `fixtureRefs`; `src/lib/content/import/fixtures/ok/lessons/hsk1/h1-01.yaml` = the fixture lesson; `h0-00.yaml` = the Primer.
- `src/lib/content/derive/seg.ts:25-37` every token is a slice of the input and covers it end to end, so a code-point index maps to exactly one token; `src/lib/content/derive/thin.ts:40-58` `thin` holds each hanzi token and each of its chars.
- `src/lib/content/derive/backlinks.ts:7-13` `listedIn` = every lesson listing a word; the first by (level, order, id) is `taughtIn`.
- `vite.config.ts:45` excludes `src/**/fixtures/**` from coverage; `vite.config.ts:56` runs `src/**/*.{test,spec}.{js,ts}`; `package.json:16` `test` = `vitest --run --passWithNoTests`.
- `src/lib/content/schemas.ts:265-272` `Lesson`, `Word`, `Char`, `Sentence`, `GrammarPoint`, `Question`, `Primer`; `src/lib/content/import/bundle.ts:8,21` `Bundle['lesson']` is an `Omit` over `Lesson | Primer` (shared keys only), while the runtime value is the full lesson; `src/lib/content/derive/dictionary.ts:4` `ThinEntry = { hanzi, pinyin, hanviet, meaning }`; `src/lib/content/import/bundle-sink.ts:1` imports `node:fs` (why `index.ts` never imports the barrel).
- Fixture content read at d090b0a0 (`tsx` probe: `importContent(fixtures/ok, createMemorySink(), { refs: fixtureRefs })` + `buildBundle`): sha `187fb644…`, lessons `h0-00` (0 words, 0 sentences, 0 thin) and `h1-01`; h1-01: 10 words, 20 sentences, s-h1-01-01 = `你好！` with `seg: ['你好','！']`, `thin` 11 entries, `你好` = `{ pinyin: 'nǐ hǎo', hanviet: 'nhĩ hảo', meaning: 'xin chào' }`, word `你好` has `listedIn: ['h1-01']`, char `你` has one reading `{ pinyin: 'nǐ', hanviet: 'nhĩ' }`.

## Task 1 [AC7] Source seam + lesson load + errors
File: `src/lib/catalog/index.ts` (new); first cases in `src/lib/catalog/catalog.test.ts` (new)
- Test first: a hand-written source over two `buildBundle` results returns `lesson('h1-01')` with `contentSha` = the sha, `lesson.title` `Xin chào`; the second call for the same id calls `source.bundle` once (the bundle is cached); `lesson('h9-99')` -> `CatalogError` `not-found`, `id 'h9-99'`, message contains `h9-99`; a bundle with `sha` `'f'.repeat(64)` under the requested sha -> `malformed`; a bundle whose `lesson.id` is `h1-02` when h1-01 was asked -> `malformed`.
- Change: every export of the SPEC `## Seam` block, verbatim (`CatalogSource`, `CatalogErrorCode`, `CatalogError`, `LessonContent`, `CatalogWord`, `CatalogChar`, `LookupHit`, `Catalog`); `createCatalog(source)` with `loaded: Map<string, Bundle>`; `lesson(id)` = `source.current()` -> `source.bundle(sha, id)` -> validate -> cache -> `toLessonContent(bundle)`, where `lesson` = `bundle.lesson as Lesson | Primer` (sound per `bundle.ts:21`) and `words` = `'words' in lesson.sections ? lesson.sections.words.ids` mapped through `bundle.words` `: []` (Primer) — a direct `.sections.words` read fails tsc TS2339 on the union. Types are `import type` from `../content/import/bundle`, `../content/import/sink`, `../content/schemas`, `../content/derive/dictionary`.
- Verify: `pnpm test -- src/lib/catalog/catalog.test.ts`.

## Task 2 [AC2] Word and char reads
File: `src/lib/catalog/index.ts`, `src/lib/catalog/catalog.test.ts`
- Test first: after `lesson('h1-01')`, `word('你好')` deep-matches the bundle's word plus `contentSha` (pinyin `nǐ hǎo`, spoken `ní hǎo`, hanviet `nhĩ hảo`, `listedIn ['h1-01']`, `taughtIn 'h1-01'`); `char('你')` has one reading `{ pinyin: 'nǐ', hanviet: 'nhĩ' }`, `strokes 7` and `contentSha`; `word('不存在')` and `char('𠀀')` -> `not-found` naming the id; both work with a lesson loaded second that holds the word (search every loaded bundle, not just the last).
- Change: `word(id)` and `char(hanzi)` scan `loaded.values()`; return `{ ...found, contentSha: bundle.sha }`; a miss throws `not-found` naming the id.
- Verify: same command.

## Task 3 [AC3] Tap lookup through seg + thin
File: `src/lib/catalog/index.ts`, `src/lib/catalog/catalog.test.ts`
- Test first: `lookup('s-h1-01-01', 0)` and `…, 1` -> `你好` (`pinyin 'nǐ hǎo'`, `hanviet 'nhĩ hảo'`, `meaning 'xin chào'`, `contentSha`, `sentenceId 's-h1-01-01'`, `start 0`); `…, 2` (the `！` token) -> `not-found` naming `s-h1-01-01:2`; a hand-built bundle whose `thin` lacks `你好` but holds `你` and `好` -> `lookup(…, 1)` returns the `好` entry with `start 1` (char fallback); `…, 20` -> `not-found` naming `s-h1-01-01:20`; `lookup('s-h9-99-01', 0)` -> `not-found` naming `s-h9-99-01`; a hand-built sentence whose `seg` does not concatenate to `hanzi` -> `malformed` naming the sentence id.
- Change: `tokenAt(seg, index)` walks token lengths over `[...token]`; find the sentence across loaded bundles; `thin` entry by token hanzi, else by the single char under the index; else `not-found` `<sentenceId>:<tapIndex>`; `start` = the token's first code-point index, or the tapped index on the char fallback.
- Verify: same command. Negative control as in SPEC.

## Task 4 [AC7] Fixture source, no network
Files: create `src/lib/catalog/fixtures/source.ts`; edit `src/lib/catalog/catalog.test.ts`
- Test first: replace the hand-written source with `await fixtureSource()`; assert the SPEC literals for h1-01 and the Primer (`lesson('h0-00').words` is `[]`); `vi.stubGlobal('fetch', spy)` with a throwing spy (the catalog takes no `fetch` param) and assert its call count is 0 across `lesson`, `word`, `char` and `lookup`.
- Change:
  ```ts
  export async function fixtureSource(): Promise<CatalogSource> {
    const sink = createMemorySink();
    const res = await importContent(join(__dirname, '../../content/import/fixtures/ok'), sink, { refs: fixtureRefs });
    if ('errors' in res) throw new Error(JSON.stringify(res.errors));
    const content = sink.content!;
    const bundles = new Map(content.lessons.map((l) => [l.id, buildBundle(content, l.id)]));
    return {
      current: async () => content.sha,
      bundle: async (sha, id) => {
        if (sha !== content.sha) throw new CatalogError('malformed', id);
        const bundle = bundles.get(id);
        if (!bundle) throw new CatalogError('not-found', id);
        return bundle;
      }
    };
  }
  ```
  `__dirname` for the fixture path matches `bundle.test.ts:8`; the file imports `node:path` only here. A build error for any fixture lesson surfaces while building the map, before a test can mask it as not-found.
- Verify: `pnpm test -- src/lib/catalog`; `pnpm check` (the test file is type-checked, so a seam signature drift fails here).

## Task 5 [NFR][CHORE] Prove it
- `pnpm test -- src/lib/catalog`, `pnpm test`, `pnpm check`, `pnpm lint` green on one tree.
- Grep the runtime graph: `grep -n "node:" src/lib/catalog/index.ts` -> 0; `grep -n "buildBundle" src/lib/catalog/index.ts` -> only inside a comment or none.
- `git status --porcelain` lists only the three files above.

## Mutation paths covered
- Loaded map empty (all reads -> not-found), one bundle, two bundles (word found in the earlier one, sentence in the later one), repeated `lesson` (one `bundle` call), unknown id, wrong sha, wrong lesson id, non-concatenating `seg`, tap on a multi-char token, tap between tokens (only boundaries exist), tap past the end.
- `word`/`char`/`lookup` do not mutate the map; only `lesson` does.

## Rollback
Delete `src/lib/catalog/`; nothing else imports it until S2.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
```ts
import type { Bundle } from '../content/import/bundle';
export type CatalogSource = {
  current(): Promise<string>;
  bundle(sha: string, lessonId: string): Promise<Bundle>;
};
export class CatalogError extends Error {
  constructor(readonly code: CatalogErrorCode, readonly id: string) {
    super(`${code}: ${id}`);
  }
}
export function createCatalog(source: CatalogSource): Catalog {
  const loaded = new Map<string, Bundle>();
  return {
    async lesson(id: string) {
      const sha = await source.current();
      const bundle = await source.bundle(sha, id);
      if (bundle.sha !== sha || bundle.lesson.id !== id) throw new CatalogError('malformed', id);
      loaded.set(id, bundle);
      return toLessonContent(bundle);
    },
    async word(id: string) {
      for (const b of loaded.values()) {
        const w = b.words.find((x) => x.id === id);
        if (w) return { ...w, contentSha: b.sha };
      }
      throw new CatalogError('not-found', id);
    }
    // char and lookup follow the same shape
  };
}
```
A fixture that contradicts the SPEC (a count that does not add up) is reported to the Captain, not edited to pass.
