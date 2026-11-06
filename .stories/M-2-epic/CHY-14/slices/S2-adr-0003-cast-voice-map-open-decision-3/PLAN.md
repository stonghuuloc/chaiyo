# CHY-14 S2 — plan
ACs: AC4, AC5  ·  Spec rev 3  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-14 (after S1 is merged, and after CHY-12 S2 frees `content/**`)

## Anchors (verified 2026-11-06 on main 23f1db9)
- `docs/adr/0002-lesson-content-as-static-bundles.md:1-3` — title line `# 0002 — …`, `Status: accepted (2026-11-01)`; sections `## Context`, `## Decision`, `## Consequences`.
- `docs/architecture.md:18` — map box `│  VoiceStudio → R2    │`.
- `docs/architecture.md:28` — Audio Renderer row: "VoiceStudio calls … **TTS**: VoiceStudio now; Azure TTS is the fallback if the spike fails."
- `docs/architecture.md:44` — decision 5: "TTS stays a direct call until the VoiceStudio spike decides whether Azure TTS is needed."
- `docs/content-schema.md:370-372` — decisions 1 and 2 (struck-through + **Decided**), decision 3 open.
- `docs/content-schema.md:42` — `cast.yaml  Cast members + fixed voice ids` (stays true, untouched).
- `content/cast.yaml:1` — `[]`.
- `src/lib/content/content.test.ts:9` — `skipped = ['cast.yaml', …]`: the content test never parses it.
- `src/lib/content/lint/types.ts:46-48` — lint's own Cast list; lint never reads cast.yaml.
- `src/lib/content/import/audio.ts:49` — manifest voice = `speaker ?? 'narrator'`, the keys of `voices`.

## Task 1 [AC4] ADR 0003
File: `docs/adr/0003-tts-engine.md` (new)
- Context: the 30-item test set (link `spike/sentences.yaml`), the two engines (Q1's engine named), blind A/B with a shared encode (S1 SPEC).
- Decision: winner from `results.json`; tally line pasted from `pnpm -s tts:spike tally spike/results.json`; for #28-#29 each engine's `control` (inputs.json) and Loc's `said` engines.
- Licence table: re-read each spiked engine's licence on the day (OmniVoice card, Fun-CosyVoice3-0.5B-2512 card, IndexTTS LICENSE; Azure: Microsoft Product Terms for Azure AI Speech); row per engine with licence name, commercial use yes/no, link, date read.
- Voice map: three rows `redpanda (ticket: Hachiware)`, `takin (ticket: Momonga)`, `narrator`, ids from `spike/sentences.yaml` `voices.<winner>`; restore column (Azure: voice name only; VoiceStudio: engine + saved profile + where its export is kept).
- Consequences: where the renderer runs (Azure: anywhere with the key, CI included; VoiceStudio: Loc's Mac only), and that architecture.md:44 adds no second adapter.
- Verify: SPEC AC4 tally compare; links return 200.

## Task 2 [CHORE] architecture.md, 3 lines
File: `docs/architecture.md:18`, `:28`, `:44`
- :18 box text → `<winner> → R2` padded to the same box width (keep the `│` columns aligned).
- :28 Hidden column `VoiceStudio calls` → `<winner> calls`; Seam column → `**TTS**: <winner> (ADR 0003). One adapter.`
- :44 → replace only its last sentence ("TTS stays a direct call until the VoiceStudio spike decides whether Azure TTS is needed.") with `TTS is a direct call to <winner> (docs/adr/0003-tts-engine.md); no second adapter.` The head "5. **Seams only where two adapters exist today.** Sink, Source, Store, Scorer, Channel qualify." stays.
- Verify: `git diff --unified=0 origin/main -- docs/architecture.md | rg '^@@'` shows hunks at 18, 28, 44 only; `sed -n 44p docs/architecture.md` still starts with the decision 5 head.

## Task 3 [AC5] content-schema.md:372
File: `docs/content-schema.md:372`
- Replace the line with the SPEC AC5 wording, the Markdown link `[ADR 0003](adr/0003-tts-engine.md)` and the three ids, in the style of :370-371.
- Verify: SPEC AC5 `rg` checks.

## Task 4 [AC5] content/cast.yaml
File: `content/cast.yaml:1`
- Replace `[]` with:
  ```yaml
  # Provider voice per manifest voice (docs/adr/0003-tts-engine.md). The Audio Renderer reads it; lint does not.
  engine: <azure | voicestudio:<engine>>
  voices:
    redpanda: <id>
    takin: <id>
    narrator: <id>
  ```
- Before: `pnpm -s lint:content > ~/.capy/work/chy14-before.txt; echo $?`. After: same into `after.txt`; `wc -l` and exit code equal.
- Verify: `pnpm test` green; the SPEC voice-map one-liner exits 0, and 1 on the negative-control copy.

## Task 5 [CHORE] Final tree
- `pnpm check && pnpm lint && pnpm test` on the final head; record each result in the READY report.

## Mutation paths covered
- Loc re-listens and changes the winner before S2 merges → Tasks 1-4 read one source (`results.json` + `voices.<winner>`), so a re-run of the compare catches any stale id.

## Draft code (UNEXECUTED — the tester's voice-map compare, `scripts`-free)
```js
// node --input-type=module -e "$(cat this)" [cast.yaml path]; with -e, argv[1] is the first argument; yaml is a devDependency
import YAML from 'yaml';
import { readFileSync as r } from 'node:fs';
const cast = YAML.parse(r(process.argv[1] ?? 'content/cast.yaml', 'utf8')).voices;
const winner = JSON.parse(r('spike/results.json', 'utf8')).winner;
const spiked = YAML.parse(r('spike/sentences.yaml', 'utf8')).voices[winner];
const adr = r('docs/adr/0003-tts-engine.md', 'utf8').split('\n');
let bad = 0;
for (const v of ['redpanda', 'takin', 'narrator']) {
	if (cast[v] !== spiked[v]) (console.log(`${v}: cast.yaml ≠ sentences.yaml`), (bad = 1));
	if (!adr.some((l) => l.startsWith('|') && l.includes(v) && l.includes(cast[v])))
		(console.log(`${v}: cast.yaml ≠ ADR`), (bad = 1));
}
process.exit(bad);
```

## Rollback
`git revert` of the S2 commits; `content/cast.yaml` returns to `[]`, which nothing reads.
