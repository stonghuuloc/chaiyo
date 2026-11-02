# CHY-6 S2 — plan
ACs: AC2, AC3  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: decided at execute (origin/CHY-6 was merged into `main` under different shas; planned off `main` @ ca1a241)

## Anchors (verified 2026-11-02 on `main` @ ca1a241)
- `docs/content-schema.md:102` — `std: number[];  // GF 0025-2021 Appendix A item numbers (data/sources/hsk30-grammar.csv); [] = vocabulary pattern, no item` (stays).
- `docs/content-schema.md:107` — `pitfalls?: { wrong: string; right: string; why: string }[];` (the only `why: string` in the file).
- `docs/content-schema.md:184` — Bài 1 example `ids: [你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]` (stays).
- `docs/content-schema.md:186` — `ids: [h1-g01]`; `:211` — `tests: { words: [好], tone: true }` on `q-h1-01-l01`.
- `docs/content-schema.md:344` — `| 8 | References | unknown word / sentence / grammar / Cast id; word count outside 8–15; gate pool < 2 × draw; a lesson word never tested in gate pool |`.
- `docs/content-schema.md:349` — `1. Do words listed in \`sections.words\` include single chars that also appear inside a compound (你 and 你好), or only the compound?`
- `docs/content-schema.md:350` — `2. ~~Grammar point ids~~ **Decided 2026-10-26:** … Lint: no item above the lesson level, at least one item at exactly that level.`
- `content/grammar/h1-g01.yaml:4` `std: []`; `:6` `pattern: 你 / 您 / 你们 + 好`; `:12-13` one pitfall `{ wrong: 好你, right: 你好 }`, no `why` (stays).
- `content/lessons/hsk1/h1-01.yaml:36` same 10 ids; `:38` `[ h1-g01 ]`; `:39` `drills: []`, `:46` `questions: []`, `:48` `items: []`, `:53` `pool: []` (stays).
- `docs/diagrams/content-classes.html:98` — GrammarPoint box shows `+ std?: GF0025-2021 ref`; no pitfalls/why line → not edited.
- `.prettierignore:14` `/docs/`, `:19` `*.md`; `package.json:13` `"lint": "prettier --check . && eslint ."`.
- No `rg` on this Mac: every check below uses `grep`.

## Task 1 [AC2] Mark open decision 1 decided
File: `docs/content-schema.md:349`
- Test first: `grep -n "^1\. ~~" docs/content-schema.md` → 0 hits today.
- Change: replace the line with the draft line 1 below (strikethrough heading + `**Decided 2026-11-02:**` + rule + Bài 1 numbers + "Lint 8 checks it").
- Verify: same grep → 1 hit; it contains `Decided 2026-11-02`, `你好`, `pattern`, `tests.words`.

## Task 2 [AC2] Add the lint 8 clause
File: `docs/content-schema.md:344`
- Test first: `grep -n "^| 8 |" docs/content-schema.md | grep -c "single-char"` → 0 today.
- Change: append the draft clause to the "Fails when" cell (row 8 stays one row, 3 cells). The `tests.words` branch counts only `grammar.drills`, `dialogue.questions` and `listenSpeak.items`, never `gate.pool` (row 8 already forces every word into the gate pool, so the gate would excuse every char).
- Verify: same pipeline → 1; `grep -c "^| [0-9] |" docs/content-schema.md` → 9 (no row added or lost).
- Walk (no code; record in SUMMARY.md):

| Source | Single chars inside a listed compound | Pattern token of h1-g01? | In `tests.words`? | Result |
|---|---|---|---|---|
| doc example `:184` | 你 (你好, 你们), 好 (你好) | 你 ✓, 好 ✓ | 好 ✓ (`:211`, listenSpeak) | 2 pass, 0 fail |
| `h1-01.yaml:36` | 你, 好 | 你 ✓, 好 ✓ | none (0 questions) | 2 pass, 0 fail |

## Task 3 [AC3] Exempt `std: []` in decision 2's lint
File: `docs/content-schema.md:350`
- Test first: `grep -n "^2\. ~~" docs/content-schema.md | grep -c "non-empty"` → 0 today.
- Change: replace only the "Lint: …" sentence with the draft line 2 below; the decided text before it stays byte-identical.
- Verify: same pipeline → 1, line also contains `exempt`; `git diff -U0 docs/content-schema.md` has no hunk at `:102`.

## Task 4 [AC3] Make `pitfalls[].why` optional
File: `docs/content-schema.md:107`
- Test first: `grep -c "why?: string" docs/content-schema.md` → 0 today.
- Change: `why: string` → `why?: string`; column alignment of the line unchanged otherwise.
- Verify: `grep -n "why?: string"` → 1 hit at `:107`; `grep -c "why: string"` → 0.

## Task 5 [CHORE] Gate + commit
- `git diff --stat` → exactly 1 file, `docs/content-schema.md`, 4 lines changed (4 +, 4 −); `git diff --quiet -- content/ docs/diagrams/` exits 0.
- `pnpm lint` raw (not under rtk) → exit 0.
- Run every SPEC Test contract line on the final tree; paste the results and the Task 2 walk into `SUMMARY.md`.
- Commit `docs(schema): decide single chars in compounds, exempt std [] and make pitfall why optional (CHY-6)` on the branch picked at execute.

## Mutation paths covered
- Docs only, no write path. The edit-vs-create risk here is a rewrite that drifts: Task 3 keeps decision 2's decided text and changes only its Lint sentence; Task 1 keeps item numbering 1–4 so references to "open decision 3/4" (`STORY.md`) still point at the same items.

## Draft lines (UNEXECUTED — adapt to what's on disk; numbers must match Anchors)
```markdown
| 8 | References | unknown word / sentence / grammar / Cast id; word count outside 8–15; gate pool < 2 × draw; a lesson word never tested in gate pool; a single-char word inside another word of the same `sections.words` that is neither a token of a lesson grammar point's `pattern` nor in the `tests.words` of a drill, dialogue or listenSpeak question (decision 1) |

1. ~~Single chars inside compounds~~ **Decided 2026-11-02:** a single char that also appears inside a compound is listed in `sections.words` next to the compound (你 and 你好) only when the lesson teaches it on its own: it is a whole token of one of the lesson's grammar `pattern`s (split on spaces, `/`, `+`), or a drill, dialogue or listenSpeak question names it in `tests.words` (the gate pool does not count). Bài 1: 你 and 好 sit inside 你好 / 你们 and are both tokens of h1-g01's `你 / 您 / 你们 + 好` (好 is also tested by listenSpeak `q-h1-01-l01`), so it keeps 10 ids. Lint 8 checks it.
2. ~~Grammar point ids~~ **Decided 2026-10-26:** ids stay our own `h<L>-gNN`; each point carries `std` = the GF 0025-2021 item numbers it teaches. Lint: no item above the lesson level; when `std` is non-empty, at least one item at exactly that level (`std: []` = vocabulary pattern, exempt).
```
```ts
  pitfalls?: { wrong: string; right: string; why?: string }[];
```

## Rollback
`git revert` of the slice commit; docs only, no migration, no data.
