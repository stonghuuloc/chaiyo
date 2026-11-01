# CHY-6 S1 — discussion
ACs: AC1, AC4

## Current behaviour (verified, with anchors)
- [AC1] Only ADR is `docs/adr/0001-sveltekit-over-nuxt.md` (Status / Context / Decision / Consequences). 0002 does not exist.
- [AC1] `docs/architecture.md:29` Catalog row already names "JSON bundle on the CDN + Supabase rows for Dictionary search" as its Source; Importer Sink (`:27`) = "Postgres rows + static JSON bundle".
- [AC1] `docs/content-schema.md:7` rule 1 says the importer "loads Postgres; Learners read it" — reads as option B.
- [AC1] `docs/content-schema.md:316-331` Postgres table list holds every content table (lessons, sentences, words, chars, questions, dictionary, content_versions); Attempts reference `question_id` + `content_sha`.
- [AC1] No Dictionary search screen: X1 is lookup-only (`docs/screens.md:148`, CHY-5 lock). AC1's "Dictionary search" = X1 lookup of a word outside the lesson.
- [AC1] Prototype sizes: `prototype/data/h1-01.js` 4,965 B raw / 2,024 B gzip; `ukai-h1-01.woff2` 6.5 KB; `dict.json` 4,233 entries = 712 KB raw / 228 KB gzip → 122k entries ≈ 20 MB raw / 6.6 MB gzip; `entries.json` rich W1 entries avg 2,119 B raw (10 entries).
- [AC4] `docs/architecture.md:46-48` = the "Open question" section to replace.
- No Supabase migrations yet (`supabase/` has config only); no `lib/catalog` yet.

## Answered here (no human needed)
- [AC1] Q: does either option change the Catalog interface? A: no — `architecture.md:48` "Either answer fits the same Catalog interface".
- [AC1] Q: bundle URL version = per-lesson hash or the import's `contentSha`? A: `contentSha` — `architecture.md:48` "versioned by `contentSha`"; `content_versions` is one row per import; 40 HSK1 lessons × ~2 KB gzip re-download per import is trivial.
- [AC1] Q: does Q4 B cover X1's shrink-to-single-char chip (学 / 学生)? A: yes — thin entries include each char of every `seg` word, else Q4's answer fails on the chip row (`screens.md:148`).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | lesson content delivery | A — static JSON bundle per lesson; Postgres keeps Dictionary + Attempt FKs | Loc, 2026-11-01 |
| 2 | Q2 [AC1] | bundle host | A — Vercel static, same origin, built in CI with the app | Loc, 2026-11-01 |
| 2 | Q3 [AC1] | Postgres scope | A — full mirror of all content tables (`content-schema.md:316-329`) | Loc, 2026-11-01 |
| 2 | Q4 [AC1] | offline X1 on untaught lesson words | B — bundle carries thin entries for every `seg` word of the lesson | Loc, 2026-11-01 |
| 2 | Q5 [AC1] | reword `content-schema.md:7` rule 1 | yes, in S1 under [AC1] | Loc, 2026-11-01 |
| 3 | Q6 [AC1] | Word Page (W1) data location | A — inside the teaching lesson's bundle | Loc, 2026-11-01 |

## Open — needs an answer before spec
None. Q1–Q6 answered → Resolved. Frontier empty; awaiting Loc's confirmation of the summary.

## Locked (do not re-open)
- none touch S1.
