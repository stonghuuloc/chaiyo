# CHY-8 S3 — discussion
ACs: AC3, AC7

## Current behaviour (verified, with anchors)
- [AC3] No sink beyond the S2 memory sink exists. `supabase/` holds `config.toml` and `templates/magic-link.html` only (no `migrations/`); `[db.migrations] enabled = true` (config.toml:53). `@supabase/supabase-js` is the only DB package (package.json:58): no SQL driver, no PGlite.
- [AC3] Table list and keys: content-schema.md:331-343 (`chars`, `words`, `word_chars`, `sentences`, `grammar_points`, `lessons` `(level, order)` unique, `lesson_words`/`lesson_grammar`, `questions` with role drill/dialogue/listen/gate/mock, `content_versions`); RLS: select for authenticated, no writes; "questions are never deleted, so old Attempts still resolve".
- [AC3] Bundle: one JSON per lesson, URL carries the sha, same origin (ADR 0002). `static/` files are precached per deploy by the service worker (`src/service-worker/index.ts:9-11`: `assets` from `$app/manifest`), so every bundle of a deploy is cached at install, which ADR 0002 reason 4 expects. `static/content` does not exist; `vercel.json` and `svelte.config.js` do not exist (config lives in vite.config.ts); `pnpm build` is `vite build` and CI runs it (ci.yml).
- [AC7] Audio rule: content-schema.md:322 (key `sha256(hanzi|voice)` per Sentence and Word, normal speed, voice = speaker's Cast voice else default narrator; Primer syllable key `sha256(syllable|narrator)`, Pinyin Table = syllables.yaml × 4 tones ≈ 1,600 clips, content-schema.md:301). `content/cast.yaml` is `[]`; Cast voice ids wait for the VoiceStudio spike (content-schema.md:363), so `voice` = CastId (`redpanda`, `takin`) or `narrator`; the Audio Renderer owns CastId → provider voice (architecture.md:28).
- [AC7] Real keys: `sha256('你好！|redpanda')` = 2499c461…, `sha256('你好|narrator')` = a8c34d15… (computed 2026-11-03).
- [AC3] The ticket description lists no Dictionary link (`dictionary.word_id`) and no Dictionary table load; only content-schema.md:326 mentions the link. No story loads the 122k rows.

## Answered here (no human needed)
- [AC3] Q: tables the Postgres sink writes? A: chars, words, word_chars, sentences, grammar_points, lessons, lesson_words, lesson_grammar, questions, content_versions; no `dictionary` table or link (parked: no AC, nothing loads it). Confidence 85%.
- [AC3] Q: write semantics? A: one transaction; mirror tables are upserted and rows missing from this import deleted; `questions` are upserted and never deleted; `content_versions` insert `on conflict do nothing`. Confidence 85%: doc line 341.
- [AC3] Q: driver? A: sink takes a minimal `SqlClient` (`transaction`, `query`); tests use PGlite (Captain, 8.Q2), the CLI uses `pg` (devDependency; the build and CLI run in CI/Vercel, never in the browser). Confidence 80%.
- [AC3] Q: RLS in the migration? A: yes, `enable row level security` + `select to authenticated using (true)` on every table, no write policy; tests create the `authenticated` role first. If PGlite rejects it the executor reports; it never drops the RLS. Confidence 80%.
- [AC3] Q: where does the Postgres import run? A: not decided here: the CLI has `--sink postgres` reading `SUPABASE_DB_URL`; which pipeline calls it is promotion (rollout), not this slice. Confidence 85%.
- [AC3] Q: bundle body? A: `{ sha, lesson, sentences, questions, grammar, words, chars, gateCoverage, thin }`; sentences = lesson sentences + free sentences listed in a taught word's `examples`/`senses[].example`; words = the lesson's `sections.words.ids`; chars = hanzi of those words. Confidence 85%: ADR 0002 text.
- [AC3] Q: how does the app find the current sha? A: `<outDir>/current.json` = `{ sha }`, written last. Confidence 80%: CHY-25 consumes it; it is inside the static folder, so the service worker precaches it per deploy.
- [AC3] Q: bundle write atomic? A: write to `<outDir>/.tmp-<sha>`, rename to `<outDir>/<sha>`, then rewrite `current.json`; `has` = `<sha>/manifest.json` exists. Confidence 90%.
- [AC7] Q: manifest entry? A: `{ key, kind, ref, voice, hanzi, reading?, split? }`; a Word whose id differs from its hanzi is `split` and carries `reading` = its resolved spoken pinyin, which is the TTS input (Captain, 8.Q6). Confidence 85%.
- [AC7] Q: syllable clips? A: Pinyin Table = every syllables.yaml row × tones 1–4 with generated tone marks (a, e, ou rules), plus Primer `syllables`, `pairs` and `kind: 'syllable'` prompts keyed `sha256((spoken ?? text)|narrator)`; deduped, sorted by key. Confidence 85%: content-schema.md:301 and CHY-11's ask.
- [AC7] Q: where is the manifest computed? A: in `assemble` (adds `audio` to `ImportedContent`, so it is in the sha and in every sink); the bundle sink writes it as `audio-manifest.json`, Postgres fills `sentences.audio_key`. Confidence 85%.
- [CHORE] Q: build chain? A (Captain): production build = `pnpm import:content --sink bundle --only lessons/hsk1` → `pnpm fonts <outDir>/<sha> <fontsDir>` → `vite build`, in `scripts/build-content.sh` called from `vercel.json`'s `buildCommand`; CI's `pnpm build` stays as is and gains one memory-sink import step. `static/content/` is git-ignored. Confidence 80%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 3 | 8.Q5 [LOCK] | production build scope | B — lint + import only `lessons/hsk1` (`--only`; CHY-9 adds `lintDir(dir, { only })`) | Captain (80% rule), 2026-11-03 |
| 3 | 8.Q6 [LOCK] | audio key for split Words | C — `id|voice` for split Words, `hanzi|voice` otherwise; TTS input of a split Word is its reading | Captain (80% rule), 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- ADR 0002: bundle + Postgres sinks, sha in URL. Loc: Postgres sink tests on PGlite. Audio key normal speed only.
