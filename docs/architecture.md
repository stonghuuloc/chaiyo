# Chaiyo — module design

How the code is cut into modules on the locked stack (`docs/adr/0001-sveltekit-over-nuxt.md`, diagram `docs/diagrams/stack.html`). Terms: `CONTEXT.md`. Content shapes: `docs/content-schema.md`. Vocabulary (module, interface, depth, seam, adapter) as in the `codebase-design` skill.

Goal: few **deep** modules with small interfaces. Screens stay thin and call them; every hard rule of the domain (sandhi, FSRS, unlocks, Streak, Freeze, Badges) lives in exactly one place.

## Map

```
 BUILD TIME (Mac / CI)                      RUNTIME
 ┌──────────────────────┐                   ┌─────────────────────────── SvelteKit SPA (PWA) ──────────────┐
 │ content/  (Importer) │──bundle+rows─────▶│ Catalog ◀── screens ──▶ Study ──▶ Ledger ──┬─ IndexedDB outbox│
 │  YAML→lint→derive    │                   │  lesson/word/lookup      apply()   record()└─ Supabase        │
 │  →sink               │──audio manifest─┐ │ Audio.play(key)          rollover()                          │
 └──────────────────────┘                 │ │ Speech.score() ──▶ /api/speech (server route) ──▶ Azure      │
 ┌──────────────────────┐                 │ └──────────────────────────────────────────────────────────────┘
 │ audio/ (Renderer)    │◀────────────────┘   Supabase Edge Function (pg_cron, 15 min)
 │  VoiceStudio → R2    │                     Study.rollover() per Learner ──▶ Notify.send() ──┬ Web Push
 └──────────────────────┘                                                                      ├ Resend
                                                                                               └ Telegram
```

## Modules

| Module | Interface (all a caller must know) | Hidden behind it | Seam / adapters |
|---|---|---|---|
| **Importer** `content/` (CLI) | `import(dir) → { sha } \| { errors: LintError[] }`. Never partial: any error writes nothing. Re-running the same files is a no-op. | Zod schemas, the 9 contract lint checks, sandhi → spoken pinyin, Hán Việt per word, `seg`, `taughtIn` + backlinks, audio keys, gate-pool coverage, `content_versions`. | **Sink**: Postgres rows + static JSON bundle (prod), in-memory (tests). Two real adapters. |
| **Audio Renderer** `audio/` (CLI) | `render(manifest) → { uploaded, skipped }`. Idempotent by key `sha256(hanzi\|voice)`. | VoiceStudio calls, Cast → voice map, mp3 encode, R2 upload, skip existing keys. | **TTS**: VoiceStudio now; Azure TTS is the fallback if the spike fails. Second adapter only if that happens. |
| **Catalog** `lib/catalog` | `lesson(id)`, `word(id)`, `char(hanzi)`, `lookup(sentenceId, tapIndex)`, `search(query)`. Read-only; every result carries `contentSha`. Works offline for any lesson already opened. | Where content comes from (bundle vs rows), service-worker caching, the 122k Dictionary search, polyphone choice. | **Source**: JSON bundle on the CDN + Supabase rows for Dictionary search; fixture source for tests. |
| **Study** `lib/study` (pure TS, runs in browser and Edge Function) | `apply(state, attempt, now) → { state, events }` and `rollover(state, day, tz) → { state, events }`. Events: `CardScheduled`, `SectionDone`, `GatePassed`, `LessonUnlocked`, `DayCounted`, `FreezeEarned`, `FreezeSpent`, `StreakReset`, `BadgeEarned`. | ts-fsrs, review-card generation, the 80% Gate Test rule + best score, unlock order, Placement blocks + 20 new cards/day, Streak counting in the Learner's timezone, Freeze earn/spend/cap 2, the Badge list, Lexicon promotion from "tự thêm" to taught. | None. It has no I/O, so it needs none. Tested only through `apply`/`rollover` with Attempt sequences. |
| **Ledger** `lib/ledger` | `record(attempt)` (append-only), `state()`, `subscribe(fn)`. Accepts writes offline; syncs when online; never loses or duplicates an Attempt. | IndexedDB outbox, idempotent upsert by Attempt id, replay of `Study.apply` over unsynced Attempts, merge with server state, RLS session. | **Store**: Supabase (online) + IndexedDB (offline outbox), plus an in-memory store for tests. Real, because offline SRS is a requirement. |
| **Speech** `lib/speech` + `/api/speech` | `score(audio, task) → SpeakingScore \| SpeechError`. The recording is deleted once scored. | Azure token from the server route (key never in the client), read-aloud vs free-answer scoring, rubric grading, the delete-after-score guarantee. | **Scorer**: Azure; a fake for tests. |
| **Audio player** `lib/audio` | `play(key, { slow })`. Second tap of the same clip = 0.5×, pitch kept. | R2 URL, service-worker cache, `preservesPitch`. | None needed. |
| **Notify** (Edge Function) | `sendReminders(now) → { sent, skipped }`. At most one Reminder per Learner per day; none if the day already counts. | Timezone match to the Learner's chosen time, channel preferences, retries, dead-token cleanup. | **Channel**: Web Push, Resend, Telegram. Three real adapters. |

Screens (`routes/`) and the lesson runner (successor of `prototype/step.js`) only render Catalog data, collect answers into Attempts, call `Ledger.record`, and react to Study events (a `GatePassed` event shows the "Chaiyo!" screen). No rule lives in a screen.

## Decisions this design makes

1. **Study is the one deep core, shared by browser and Edge Function.** Streak rollover runs nightly on the server and live on the phone; one implementation means they cannot disagree. This is a real second runtime, not a pure helper extracted only for tests.
2. **Progress is derived, Attempts are the truth.** The Ledger stores Attempts; Progress is `Study.apply` folded over them. A rule change can be replayed over history.
3. **The client is trusted with its own Progress.** Learners could forge their own unlocks or Streak through the API. Accepted: there are no points, no currency and no prizes, and RLS still stops writes to anyone else's rows. Revisit if leaderboards ever matter.
4. **No repository-per-table layer.** Supabase calls live inside Ledger and Catalog only. A thin wrapper per table fails the deletion test: deleting it moves complexity, it does not remove any.
5. **Seams only where two adapters exist today.** Sink, Source, Store, Scorer, Channel qualify. TTS stays a direct call until the VoiceStudio spike decides whether Azure TTS is needed.

## Open question (changes Catalog's Source adapter)

Should lesson content reach the phone as a **static JSON bundle per lesson on the CDN** (versioned by `contentSha`, cached by the service worker, zero DB reads) or as **Postgres rows** read through Supabase? The design recommends the bundle for lessons and Word Pages, and Postgres only for Dictionary search and Attempt foreign keys. Either answer fits the same Catalog interface.

## Test surface

| Module | Tested through | With |
|---|---|---|
| Importer | `import(fixtureDir)` | in-memory sink; one fixture per lint check |
| Study | `apply` / `rollover` | Attempt sequences: gate fail→retry→pass, a missed day with and without a Freeze, DST change, placement |
| Ledger | `record` / `state` | in-memory store; offline → online with duplicate replays |
| Notify | `sendReminders(now)` | fake channels; a Learner who already studied gets nothing |
