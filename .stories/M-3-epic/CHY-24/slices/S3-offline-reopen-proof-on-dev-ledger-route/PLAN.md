# CHY-24 S3 — plan
ACs: AC1  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-24  ·  Lane L3 (WAVE-PLAN)

## Depends on (execution order)
- CHY-24 S2 merged (`supabaseStore`, `syncWhenOnline`).
- CHY-20 S1 merged (sections, `lessons[…].done`, `initialState({ curriculum })`) and CHY-21 S1 merged (`streak.last`, `tz`). Runs in wave F next to CHY-21 S2 (L1), after CHY-21 S1 merges; no shared file (WAVE-PLAN).

## Anchors (verified 2026-11-09 on main 90fbe31)
- `src/routes/dev/audio/+page.server.ts:1-11` — the dev/preview gate to copy.
- `src/routes/dev/audio/+page.svelte:14,27` — `online` state and `<svelte:window ononline onoffline>` pattern.
- `src/service-worker/index.ts:1-2,42-52` — shell precache, network-first fallback for other GETs.
- `src/lib/supabase.ts:4` — the app's Supabase client.
- `content/lessons/hsk1/h1-01.yaml:36` — Bài 1 word ids; `content/lessons/hsk1/h0-00.yaml:12-13` — Primer sections.

## Task 1 [AC1] Route, curriculum, page
Files: `src/routes/dev/ledger/+page.server.ts`, `src/routes/dev/ledger/+page.svelte`, `src/routes/dev/ledger/curriculum.ts`, `src/routes/dev/ledger/finish.ts` (the 10 Attempts as a pure function of `now` and `uuid`) (all new)
- Test first: `src/routes/dev/ledger/ledger-page.test.ts` (SPEC unit line + 9-Attempt control), driving `finish()` and `openLedger` with `fake-indexeddb` and `memoryStore`.
- Verify: `pnpm vitest run src/routes/dev/ledger` → pass; `pnpm dev`, open `/dev/ledger`, click → the three lines change.

## Task 2 [AC1] Preview + offline proof (tester)
- Run: deploy the head as in CREW.md (git archive export, `npx vercel deploy --target=preview`), `npx vercel curl /dev/ledger --deployment <url>` → 200; production URL → 404. Playwright script per SPEC; paste its log into VERIFY.md.
- Hand Loc the iPhone steps (SPEC) through the Captain.

## Task 3 [CHORE] Gates
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Mutation paths covered
- Fresh device, after 10 Attempts, after reopen, offline reload, 9-Attempt run (not done), production (404).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/routes/dev/ledger/finish.ts
export const finish = (now: Date, uuid: () => string): Attempt[] => {
	const run = uuid();
	return DEV_CURRICULUM.lessons[1].words.map((word, i) => ({
		id: uuid(), at: new Date(now.getTime() + i).toISOString(), questionId: `q-h1-01-words-${word}`, contentSha: 'dev',
		card: { word, skill: 'the' }, correct: true, ms: 1000, step: { kind: 'section', lesson: 'h1-01', section: 'words', run, of: 10 }
	}));
};
```

## Rollback
`git revert`; the route is dev/preview-only and stores data only in the browser.
