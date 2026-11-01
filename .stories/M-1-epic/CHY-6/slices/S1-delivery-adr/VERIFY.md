# CHY-6 S1 — verify
Ref: `origin/CHY-6` @ da8aac1 (PR #17) · read via `git show origin/CHY-6:<path>`, not the working tree.

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC1 | Given 0001 is the only ADR | ✅ | `main` has only `0001-sveltekit-over-nuxt.md`; `git ls-tree origin/CHY-6 docs/adr/` → 0001, 0002 |
| AC1 | Then it states one choice | ✅ | 0002 `## Decision`: "one static JSON bundle per lesson … Postgres rows were not chosen for lesson delivery" |
| AC1 | And lists the reasons | ✅ | 4 numbered reasons: 0 DB reads vs 7 tables · offline from service worker · `contentSha` URL expiry · Bài 1 ≈ 2.0 KB gzip × 40 lessons |
| AC1 | And names what the other option is still used for (Dictionary search, Attempt FKs) | ✅ | "Postgres is still used for": Dictionary search/lookup (X1) · `questions` + `content_versions` by `question_id` / `content_sha` · Admin mirror |
| AC4 | Given the ADR is written | ✅ | as AC1 |
| AC4 | Then "Open question" section replaced by a pointer to the ADR | ✅ | `architecture.md` "Open question" → 0 hits; `:46` `## Content delivery`, `:48` "Decided in `docs/adr/0002-lesson-content-as-static-bundles.md` …"; `:3` links 0002 |
| AC4 | (SPEC) diagram no longer shows it open | ✅ | `stack.html` `TBD\|open question\|still open\|5,4` → 0 hits; screenshot `stack-after.png`: solid arrow `JSON BUNDLE`, no legend gap |
| AC1 | (SPEC, Q5) schema rule 1 agrees | ✅ | `content-schema.md:7` "writes Postgres rows plus one JSON bundle per lesson (ADR 0002); Learners read the bundle" |
| — | `pnpm lint` | ✅ | exit 0 (tester, raw, on d7fad99; later commits touch `.stories/` + `backlog/` only, both prettierignored) |

## Residual risk
- AC1 names the option "bundle … on the CDN"; the ADR says "served by Vercel with the app". Vercel is the CDN, so same choice — wording only (parked).
- 5 parked items, none on an AC (`PARKED.md`).
