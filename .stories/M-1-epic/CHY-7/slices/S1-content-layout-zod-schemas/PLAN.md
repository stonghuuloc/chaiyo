# CHY-7 S1 — plan
ACs: AC1, AC2, AC3, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-7 (fast-forwarded to main dd1b4d0 on 2026-11-03) · run `pnpm install` first (node_modules absent)

## Anchors (verified 2026-11-03 on main dd1b4d0)
- `docs/content-schema.md:58` `type Level = 1 | 2 | 3 | 4 | 5;` · `:59` CastId union ending `| string`.
- `:61-72` Char · `:74-86` Word (`:78` spoken?, `:84` `image?: { file; cast: CastId[]; prompt }`, `:85` `taughtIn?` "never authored here") · `:88-97` Sentence (no spoken) · `:99-108` GrammarPoint.
- `:111-129` Lesson; `:120-127` sections (warmup, words, grammar, dialogue, listenSpeak, writing — no reading) · `:128` gate · `:131-136` Prompt · `:138-150` Question union (8 `type`s).
- `:270-286` Primer, `:288-296` PrimerSection · `:40-51` Files · `:301` syllables/pairs must exist in syllables.yaml.
- `content/words/你好.yaml:7` `level: 0` (only level-0 file of 67).
- `package.json:16` `"test": "vitest --run --passWithNoTests"` · `:49` `"yaml": "^2.9.1"` (devDependencies) · no zod · `:51-54` imports `#lib/*` → `./src/lib/*`.
- `vite.config.ts:25-38` vitest project `server`, node env, include `src/**/*.{test,spec}.{js,ts}`, `requireAssertions: true`.
- `src/lib/shell/guard.test.ts:3` test style: `import { describe, expect, it } from 'vitest'`.
- `prototype/data/syllables.js` exports INITIALS, FINALS, SYL, cell (used at `prototype/w3-pinyin.html:70`).
- No `rg` on the Mac: use `grep`.

## Task 1 [AC1] Content layout placeholders + syllables.yaml
Files: new `content/cast.yaml`, `content/levels/hsk1.yaml`, `content/chars/.gitkeep`, `content/mock/hsk1/.gitkeep`, `content/syllables.yaml`
- Test first: `src/lib/content/layout.test.ts` — `content tree has every path from content-schema Files` (8 paths, fs.existsSync from repo root) and `syllables.yaml has 400–420 rows`.
- Change: cast.yaml = `[]`; levels/hsk1.yaml = `level: 1\ntopics: []`; keep files; syllables.yaml generated once from prototype/data/syllables.js (every `cell(i, f)` that returns a syllable → `{ syllable, initial, final }`, zero initial `""`, sorted by initial then final). Commit the generator only if it is ≤30 lines under scripts/; otherwise generate by hand and cite the source in the commit message.
- Verify: `pnpm vitest --run src/lib/content/layout.test.ts`

## Task 2 [AC2] Add zod + schemas module
Files: `package.json` (add `zod` ^4 to dependencies — runtime use by the importer later), new `src/lib/content/schemas.ts`
- Change: one Zod schema per type, all objects `.strict()` (Q4 A). Shapes exactly as doc anchors above, plus: Sentence `spoken: z.string().optional()`; Word `hanviet` optional string, `parts` optional array of strict `{ hanzi, pinyin, hanviet, vi }`; Word image `cast` and `prompt` optional (Q11 A); Word `components` optional array of strict `{ hanzi, name, vi }` (Q12 B); Word has NO `taughtIn` key (authored files must not carry it → strict rejects it); Lesson `goal: z.string()`; sections `reading: { title: z.string(), lines: SentenceId[] }.optional()`; Question = `z.discriminatedUnion('type', [...8])` where each variant is `QuestionBase.extend({ type: z.literal(...), ...variantFields }).strict()` and QuestionBase = `{ id, tests }` — never `z.intersection` (strict base × strict variant rejects everything); Primer likewise built with `.extend` from Lesson pieces; Prompt = discriminated union on `kind`; Syllable row = strict `{ syllable, initial, final }`, syllables file = array of rows. Export `type X = z.infer<typeof X>` for all 8.
- Test first: covered by Task 4 valid fixtures.
- Verify: `pnpm check` (svelte-check / tsc) clean.

## Task 3 [AC3] parseContent with file + path errors
File: new `src/lib/content/parse.ts`
- Change: `parseContent(type, file, text)`: YAML.parse with `yaml` → on YAMLParseError return `{ ok:false, errors:[{ file, path: "", line, col, message }] }`; else `schema.safeParse` → issues mapped to `{ file, path, message }`, path built from `issue.path`: numbers → `[n]`, strings joined by `.` (`sentences[3].hanzi`). Unknown-key issues (`unrecognized_keys`) emit one error per key with path = parent path + key. Never throws.
- Test first: `src/lib/content/parse.test.ts` — `formats nested path as sentences[3].hanzi`, `unknown key collocatons → path collocatons`, `YAML syntax error → file + line`.
- Verify: `pnpm vitest --run src/lib/content/parse.test.ts`

## Task 4 [AC2][AC3][AC4] Fixtures: one valid + one invalid per type
Files: new `src/lib/content/fixtures/{lesson,word,char,sentence,grammar-point,question,primer,syllables}.{valid,invalid}.yaml`, `src/lib/content/schemas.test.ts`
- Change: valid fixtures copied from the doc Example (`:155-265`) where one exists (lesson h1-01 trimmed, word 你好, char 你), hand-written otherwise; each invalid fixture = its valid twin with exactly one wrong-typed field. Expected wrong paths: lesson `level`, word `level`, char `strokes`, sentence `hanzi`, grammar-point `std`, question `answer`, primer `kind`, syllables `[0].initial`.
- Test: `it.each` over the 8 types: valid → ok and deep-equals the parsed YAML; invalid → ok:false, errors[0].file === fixture name, errors[0].path === expected path. 16 cases.
- Verify: `pnpm vitest --run src/lib/content/schemas.test.ts`

## Task 5 [AC2] Real content parses (Q3 B) + 你好 level fix (Q7 B)
Files: `content/words/你好.yaml:7` (`level: 0` → `level: 1`); `content/words/{你,刻,好,您}.yaml` key `parts:` → `components:` (e.g. `你.yaml:10`); `content/lessons/hsk3/h3-01.yaml:26,27,30` `unknown: [ 阿 ]` → `unknown: [ { hanzi: 阿, pinyin: ā, vi: A (tiền tố tên) } ]`; new `src/lib/content/content.test.ts`
- Test first: `every file under content/{words,grammar,lessons} parses with 0 errors` — it.each over the 84 files, type by folder; failing message lists file + path.
- Change: exactly these 3 data fixes (6 files). If any other file fails, STOP and report the file:path list to the Captain (no schema widening, no other data edits).
- Verify: `pnpm vitest --run src/lib/content/content.test.ts` → 84 passed.

## Task 6 [CHORE] Sync docs/content-schema.md Types
File: `docs/content-schema.md` `:78-97`, `:120-127`, `:111-118`, `:49`
- Change: Word + `hanviet?`, `parts?`, `components?`; image `cast?`, `prompt?`; Sentence + `spoken?`; Lesson + `goal: string`; sections + `reading?`; add `interface Syllable { syllable; initial; final }` near `:49`/`:300`.
- Verify: `grep -c "spoken?: string" docs/content-schema.md` → 2; `grep -n "reading?" docs/content-schema.md` → 1 hit.

## Mutation paths covered
- Read-only parse; no writers. Data mutations are the 3 Task 5 fixes (6 files). Strict mode is the one behaviour change every later consumer inherits.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
const fmt = (p: PropertyKey[]) => p.map((k, i) => typeof k === 'number' ? `[${k}]` : (i ? '.' : '') + String(k)).join('');
export function parseContent(type: ContentType, file: string, text: string): ParseResult {
  let data: unknown;
  try { data = YAML.parse(text); } catch (e) { const { line, col } = (e as YAMLParseError).linePos?.[0] ?? {}; return { ok: false, errors: [{ file, path: '', line, col, message: (e as Error).message }] }; }
  const r = schemas[type].safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, errors: r.error.issues.flatMap((i) => i.code === 'unrecognized_keys' ? i.keys.map((k) => ({ file, path: fmt([...i.path, k]), message: 'unknown key' })) : [{ file, path: fmt(i.path), message: i.message }]) };
}
```
A self-contradictory fixture or a doc type that can't be expressed must be reported, not hacked to green.

## Rollback
git revert of this slice's commits; removes zod and the new folders. No migration.
