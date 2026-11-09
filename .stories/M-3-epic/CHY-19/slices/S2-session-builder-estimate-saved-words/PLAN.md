# CHY-19 S2 — plan
ACs: AC4, AC5, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-19  ·  Lane L1 (WAVE-PLAN)

## Anchors (verified 2026-11-09 on main 7e52b9f; S1 files are new in S1)
- `prototype/data/lexicon.js:7-10` — seconds per skill (10 / 15 / 35).
- `prototype/data/lexicon.js:47` — "listening needs a recorded clip": no nghe for words that are not taught.
- `prototype/data/lexicon.js:57` — `dueIn`: thẻ từ also takes `new` cards.
- `prototype/data/lexicon.js:60-71` — `session()` round-robin interleave this slice ports.
- `prototype/data/lexicon.js:72` — `minutes = max(1, round(Σ sec / 60))`.
- `docs/architecture.md:30` — Study row (interface column).
- S1: `src/lib/study/apply.ts` `apply()`, `src/lib/study/types.ts`, `src/lib/study/fixtures/bai1.ts`, `src/lib/study/index.ts`.

## Task 1 [AC4] `WordSaved` and the saved flag
Files: `src/lib/study/types.ts`, `src/lib/study/apply.ts`, `src/lib/study/index.ts`
- Change: `WordSaved = { kind: 'saved'; word: string; at: string }`; Lexicon entry `{ saved: boolean; cards }`. `apply(state, input: Attempt | WordSaved, now)`: `'kind' in input` → add `{ saved: true, cards: {} }` if the word is absent, else return `state` unchanged; no event. Card Attempt: new entries get `saved: false`; `skill === 'nghe' && entry?.saved` → `{ state, events: [] }`.
- Test first: `src/lib/study/session.test.ts` "a saved word has no listening card" — the apply half (SPEC [AC4] lines 2-3, with the 你好 negative control).
- Fixture: add the three inputs from SPEC "Fixture additions" to `fixtures/bai1.ts` in time order. Rerun S1's `study.test.ts`: still green (no S1 value depends on 熊猫 or 奶茶).
- Verify: `pnpm vitest run src/lib/study` → pass.

## Task 2 [AC5] `session` and `minutes`
File: `src/lib/study/session.ts` (new); `index.ts` re-exports
- Change: `localDate(d: Date, tz)` = `year-month-day` from `new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)` (YYYY-MM-DD strings compare as dates; not `en-CA` `.format()`, whose output is CLDR data that CLDR 42 changed; CHY-21 S1 moves it to `dates.ts`). Lanes per SPEC; interleave port of lexicon.js:60-71; `minutes` per lexicon.js:72 with `SECONDS = { the: 10, nghe: 15, viet: 35 }`.
- Test first: `session.test.ts` "today's session interleaves skills" — exact list, the neighbour rules, `minutes` = 3; "due cut" at 23:59:59 and 00:00 local (SPEC [AC5]).
- Verify: `pnpm vitest run src/lib/study -t "interleaves"` → pass. Negative control: replace the round-robin with lane concatenation → the neighbour assertion fails; revert.

## Task 3 [AC6] Skill filter
File: `src/lib/study/session.test.ts`
- Test: "single-skill filter" (SPEC [AC6]); plus `only: ['nghe']` and `only: ['the']` lists from the AC4 test.
- Verify: `pnpm vitest run src/lib/study -t "filter"` → pass.

## Task 4 [CHORE] Docs + gates
File: `docs/architecture.md:30`
- Change: in the Study row's interface cell, after the `rollover` signature, add "`session(state, { now, tz, only }) → { word, skill }[]`, `minutes(cards)`; `apply` also takes `WordSaved` (a word saved from the Dictionary)". In the same row's last cell, replace "Tested only through `apply`/`rollover` with Attempt sequences." with "Tested only through its exports (`apply`, `rollover`, `session`, `minutes`) with Attempt and WordSaved sequences." Touch no other row (L3 owns :31 later).
- Verify: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` → exit 0 on the final tree; `git diff --stat main` lists only `src/lib/study/**`, `docs/architecture.md`, plus S1's package.json, pnpm-lock.yaml, eslint.config.js.

## Mutation paths covered
- WordSaved: new word (adds), repeat (no-op), word already taught (no-op). Card Attempt on a saved word: nghe (blocked), the (schedules: the 奶茶 · the line of the AC4 test). Session: due today, overdue, due tomorrow, new (saved, no card).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/study/session.ts
const ORDER: Skill[] = ['the', 'nghe', 'viet'];
const SECONDS: Record<Skill, number> = { the: 10, nghe: 15, viet: 35 };
const localDate = (d: Date, tz: string) => {
	const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
	return `${p.year}-${p.month}-${p.day}`;
};
export function session(state: State, o: { now: Date; tz: string; only?: Skill[] }): SessionCard[] {
	const today = localDate(o.now, o.tz);
	const words = Object.keys(state.lexicon);
	const lanes = ORDER.filter((s) => !o.only || o.only.includes(s)).map((skill) => {
		const due = words
			.filter((w) => { const c = state.lexicon[w].cards[skill]; return c && localDate(new Date(c.due), o.tz) <= today; })
			.sort((a, b) => Date.parse(state.lexicon[a].cards[skill]!.due) - Date.parse(state.lexicon[b].cards[skill]!.due));
		const fresh = skill === 'the' ? words.filter((w) => state.lexicon[w].saved && !state.lexicon[w].cards.the) : [];
		return [...due, ...fresh].map((word) => ({ word, skill }));
	});
	const out: SessionCard[] = [];
	while (lanes.some((l) => l.length)) {
		for (const lane of lanes) {
			if (!lane.length) continue;
			const i = lane.findIndex((c) => c.word !== out.at(-1)?.word);
			out.push(...lane.splice(i < 0 ? 0 : i, 1));
		}
	}
	return out;
}
export const minutes = (cards: SessionCard[]) =>
	Math.max(1, Math.round(cards.reduce((n, c) => n + SECONDS[c.skill], 0) / 60));
```
`Array.prototype.sort` is stable, so ties keep Lexicon order. If the session list in SPEC does not come out, report it to the lead; do not edit the expected list.

## Rollback
`git revert` of the slice commits; no migration, no data.
