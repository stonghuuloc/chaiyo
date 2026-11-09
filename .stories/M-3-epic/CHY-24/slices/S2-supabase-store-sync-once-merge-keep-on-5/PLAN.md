# CHY-24 S2 — plan
ACs: AC2, AC5, AC7  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-24  ·  Lane L3 (WAVE-PLAN)

## Depends on (execution order)
- CHY-24 S1 merged (`openLedger`, `memoryStore`, `Store`, migration `20261111000000_ledger.sql`).
- CHY-20 S1 merged: `Attempt.step` exists in `#lib/study/index.js` (the row map reads it). Wave D keeps this order (WAVE-PLAN).
- Local Supabase on the Mac for the `.local` test: CHY-23 S1-S2 and CHY-24 S1 migrations on the branch base.

## Anchors (verified 2026-11-09 on main 90fbe31)
- `src/lib/supabase.ts:1-4` — the app's client (`createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY)`); S3 passes it to `supabaseStore`.
- `supabase/config.toml:10` — API port 56321; `:18` — `max_rows = 1000`; `:214-221` — email sign-up on, confirmations off (password users work locally).
- `.github/workflows/ci.yml:14-16` — CI never talks to Supabase (placeholder URL + key).
- `docs/architecture.md:31` — Ledger row (Task 4).
- postgrest-js `upsert`: `Prefer: resolution=ignore-duplicates`, `on_conflict` param, `columns` = union of row keys (installed `node_modules/.pnpm/@supabase+postgrest-js@2.118.0/node_modules/@supabase/postgrest-js/src/PostgrestQueryBuilder.ts:1390-1407`).

## Task 1 [AC7] supabaseStore.push
File: `src/lib/ledger/supabase.ts` (new)
- Change: `toRow` / `fromRow`; `push` per SPEC; throw `Object.assign(new Error(error.message), { status })` on `error`.
- Test first: `src/lib/ledger/sync.test.ts` "a failed upload keeps the Attempts" (fake fetch).
- Verify: `pnpm vitest run src/lib/ledger -t "failed upload"` → pass. Negative control: ignore `error` in `push` → `pending()` becomes 0 after the 500; revert.

## Task 2 [AC5] supabaseStore.pull + merge
File: `src/lib/ledger/supabase.ts`
- Change: paged `select` per SPEC, both tables; `at` normalised to ISO with milliseconds (PostgREST returns `+00:00`).
- Tests: "another device's Attempts are merged" (memory store), "pull pages" (fake fetch).
- Verify: `pnpm vitest run src/lib/ledger -t "merged|pages"` → pass. Negative control: a single page without `range` → "pull pages" gets 1000; revert.

## Task 3 [AC2] syncWhenOnline
File: `src/lib/ledger/online.ts` (new); `src/lib/ledger/index.ts` exports it and `supabaseStore`
- Test: "back online, sync exactly once" (SPEC).
- Verify: `pnpm vitest run src/lib/ledger -t "exactly once"` → pass.

## Task 4 [CHORE] Local Supabase proof, docs, gates
Files: `src/lib/ledger/supabase.local.test.ts` (new), `docs/architecture.md:31`
- Change: the two `.local` tests (SPEC), skipped without `LEDGER_SUPABASE`; the Ledger row text from SPEC [CHORE].
- Verify: tester runs SPEC's command on the Mac → pass, and pastes the vitest summary (not the env). CI: `pnpm test` shows the file skipped. `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0 on the final tree.

## Mutation paths covered
- push: ok, 500, network error, rows already on the server (ignored). pull: empty, one page, several pages, other learner's rows (RLS hides). Online: initial call, event, stop.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/ledger/supabase.ts
const COLS = 'id, at, question_id, content_sha, word, skill, correct, ms, answer, step';
export function supabaseStore(client: SupabaseClient): Store {
	const fail = (e: { message: string }, status: number) => Object.assign(new Error(e.message), { status });
	async function page<T>(q: (from: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null; status: number }>) {
		const out: T[] = [];
		for (let from = 0; ; from += 1000) {
			const { data, error, status } = await q(from);
			if (error) throw fail(error, status);
			out.push(...(data ?? []));
			if ((data ?? []).length < 1000) return out;
		}
	}
	return {
		async push(inputs) {
			const attempts = inputs.filter((i): i is Attempt => !('kind' in i)).map(toRow);
			const saves = inputs.filter((i): i is WordSaved => 'kind' in i).map((s) => ({ word: s.word, saved_at: s.at }));
			for (const [table, rows, onConflict] of [['attempts', attempts, 'learner_id,id'], ['lexicon_saves', saves, 'learner_id,word']] as const) {
				if (!rows.length) continue;
				const { error, status } = await client.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
				if (error) throw fail(error, status);
			}
		},
		async pull() {
			const a = await page((f) => client.from('attempts').select(COLS).order('at').order('id').range(f, f + 999));
			const s = await page((f) => client.from('lexicon_saves').select('word, saved_at').order('saved_at').order('word').range(f, f + 999));
			return [...a.map(fromRow), ...s.map((r) => ({ kind: 'saved' as const, word: r.word, at: new Date(r.saved_at).toISOString() }))];
		}
	};
}
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; no migration in this slice.
