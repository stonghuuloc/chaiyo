# CHY-7 S1 — verify
Ref: branch CHY-7 @ a14e1dd (PR #21). Proven by tester CHAA-14 from its own worktree checked out at that sha; review by CHAA-15 (Opus, 2 rounds, approve).

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC1 | content/ layout matches schema doc Files | ✅ | layout.test.ts 2/2; all 8 Files paths exist; cast.yaml `[]`, levels/hsk1.yaml `level: 1 / topics: []`, chars/ + mock/hsk1/ keep files only |
| AC1 | syllables.yaml (Q1 B) | ✅ | 405 rows `{ syllable, initial, final }`, no duplicates, parses through the Syllables schema; matches the 405 in prototype/data/syllables.js |
| AC2 | 8 types have Zod schemas accepting valid YAML | ✅ | schemas.test.ts 16/16 (8 valid deep-equal the typed object) |
| AC2 | real content parses (Q3 B) | ✅ | content.test.ts 85/85 (84 files + count pin); hand parse of 你.yaml, h1-g01.yaml, h1-01.yaml ok; data edits = the 3 planned fixes over 6 files |
| AC3 | invalid YAML → typed errors with file + path | ✅ | 你好.yaml copy with `level: "one"` + `collocatons` → `[{file:"你好.yaml", path:"level", message:"Invalid option: expected one of 1\|2\|3\|4\|5"}, {file:"你好.yaml", path:"collocatons", message:"unknown key"}]` |
| AC3 | never throws | ✅ | broken YAML → file "broken.yaml", line 1, col 9; `a: *nope` → ok:false with file "alias.yaml", no throw (reviewer negative control: reverting the fix fails the alias test) |
| AC4 | one valid + one invalid test per type, all pass | ✅ | `pnpm test` 207/207 across 14 files: schemas 16 (8+8), parse 5, layout 2, content 85; `pnpm check` 0 errors; `pnpm lint` clean |
| — | Signing | ✅ | 8/8 commits dd1b4d0..a14e1dd `%G?` = G, author and committer 43029756+stonghuuloc@users.noreply.github.com |

## Residual risk
- Unresolved-alias errors carry the file but no line/col (the yaml library gives no position for them).
- Cross-file checks (ids exist, topic id vs label, cast refs, gate pool ≥ 2×draw, scene path) are not enforced; CHY-9 owns them.
- CI and Capy review on PR #21's final head are read at merge time, not here.
