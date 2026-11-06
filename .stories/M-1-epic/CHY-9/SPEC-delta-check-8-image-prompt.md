# CHY-9 — SPEC delta, check 8: image prompts need a word with an image

Source: [issue #40](https://github.com/stonghuuloc/chaiyo/issues/40), from the CodeRabbit Major on
[PR #29 `discussion_r4465817719`](https://github.com/stonghuuloc/chaiyo/pull/29#discussion_r4465817719),
declined as out of CHY-9 S1 scope. Baseline: main `4112e60`. Docs only; no code in this change.

Issue #40 calls this "a new check 8". Check 8 is already References and check 9 is Audio, and
`LintCheck` already reserves 10 for CHY-8's Derive errors (`src/lib/content/lint/types.ts:3`,
`CHECK_NAMES` at `:32-44`). This delta therefore adds the rule to check 8 as clause **(g)**.
Numbering stays open in Q1.

## Problem (verified on main `4112e60`)

`docs/content-schema.md:150` defines an image prompt as `{ kind: 'image'; ref: string }` with
`// word id → its picture`: the question shows a Word's `image`, so `ref` must name a Word that has
one. Check 8 does not enforce that today.

`src/lib/content/lint/checks/8-references.ts:43-46` treats every non-`vi`, non-`syllable` prompt
alike:

```ts
if ('prompt' in q && q.prompt.kind !== 'vi' && q.prompt.kind !== 'syllable') {
	const { ref } = q.prompt;
	if (!wordIds.has(ref) && !sentenceIds.has(ref))
		add(file, [...base, 'prompt', 'ref'], `Unknown word or sentence id ${ref}`);
}
```

So both of these pass although neither supplies a picture:

- `{ kind: 'image', ref: 's-h1-01-01' }` — a sentence id; a Sentence has no `image`.
- `{ kind: 'image', ref: '你好' }` — a known Word id whose file omits `image` (the field is optional,
  `src/lib/content/schemas.ts:62-68`).

No current `content/` YAML and no lint or import fixture carries a `kind: 'image'` prompt, so there
is nothing to migrate.

## Anchors

| Anchor | What it says |
|---|---|
| `docs/content-schema.md:150` | image prompt `ref` is a word id that supplies its picture |
| `docs/content-schema.md:365` | check 8 References; no image-specific clause |
| `docs/content-schema.md:366` | check 9 Audio |
| `.stories/M-1-epic/CHY-9/slices/S1-9-checks-clean-primer/SPEC.md:13` | check 8(a) accepts a `prompt` hanzi/audio/image `ref` that is a word **or sentence** id |
| `src/lib/content/lint/checks/8-references.ts:43-46` | the word-or-sentence check above |
| `src/lib/content/lint/checks/8-references.ts:36-51` | question walker used by every question location |
| `src/lib/content/schemas.ts:62-68` | `Word.image?: { file: string; cast?: string[]; prompt?: string }` |
| `src/lib/content/schemas.ts:128-183` | only `choice`, `tone`, `typePinyin`, `trueFalse`, `freeAnswer` carry a `prompt` |
| `src/lib/content/lint/fixtures/clean/words/*.yaml` | all 10 clean-fixture words already have `image.file` |
| `src/lib/content/import/scope.ts:14-15` | `scopeFor` already adds a prompt ref's word file when it exists; no change needed |

## Proposed rule — check 8(g)

For every `Question` with `prompt.kind === 'image'`, `prompt.ref` must be the `id` of a Word in the
set **and** that Word must have an `image`. Q2 recommends that `image.file` also be non-empty; this
delta assumes that answer. A Sentence id is never valid for an image prompt (Q3 recommends
confirming it). `hanzi` and `audio` prompts keep today's word-or-sentence rule unchanged.

One error per offending field, at `...prompt.ref`, `check: 8`, `name: 'References'`:

| Cause | Message |
|---|---|
| `ref` is a known Sentence id | `Image prompt ref <ref> is a sentence id, not a word with an image` |
| `ref` is a known Word with no `image` (or an empty `file`) | `Word <ref> has no image` |
| `ref` is neither a Word nor a Sentence id | `Unknown word or sentence id <ref>` (today's message; do not add a second error) |

Control flow (for the later code slice, not this change):

```ts
const word = wordById.get(ref);
if (!word) {
	if (sentenceIds.has(ref)) add(file, [...base, 'prompt', 'ref'], `Image prompt ref ${ref} is a sentence id, not a word with an image`);
	else add(file, [...base, 'prompt', 'ref'], `Unknown word or sentence id ${ref}`);
} else if (!word.image?.file) {
	add(file, [...base, 'prompt', 'ref'], `Word ${ref} has no image`);
}
```

`wordById` replaces the current `wordIds` Set or is built beside it. Every other clause of check 8 is
unchanged.

## What it flags, and what it does not

| Case | Example | Result |
|---|---|---|
| image prompt names a word with an image | `{ kind: 'image', ref: '谢谢' }`, `words/谢谢.yaml` has `image.file` | pass |
| image prompt names a word without an image | `ref: '谢谢'`, no `image:` line | 1 error, check 8 |
| image prompt names a word with `image: { file: '' }` | `file: ''` | 1 error, check 8 (pending Q2) |
| image prompt names a sentence id | `ref: 's-h1-01-01'` | 1 error, check 8 |
| image prompt names an unknown id | `ref: 'xx'` | 1 error, today's `Unknown word or sentence id` |
| hanzi/audio prompt names a sentence id | `{ kind: 'hanzi', ref: 's-h1-01-01' }` | pass (unchanged) |
| hanzi/audio prompt names a word without an image | `{ kind: 'audio', ref: '谢谢' }`, no `image` | pass (unchanged) |
| `vi` / `syllable` prompt | no `ref` | not checked |
| `optionKind: 'image'` choice options | `options: string[]` | not checked (Q4) |
| `scene.prompt`, `Word.image.prompt` | free text for generation | not checked; they are not refs |
| asset existence on disk | `image.file` path missing | not checked; the linter has no asset access |

Question locations already walked by check 8: lesson `sections.grammar.drills`,
`sections.dialogue.questions`, `sections.listenSpeak.items`, `gate.pool`; primer
`sections.<name>.drills`, `gate.pool`. The proposed rule applies in all of them; Q5 asks whether
primers should be an explicit exception (they skip only checks 1–7 and the word-count part of 8).

## Fixtures — described, not committed

The base is `src/lib/content/lint/fixtures/clean` (Bài 1, 0 errors). Each case is one in-test
mutation, as `lint.test.ts` already does. Add these to the check-8 table once the code slice opens.

**Positive**

| # | Mutation | Expected |
|---|---|---|
| P1 | `gate.pool[0].prompt` → `{ kind: 'image', ref: '你' }` (q-h1-01-g01 tests 你; `words/你.yaml` has `image.file`) | 0 errors |
| P2 | `sections.dialogue.questions[0].prompt` → `{ kind: 'image', ref: '你好' }` (q-h1-01-d01 tests 你; `words/你好.yaml` has `image.file`) | 0 errors; proves a dialogue-question location, not just the pool |

**Negative**

| # | Mutation | Expected |
|---|---|---|
| N1 | `gate.pool[0].prompt` → `{ kind: 'image', ref: 's-h1-01-01' }` | exactly 1 error: check 8, path `gate.pool[0].prompt.ref`, message says sentence id is not a word with an image |
| N2 | `gate.pool[0].prompt` → `{ kind: 'image', ref: '你' }` and delete the `image:` line from `words/你.yaml` | exactly 1 error: check 8, path `gate.pool[0].prompt.ref`, message `Word 你 has no image`; no other check fires |
| N3 | `gate.pool[0].prompt` → `{ kind: 'image', ref: 'xx' }` | exactly 1 error: today's `Unknown word or sentence id xx`, no 8(g) error |
| N4 | primer merged from `fixtures/primer`; `sections.tones.drills[0].prompt` → `{ kind: 'image', ref: 's-h1-01-01' }` | exactly 1 error: check 8, path `sections.tones.drills[0].prompt.ref`; proves the clause runs on primers |

**Preserved-behaviour controls**

| # | Mutation | Expected |
|---|---|---|
| C1 | `gate.pool[0].prompt` → `{ kind: 'hanzi', ref: 's-h1-01-01' }` | 0 errors (word-or-sentence rule kept for hanzi) |
| C2 | `gate.pool[0].prompt` → `{ kind: 'audio', ref: '你' }`, delete `image:` from 你 | 0 errors (audio does not need a picture) |

## Open questions for the owner

**Q1 — Numbering.** Extend check 8 (recommended) or create a separately numbered check? Check 8 is
References, 9 Audio, and 10 already means Derive, so a new number forces a renumber of 8/9/10 in
docs, code, tests and `CHECK_NAMES` — a coordinated change, not the local edit this slice asks for.
Recommendation: clause 8(g), no renumber. Impact if changed: a coordinated interface change in
`lint/**` plus the S1/S2 SPECs.

**Q2 — "Has an image" means what?** Just `image` present, or `image.file` non-empty? Recommendation:
non-empty `file` — an empty string supplies no picture. The schema requires `file`, so emptiness is
the only representable gap. Impact: one condition. (Checking the file exists on disk stays out; the
linter does not read assets.)

**Q3 — Can an image prompt ever name a sentence?** Recommendation: no. `docs/content-schema.md:150`
says word id → its picture, and a Sentence has no `image` field. If the owner wants sentence refs
for some future "show the whole line as a picture" mode, that needs a separate field, not this ref.

**Q4 — `optionKind: 'image'` choice options.** `options: string[]` carries no ref contract today.
Recommendation: leave out of 8(g); spec it separately if options ever become word ids.

**Q5 — Primers.** Apply 8(g) to primer drills and gate pool? Recommendation: yes. Check 8 already
walks every Question, and primers skip only checks 1–7 plus the word-count clause; a primer image
prompt is unusual but still needs a picture. Alternative: skip primers explicitly, as a deliberate
exception.

## Affected contract edits when the code lands (not this PR)

- `docs/content-schema.md:365` row 8 fails-when cell: append "an image prompt `ref` is not a word
  with an `image`".
- `.stories/M-1-epic/CHY-9/slices/S1-9-checks-clean-primer/SPEC.md:13` check 8: add clause (g) with
  the rule and the two messages above.
- `.stories/M-1-epic/CHY-9/slices/S1-9-checks-clean-primer/DISCUSSION.md`: log the Q1–Q5 answers.
- `src/lib/content/lint/checks/8-references.ts`: swap `wordIds` for a `wordById` Map and add the
  image branch in `question()`. Tests: P1–P2, N1–N4, C1–C2 above.

## Not this slice

- Implementing the check; `lint/**` is frozen for this docs-only change.
- Schema changes: `Word.image` is already optional and needs no new field.
- Asset-existence validation and `content/` migration; there are no image prompts today.
- `scene.prompt` / `Word.image.prompt` content rules; those are generation text, not references.
