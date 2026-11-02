# CHY-6 S2 — verify
Ref: `origin/main` @ 3e3997d (PR #18, fast-forwarded). Read from a clean worktree of that ref.

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC2 | decision 1 marked decided | ✅ | `content-schema.md:349` `1. ~~Single chars inside compounds~~ **Decided 2026-11-02:**`; contains 你好, `pattern`, `tests.words` (1 hit each) |
| AC2 | answer: both listed (only when taught on its own) | ✅ | `:349` "listed in `sections.words` next to the compound (你 next to 你好) only when the lesson teaches it on its own" |
| AC2 | Bài 1 example consistent | ✅ | ids line `[你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]` → 1 hit; walk: `h1-g01` pattern "你 / 您 / 你们 + 好" tokens → 你 ✓ 好 ✓ (2/2); doc listenSpeak `q-h1-01-l01` tests.words [好] ✓ |
| AC2 | rule is lint-checkable | ✅ | `:344` lint 8 row carries the one-char clause (decision 1) |
| AC2 | content unchanged | ✅ | `git diff --quiet ca1a241 3e3997d -- content/` → exit 0 |
| AC3 | decision 2 decided, ids kept | ✅ | `:350` "Decided 2026-10-26: ids stay our own `h<L>-gNN`" + "when any point in the lesson has a non-empty `std` … (`std: []` = vocabulary pattern, exempt)" |
| AC3 | GrammarPoint type consistent | ✅ | `:102` comment unchanged (no hunk); `:107` `why?: string`; `why: string` → 0 hits |
| AC3 | h1-g01 example consistent | ✅ | `content/grammar/h1-g01.yaml`: `std: []` (exempt), pitfall `{ wrong: 好你, right: 你好 }` with no `why` (optional) |
| AC3 | lint script agrees with decision 2 | ✅ | `scripts/check-lesson.py:98`; synthetic h2-01 with every `std` set to []: old script → `★8 no grammar point at syllabus HSK 2`, new → 0 ★8 errors |
| AC3 | no regression on real lessons | ✅ | `check-lesson.py` h2-01, h3-01, h4-01, h5-01: exit 0 before and after, identical output |
| AC3 | ★8 spec agrees | ✅ | `docs/lesson-preview-format.md:47` carries the same "when any point has a non-empty `std`" exemption |
| — | CI | ✅ | PR #18 @ 3e3997d: ci, Vercel, Vercel Preview Comments success; CodeRabbit skipped (unchanged tree, earlier passes clean); 0 unresolved comments |
| — | Signing | ✅ | 7/7 commits `%G?` = G, author and committer `43029756+stonghuuloc@users.noreply.github.com` |

## Residual risk
- Capy review on 3e3997d was still running when Loc ordered the merge. The tree is the same as d5c206a, which had green checks and 0 unresolved comments.
- `prototype/data/h1-01.js` uses an older format `check-lesson.py` can't load, so the `std: []` exemption is proven on synthetic data only, not on Bài 1.
- Parked items stay open (`PARKED.md`), none on an AC.
