# CHY-25 S1 — spec
ACs: AC2, AC3, AC4, AC7  ·  Repo: stonghuuloc/chaiyo  ·  rev 2 (design; anchors re-verified on main d090b0a0, 2026-11-13)

## Behaviour
- [AC7] `src/lib/catalog/index.ts` owns no I/O and reads only through the injected `CatalogSource`. Its public surface is exactly the block in `## Seam`.
- [AC2] `LessonContent.lesson` is typed `Lesson | Primer` (a Primer has `kind`, `schemas.ts:272`), not `Bundle['lesson']`: that `Omit` over the union (`import/bundle.ts:8`, `import/sink.ts:14`) keeps only shared keys and drops `goal`/`topic`/`kind`. The runtime object is the full lesson minus `gateCoverage`/`thin` (`import/bundle.ts:21`), so one cast in `toLessonContent` is sound.
- [AC2] `lesson(id)` reads `source.current()` (the sha), then `source.bundle(sha, id)`, checks `bundle.sha === sha` and `bundle.lesson.id === id`, keeps that bundle in the catalog, and returns `LessonContent` = `{ contentSha, lesson, words, chars, sentences, grammar, questions, gateCoverage, thin }`. `words` follows `lesson.sections.words.ids` order (the bundle's own `words` array is content order); a Primer returns `words: []`. `contentSha` is the bundle's `sha`.
- [AC2] For the fixture h1-01, `lesson('h1-01')` gives title `Xin chào`, level 1, `contentSha` matching `/^[0-9a-f]{64}$/` (fixture sha `187fb644…` at d090b0a0), and 10 words in the order `你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见`.
- [AC2] `word(id)` returns `CatalogWord` from a bundle the catalog has loaded. `word('你好')` gives pinyin `nǐ hǎo`, spoken `ní hǎo`, hanviet `nhĩ hảo`, `listedIn: ['h1-01']`, `taughtIn: 'h1-01'` and that bundle's sha. The word therefore names every lesson that teaches it (`derive/backlinks.ts:7-13`).
- [AC2] `char(hanzi)` returns `CatalogChar`. `char('你')` carries `readings` (one reading is pinyin `nǐ`, hanviet `nhĩ`), `strokes`, `ids` and that bundle's sha.
- [AC2] An id that no loaded bundle holds throws `CatalogError` code `not-found` with `id` = the requested id (word and char included); the message contains the id. The catalog never scans or downloads the other bundles.
- [AC3] `lookup(sentenceId, tapIndex)` finds the sentence in a loaded bundle, maps `tapIndex` — a code-point index into `sentence.hanzi` — through `sentence.seg`, whose tokens are consecutive and include punctuation as their own token (`derive/seg.ts:25-37`), and returns the `thin` entry whose `hanzi` equals the token as `LookupHit`, where `start` is the code-point index in `hanzi` where the token begins (`lookup('s-h1-01-01', 1).start === 0`). A token with no `thin` entry falls back to the `thin` entry of the single char under the tap (`derive/thin.ts:52` adds every char of a token), and then `start` = the tapped char's index, so `start` always marks where the returned `hanzi` begins; no entry for either -> not-found. `lookup('s-h1-01-01', 0)` and `lookup('s-h1-01-01', 1)` both give `你好` (pinyin `nǐ hǎo`, hanviet `nhĩ hảo`, meaning `xin chào`); `lookup('s-h1-01-01', 2)` (the `！` token) throws not-found.
- [AC3] A sentence id in no loaded bundle throws `not-found` with `id` = `<sentenceId>`. A tap past the end of `hanzi`, or on a token with no `thin` entry (punctuation), throws `not-found` with `id` = `<sentenceId>:<tapIndex>`.
- [AC4] `lesson('h9-99')` throws `CatalogError` code `not-found` with `id === 'h9-99'`; the message contains `h9-99`; no empty `LessonContent` is returned. A bundle whose `sha` differs from the sha the URL carried, or whose `lesson.id` differs from the requested id, throws code `malformed` with the requested id.
- [NFR] `index.ts` imports content types with `import type` from `../content/import/bundle` and `../content/import/sink`, never the barrel `import/index.ts:1-5`, whose `bundle-sink` re-export pulls `node:fs`. No new dependency.

## Fixtures (described, not committed code)
- `src/lib/catalog/fixtures/source.ts` builds the source in memory: `importContent('src/lib/content/import/fixtures/ok', createMemorySink(), { refs: fixtureRefs })` (the pattern at `src/lib/content/import/bundle.test.ts:3-15`), then `buildBundle(sink.content, id)` for every lesson; `current()` returns `sink.content.sha`; `bundle(sha, id)` returns the map entry or throws not-found. No vault, no network, no temp files.
- The fixture h1-01 is a copy of Bài 1 with 10 words and Primer h0-00; the literals above are read from it. A content edit that changes them is a test change, not a code change.
- The file sits under `src/lib/catalog/fixtures/`, which `vite.config.ts:45` excludes from coverage; only tests import it.

## Negative controls
- `lesson('h9-99')` -> `not-found`, not an empty lesson.
- A source returning `{ ...bundle, sha: 'f'.repeat(64) }` under the requested sha -> `malformed`.
- A source returning a bundle whose `lesson.id` is `h1-02` when h1-01 was asked -> `malformed`.
- `lookup('s-h1-01-01', 2)` (punctuation) -> `not-found` naming `s-h1-01-01:2`; `lookup('s-h1-01-01', 20)` -> `not-found` naming `s-h1-01-01:20`.
- `lookup('s-h9-99-01', 0)` (no bundle loaded) -> `not-found` naming `s-h9-99-01`.
- `word('不存在')`, `char('𠀀')` -> `not-found`.
- AC7: `vi.stubGlobal('fetch', spy)` with a throwing spy; it asserts 0 calls across all read calls. This proves absence, so it cannot fail before the change; it guards against a later regression.

## Not this slice
- The HTTP source, `vercel.json`, the lesson route (S2); the offline SW path, `cần mạng`, and the browser check (S3).
- `entry(hanzi)`, the 122k Dictionary, the Word Page body (CHY-32), rendering any other section (CHY-31..35).

## Seam
[AC2][AC3][AC4][AC7] Exact exports of `src/lib/catalog/index.ts`; wave-2/3 slices build against this block. Types come from `src/lib/content/import/bundle.ts:6-16`, `import/sink.ts:19,21`, `schemas.ts:265-272`, `derive/dictionary.ts:4`, all `import type`.
```ts
export type CatalogSource = { current(): Promise<string>; bundle(sha: string, lessonId: string): Promise<Bundle> };
export type CatalogErrorCode = 'not-found' | 'offline' | 'malformed';
export class CatalogError extends Error { constructor(code: CatalogErrorCode, id: string); readonly code: CatalogErrorCode; readonly id: string }
export type LessonContent = {
  contentSha: string; lesson: Lesson | Primer; words: ImportedWord[]; chars: Char[];
  sentences: ImportedSentence[]; grammar: GrammarPoint[]; questions: Question[];
  gateCoverage: Record<string, string[]>; thin: ThinEntry[];
};
export type CatalogWord = ImportedWord & { contentSha?: string };
export type CatalogChar = Char & { contentSha?: string };
export type LookupHit = ThinEntry & { contentSha?: string; sentenceId: string; start: number };
export type Catalog = {
  lesson(id: string): Promise<LessonContent>;
  word(id: string): Promise<CatalogWord>;
  char(hanzi: string): Promise<CatalogChar>;
  lookup(sentenceId: string, tapIndex: number): Promise<LookupHit>;
};
export function createCatalog(source: CatalogSource): Catalog;
```
- [LOCK] `contentSha?` is optional on `CatalogWord`/`CatalogChar`/`LookupHit` (CHY-7, `STORY.md` → Locked); every S1 result comes from a bundle, so S1 always sets it. `LessonContent.contentSha` is required: a lesson only ever comes from a bundle.
- [LOCK] No `entry(hanzi)` and no free-text `lookup(text, i)`: the ticket names `lookup(sentenceId, tapIndex)` and `STORY.md` parks the Dictionary. The epic report's `entry / lookup(text, i)` maps to `word`/`char`/`lookup(sentenceId, tapIndex)` (DISCUSSION D3).
- [AC7] `src/lib/catalog/fixtures/source.ts` exports `fixtureSource(): Promise<CatalogSource>` (test-only). No route, SW, schema or content edit.

## Test contract
- vitest `src/lib/catalog/catalog.test.ts`: the read calls and the error cases above, over `fixtureSource()`.
- Test first: the not-found case fails while `lesson` returns an empty object; AC7's fetch spy reports 0 calls.
- Verify: `pnpm test -- src/lib/catalog` green, `pnpm check` green, `pnpm lint` green (prettier ignores `.stories/` and `*.md`).

## Open assumptions
- [AC2] `word('你好').listedIn` is `['h1-01']` in the fixture: the same word is not also listed by another fixture lesson. If a later fixture lesson lists it, the assertion becomes `toContain('h1-01')`; nothing in the design depends on the exact list.
- [AC4] The fixture source raises not-found itself; the 404 case of the HTTP source is S2's test.
- [AC3] `seg` tokens always concatenate to `hanzi` (CHY-8 S4 DISCUSSED, 85%); if a bundle ever ships a `seg` that does not, the lookup throws `malformed` instead of guessing an index.
