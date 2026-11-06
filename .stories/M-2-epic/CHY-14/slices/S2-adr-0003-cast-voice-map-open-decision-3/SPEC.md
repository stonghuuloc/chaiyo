# CHY-14 S2 — spec
ACs: AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 3 (vs main 23f1db9; advisor r1 + r2 applied)  ·  input: S1's `spike/results.json`, `spike/sentences.yaml`, `spike/*/inputs.json`

## Behaviour
- [AC4] `docs/adr/0003-tts-engine.md` exists with `Status: accepted (<date>)` and sections Context, Decision, Consequences, like docs/adr/0002-lesson-content-as-static-bundles.md.
- [AC4] Decision names one engine, the one in `results.json` `winner`: `Azure TTS`, or `VoiceStudio (<engine>)` with the Q1 engine.
- [AC4] It quotes the tally exactly as `pnpm -s tts:spike tally spike/results.json` prints it (`voicestudio V · azure Z · winner <engine>`, V + Z = 30) and links `spike/results.json`.
- [AC4] A licence table has one row per engine in the spike: weights licence name, "commercial use: yes" or "no", link to the licence text, date read. Azure row: licence = Microsoft Product Terms (Azure AI Speech), commercial use of the output audio: yes or no as read on the day, weights: not shipped (hosted service).
- [AC4] A voice map table has exactly three rows, `redpanda (ticket: Hachiware)`, `takin (ticket: Momonga)`, `narrator`, each with one voice id of the winner, equal to `spike/sentences.yaml` `voices.<winner>.<voice>`, plus how to restore that voice on a new machine.
- [AC4] It records, for items #28-#29 (forced reading), each engine's `control` from `spike/<engine>/inputs.json` and Loc's `said` engines from `results.json`, since CHY-15 needs forced readings for split Words.
- [CHORE] `docs/architecture.md` :18 (map box), :28 (Audio Renderer row) and the last sentence of :44 (decision 5) name the winner and cite ADR 0003; no other line or sentence changes.
- [AC5] `docs/content-schema.md:372` becomes `3. ~~Cast voice per member (and gender) waits on the VoiceStudio spike.~~ **Decided <date>:** [ADR 0003](adr/0003-tts-engine.md): redpanda <id>, takin <id>, narrator <id>.` (a Markdown link, as AC5 asks) Decisions 1, 2 and 4 are unchanged.
- [AC5] `content/cast.yaml` = `{ engine, voices: { redpanda, takin, narrator } }` with the ADR's ids; no other file under `content/` changes.
- [CHORE] `pnpm test`, `pnpm check` and `pnpm lint` stay green; `pnpm -s lint:content` prints the same error count before and after.

## Not this slice
- AC1-AC3 (test set, renders, sheet) → S1. The renderer reading `cast.yaml` and a Zod schema for it → CHY-15.

## Seam
Docs only: `docs/adr/0003-tts-engine.md` (new), `docs/architecture.md` (3 lines), `docs/content-schema.md:372`, `content/cast.yaml`.

## Test contract (tester, on the merged S1 tree)
- [AC4] The ADR's tally line equals the stdout of `pnpm -s tts:spike tally spike/results.json` (string compare).
- [AC4] Voice-map compare: a `node -e` one-liner loads `content/cast.yaml`, `spike/sentences.yaml` and the ADR table; the three ids are equal in all three, exit 0. Negative control: change `takin` in a temp copy of cast.yaml and pass its path → stdout includes `takin: cast.yaml ≠ ADR`, exit 1.
- [AC4] The licence table has a row per spiked engine with "yes" or "no" and a working link (`curl -sIL -o /dev/null -w '%{http_code}' <url>` → 200).
- [CHORE] `git diff origin/main -- docs/architecture.md` touches only lines 18, 28 and 44; :44 still starts "5. **Seams only where two adapters exist today.** Sink, Source, Store, Scorer, Channel qualify."
- [AC5] `rg -n '0003-tts-engine' docs/content-schema.md` → line 372; `rg -c 'waits on the VoiceStudio spike' docs/content-schema.md` counts only the struck-through copy.
- [CHORE] `pnpm test` green (content.test.ts:9 skips cast.yaml); `pnpm -s lint:content` error count unchanged (it does not read cast.yaml).

## Open assumptions
- [AC4] If Loc's tally is close (e.g. 16 vs 14) and he names the engine with fewer picks, the ADR records both: the tally as measured and his reason. The AC asks for "the tally" and "the winner", not for the winner to have more picks.
