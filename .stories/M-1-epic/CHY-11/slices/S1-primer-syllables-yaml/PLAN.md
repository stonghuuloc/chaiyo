# CHY-11 S1 — plan
ACs: AC1, AC2, AC3, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-11 at e5f025e (base 46d0208), rebased onto origin/main f5896d6, then Task 5 · run `pnpm install` first (node_modules absent)

## Files touched
- create `content/lessons/hsk1/h0-00.yaml`
- edit `src/lib/content/primer.test.ts` (add the lintDir describe beside the existing structural tests)
- edit `src/lib/content/schemas.ts` (C6 fields)
- create `src/lib/content/fixtures/sentences.valid.yaml`, `src/lib/content/fixtures/sentences.invalid.yaml`
- edit `src/lib/content/schemas.test.ts`, `src/lib/content/fixtures/primer.valid.yaml`, `src/lib/content/fixtures/question.valid.yaml`, `src/lib/content/fixtures/word.valid.yaml`
- edit `docs/content-schema.md` (Types)
- edit `src/lib/content/content.test.ts` (type by path over all of content/, no count literal)
- edit `content/syllables.yaml` only if the lint finds a missing syllable (expected: no change)
- not committed: scratch converter in `~/.capy/work/chy11-h0-00.mjs`

## Anchors (verified 2026-11-03 on origin/main 9007e33)
- `src/lib/content/schemas.ts:94-100` Prompt union (syllable at :99) · `:102-109` QuestionBase `{ id, tests }` · `:115-` Question union (spread `...QuestionBase`) · `:197-207` PrimerSection · `:209-225` Primer (gate `:224`).
- `docs/content-schema.md:143-148` Prompt · `:150-153` Question head · `:300-307` PrimerSection (`syllables` :304, `pairs` :305) · `:313` Primer lint line.
- `src/lib/content/content.test.ts:8-12` folder→type map · `:29` `toHaveLength(84)` · `:32` it.each.
- `src/lib/content/schemas.test.ts:7-16` case table · `:27-34` invalid fixture asserts `errors[0].path`.
- `src/lib/content/fixtures/primer.valid.yaml` (string chips, `type: tone` drills) and `primer.invalid.yaml` (`kind: lesson` → path `kind`).
- `src/lib/content/parse.ts:16` `parseContent(type, file, text)`.
- `prototype/data/h0-00.js:26-29` HZ · `:32-53` PHRASE · `:56-57` audioKey/label · `:59-65` question builders · `:69-158` sections · `:161-189` POOL · `:192-197` PRIMER.
- C1 on main: `lintDir(dir, opts?: { refs?, only? }): { set, errors, notices }` (`src/lib/content/lint/index.ts:44`). Errors on object chips carry `.say` (`checks/8-references.ts:78`).
- No `rg` on the Mac: use `grep`.

## Task 1 [LOCK] C6 schema fields + fixtures (lands first, own commit)
Files: `schemas.ts:5-18,50,70-79,94-109,197-207,229-231`, `fixtures/primer.valid.yaml`, `fixtures/question.valid.yaml`, `schemas.test.ts`
- CHY-12 fields (CHAA-24, 2026-11-03): `Pos` += `'comp'` (`:5-18`); Word `senses` element (`:50`) += `pos: Pos.optional()`, `rare: z.literal(true).optional()`, `example: Id.optional()`; Sentence (`:70-79`) += `source: z.union([z.literal('ai'), z.string().regex(/^tatoeba:\d+$/)]).optional()`; `export const Sentences = z.array(Sentence)`, added to `schemas` (`:231`, the `schemas` map) and exported as type `Sentences`.
- Test first (`schemas.test.ts`, case table `:7-16` gains `['Sentences', 'sentences', '[0].source']`; plus): `chip object { say, label, hanzi } parses`, `chip with unknown key is rejected`, `section 'dance' is rejected`, `spoken on a vi prompt is rejected`, `ask/why/section accepted on a choice question`, `sense rare: false rejected`, `sense pos 'foo' rejected, 'comp' accepted`, `Sentence source 'tatoeba:abc' rejected`.
- Change: `QuestionBase` += `why: z.string().optional()`, `ask: z.string().optional()`, `section: z.enum([...5]).optional()`; Prompt syllable += `spoken: z.string().optional()`; new `const Chip = z.union([z.string(), z.strictObject({ say: z.string(), label: z.string().optional(), hanzi: z.string().optional() })])`; PrimerSection `syllables: z.array(Chip)`, `pairs: z.array(z.tuple([Chip, Chip])).optional()`. Export Chip type only if a test needs it.
- Fixtures: primer.valid.yaml gets one object chip and one pair; question.valid.yaml gets `why`, `ask`, `section`; word.valid.yaml gets a sense with `pos`, `rare: true`, `example`; sentences.valid.yaml = `- { id: s-w-5670795, hanzi: 她打了他。, pinyin: Tā dǎ le tā., vi: Cô ấy đánh anh ta., source: tatoeba:5670795 }`, sentences.invalid.yaml = the same with `source: tatoeba:abc`. Invalid fixtures unchanged (paths stay `kind`, `answer`).
- Verify: `pnpm vitest --run src/lib/content/schemas.test.ts` and `pnpm check`.

## Task 2 [LOCK] docs/content-schema.md Types
File: `docs/content-schema.md:49,81,82,98,148,152,304,305,313`
- Change: Prompt syllable `spoken?: string` (audio uses `spoken ?? text`); Question gains `why?`, `ask?`, `section?`; PrimerSection `syllables: Chip[]`, `pairs?: [Chip, Chip][]`, `type Chip = string | { say: string; label?: string; hanzi?: string }`; Word `senses` element gains `pos?`, `rare?: true`, `example?`; `pos` union gains `'comp'`; Sentence gains `source?`; Files list notes `content/sentences/*.yaml` = `Sentence[]`; Lint line says entries are read through `say`, pool questions carry `section`.
- Verify: `grep -c "spoken?: string" docs/content-schema.md` → 3 (word spoken, sentence spoken, prompt), `grep -n "type Chip" docs/content-schema.md` → 1 hit.

## Task 3 (DONE) [AC1][AC2][AC3][AC4] Generate content/lessons/hsk1/h0-00.yaml
File: new `content/lessons/hsk1/h0-00.yaml` (scratch converter outside the repo)
- Change: node script imports PRIMER, PHRASE, HZ from `prototype/data/h0-00.js`; maps per SPEC: chip `k=lab` → `{ say: py(k), label: lab }`, phrase key → `{ say: PHRASE[k].py, hanzi: PHRASE[k].hz }`, HZ key → `{ say: py(k), hanzi }`, else plain `py(k)`; questions by kind (below); ids; `why`; `ask` from prompt/`title`-free text with `<span…>` stripped; `section` on pool items from `s`; scene as is. Emit with `yaml` (flow maps for questions, as CHY-7 fixtures), then `pnpm exec prettier --write content/lessons/hsk1/h0-00.yaml`.
- Mapping: `tone` → choice, prompt syllable `py(key)`, options `opts.map(py)`, answer index of `ans`, `tests.tone: true`; `pinyin` → choice, prompt syllable `py(key)`, options as authored, answer index; `spell` → choice, `ask` = prompt text, prompt syllable `py(key)` when `key` else `{ kind: vi, text: <prompt text> }` and no `ask`; `sandhi` → choice, prompt syllable text = PHRASE written py (spoken override only for ni3hao3 → ní hǎo), `ask` = prompt text, `tests.tone: true`.
- Verify: `pnpm vitest --run src/lib/content/primer.test.ts`; eyeball 3 questions per kind against the prototype.

## Task 4 (DONE) [AC1][LOCK] content.test.ts: type by path, no hard-coded count
File: `src/lib/content/content.test.ts:8-12,29`
- Change (C6, Captain): replace the folder map `:8-12` and `toHaveLength(84)` `:29` with a walk of all `.yaml` under `content/`; `typeOf(path, text)`: `words/` Word, `grammar/` GrammarPoint, `chars/` Char, `sentences/` Sentences, `syllables.yaml` Syllables, `lessons/` Primer if the parsed `kind` is `primer` else Lesson; placeholders `cast.yaml`, `levels/`, `mock/` are skipped by name; any other unmapped file is a failing case. Every file still parses with 0 errors; nothing weakened.
- Lands in the Task 1 commit (C6, Captain). Test: `every yaml under content/ has a type and parses`; once Task 3 adds h0-00.yaml it is picked as Primer (a Lesson parse would fail on `kind`).
- Verify: `pnpm vitest --run src/lib/content/content.test.ts` → all files pass, no count literal left (`grep -n 'toHaveLength(8' src/lib/content/content.test.ts` → no hit).

## Task 5 [AC1][AC2][AC3][AC4] primer.test.ts via lintDir
File: edit `src/lib/content/primer.test.ts` (style as `layout.test.ts`: vitest, node fs, `process.cwd()/content`)
- Setup helper: copy h0-00.yaml and syllables.yaml into `mkdtempSync` dir as `lessons/hsk1/h0-00.yaml`, `syllables.yaml`; optional mutator over `YAML.parse`d data; `lintDir(dir, { refs: fixtureRefs }).errors` (avoids loadRefs(), python3 on the vault), with `import { fixtureRefs } from './lint/fixtures/refs'` and `import { lintDir } from './lint'`.
- Tests (names): `AC1 h0-00 parses as Primer and lints with 0 errors`; `AC2 unknown chip (entry replaced by string xyz) errors at sections.finals.cards[0].syllables[0]`; `AC2 unknown pairs entry errors at sections.initials.cards[0].pairs[0][1]`; `AC2 syllables.yaml without row ma errors on exactly the entries with a ma piece (9 paths, 10 errors; set built as `typeof e === 'string' ? p : p + '.say'` over entries with a `ma` piece)`; `AC3 every section has ≥1 drill` and `AC3 empty sandhi drills errors at sections.sandhi.drills`; `AC4 pool is 24, covers 5 sections, ≥ 2×draw`; `AC4 one item dropped per section (19, 5 sections) errors only on count`; `AC4 sandhi items retagged tones (24) errors only on missing sandhi`. Both assert the exact error list.
- CHY-9 S2 is on main (f5896d6); Tasks 1-4 are done.
- Verify: `pnpm vitest --run src/lib/content/primer.test.ts`.
- [AC1] exits 0: copy h0-00.yaml and syllables.yaml into `$T` as `lessons/hsk1/h0-00.yaml` and `syllables.yaml`, run `pnpm -s lint:content $T`, expect exit 0, record in SUMMARY. AC1 is not ticked before that run.

## Task 6 [CHORE] Full run
- `pnpm test` (all green, `requireAssertions` on), `pnpm lint` (prettier on the new YAML and tests), `pnpm check`.

## Mutation paths covered
- Read-only content. The one write path is the one-off conversion; re-running it overwrites h0-00.yaml, so hand edits after generation are reviewed in the diff, not regenerated.
- Strict schema: any key outside C6 in h0-00.yaml fails Task 5's AC1 test, so a converter slip is caught.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```js
const chip = (k) => {
  const [key, label] = k.split('=');
  const hanzi = PHRASE[key]?.hz ?? HZ[key];
  const say = PHRASE[key]?.py ?? py(key);
  return label || hanzi ? { say, ...(label && { label }), ...(hanzi && { hanzi }) } : say;
};
const q = (s, n, x, pool) => ({ id: `q-h0-00-${pool ? 'g-' : ''}${s}-${String(n).padStart(2, '0')}`, type: 'choice', tests: ['tone','sandhi'].includes(x.t) ? { tone: true } : {}, ... });
```
A self-contradictory fixture or a lint path that differs from C1 is reported, not bent around.

## Rollback
git revert of this slice's commits; no migration, no data outside content/ and the schema module.
