# CHY-35 S1 — picture
ACs: AC2, AC6 · Spec rev 2 · Sub-task — (chaiyo uses backlog, no Jira) · Base d090b0a0

## What this slice is about

A reusable writing pad for one character. The learner sees a stroke counter, writes with a thick pen, gets three tools (example, hint, redo), sees the radical in red, and gets a clear message when the stroke data cannot load. The section around it (rounds, results, skip) is S2; the word card that only plays the animation is CHY-32.S1.

| | |
|---|---|
| Repo | `chaiyo` · branch `stonghuuloc/CHY-35-S1` · wave 1, no deps |
| Lands | `hanzi-writer` dep, `hanzi-strokes.ts`, `HanziStrokes.svelte`, 5 `strokes_*` messages, `/dev/strokes` proof page |
| Does not land | rounds / Attempts / skip / done list (S2), word-card wiring (CHY-32.S1) |

## **AC2** — verbatim

> Scenario: Stroke feedback and tools
> Given I am writing 你
> Then the stroke counter reads "nét 0/7" and rises with every correct stroke
> And "Xem mẫu" animates the character, "Gợi ý" highlights the next stroke and "Viết lại" restarts the round
> And the radical is red (patched in for characters whose Hanzi Writer data has no `radStrokes`, e.g. 再 见 气) and the pen width is 48

## **AC6** — verbatim

> Scenario: Stroke data cannot load
> Given there is no network for the stroke data
> Then I see "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại."

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.svg"><svg viewBox="0 0 640 255" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Expected result: counter, tools, and the offline message" style="display:block;width:100%;height:auto;font-family:sans-serif"><rect width="640" height="255" rx="8" fill="#1b1714"/><defs><marker id="m1-expected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#948a7e"/></marker></defs><rect x="10" y="15" width="140" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="80.0" y="36.0" text-anchor="middle" font-size="12" fill="#f3ede2">Learner opens 你</text><text x="80.0" y="52.0" text-anchor="middle" font-size="11" fill="#b9ad9e">writing pad</text><line x1="150" y1="40" x2="180" y2="40" stroke="#948a7e" marker-end="url(#m1-expected)"/><rect x="180" y="15" width="140" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="250.0" y="36.0" text-anchor="middle" font-size="12" fill="#f3ede2">“nét 0/7”</text><text x="250.0" y="52.0" text-anchor="middle" font-size="11" fill="#b9ad9e">faint outline</text><line x1="320" y1="40" x2="350" y2="40" stroke="#948a7e" marker-end="url(#m1-expected)"/><rect x="350" y="15" width="130" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="415.0" y="36.0" text-anchor="middle" font-size="12" fill="#f3ede2">draws stroke 1</text><text x="415.0" y="52.0" text-anchor="middle" font-size="11" fill="#b9ad9e">pen width 48</text><line x1="480" y1="40" x2="500" y2="40" stroke="#948a7e" marker-end="url(#m1-expected)"/><rect x="500" y="15" width="130" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="565.0" y="36.0" text-anchor="middle" font-size="12" fill="#f3ede2">“nét 1/7”</text><text x="565.0" y="52.0" text-anchor="middle" font-size="11" fill="#b9ad9e">… “nét 7/7” done</text><line x1="250" y1="65" x2="250" y2="95" stroke="#948a7e" marker-end="url(#m1-expected)"/><rect x="10" y="95" width="190" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="105.0" y="116.0" text-anchor="middle" font-size="12" fill="#f3ede2">Xem mẫu</text><text x="105.0" y="132.0" text-anchor="middle" font-size="11" fill="#b9ad9e">animates, back to 0/7</text><rect x="215" y="95" width="190" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="310.0" y="116.0" text-anchor="middle" font-size="12" fill="#f3ede2">Gợi ý</text><text x="310.0" y="132.0" text-anchor="middle" font-size="11" fill="#b9ad9e">highlights next stroke</text><rect x="420" y="95" width="210" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="525.0" y="116.0" text-anchor="middle" font-size="12" fill="#f3ede2">Viết lại</text><text x="525.0" y="132.0" text-anchor="middle" font-size="11" fill="#b9ad9e">clears, back to 0/7</text><rect x="10" y="170" width="140" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="80.0" y="191.0" text-anchor="middle" font-size="12" fill="#f3ede2">No network for</text><text x="80.0" y="207.0" text-anchor="middle" font-size="11" fill="#b9ad9e">stroke data</text><line x1="150" y1="195" x2="180" y2="195" stroke="#948a7e" marker-end="url(#m1-expected)"/><rect x="180" y="170" width="450" height="50" rx="6" fill="#3a2a12" stroke="#d9a441"/><text x="405.0" y="191.0" text-anchor="middle" font-size="12" fill="#f3ede2">“Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại.”</text><text x="405.0" y="207.0" text-anchor="middle" font-size="11" fill="#f3ede2">tools disabled</text><text x="320" y="245" text-anchor="middle" font-size="10" fill="#b9ad9e">red = radical strokes (再: 2 · 见/气: all 4 · 你: its own 2)</text></svg></figure>

*Notice: every red box is a thing the learner sees change; the amber row is the only failure the AC decides.*

## Requirement [AC2] [AC6]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.svg"><svg viewBox="0 0 640 212" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Requirement: pad loads strokes or says check network" style="display:block;width:100%;height:auto;font-family:sans-serif"><rect width="640" height="212" rx="8" fill="#1b1714"/><defs><marker id="m2-requirement" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#948a7e"/></marker></defs><rect x="10" y="20" width="130" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="75.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">Learner</text><text x="75.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">opens a character</text><line x1="140" y1="45" x2="170" y2="45" stroke="#948a7e" marker-end="url(#m2-requirement)"/><rect x="170" y="20" width="140" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="240.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">Stroke data</text><text x="240.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">from the internet</text><line x1="310" y1="45" x2="350" y2="45" stroke="#948a7e" marker-end="url(#m2-requirement)"/><text x="330" y="14" text-anchor="middle" font-size="10" fill="#b9ad9e">arrives</text><rect x="350" y="20" width="280" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="490.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">Pad ready: counter 0/N,</text><text x="490.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">radical red, pen 48</text><line x1="240" y1="70" x2="240" y2="120" stroke="#948a7e" marker-end="url(#m2-requirement)"/><text x="248" y="100" font-size="10" fill="#b9ad9e">missing</text><rect x="150" y="120" width="180" height="50" rx="6" fill="#3a2a12" stroke="#d9a441"/><text x="240.0" y="141.0" text-anchor="middle" font-size="12" fill="#f3ede2">Message: check network</text><text x="240.0" y="157.0" text-anchor="middle" font-size="11" fill="#f3ede2">and try again</text><line x1="490" y1="70" x2="490" y2="120" stroke="#948a7e" marker-end="url(#m2-requirement)"/><rect x="350" y="120" width="280" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="490.0" y="141.0" text-anchor="middle" font-size="12" fill="#f3ede2">Each right stroke: +1</text><text x="490.0" y="157.0" text-anchor="middle" font-size="11" fill="#b9ad9e">Tools: example · hint · redo</text><text x="320" y="200" text-anchor="middle" font-size="10" fill="#b9ad9e">Rounds, results, skip and done list are the section (S2), not this pad</text></svg></figure>

*Notice: one fork — the stroke data arrives or it does not; everything else is the pad.*

## Solution [AC2] [AC6]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.svg"><svg viewBox="0 0 640 258" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Solution: CDN to loader to hanzi-writer to HanziStrokes" style="display:block;width:100%;height:auto;font-family:sans-serif"><rect width="640" height="258" rx="8" fill="#1b1714"/><defs><marker id="m3-solution" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#948a7e"/></marker></defs><rect x="10" y="20" width="190" height="50" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="105.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">jsDelivr CDN</text><text x="105.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">hanzi-writer-data@2.0.1/&lt;c&gt;.json</text><line x1="200" y1="45" x2="230" y2="45" stroke="#948a7e" marker-end="url(#m3-solution)"/><text x="215" y="14" text-anchor="middle" font-size="10" fill="#b9ad9e">fetch</text><rect x="230" y="20" width="190" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="325.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">hanzi-strokes.ts (new)</text><text x="325.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">loadStrokes + withRadicals</text><line x1="420" y1="45" x2="450" y2="45" stroke="#948a7e" marker-end="url(#m3-solution)"/><rect x="450" y="20" width="180" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="540.0" y="41.0" text-anchor="middle" font-size="12" fill="#f3ede2">hanzi-writer 3.7.3</text><text x="540.0" y="57.0" text-anchor="middle" font-size="11" fill="#b9ad9e">new dependency (MIT)</text><line x1="540" y1="70" x2="540" y2="100" stroke="#948a7e" marker-end="url(#m3-solution)"/><rect x="330" y="100" width="300" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="480.0" y="121.0" text-anchor="middle" font-size="12" fill="#f3ede2">HanziStrokes.svelte (new)</text><text x="480.0" y="137.0" text-anchor="middle" font-size="11" fill="#b9ad9e">animate | quiz · counter · 3 tools · error</text><rect x="10" y="100" width="290" height="50" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="155.0" y="121.0" text-anchor="middle" font-size="12" fill="#f3ede2">messages/vi.json (changed)</text><text x="155.0" y="137.0" text-anchor="middle" font-size="11" fill="#b9ad9e">strokes_* copy, after screen_word</text><line x1="300" y1="125" x2="330" y2="125" stroke="#948a7e" marker-end="url(#m3-solution)"/><line x1="400" y1="150" x2="400" y2="180" stroke="#948a7e" marker-end="url(#m3-solution)"/><line x1="480" y1="150" x2="480" y2="180" stroke="#948a7e" stroke-dasharray="4 3" marker-end="url(#m3-solution)"/><line x1="580" y1="150" x2="580" y2="180" stroke="#948a7e" stroke-dasharray="4 3" marker-end="url(#m3-solution)"/><rect x="330" y="180" width="120" height="46" rx="6" fill="#3a1f1a" stroke="#e8604c"/><text x="390.0" y="199.0" text-anchor="middle" font-size="12" fill="#f3ede2">/dev/strokes</text><text x="390.0" y="215.0" text-anchor="middle" font-size="11" fill="#b9ad9e">proof page (new)</text><rect x="455" y="180" width="85" height="46" rx="6" fill="#1b1714" stroke="#6f665c" stroke-dasharray="4 3"/><text x="497.5" y="199.0" text-anchor="middle" font-size="12" fill="#b9ad9e">S2 writing</text><text x="497.5" y="215.0" text-anchor="middle" font-size="11" fill="#b9ad9e">wave 4</text><rect x="545" y="180" width="85" height="46" rx="6" fill="#1b1714" stroke="#6f665c" stroke-dasharray="4 3"/><text x="587.5" y="199.0" text-anchor="middle" font-size="12" fill="#b9ad9e">CHY-32.S1</text><text x="587.5" y="215.0" text-anchor="middle" font-size="11" fill="#b9ad9e">word card</text><rect x="10" y="180" width="290" height="46" rx="6" fill="#2b241f" stroke="#948a7e"/><text x="155.0" y="199.0" text-anchor="middle" font-size="12" fill="#f3ede2">service worker index.ts:42 (unchanged)</text><text x="155.0" y="215.0" text-anchor="middle" font-size="11" fill="#b9ad9e">cross-origin passes through → offline fails</text><text x="320" y="248" text-anchor="middle" font-size="10" fill="#b9ad9e">red border = new/changed in S1 · dashed = consumers in later waves · grey = unchanged</text></svg></figure>

*Notice: the loader fetches the same CDN URL Hanzi Writer's own loader uses, so Q3 = A holds; the two dashed consumers build on the seam in later waves.*

## Seam (what wave 2+ builds against)

| Piece | Contract | Used by |
|---|---|---|
| `HanziStrokes.svelte` props | `char`, `mode: 'animate' \| 'quiz'`, `outline?`, `load?`, `onprogress?({done,total,mistakes})`, `oncomplete?({mistakes})`, `onerror?()` | S2 rounds, CHY-32.S1 |
| `HanziStrokes.svelte` export | `play(): Promise<void>` via `bind:this` | CHY-32.S1 (tap replays), Xem mẫu |
| `outline` flip | show/hide outline + restart quiz, no re-fetch | S2 round 1 → 2 |
| `hanzi-strokes.ts` | `loadStrokes`, `withRadicals`, `writerOptions`, `STROKE_DATA`, `PEN_WIDTH`, `RADICALS` | tests, `/dev/strokes` |

Full signatures: `SPEC.md` → Seam.

## Settled

| Decision | Why / source |
|---|---|
| Stroke data from the CDN, offline → AC6 copy | Q3 = A, locked (`DISCUSSION.md` L1) |
| Own loader on the same URL `hanzi-writer-data@2.0.1` | default loader is not exported and cannot patch `radStrokes` (tarball `dist/index.esm.js` L2193-2224) |
| Patch only 再 见 气 | the only Bài 1 chars without `radStrokes` (script over `h1-01.yaml` + data tarball) |
| `hanzi-writer` 3.7.3, MIT, 0 deps, in `dependencies` | `npm view`; CI `pnpm audit --prod` (`.github/workflows/ci.yml:86`) covers it |
| Colours live in `.ts`, equal to tokens | guard bans literals in `.svelte`/`.css` (`src/lib/styles/guard.test.ts:7`); test compares `tokens.css:10,19,23` |
| Error text shows in both modes, pad stays mounted | AC6; advisor r1 #1 (rebuild after error needs the pad) |
| Proof page `/dev/strokes`, gated like `/dev/audio` | S2's route lands in wave 4; `src/routes/dev/audio/+page.server.ts:7-11` |

## Carried elsewhere

| Item | Home |
|---|---|
| radStrokes for 12 chars of h1-02…h1-05 | parked → `PARKED.md` |
| Arphic Public License credit in About | parked → `PARKED.md` |
| Hint after 2 misses in round 1 (prototype) | parked → `PARKED.md` (S2 / AC1 territory) |
| Pad resize, word-card idle look | parked → `PARKED.md` |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Add `hanzi-writer@^3.7.3` | CHORE | `package.json:70` | `pnpm audit --prod --audit-level=high`, `pnpm check` |
| 2 | Pure loader, radical patch, writer options | AC2 AC6 | pattern `talking-cast.ts:1` | `hanzi-strokes.test.ts` (11 cases: patch, URL, reject, 404, pen 48, colours = tokens) |
| 3 | 5 `strokes_*` messages after `screen_word` | AC2 AC6 | `messages/vi.json:13` | AC6 copy exact-match test |
| 4 | `HanziStrokes.svelte`: build + outline effects, `gen` guards, 3 layers, tools, `play()` | AC2 AC6 | pattern `TalkingCast.svelte:17` | SSR render: tools + `nét 0/–` in quiz, none in animate |
| 5 | `/dev/strokes` proof page | AC2 AC6 | `dev/audio/+page.server.ts:7` | used by 6 |
| 6 | agent-browser proof: 0/7 → 1/7, miss, 7/7 complete once, tools, outline flip, red radical paths, stroke-width 48, CDN aborted → AC6 copy, recover on char change | AC2 AC6 | `/dev/strokes` | screenshots → VERIFY.md |
| 7 | Full CI chain raw | CHORE | `vite.config.ts:48` | lint · check · test · build · audit |

Mutation paths: char change and mode change rebuild; outline flip toggles; Xem mẫu / Viết lại / load all restart through one `restart()`; three failure paths end in one `onerror`. Rollback: `git revert`, no data.

## Today → after

| | Today (d090b0a0) | After S1 |
|---|---|---|
| `hanzi-writer` in app | absent | 3.7.3, lazy chunk |
| Writing pad component | none (prototype only) | `HanziStrokes` animate + quiz |
| 再 radical colour | all ink (data has no `radStrokes`) | 2 strokes red |
| No network | n/a | "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại." |

## Out of frame
- AC1 captions, AC3 result line + Attempt, AC4 skip, AC5 done list, `/lesson/[id]/writing` → CHY-35.S2 (wave 4).
- Word card stroke animation and its offline look → CHY-32.S1 (wave 3).
