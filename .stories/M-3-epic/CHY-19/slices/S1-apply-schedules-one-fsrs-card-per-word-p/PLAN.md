# CHY-19 S1 — plan
ACs: AC1, AC2, AC3, AC7  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-19  ·  Lane L1 (WAVE-PLAN)

## Anchors (verified 2026-11-09 on main 7e52b9f)
- `package.json:67-72` — `dependencies` (`@sentry/sveltekit`, `@supabase/supabase-js`, `@vercel/speed-insights`, `zod`); ts-fsrs goes here.
- `eslint.config.js:37-41` — last config object (`rules: {}`); the study block goes after it.
- `vite.config.ts:45` — coverage excludes `src/**/fixtures/**`; `vite.config.ts:56` — vitest includes `src/**/*.{test,spec}.{js,ts}`.
- `prototype/data/lexicon.js:7-10` — skill ids and seconds (S2 uses the seconds).
- `content/lessons/hsk1/h1-01.yaml:36` — Bài 1 word ids.
- `docs/architecture.md:30` — Study row (S2 edits it).
- ts-fsrs 6.0.0: `DefaultScheduler(options)` async (dist/index.mjs:1092); `scheduler.newCard({ now, cardId })`, `scheduler.review({ card, grade, now }).card`; `Rating.Good` / `Rating.Again`; `review()` throws "Expected valid Date fields" on ISO strings.

## Task 0 [CHORE] Add ts-fsrs
File: `package.json:67-72`
- Change: `pnpm add ts-fsrs@^6.0.0` (writes `package.json` and `pnpm-lock.yaml`).
- Verify: `pnpm ls ts-fsrs` → `ts-fsrs 6.0.0`; `git diff --stat` shows only package.json and pnpm-lock.yaml.

## Task 1 [AC1] Types, FSRS adapter, `apply`
Files: `src/lib/study/types.ts`, `src/lib/study/fsrs.ts`, `src/lib/study/apply.ts`, `src/lib/study/index.ts` (all new)
- `types.ts`: `Skill`, `Attempt` (C-M3-1), `Card = { due: string; fsrs: Record<string, unknown> }`, `State = { lexicon: Record<string, { cards: Partial<Record<Skill, Card>> }> }`, `StudyEvent` (CardScheduled only).
- `fsrs.ts`: the only ts-fsrs import. Top-level `const scheduler = await DefaultScheduler({ enableFuzz: false })`. `review(stored, cardId, right, now)` revives `dueAt` / `lastReviewAt` to `Date`, or makes `newCard({ now, cardId })`; returns `{ due, fsrs }` with dates as ISO strings.
- `apply.ts`: `initialState()`, `apply(state, input, now)` per SPEC; copies only the touched entry.
- `index.ts`: re-exports `apply`, `initialState` and the types; nothing from `fsrs.ts`.
- Test first: `src/lib/study/fixtures/bai1.ts` (SPEC fixture table, built with `#lib/study/index.js` only) and `src/lib/study/study.test.ts` → `describe('apply')`: "one Attempt schedules only its own skill's card" (SPEC [AC1] lines), the `skill: 'the'` negative control, "a drill Attempt changes nothing".
- Verify: `pnpm vitest run src/lib/study` → the AC1 tests pass; the AC1 test fails if `apply` re-reviews every card of the word (negative control: temporarily loop over all skills, see it fail, revert).

## Task 2 [AC2] Right beats wrong
File: `src/lib/study/study.test.ts`
- Test: "remembering pushes the card further than forgetting" (SPEC [AC2]); assert the two exact dues and `due(好) − T ≤ 86_400_000`.
- Verify: `pnpm vitest run src/lib/study -t "further"` → pass.

## Task 3 [AC3] Three skills, three cards
File: `src/lib/study/study.test.ts`
- Test: "same word, three skills, three cards" (SPEC [AC3]); `new Set(events.map(e => e.skill))` has size 3; each card's `due` equals its event's `due`.
- Verify: `pnpm vitest run src/lib/study -t "three cards"` → pass.

## Task 4 [AC7] Tests reach Study only through `#lib/study/index.js`
File: `eslint.config.js:37-41` (new object after the last one)
- Change: `files: ['src/lib/study/**/*.test.ts', 'src/lib/study/fixtures/**']`, rule `no-restricted-imports` with patterns: group `['ts-fsrs', 'ts-fsrs/*']`; regex `^\.{1,2}/(?!fixtures/)`; regex `^#lib/study/(?!index\.js$|fixtures/)`; message "Study tests use #lib/study/index.js only (CHY-19 AC7)". SvelteKit 3 removed `$lib` (3.1.0 installed) (node_modules/@sveltejs/kit/src/messages/build-errors.js:521); imports are `#lib/<path>.js` (package.json `imports`, e.g. src/hooks.server.ts:6).
- Verify: `pnpm lint` → exit 0. Negative controls (SPEC [AC7]): the `ts-fsrs` import and the `./fsrs` import each → exit 1 naming `no-restricted-imports`; revert. If ESLint 10 rejects `regex` in `patterns`, use `group` globs `['./*', '../*', '!./fixtures/*', '!../fixtures/*', '#lib/study/*', '!#lib/study/index.js', '!#lib/study/fixtures/*']` and rerun both controls.

## Task 5 [NFR] JSON-safe and pure
File: `src/lib/study/study.test.ts`
- Tests: "state survives JSON" and "apply does not mutate its input" (SPEC [NFR]).
- Verify: `pnpm vitest run src/lib/study` → all pass.

## Task 6 [CHORE] Gates
- Verify on the final tree: `pnpm check` (top-level `await` in `fsrs.ts` must type-check), `pnpm lint`, `pnpm test`, `pnpm build` → all exit 0; coverage thresholds (vite.config.ts:48) still met. In the Vercel build log of the PR preview, the install step shows no engine error for ts-fsrs (WAVE-PLAN P3).

## Mutation paths covered
- create: first Attempt on a word (Task 1, AC3's 你 · nghe). update: Attempt on an existing card (AC1, AC2). no-op: drill Attempt and `correct: null` (Task 1). Replay: JSON round trip (Task 5). There is no delete path: Attempts are append-only.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/study/fsrs.ts
import { DefaultScheduler, Rating } from 'ts-fsrs';
const scheduler = await DefaultScheduler({ enableFuzz: false });
type Stored = Record<string, unknown>;
const date = (v: unknown) => (v == null ? null : new Date(v as string));
export function review(stored: Stored | undefined, cardId: string, right: boolean, now: Date) {
	const card = stored
		? ({ ...stored, dueAt: date(stored.dueAt), lastReviewAt: date(stored.lastReviewAt) } as never)
		: scheduler.newCard({ now, cardId });
	const next = scheduler.review({ card, grade: right ? Rating.Good : Rating.Again, now }).card;
	const fsrs = JSON.parse(JSON.stringify(next)) as Stored;
	return { due: fsrs.dueAt as string, fsrs };
}

// src/lib/study/apply.ts
export const initialState = (): State => ({ lexicon: {} });
export function apply(state: State, input: Attempt, now: Date): { state: State; events: StudyEvent[] } {
	if (!input.card || input.correct === null) return { state, events: [] };
	const { word, skill } = input.card;
	const entry = state.lexicon[word] ?? { cards: {} };
	const card = review(entry.cards[skill]?.fsrs, `${word}:${skill}`, input.correct, now);
	const lexicon = { ...state.lexicon, [word]: { ...entry, cards: { ...entry.cards, [skill]: card } } };
	return { state: { ...state, lexicon }, events: [{ type: 'CardScheduled', word, skill, due: card.due }] };
}
```
If a fixture value in SPEC does not come out of this code, report it to the lead; do not edit the expected value to make the test pass.

## Rollback
`git revert` of the slice commits; no migration, no data.
