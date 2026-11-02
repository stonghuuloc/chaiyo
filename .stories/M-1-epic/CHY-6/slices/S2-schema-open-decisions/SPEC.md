# CHY-6 S2 — spec
ACs: AC2, AC3  ·  Repo: chaiyo (`docs/content-schema.md` only)  ·  rev 1

## Behaviour
- [AC2] `content-schema.md` "Open decisions" item 1 (`:349`) is marked decided (`~~…~~ **Decided 2026-11-02:**`, same shape as item 2) with the answer: a single char that also appears inside a compound is listed in `sections.words` **next to** the compound (你 and 你好), but only when the lesson teaches that char on its own. (DISCUSSION Q1 = A, Q4 = B)
- [AC2] "Teaches on its own" is defined in checkable terms: the char is a whole token of the `pattern` of one of the lesson's `sections.grammar.ids` (tokens split on whitespace, `/`, `+`, brackets and full-width punctuation), or the char is named in `tests.words` of a section question of the lesson (`grammar.drills`, `dialogue.questions`, `listenSpeak.items`). The gate pool does not count: lint 8 already requires every lesson word to be tested there, so counting it would let every char pass. (Q4; advisor R1)
- [AC2] Decision 1 names the Bài 1 outcome with its numbers: 2 single chars sit inside a listed compound (你 in 你好 and 你们, 好 in 你好); both qualify (你: token of h1-g01 `pattern` "你 / 您 / 你们 + 好"; 好: same pattern, and `q-h1-01-l01` `tests.words: [好]`); so Bài 1 keeps 10 ids. 您 is single but sits in no listed compound, so the rule does not apply to it.
- [AC2] Linter table row 8 "References" (`:344`) gains one "Fails when" clause: a word whose `hanzi` is one char and sits inside another word's `hanzi` in the same `sections.words` and is neither a `pattern` token of a lesson grammar point nor in the `tests.words` of a drill, dialogue or listenSpeak question. (Q4: "must be lint-checkable")
- [AC2] The Bài 1 example (`:184`) stays `[你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]` = 10 ids; it is already consistent with the decision. `content/lessons/hsk1/h1-01.yaml` does not change.
- [AC3] Decision 2 (`:350`) keeps its decided text and `h<L>-gNN` ids, and its lint sentence reads: no `std` item above the lesson level; **when `std` is non-empty**, at least one item at exactly the lesson level; `std: []` (vocabulary pattern) is exempt. (Q2 = A)
- [AC3] The `GrammarPoint.std` comment at `:102` ("`[] = vocabulary pattern, no item`") is unchanged. (Q2)
- [AC3] `GrammarPoint.pitfalls` at `:107` reads `pitfalls?: { wrong: string; right: string; why?: string }[];` (Q3 = A). With this, `h1-g01.yaml` (`std: []`, one pitfall with no `why`) matches the type and the decision; `content/grammar/*.yaml` does not change.
- [LOCK] Grammar point ids stay our own `h<L>-gNN`; each point carries `std` GF 0025-2021 item numbers (2026-10-26). Not reopened.

## Not this slice
- AC1, AC4 (ADR 0002, architecture.md pointer) → S1, done.
- Open decisions 3 (Cast voice) and 4 (MockSection) → out of scope per `STORY.md`.
- Linter code, Zod schemas, importer (CHY-7+). This slice writes the rule; it does not build the check.
- `docs/diagrams/content-classes.html` shows no `pitfalls` or `why` field (only `std?` at `:98`), so it does not change. Its `std?` vs the type's `std: number[]` → parked.
- `h3-g01.yaml` `std: [130]` is a level-2 item on a level-3 point, so it fails the decision-2 lint once that lint is built → parked (no AC names h3-g01).
- `h5-01.yaml` lists 17 words, above the 8–15 bound of lint 8 → parked.

## Seam
`docs/content-schema.md`: 3 line edits (`:107`, `:344`, `:350`) and 1 rewritten line (`:349`). No other file.

## Test contract
- [AC2] `grep -n "^1\. ~~" docs/content-schema.md` → 1 hit containing `Decided 2026-11-02`, `你好`, `pattern` and `tests.words`.
- [AC2] `grep -n "^| 8 |" docs/content-schema.md` → 1 row that contains `one char` and `tests.words`.
- [AC2] Walk Bài 1 through the new lint 8 clause by hand, twice: the doc example (`content-schema.md:184`, `:211`) and the file on disk (`content/lessons/hsk1/h1-01.yaml:36`, which has 0 questions: `drills: []`, `pool: []`), both against `content/grammar/h1-g01.yaml:6`. Each walk: 2 chars checked, 2 pass, 0 fail. Record both walks in SUMMARY.md.
- [AC2] `git diff --quiet -- content/` exits 0; `grep -c "ids: \[你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见\]" docs/content-schema.md` → 1.
- [AC3] `grep -n "why?: string" docs/content-schema.md` → 1 hit (`:107`); `grep -c "why: string" docs/content-schema.md` → 0.
- [AC3] `grep -n "^2\. ~~" docs/content-schema.md` → 1 hit containing `non-empty` and `exempt`; `git diff -U0 docs/content-schema.md` shows no hunk at `:102`.
- [CHORE] `pnpm lint` exits 0 (raw, not under rtk). `docs/` is prettierignored, so this only proves nothing else broke.

## Open assumptions
- [AC2] A pattern match is a whole token (split on whitespace, `/`, `+`, brackets and full-width punctuation), not a substring. A substring match also passes Bài 1, so the pick changes 0 ids today; it only makes the future check stricter.
- [AC2] On disk, `h1-01.yaml` has no questions yet, so 你 and 好 pass through the `pattern` branch alone; the `tests.words` branch is exercised only by the doc example (listenSpeak `q-h1-01-l01`). Either branch alone keeps 10 ids.
- [AC2] The rule binds only words whose `hanzi` is one char and sits inside another word's `hanzi` in the same lesson's `sections.words`. Checked across all 5 lessons on disk: only Bài 1 has such chars (2), so no other lesson is affected.
