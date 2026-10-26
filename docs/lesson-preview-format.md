# Prototype lesson format (first lesson of each HSK level)

`prototype/data/h<L>-01.js` exports one object, `export const LESSON = { … }`. It's the prototype stand-in for `content/lessons/hsk<L>/h<L>-01.yaml` (`docs/content-schema.md`). Rendered by `prototype/lesson.html?l=h<L>-01`. Check: `python3 scripts/check-lesson.py h<L>-01`.

```js
export const LESSON = {
  id: 'h2-01', level: 2, order: 1,
  title: 'Mấy giờ bạn dậy?', titleHanzi: '你几点起床', topic: 'Thói quen hằng ngày',
  goal: 'Hỏi và nói giờ giấc trong ngày',            // one line, Vietnamese, what the learner can do after
  cover: 'English scene prompt for the lesson cover', // cast + setting, see "Art"
  words: [
    { hz: '起床', py: 'qǐchuáng', hv: 'khởi sàng', vi: 'thức dậy', pos: 'động từ',
      chars: [['起', 'qǐ', 'khởi', 'dậy'], ['床', 'chuáng', 'sàng', 'giường']],   // multi-char word
      ex: 's03', art: 'English scene prompt for this word' },
    { hz: '点', py: 'diǎn', hv: 'điểm', vi: 'giờ (đồng hồ)', pos: 'lượng từ',
      parts: [['占', 'chiêm', 'phần đọc'], ['灬', 'hỏa', 'lửa']],                 // single char: components
      ex: 's01', art: '…' },
  ],
  sentences: {
    s01: { hz: '你几点起床？', py: 'nǐ jǐ diǎn qǐchuáng?', spoken: 'ní jǐ diǎn qǐchuáng?', vi: 'Bạn mấy giờ dậy?', speaker: 'redpanda' },
  },
  dialogue: [{ title: 'Buổi sáng', lines: ['s01', 's02'] }],   // 1–2 parts
  reading: { title: '…', lines: ['s10', 's11'] },             // HSK 3+ only (narrator, no speaker)
  grammar: [{ id: 'h2-g01', std: [44], title: 'Hỏi giờ: 几点', pattern: ['主语', '几点', '动词'],
    explain: '…', examples: ['s01', 's05'], wrong: ['你起床几点？', '你几点起床？'] }],
  writing: ['起', '床', '点'],
  gate: [
    { t: 'choice', title: 'Nghĩa của 起床?', kind: 'text', opts: ['thức dậy', 'đi ngủ', 'ăn sáng', 'đi học'], ans: 'thức dậy' },
    { t: 'choice', title: 'Chọn từ có nghĩa “giường”', kind: 'hz', opts: ['床', '点', '早', '晚'], ans: '床' },
    { t: 'listen', sid: 's01', title: 'Bạn nghe thấy câu nào?', opts: ['Bạn mấy giờ dậy?', '…', '…'], ans: 'Bạn mấy giờ dậy?' },
    { t: 'order', title: 'Xếp câu: “Bạn mấy giờ dậy?”', tiles: ['起床', '你', '几点'], ans: '你几点起床' },
  ],
};
```

## Rules (the checker enforces the starred ones)

| # | Rule |
|---|---|
| ★1 | Every `words[].hz` exists in `prototype/data/dict.json` (rows `[hz, py, key, hv, short, level, senses, others]`), `py` matches that row (or one of its `others` readings), `hv` matches the Hán Việt of that reading. |
| ★2 | At least 70% of the words are exactly level L; none above L. Count: HSK2 10–12, HSK3 12–14, HSK4 14–16, HSK5 15–18. |
| ★3 | Every hanzi in every sentence belongs to a dict word of level ≤ L, or is listed in that sentence's `unknown: ['字']` (max 1 per sentence, explained in `vi`). |
| ★4 | Every lesson word appears in at least one dialogue/reading sentence and in at least one gate question. |
| ★5 | Pinyin uses tone marks, never digits. Tone sandhi goes in `spoken`: 3-3 → 2-3, 不 before tone 4 → bú, 一 by the next tone. Same convention as `data/h1-01.js`. |
| ★6 | Dialogue speakers are only `redpanda` (Gấu Đỏ) and `takin` (Linh Ngưu), alternating line by line. Reading lines have no speaker. |
| ★7 | 1–3 grammar points, each with ≥ 2 example sentence ids; `writing` 3–5 chars, all from lesson words; gate ≥ 8 questions with all of `t: choice | listen | order`; every `order.ans` = `tiles` joined in the right order, every `ans` is in `opts`. |
| ★8 | Grammar comes from the official syllabus: `std` lists the GF 0025-2021 Appendix A item numbers (`data/sources/hsk30-grammar.csv`, column `No`); `std: []` only for a vocabulary pattern with no item. No item above level L; at least one point at exactly level L (lower-level points are review). Pick the grammar from the syllabus first, then write the story around it. |
| 8b | Size grows by level: HSK2 dialogue 8–10 lines; HSK3 dialogue 10–12 + reading 5–6 sentences; HSK4 dialogue 10–12 + reading 7–9; HSK5 dialogue 10–14 + reading 9–12 sentences, natural written register, can include one 成语 if it is an HSK5 word. |
| 9 | Vietnamese is natural, friendly, short. Grammar `explain` teaches the textbook way (no comparisons to Vietnamese sounds); Hán Việt is a memory aid, not a translation. |
| 10 | Stories match the cast roles: panda shy/teary, red panda kind teacher, fawn wild/excited, takin smug. Only red panda and takin speak lines. |

## Art prompts (`cover`, `words[].art`)

English, one sentence, cast by role, characters named "the panda", "the red panda", "the fawn", "the takin". Say "Only the X and the Y." when fewer than four appear. Concrete action that shows the word's meaning. No text, letters or numbers in the scene (a clock face with hands is fine, no digits). Characters never stand on tables.
