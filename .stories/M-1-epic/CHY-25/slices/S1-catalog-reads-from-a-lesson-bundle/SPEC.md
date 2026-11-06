# CHY-25 S1 — spec
ACs: AC2, AC3, AC4, AC7  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (design; anchors on main 23f1db9, 2026-11-06)

## Behaviour
- [AC7] `src/lib/catalog/index.ts` exports `createCatalog(source: CatalogSource): Catalog` and `CatalogError`. `CatalogSource` is `{ current(): Promise<string>; bundle(sha: string, lessonId: string): Promise<Bundle> }`; the module owns no I/O and reads only through the injected source. `CatalogError` carries `code: 'not-found' | 'offline' | 'malformed'` and the `id` it names.
- [AC2] `lesson(id)` reads `source.current()` (the sha), then `source.bundle(sha, id)`, checks `bundle.sha === sha` and `bundle.lesson.id === id`, keeps that bundle in the catalog, and returns `LessonContent` = `{ contentSha, lesson, words, chars, sentences, grammar, questions, gateCoverage, thin }`. `words` follows `lesson.sections.words.ids` order (the bundle's own `words` array is content order); a Primer returns `words: []`. `contentSha` is the bundle's `sha`.
- [AC2] For the fixture h1-01, `lesson('h1-01')` gives title `Xin chào`, level 1, `contentSha` matching `/^[0-9a-f]{64}$/`, and 10 words in the order `你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见`.
- [AC2] `word(id)` returns `ImportedWord & { contentSha }` from a bundle the catalog has loaded. `word('你好')` gives pinyin `nǐ hǎo`, spoken `ní hǎo`, hanviet `nhĩ hảo`, `listedIn: ['h1-01']`, `taughtIn: 'h1-01'` and that bundle's sha. The word therefore names every lesson that teaches it (`derive/backlinks.ts:7-13`).
- [AC2] `char(hanzi)` returns `Char & { contentSha }`. `char('你')` carries `readings` (one reading is pinyin `nǐ`, hanviet `nhĩ`), `strokes`, `ids` and that bundle's sha.
- [AC2] An id that no loaded bundle holds throws `CatalogError` code `not-found` with `id` = the requested id (word and char included); the message contains the id. The catalog never scans or downloads the other bundles.
- [AC3] `lookup(sentenceId, tapIndex)` finds the sentence in a loaded bundle, maps `tapIndex` — a code-point index into `sentence.hanzi` — through `sentence.seg`, whose tokens are consecutive and include punctuation as their own token (`derive/seg.ts:25-37`), and returns the `thin` entry whose `hanzi` equals the token as `ThinEntry & { contentSha, sentenceId, index }`. `lookup('s-h1-01-01', 0)` and `lookup('s-h1-01-01', 1)` both give `你好` (pinyin `nǐ hǎo`, hanviet `nhĩ hảo`, meaning `xin chào`); `lookup('s-h1-01-01', 2)` (the `！` token) throws not-found.
- [AC3] A `tapIndex` past the end of `hanzi`, or a sentence id in no loaded bundle, throws `CatalogError` code `not-found` naming `<sentenceId>` or `<sentenceId>:<index>`.
- [AC4] `lesson('h9-99')` throws `CatalogError` code `not-found` with `id === 'h9-99'`; the message contains `h9-99`; no empty `LessonContent` is returned. A bundle whose `sha` differs from the sha the URL carried, or whose `lesson.id` differs from the requested id, throws code `malformed` with the requested id.
- [NFR] The bundle type is imported with `import type` only, so the client bundle never pulls `import/bundle.ts`'s Node-side `buildBundle` or `bundle-sink.ts`'s `node:fs`. No new dependency.

## Fixtures (described, not committed code)
- `src/lib/catalog/fixtures/source.ts` builds the source in memory: `importContent('src/lib/content/import/fixtures/ok', createMemorySink(), { refs: fixtureRefs })` (the pattern at `src/lib/content/import/bundle.test.ts:3-15`), then `buildBundle(sink.content, id)` for every lesson; `current()` returns `sink.content.sha`; `bundle(sha, id)` returns the map entry or throws not-found. No vault, no network, no temp files.
- The fixture h1-01 is a copy of Bài 1 with 10 words and Primer h0-00; the literals above are read from it. A content edit that changes them is a test change, not a code change.
- The file sits under `src/lib/catalog/fixtures/`, which `vite.config.ts:45` excludes from coverage; only tests import it.

## Negative controls
- `lesson('h9-99')` -> `not-found`, not an empty lesson.
- A source returning `{ ...bundle, sha: 'f'.repeat(64) }` under the requested sha -> `malformed`.
- A source returning a bundle whose `lesson.id` is `h1-02` when h1-01 was asked -> `malformed`.
- `lookup('s-h1-01-01', 2)` (punctuation) -> `not-found` naming `s-h1-01-01`; `lookup('s-h1-01-01', 20)` -> `not-found` naming `s-h1-01-01:20`.
- `lookup('s-h9-99-01', 0)` (no bundle loaded) -> `not-found` naming `s-h9-99-01`.
- `word('不存在')`, `char('𠀀')` -> `not-found`.
- AC7: the test injects a `fetch` that throws; a counter asserts 0 calls across all read calls.

## Not this slice
- The HTTP source, `vercel.json`, the lesson route (S2); the offline SW path, `cần mạng`, and the browser check (S3).
- `entry(hanzi)`, the 122k Dictionary, the Word Page body (CHY-32), rendering any other section (CHY-31..35).

## Seam
`src/lib/catalog/index.ts` (types, `createCatalog`, `CatalogError`) and `src/lib/catalog/fixtures/source.ts` (test-only source). No route, SW, schema or content edit.

## Test contract
- vitest `src/lib/catalog/catalog.test.ts`: the read calls and the error cases above, over `fixtureSource()`.
- Test first: the not-found case fails while `lesson` returns an empty object; AC7's fetch spy reports 0 calls.
- Verify: `pnpm test -- src/lib/catalog` green, `pnpm check` green, `pnpm lint` green (prettier ignores `.stories/` and `*.md`).

## Open assumptions
- [AC2] `word('你好').listedIn` is `['h1-01']` in the fixture: the same word is not also listed by another fixture lesson. If a later fixture lesson lists it, the assertion becomes `toContain('h1-01')`; nothing in the design depends on the exact list.
- [AC4] The fixture source raises not-found itself; the 404 case of the HTTP source is S2's test.
- [AC3] `seg` tokens always concatenate to `hanzi` (CHY-8 S4 DISCUSSED, 85%); if a bundle ever ships a `seg` that does not, the lookup throws `malformed` instead of guessing an index.
