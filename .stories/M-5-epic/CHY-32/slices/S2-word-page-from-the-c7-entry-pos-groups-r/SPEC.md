# CHY-32 S2 — spec
ACs: AC5, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

AC5 (verbatim): *Given a word has a C7 entry with senses grouped by part of speech, When I open its
Word Page, Then I see the meanings grouped by POS, each with an example, And with 3 rare senses I
see "Xem thêm 3 nghĩa ít gặp", which reads "Thu gọn" once opened.*
AC6 (verbatim): *Given an example comes from Tatoeba, Then it carries the label "Tatoeba" linking to
`https://tatoeba.org/vi/sentences/show/<id>`, And an AI-written example is covered by "Ví dụ:
Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt".*

## Behaviour
- [AC5] `/word/<id>?lesson=<lessonId>` loads lesson `<lessonId>` through the app `catalog`, then reads
  word `<id>`; the page renders with no lesson opened earlier in the session (Q1 = A).
- [AC5] `/word/<id>` with no `lesson`, or a `lesson` the Source reports `not-found`/`malformed`, still
  renders when a lesson holding the word was loaded this session; otherwise it shows
  "Không tìm thấy từ này." and no senses (Q1 fallback).
- [AC5] The header shows the word's hanzi, pinyin and Hán Việt. The top of the page keeps one slot
  above the senses for CHY-39.S1's Báo lỗi button; this slice renders no button there.
- [AC5] Senses render in groups, one per distinct `pos`, in the order each `pos` first appears in
  `senses`; each group heading is the Vietnamese POS label (13 labels, e.g. `adj` → "Tính từ",
  `adv` → "Phó từ", `phrase` → "Cụm từ"). `好` (real content) → 5 groups: Tính từ, Phó từ, Bổ ngữ,
  Thán từ, Cụm từ.
- [AC5] Each shown sense shows its `vi` and its example sentence (hanzi, pinyin, vi) resolved from
  the lesson bundle's `sentences` by `sense.example`.
- [AC5] A sense with no `pos` is hidden when the word has ≥1 sense with a `pos` (Q2 = A): `你` shows 1
  sense under "Đại từ", not 2. A word whose senses all lack `pos` shows them in one group labelled
  by `word.pos[0]`; such a sense with no `example` takes `word.examples[0]`: `你好` → "Cụm từ ·
  xin chào · 你们好！".
- [AC5] Senses with `rare: true` are hidden on first render. With N ≥ 1 rare senses a button reads
  "Xem thêm N nghĩa ít gặp"; tapping it shows the rare senses in their groups and the button reads
  "Thu gọn"; tapping again hides them. N = 0 → no button. A group whose only senses are rare is
  hidden until opened.
- [AC6] An example whose sentence has `source: tatoeba:<id>` carries a link labelled "Tatoeba" to
  `https://tatoeba.org/vi/sentences/show/<id>`, opening in a new tab (`rel="noopener"`).
- [AC6] When ≥1 example currently shown has `source: ai` (rare senses count once opened), one line under the senses reads
  "Ví dụ: Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt". A word with only Tatoeba or
  unsourced examples shows no such line. An example with no `source` shows no label.

## Not this slice
- Word card picture, strokes, audio, Từng chữ/Cấu tạo (AC2 → S1); links into this page from the word
  card (S1) and X1 (CHY-38) — they append `?lesson=`.
- Example audio play button → parked (`PARKED.md`; reads `sentence.audio` once CHY-33.S1 lands).
- Báo lỗi button → CHY-39.S1. Offline "cần mạng" state → CHY-25.S3 (an `offline` CatalogError
  propagates to the route error page).

## Seam
`src/routes/(app)/word/[id]/`: `+page.ts` load → pure view builder `word-view.ts` → `WordEntry.svelte`.

## Test contract
- [AC5] unit `word-view.test.ts`: `好`-shaped word (11 senses, 1 untagged, 1 rare, 5 POS) → 5 groups
  in order adj, adv, comp, interj, phrase; untagged sense absent; rare count 1.
- [AC5] unit: `你`-shaped word → 1 group "pron" with 1 sense; `你好`-shaped word → 1 group "phrase",
  sense "xin chào", example `s-h1-01-14`.
- [AC5] unit (catalog fixture): `loadWord(catalog, '你好', 'h1-01')` on a fresh catalog → view with
  hanzi `你好`; `loadWord(catalog, '你好', null)` fresh → not-found; `'h9-99'` → not-found;
  `null` after `catalog.lesson('h1-01')` → view; `'h9-99'` after `catalog.lesson('h1-01')` → view.
- [AC5] jsdom `WordEntry.svelte.test.ts`: word with 3 rare senses → button "Xem thêm 3 nghĩa ít
  gặp", rare `vi` absent; click → 3 rare `vi` present, button "Thu gọn"; click → hidden again.
  0 rare → no button.
- [AC6] jsdom: example `tatoeba:785298` → `<a href="https://tatoeba.org/vi/sentences/show/785298">`
  text "Tatoeba"; word with 1 AI example → disclaimer text present once; word with only Tatoeba
  examples → disclaimer absent; only AI example on a rare sense → absent, then present after opening.
- [AC5] jsdom: a shown sense renders its example hanzi under its `vi`; `/word/A` → `/word/B` resets the toggle (`{#key}`).

## Open assumptions
- None. Q1/Q2 answered by Loc 2026-11-16 (`DISCUSSION.md` Resolved).
