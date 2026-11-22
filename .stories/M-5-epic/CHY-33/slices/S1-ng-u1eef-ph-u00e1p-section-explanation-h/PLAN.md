# CHY-33 S1 — plan
ACs: AC1, AC2  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-33-S1
Base: .@a65f42970e

Landing order: rebase onto CHY-25.S2 (layout `data.lesson`, `bundle.ts` owner) and CHY-30.S2 (`ledger` prop) tips first; land after both. CHY-34.S2 rebases on this slice (`sections.ts`).

## Anchors (verified 2026-11-16 on a65f42970e)
- `src/lib/lesson/steps.ts:4` — `export type LessonStep = import('./steps/Choice.svelte').Step;`; `:8-15` view lookup by file name.
- `src/lib/lesson/types.ts:5-27` — `Answer {questionId, pick, correct, ms, card?}`, `Cta`, `StepProps<S>`.
- `src/lib/lesson/choice.ts:33-54` — `choiceCta` CTA states; `:5-14` verdict copy `m.lesson_right()` / `m.lesson_wrong()`.
- `src/lib/lesson/steps/Choice.svelte:1-17` — module script with `kind` + `Step` type (pattern for new kinds); `:32-49` CTA `$effect`.
- `src/lib/lesson/steps/Choice.svelte.test.ts:1-40` — `mountChoice` jsdom harness (pattern for new view tests).
- `src/lib/lesson/StepRunner.svelte:9-19` — props `steps, mode, exit, lesson, section, contentSha, onfinish` (+ `ledger: Ledger`, CHY-30.S2 PLAN Task 4).
- `src/lib/learner/index.ts:10` — `learnerLedger(session): Promise<Ledger>`; `src/routes/(app)/+layout.ts:5-10` returns `{ session }`.
- `src/lib/catalog/index.ts:22-32` — `LessonContent { contentSha, lesson, sentences, grammar, … }`; CHY-25.S2: `lesson/[id]/+layout.ts` returns `{ lesson: LessonContent }`.
- `src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5` — stub; `+page.ts:1-3` shell `focus`.
- `src/lib/content/schemas.ts:92-103` — `GrammarPoint`; `:199` — `grammar: z.strictObject({ ids, drills })`; `:155-158` order question `{ tiles, answer: Id }`; `:131-139` choice `{ prompt, options, answer: index }`.
- `src/lib/content/import/sink.ts:21` — `ImportedSentence = Sentence & { lessonId?; seg }`; `:39` `audio: AudioEntry[]`.
- `src/lib/content/import/bundle.ts:50` — `sentences: content.sentences.filter(...)`; `audio.ts:6-16` `AudioEntry {key, kind, ref, …}`; `:81-92` sentence entries `ref: s.id`.
- `src/lib/content/h1-01.parity.test.ts:295-304` — real-content import + `buildBundle(…, 'h1-01')`.
- `src/lib/audio/index.ts:1` — `play(key)`.
- `messages/vi.json:135` — `lesson_review_hint` (new `grammar_*` block goes after it).
- `docs/content-schema.md:113-137` — GrammarPoint / Lesson docs.

## Task 1 [AC1] Bundle sentences carry their clip key
Files: `src/lib/content/import/sink.ts:21`, `src/lib/content/import/bundle.ts:47-57`
- `ImportedSentence` gains `audio?: string`.
- `buildBundle`: `const clip = new Map(content.audio.filter((a) => a.kind === 'sentence').map((a) => [a.ref, a.key]))`; map bundled sentences to `{ ...s, audio: clip.get(s.id) }`. Primer branch (`:23-34`) unchanged (no sentences).
- Postgres sink untouched: it destructures named columns and recomputes `audio_key` (`postgres-sink.ts:149-159`); `audio` is never set on `content.sentences`, only on bundle copies.
- Test first: `bundle.test.ts` — `Given_Bundle_When_Build_Then_EverySentenceCarriesItsManifestKey` (each `b.sentences[i].audio === manifest entry key`, and a no-speaker sentence starts `examples/`).
- Verify: `pnpm vitest --run src/lib/content/import/bundle.test.ts`

## Task 2 [AC1] [AC2] Content fields `labels` and `done`
Files: `src/lib/content/schemas.ts:92-103,199`, `docs/content-schema.md:113-137`, `content/grammar/h1-g01.yaml`, `h1-g02.yaml`, `content/lessons/hsk1/h1-01.yaml:37`
- `GrammarPoint`: `labels: z.array(z.string()).optional()`. Lesson grammar section: `done: z.string().optional()`.
- YAML: h1-g01 `labels: [ người được chào, luôn có ]`; h1-g02 `labels: [ người kia nói, bạn đáp ]`; h1-01 `grammar.done: Mẫu A + 好 và các câu đáp đã vào phần ôn tập, sẽ quay lại cùng các câu hỏi khác.`
- Docs: one line each in the TS blocks.
- Test first: `schemas.test.ts` — `Given_GrammarWithLabels_When_Parse_Then_Kept`, `Given_GrammarSectionDone_When_Parse_Then_Kept`.
- Verify: `pnpm vitest --run src/lib/content/schemas.test.ts src/lib/content/h1-01.parity.test.ts` and `pnpm lint:content content` green on real content.

## Task 3 [AC2] `order` step kind
Files: new `src/lib/lesson/steps/Order.svelte`, `src/lib/lesson/steps.ts:4` (one union line)
- Module: `kind = 'order'`; `Step = { kind:'order'; id; ask; title; tiles: string[]; answer: string }`.
- State: `placed: number[]` (tile indexes), `phase: 'placing' | 'graded'`. Tap pool tile → push; tap slot → splice. Pool tile used → rendered as gone.
- CTA (`$effect`, same shape as `Choice.svelte:32-49`): test mode → `choiceCta({mode:'test', last, picked: full})`; feedback placing → label `m.lesson_check()`, disabled `!full`, hint full ? '' : `m.grammar_order_hint()`; graded → `choiceCta({phase:'graded', correct})`.
- Grade: `got = placed.map(i => tiles[i]).join('')`; `correct = got === answer`; verdict `m.lesson_right()` + answer, or `m.lesson_wrong()` + answer. `next({ questionId: id, pick: got, correct, ms })`.
- Union: `| import('./steps/Order.svelte').Step`.
- Test first: `steps/Order.svelte.test.ts` (harness from `Choice.svelte.test.ts:1-40`) — `Given_TwoPlaced_When_Render_Then_CheckDisabledWithHint`, `Given_RightOrder_When_Check_Then_RightVerdictAndAnswerReported`, `Given_WrongOrder_When_Check_Then_WrongVerdictShowsAnswer`, `Given_PlacedTile_When_Tap_Then_ReturnsToPool`, `Given_TestMode_When_Full_Then_NoVerdictAndNextQuestion`.
- Verify: `pnpm vitest --run src/lib/lesson/steps/Order.svelte.test.ts`

## Task 4 [AC1] `grammar` step kind (explanation)
Files: new `src/lib/lesson/steps/Grammar.svelte`, `src/lib/lesson/steps.ts:4` (one union line)
- `Step = { kind:'grammar'; id; kicker; title; rows: string[][]; labels: string[]; lead: string; more: string; examples: {hanzi; pinyin; vi; audio?}[]; pitfall?: {wrong; right}; drills: number }`.
- Render kicker, title, slot rows (`+` between slots of a 1-row pattern, `→` in pair rows; `labels[col]` under each slot), `lead`, "Xem thêm" button (`aria-expanded`, controls the `more` paragraph, hidden when `more` is empty), "Ví dụ" list with play button → `play(ex.audio)` (no button when `audio` missing), "Hay nhầm" Sai/Đúng.
- CTA on mount: `{ label: m.grammar_start(), hint: m.grammar_drills({ n: drills }), caret: true, onclick: () => next() }`.
- Union: `| import('./steps/Grammar.svelte').Step`.
- Test first: `steps/Grammar.svelte.test.ts` (`vi.mock('#lib/audio/index.js')`) — `Given_Point1_When_Render_Then_SlotsLabelsAndKicker`, `Given_XemThem_When_Tap_Then_ExpandsMore`, `Given_Example_When_TapPlay_Then_PlaysClipKey`, `Given_Pitfall_When_Render_Then_SaiAndDung`, `Given_Mount_When_Render_Then_CtaLamBaiWith3Drills`.
- Verify: `pnpm vitest --run src/lib/lesson/steps/Grammar.svelte.test.ts`

## Task 5 [AC1] [AC2] Build the 8 steps from a lesson
File: new `src/routes/(app)/lesson/[id]/[section]/grammar.ts`
- `grammarSteps(c: LessonContent): LessonStep[]` — Primer (`'kind' in c.lesson`) → `[]`; for each `lesson.sections.grammar.ids[i]` (n of N): the grammar point → one `grammar` step (`kicker = m.grammar_point({n, of})`, rows/labels from `pattern` (contains `→` → split ` / ` then ` → `; else split ` + `), `lead`/`more` = `explain` split on the first `\n\n`, examples resolved from `c.sentences`, `pitfall = pitfalls?.[0]`, `drills` = count), then its drills: `c.lesson.sections.grammar.drills` filtered by `tests.grammar` including the id — never `c.questions` (it also holds the dialogue `q-h1-01-d01` and freeAnswer `q-h1-01-f01/f02` that test the same points, `h1-01.yaml:87-128`) numbered `m.grammar_drill({n, of})`:
  - choice + `prompt.kind === 'vi'` → `{ kind:'choice', id, ask, title: prompt.text, options, answer: options[answer] }`. No `card`: no AC of this slice schedules a review card (`Skill` = `'the' | 'nghe' | 'viet'`, `src/lib/study/types.ts:3`).
  - order → `{ kind:'order', tiles, answer: sentence.hanzi without /[\p{P}\s]/gu, title: sentence.vi }`.
- Test first: `grammar.test.ts` — fixture literal: `Given_TwoPoints_When_Build_Then_EightStepsInOrder` (fixture also has a dialogue question testing g01 — must not appear), `Given_Primer_When_Build_Then_NoSteps`, `Given_PairPattern_When_Build_Then_RowsSplitOnArrow`, `Given_NoBlankLine_When_Build_Then_EmptyMore`; real Bài 1 (import as `h1-01.parity.test.ts:295-304`): `Given_Bai1_When_Build_Then_Ac1Ac2Strings` (您好, 你们好, order answer 你们好, 不客气, 没关系, 对不起, labels, pitfalls, examples have `audio`, `sections.grammar.done` = the AC2 text).
- Verify: `pnpm vitest --run "src/routes/(app)/lesson/[id]/[section]/grammar.test.ts"`

## Task 6 [AC1] [AC2] Section registry + grammar section
Files: new `[section]/sections.ts`, new `[section]/GrammarSection.svelte`, `[section]/+page.svelte:1-5`
- `sections.ts`: `export const sections: Record<string, Component<{ lesson: LessonContent; session: Session | null }>> = { grammar: GrammarSection };` (one line per section; CHY-34.S2 adds `listenSpeak`).
- `+page.svelte`: `const View = $derived(sections[page.params.section])`; `{#if View}<View lesson={data.lesson} session={data.session} />{:else}<h1>{m.screen_lesson_section()}</h1>{/if}`.
- `GrammarSection.svelte`: `steps = grammarSteps(lesson)`; `ledger = await learnerLedger(session)` (`{#await}`); `<StepRunner {steps} {ledger} lesson={lesson.lesson.id} section="grammar" contentSha={lesson.contentSha} exit={resolve('/(app)/(tabs)/today')} onfinish={() => (done = true)} />`; done → `m.grammar_done()` + `lesson.sections.grammar.done`.
- Exit target: `today` (same as `dev/step`); `lesson/[id]` has no `+page` yet, the hub is CHY-31.
- `session: Session | null` (`(app)/+layout.ts:9`, guard lets null through on a retryable error): null → placeholder, no runner. `{#await}` has a `{:catch}` showing the placeholder. 0 steps (Primer) → placeholder (`StepRunner.svelte:25` reads `steps[0]`).
- Test first: `GrammarSection.svelte.test.ts` — mount with a 2-step fixture lesson and a stub ledger (`{ state: () => initialState(), record: async () => [] }`, pattern CHY-30.S2 PLAN Task 4) → `Given_LastStep_When_Continue_Then_DoneTitleAndText`, `Given_NoDoneText_When_Finish_Then_TitleOnly`, `Given_NullSession_When_Mount_Then_PlaceholderNoRunner`, `Given_PrimerLesson_When_Mount_Then_Placeholder`.
- Verify: `pnpm vitest --run "src/routes/(app)/lesson/[id]/[section]"`

## Task 7 [AC1] [AC2] Copy
File: `messages/vi.json:135` (after `lesson_review_hint`)
- `grammar_point`: "Điểm ngữ pháp {n}/{of}", `grammar_drill`: "Câu {n}/{of}", `grammar_start`: "Làm bài", `grammar_drills`: "{n} câu luyện nhanh", `grammar_more`: "Xem thêm", `grammar_examples`: "Ví dụ", `grammar_pitfalls`: "Hay nhầm", `grammar_wrong`: "Sai", `grammar_right`: "Đúng", `grammar_play`: "Nghe {hanzi}", `grammar_order_hint`: "Chạm các chữ để xếp theo thứ tự", `grammar_order_place`: "Đặt chữ {c}", `grammar_order_remove`: "Bỏ chữ {c} ra", `grammar_done`: "Xong phần Ngữ pháp".
- Verify: `pnpm check` (paraglide compile) clean.

## Task 8 [AC1] [AC2] Real-flow proof
- `bash scripts/build-content.sh` → dev server `--port 5415 --strictPort` with the shared env → signed-in `agent-browser` on `/lesson/h1-01/grammar`: 1/8 explain (slots, labels, Xem thêm, play 您好 → network `examples/<hex>.mp3` 200, Sai/Đúng, "Làm bài · 3 câu luyện nhanh") → 2 choices → order (wrong then reload/redo right) → 2/2 pairs → 3 choices → done copy. Screenshot each AC string.
- Full gate: `pnpm lint && pnpm check && pnpm vitest --run` raw (rtk hides prettier failure).

## Mutation paths covered
- Feedback vs test mode for `order` (Gate reuse). Wrong-then-right order (remove a placed tile). Point with no `more`, no pitfall, no `done`, example without `audio` (no play button). Choice drill with a non-`vi` prompt → not mapped (Bài 1 has none; builder throws `unsupported drill` naming the id so content drift is loud).

## Draft code (UNEXECUTED — adapt to what's on disk; report a self-contradictory fixture, don't hack around it)
```ts
const rows = (p: string) => p.includes('→') ? p.split(' / ').map((r) => r.split(' → ')) : [p.split(' + ')];
const [lead, ...rest] = g.explain.split('\n\n'); const more = rest.join('\n\n');
const bare = (s: string) => s.replace(/[\p{P}\s]/gu, '');
```

## Rollback
Revert this slice's commits. Content fields are optional, so older bundles still parse; no migration.
