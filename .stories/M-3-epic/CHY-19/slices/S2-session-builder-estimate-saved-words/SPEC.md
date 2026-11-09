# CHY-19 S2 — spec
ACs: AC4, AC5, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 7e52b9f; builds on S1)

## Behaviour
- [AC4] `apply` also takes `WordSaved = { kind: 'saved'; word: string; at: string }` (`at` = when it was saved; the Ledger orders it with Attempts, WAVE-PLAN C-M3-2). A WordSaved for a word not in the Lexicon adds `{ saved: true, cards: {} }` at the end of `state.lexicon`; for a word already there it changes nothing. It emits no event. Every Lexicon entry carries `saved` (`false` for words added by a card Attempt).
- [AC4] A card Attempt with `skill: 'nghe'` on a word with `saved: true` emits no event and adds no card. Thẻ từ and viết chữ Attempts on a saved word schedule as in S1.
- [AC5] `session(state, { now, tz, only? })` returns `{ word, skill }[]`. Lanes run in the order `the`, `nghe`, `viet`, filtered by `only` (default all three). A lane holds the cards of that skill whose `due` falls on or before `now`'s calendar date in `tz`, sorted by `due`, ties in Lexicon order. The `the` lane then adds every `saved` word without a `the` card, in Lexicon order. Words without a card for a skill are not in that lane.
- [AC5] Interleave: repeat rounds over the lanes in order; in each non-empty lane take its first card whose word differs from the last card taken, else its first card; stop when all lanes are empty. While two or more lanes have cards left, no two neighbours share a skill.
- [AC5] `minutes(cards)` = `max(1, round(Σ seconds / 60))`, with 10 s per `the`, 15 s per `nghe`, 35 s per `viet` card.
- [AC6] `only: ['viet']` returns the `viet` lane alone, in its order.
- [CHORE] `index.ts` exports `session`, `minutes`, `WordSaved`, `SessionCard`. docs/architecture.md:30 Study row lists `session`, `minutes` and the `Attempt | WordSaved` input, and its test sentence reads "Tested only through its exports (`apply`, `rollover`, `session`, `minutes`) with Attempt and WordSaved sequences."

## Fixture additions (src/lib/study/fixtures/bai1.ts)
To S1's table, in time order: WordSaved 熊猫 at T − 3 d; a right `the` Attempt for 熊猫 at T − 2 d (with the others at T − 2 d); WordSaved 奶茶 at T − 1 d. Lexicon order becomes 你 好 您 对不起 谢谢 再见 没关系 熊猫 你们 不客气 你好 奶茶 (10 Bài 1 words + 2 saved). 熊猫 `the` is due 2026-11-11T20:39:55.164Z (learning, 3 days); 奶茶 has no card.

Session at T, `tz` = Asia/Ho_Chi_Minh, worked by hand from the rules above:
| lane | cards (in lane order) |
|---|---|
| the | 你, 好, 您, 对不起 (due 9 Nov), 奶茶 (new) |
| nghe | 谢谢, 再见, 没关系 (due 9 Nov) |
| viet | 你, 好 (due 8 Nov) |
Interleaved: 你·the, 谢谢·nghe, 你·viet, 好·the, 再见·nghe, 好·viet, 您·the, 没关系·nghe, 对不起·the, 奶茶·the. Seconds 5 × 10 + 3 × 15 + 2 × 35 = 165 → `minutes` = 3. Only `viet`: 你·viet, 好·viet, 70 s → 1.

## Not this slice
- AC1-AC3, AC7 (card scheduling, lint guard) → S1. The 20 new cards a day cap and placement (CHY-20). The "≈ N phút" string and the Luyện tập screens (CHY-41, CHY-42). Where saves are stored (WAVE-PLAN Q6, CHY-24).

## Seam
`src/lib/study/session.ts` (`session`, `minutes`) and the WordSaved branch of `src/lib/study/apply.ts`.

## Test contract
- [AC4] `session.test.ts` "a saved word has no listening card": fixture; `session(s, { now: T, tz, only: ['nghe'] })` has no 奶茶; `only: ['the']` has 奶茶 as its last card.
- [AC4] Same test: `apply` a wrong `奶茶 · nghe` Attempt at T → `events` = []; `state.lexicon['奶茶'].cards.nghe` is undefined; the nghe session is unchanged. Negative control: `你好 · nghe` (taught) at T emits one CardScheduled. Thẻ từ stays open: a wrong `奶茶 · the` Attempt at T → one CardScheduled `奶茶 · the`, due 2026-11-09T02:01:00.000Z.
- [AC4] A second WordSaved 奶茶 → State deep-equal, `events` = [].
- [AC5] "today's session interleaves skills": fixture; `session(s, { now: T, tz })` equals the interleaved list above (10 cards: 5 the, 3 nghe, 2 viet); for every i, if the cards at index ≥ i + 1 span ≥ 2 skills, then `skill[i] ≠ skill[i+1]` (only the pair 8-9, 对不起·the then 奶茶·the, shares a skill, and index 9 alone is left); `word[i] ≠ word[i+1]` for all i; `minutes(cards)` = 3, and the seconds sum is 165.
- [AC5] Due cut: the same call at `now` = 2026-11-09T16:59:59Z (23:59:59 local) still has 10 cards; at 2026-11-11T17:00:00Z (12 Nov 00:00 local) the T − 2 d cards (你们, 谢谢, …) join.
- [AC6] "single-skill filter": `only: ['viet']` → `[{ word: '你', skill: 'viet' }, { word: '好', skill: 'viet' }]`, `minutes` = 1.
- [CHORE] `pnpm check`, `pnpm lint` (S1's import rule covers `session.test.ts`), `pnpm test`, `pnpm build` exit 0.

## Open assumptions
- None that change the work. WAVE-PLAN Q3 decides the `tz` value callers pass, not this API.
