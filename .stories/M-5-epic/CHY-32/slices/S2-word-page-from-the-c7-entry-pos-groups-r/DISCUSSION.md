# CHY-32 S2 — discussion
ACs: AC5, AC6

## Current behaviour (verified, with anchors, on CHY-40-S1 tip a65f4297)
- [AC5] `/word/[id]` is a placeholder: `src/routes/(app)/word/[id]/+page.svelte:1-5` renders only `m.screen_word()`; `+page.ts:3` returns the `pushed` shell.
- [AC5] `catalog.word(id)` searches only bundles already loaded this session and throws `CatalogError('not-found', id)` otherwise (`src/lib/catalog/index.ts:96-99`). Nothing on disk constructs a Catalog yet; CHY-25.S2 Task 2 adds `export const catalog = createCatalog(httpSource())` (CHY-25 S2 `PLAN.md:59-61`) and the lesson load in `lesson/[id]/+layout.ts` (SHARED.md, Loc 2026-11-16).
- [AC5] Word id = hanzi (`content/lessons/hsk1/h1-01.yaml:967` `ids: [ 你, 好, … ]`). A bundle's `manifest.json` lists lessons only (`src/lib/content/import/bundle-sink.ts:36-41`); no word→lesson index ships to the client.
- [AC5] Senses carry optional `pos`, `rare: true`, `example` (`src/lib/content/schemas.ts:50-60`). A bundle ships every sense example of its taught words (`import/assemble.ts:33-42`, `import/bundle.ts:41-48`); sentences reach a screen only through `catalog.lesson(id).sentences` (`catalog/index.ts:22-32`).
- [AC5] HSK1 taught words (51, lessons/hsk1): 11 have senses in ≥2 POS; 4 have a rare sense; none has 3 (`好` has 1). The rare count is data-driven.
- [AC6] `Sentence.source` = `'ai' | 'tatoeba:<digits>'`, optional (`schemas.ts:88`). Over the 51 words' sense examples: 66 Tatoeba, 32 AI. Lesson-own sentences (`s-h1-01-14`) have no source.
- [AC5] POS labels: the prototype uses Danh từ, Động từ, Tính từ, Phó từ, Giới từ, Lượng từ, Trợ từ, Thán từ, Bổ ngữ (`prototype/data/entries.json`); the other 4 schema POS (`pron`, `num`, `conj`, `phrase`) take Đại từ, Số từ, Liên từ, Cụm từ.
- [AC5] Component tests exist: `svelte/server` render (`src/routes/(app)/pinyin/PinyinChart.test.ts:1-10`) and jsdom `*.svelte.test.ts` mount (`src/lib/components/HanziStrokes.svelte.test.ts:1`, project `client` in `vite.config.ts:60-68`).
- [AC5] Import fixture words (`src/lib/content/import/fixtures/ok/words/*.yaml`) have one pos-less sense each, no rare, no source → tests build their own word/sentence objects; the shared fixture is not edited (7 test files read it).

## Answered here (no human needed)
- [AC5] Q: group order? A: first-appearance order of `pos` in `senses` — the C7 file order (`好`: adj, adv, comp, interj, phrase).
- [AC5] Q: what does "3" in "Xem thêm 3 nghĩa ít gặp" count? A: senses with `rare: true` on the word; the button is absent at 0. "Thu gọn" re-hides them.
- [AC6] Q: where does the disclaimer show? A: once, under the senses, when ≥1 example on the word has `source: ai`. Tatoeba label = link `https://tatoeba.org/vi/sentences/show/<id>`, `target="_blank" rel="noopener"` (prototype `w1-word.html` `src()`).
- [AC5] Q: report button? A: none — CHY-39.S1 adds Báo lỗi to this page after us (SHARED.md, Loc 2026-11-16); we leave a stable header slot.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC5] | cold open of `/word/<id>` | A — `/word/<id>?lesson=<lessonId>` loads that lesson first; missing/bad `lesson` → not-found state | Loc, 2026-11-16 |
| 1 | Q2 [AC5] | sense with no `pos` | A — hidden when the word has a tagged sense; a word with only untagged senses shows them under `word.pos[0]` with `word.examples[0]` | Loc, 2026-11-16 |

## Open — needs an answer before spec
None. Q1 and Q2 answered (see above); full Q-blocks were sent to Loc via the coordinator, msg_3849e07abf9e.

## Parked
- Example audio play button: Loc 2026-11-16 says Word Page examples read `sentence.audio` (CHY-33.S1 adds it to the bundle). No clause of AC5/AC6 names audio (W1 `docs/screens.md:145` does) → parked, wire after CHY-33.S1 lands.

## Files outside the lane
- `messages/vi.json` — new keys (POS labels, rare toggle, Tatoeba, disclaimer, not-found) placed next to `screen_word` (`messages/vi.json:13`), not at the end.

## Locked (do not re-open)
- M-5 Q1–Q8 option A (Loc 2026-11-13). CHY-39.S1 owns the Báo lỗi button on this page (Loc 2026-11-16).
- `catalog` passes Source errors through; HTTP Source throws `CatalogError` (Loc 2026-11-16).
