# CHY-8 S3 — plan
ACs: AC3, AC7  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-8 (after S1, S4, S2 are on it; CHY-9 `lintDir` + `tsx`, CHY-13 `pnpm fonts`, CHY-10/11 content merged) · run `pnpm install` first

## Anchors (verified 2026-11-03 on main 9007e33; ⏳ = from lanes not merged yet)
- `docs/content-schema.md:322` audio key; `:312` Primer syllable key (`:301` is the `PrimerSection` type); `:331-343` Postgres tables, keys, RLS; `:326` Dictionary link (parked).
- `docs/adr/0002-lesson-content-as-static-bundles.md`: bundle body, sha in URL, two real sinks.
- `src/service-worker/index.ts:9-11` `SHELL = [...immutable, ...assets, ...prerendered]`: `static/` is precached per deploy.
- `package.json:7-23` scripts (`build`, `tokens`, `assets:push`, `supabase:push`); `:58-60` dependencies; `imports` map `#lib/*`. `.github/workflows/ci.yml` steps `pnpm check`, `lint`, `test:coverage`, `build`. No `vercel.json`, no `supabase/migrations/`, no `.gitignore` entry for `static/content`.
- `supabase/config.toml:53` `[db.migrations] enabled = true`; `scripts/supabase-push.sh` is the config-push guard, unrelated.
- S2 files (to be on disk): `import/sink.ts` (`ImportedContent`, `Sink`, `createMemorySink`), `import/assemble.ts`, `import/import.ts`, `import/fixtures/ok/**`. ⏳ C1: `lintDir(dir, { refs?, only? })`, `LintError`.
- ⏳ CHY-13 `pnpm fonts <bundlesDir> <fontsDir>`; ⏳ CHY-9 `tsx` devDependency + `scripts/lint-content.ts` as the pattern.
- No `rg`: use `grep`. Dependencies added (devDependencies): `@electric-sql/pglite`, `pg`, `@types/pg`.

## Task 1 [AC7] `audioManifest` + wire into `assemble`
Files: new `src/lib/content/import/audio.ts`, new `audio.test.ts`; edit `import/assemble.ts`, `import/sink.ts` (type), `import/assemble.test.ts`
- Test first (`audio.test.ts`): cases of SPEC [AC7] with literals: `你好！|redpanda` → `2499c461…` prefix, `你好|narrator` → `a8c34d15…`, no speaker → narrator, split `打-da2` → key of `打-da2|narrator`, `split: true`, `reading: 'dá'`, plain 打 unchanged; syllable `ma` → `mā má mǎ mà` (also `lü` → `lǖ lǘ lǚ lǜ`, `hou` → `hōu hóu hǒu hòu`, `liu` → `liū liú liǔ liù`); a Primer literal's `syllables`/`pairs` entries (string and `{ say }` forms; the key uses `say`) and `kind: 'syllable'` prompt (`spoken` wins over `text`) deduped with table rows; sorted by key. `assemble.test.ts`: `content.audio` deep-equals `audioManifest(content)` and a sha test input changes when a speaker changes.
- Change: `audioManifest(content): AudioEntry[]`; `addTone(syllable, tone)` (mark on `a` > `e` > `o` of `ou` > last vowel; `iu`/`ui` → the second vowel; `ü` kept); `assemble` appends `audio` before returning; `ImportedContent` type gains `audio: AudioEntry[]`. Key = `createHash('sha256').update(text + '|' + voice).digest('hex')`.
- Verify: `pnpm vitest --run src/lib/content/import/audio.test.ts src/lib/content/import/assemble.test.ts`

## Task 2 [AC3] Bundle builder + bundle sink
Files: new `import/bundle.ts`, `import/bundle-sink.ts`, `import/bundle.test.ts`, `import/bundle-sink.test.ts`
- Test first: `buildBundle(content, 'h1-01')` has the 9 keys, `words` = ids of `sections.words.ids` (derived fields present), `chars` = hanzi of those words found in `content.chars`, `sentences` = lesson sentences + free sentences referenced by a taught word's `examples` or a lesson grammar point's `examples`, `questions` = those with `lessonId`; Primer bundle has no `words`. Sink (temp dir): after `write`, `<sha>/h1-01.json`, `manifest.json` (bytes match `statSync`), `audio-manifest.json`, `current.json` exist; `has` false before and true after; revert A → B → A: third `write` only rewrites `current.json` (folder `A` untouched) and `has(A)` true again; a forced failure (stub `renameSync` via an injected `fs` object) leaves no `<sha>` dir and `current.json` unchanged; `.tmp-*` removed.
- Change: `createBundleSink(outDir, fs = nodeFs)`: write all files into `.tmp-<sha>`, `rename` to `<sha>`, then write `current.json` via temp + rename.
- Verify: `pnpm vitest --run src/lib/content/import/bundle`

## Task 3 [AC3] Migration + Postgres sink (PGlite)
Files: new `supabase/migrations/20261103000000_content_tables.sql`, new `import/postgres-sink.ts`, `import/postgres-sink.test.ts`; `package.json` (devDependencies)
- Test first (PGlite, `create role authenticated` first, migration file read from disk and executed): import `fixtures/ok` through `createPostgresSink(sql)` → counts per table equal the content; `sentences.audio_key` set from `audio`; twice → `content_versions` has 1 row; delete a word from a temp copy and re-import → gone; delete a question and re-import → still in `questions`; `grant select, insert on all tables in schema public to authenticated` then `set role authenticated` → `select` works, `insert` raises `violates row-level security`; `has(sha)` true for the latest import only; A → B → A rewrites the mirror to A. The delete-a-word / delete-a-question cases also remove that id from lesson `words`, `tests` and gate pool in the temp copy, or lint 8 fails the import first.
- Change: DDL (draft below), RLS on all 10 tables; `SqlClient = { query(sql, params?): Promise<{ rows: unknown[] }>; transaction<T>(fn: (q: SqlClient['query']) => Promise<T>): Promise<T> }`; `write` (one transaction, order as in SPEC): `delete from lesson_words, lesson_grammar, word_chars`; `delete … where id <> all($1)` for `sentences`, `words`, `grammar_points`, `chars`; upsert `lessons`, `chars`, `grammar_points`, `words`, `sentences`; then delete stale `lessons` (a kept word may have pointed its `taught_in` at a removed lesson, so `words` must be upserted first); add a test: remove a lesson, keep its word with a new `taughtIn`; add a test: write two hand-built contents straight into the Postgres sink (`fixtures/ok` has one lesson and the Primer, whose `order` is fixed at 0): the second swaps the `order` of two lessons, both rows hold their new `order`; insert the pair tables; upsert `questions`; `insert into content_versions … on conflict (sha) do update set imported_at = now()`. `has(sha)`: `select sha from content_versions order by imported_at desc limit 1`.
- Verify: `pnpm vitest --run src/lib/content/import/postgres-sink.test.ts`. If PGlite rejects RLS/role syntax: STOP and report; never drop RLS.

## Task 4 [AC3] Same content in every sink
Files: new `import/sinks.test.ts`
- Test first: import `fixtures/ok` into the three sinks. Per entity compare fields, not ids only: word `spoken`/`hanviet`/`taughtIn`, sentence `spoken`/`seg`/`audio_key`, question `body` (deep-equal), char `readings`, lesson row; each `<sha>/<id>.json` deep-equals `buildBundle(memory.content, id)`; `current.json.sha` equals the latest `content_versions.sha`. Named differences (memory ⊃ bundle): free sentences no word or grammar point lists, chars of untaught words, Primer words; assert them explicitly so they cannot widen.
- Change: none beyond tests; fix the sink that differs.
- Verify: `pnpm vitest --run src/lib/content/import/sinks.test.ts`

## Task 5 [AC3] `scopeFor` + CLI
Files: new `import/scope.ts`, `import/scope.test.ts`, new `scripts/import-content.ts`, new `scripts/pg-client.ts`, new `scripts/cli.test.ts`; `package.json` scripts (`"import:content": "tsx scripts/import-content.ts"`)
- Test first: `scopeFor(fixtures/ok, ['lessons/hsk1'])` = roots + `chars`, `sentences`, `syllables.yaml` + `words/<id>.yaml` / `grammar/<id>.yaml` of exactly every word/grammar id the in-scope lessons reference through check 8(a) fields (`sections.words.ids`, question `tests.words` and word-typed `prompt.ref`, `sections.grammar.ids`, `tests.grammar`) (a word file nothing references is absent; add a case where a question references a word no lesson lists); CLI via `spawnSync('pnpm', ['tsx', …])` on a temp copy: memory sink → exit 0 and last stdout line is 64 hex; bad pinyin → exit 1 and a line `words/你好.yaml  pinyin  #3 Tone marks …`; `--sink postgres` without `SUPABASE_DB_URL` → exit 1 before any file read; `--sink bundle --out <tmp>` leaves `<tmp>/<sha>/manifest.json`.
- Change: `scopeFor(dir, roots)` parses the lessons under the roots with `parseContent` (parse errors ignored: lint reports them); CLI parses args, builds the sink (`createPgClient(url)` wraps `pg` with `BEGIN/COMMIT/ROLLBACK` on one client), prints per C2.
- Verify: `pnpm vitest --run src/lib/content/import/scope.test.ts scripts/cli.test.ts`

## Task 6 [CHORE] Build chain, CI, ignore, docs
Files: new `scripts/build-content.sh`, new `vercel.json`, `.gitignore`, `.github/workflows/ci.yml`, `docs/content-schema.md:322`
- Change: `build-content.sh`: `set -euo pipefail; sha=$(pnpm -s import:content content --sink bundle --out static/content --only lessons/hsk1 | tail -n 1); pnpm -s fonts "static/content/$sha" static/fonts/lessons`; `vercel.json` = `{ "buildCommand": "scripts/build-content.sh && pnpm build" }`; `.gitignore` += `static/content/` and `static/fonts/lessons/` (CHY-13 output); `ci.yml` += step `pnpm import:content content --sink memory --only lessons/hsk1` before `pnpm build`; doc audio-key row += "a Word whose id differs from its hanzi keys on `id|voice`; voice = the CastId, the Audio Renderer maps it to a provider voice".
- Verify: `bash -n scripts/build-content.sh && pnpm import:content content --sink memory --only lessons/hsk1 | tail -n 1` → 64 hex; `pnpm check && pnpm lint && pnpm test:coverage` green; `git status` lists only the Files touched.

## Mutation paths covered
- Bundle sink: temp dir then rename, `current.json` last; a repeat of the current sha never reaches `write` (`has`); a revert to an earlier sha reaches `write` and only rewrites `current.json`. Postgres: one transaction; re-import upserts and deletes stale mirror rows, never deletes `questions`. CLI creates no file in `memory` mode.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
```sql
create table content_versions (sha text primary key, imported_at timestamptz not null default now());
create table chars (hanzi text primary key, radical text not null, ids text not null, strokes int not null, readings jsonb not null, mnemonic jsonb, traditional text);
create table lessons (id text primary key, kind text not null default 'lesson', level int not null, "order" int not null, topic text, title text not null, title_hanzi text not null, sections jsonb not null, unique (level, "order") deferrable initially deferred);
create table words (id text primary key, hanzi text not null, pinyin text not null, spoken text not null, hanviet text not null, level int not null, taught_in text references lessons(id), data jsonb not null);
create table word_chars (word_id text references words(id) on delete cascade, pos int, hanzi text not null, primary key (word_id, pos));
create table sentences (id text primary key, lesson_id text references lessons(id), hanzi text not null, pinyin text not null, spoken text not null, vi text not null, seg text[] not null, audio_key text not null);
create table grammar_points (id text primary key, level int not null, std int[] not null, title text not null, pattern text not null, data jsonb not null);
create table lesson_words (lesson_id text references lessons(id) on delete cascade, word_id text references words(id), pos int, primary key (lesson_id, word_id));
create table lesson_grammar (lesson_id text references lessons(id) on delete cascade, grammar_id text references grammar_points(id), pos int, primary key (lesson_id, grammar_id));
create table questions (id text primary key, lesson_id text not null, role text not null check (role in ('drill','dialogue','listen','gate','mock')), body jsonb not null);
-- alter table … enable row level security; create policy … for select to authenticated using (true);  (each of the 10 tables)
```
`words.taught_in` references `lessons`: the Task 3 order (pair tables cleared first, parents upserted, stale `lessons` deleted last) is what makes the FKs hold, and the deferred `(level, order)` unique lets lessons swap or shift order row by row. A self-contradictory fixture or a table definition PGlite cannot run is reported to the Captain, not hacked to green.

## Rollback
git revert of this slice's commits; removes the migration file (not yet applied to any database), the sinks, the CLI and the build chain. The 3 devDependencies leave with `package.json`.
