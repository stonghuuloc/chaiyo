# CHY-17 S2 — picture
ACs: AC3, AC4 · Spec rev 1 · Issue LOC-55

## What this slice is about
A dev page where you tap a syllable, tap a tone, and hear that clip, plus a "Random 20" test where Loc marks each clip right or wrong by ear. It proves the clips teach tones before the real Pinyin Table exists.

| | |
|---|---|
| Repo | stonghuuloc/chaiyo |
| Lands | a Syllables section on `/dev/audio`, a server module for keys, a seeded picker, vitest for both |
| Does not land | the clips and check (S1), the route and `play` (CHY-16), the real table (CHY-40) |

## **AC3** — verbatim
> *Scenario Outline: A cell plays the right tone*
> * *Given* the Pinyin Table is open
> * *When* I tap the cell "<syllable>" and then the tone button <tone>
> * *Then* the clip played is "<syllable><tone>" in the narrator voice
> * *And* the tone I hear is <contour>
> * ba 1 high and level · ba 2 rising · ba 3 falling then rising · ba 4 falling

## **AC4** — verbatim
> *Scenario: Tap test on 20 random cells*
> * *Given* the Pinyin Table is open
> * *When* I tap 20 randomly chosen syllable × tone cells
> * *Then* every one of the 20 plays a clip
> * *And* Loc confirms by ear that each clip has the tone of the cell

## Expected result
<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">Open /dev/audio, tap cell ba, tap tone 3</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">Hear a falling-then-rising ba; page says Last played: ba3</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">Random 20: tap each play, mark right or wrong</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">Header 20/20 played; line &quot;wrong: none&quot; or the list</text></svg></figure>

*Notice: Loc's ears are the final check; the page only counts plays and records verdicts.*

## Requirement [AC3] [AC4]
<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">Learner picks a syllable and a tone</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">The matching recording plays</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">20 random syllable-tone pairs are drawn</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">Each plays; Loc says whether the tone is right</text></svg></figure>

*Notice: AC3 is one pair; AC4 repeats it 20 times with a verdict.*

## Solution [AC3] [AC4]
<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#3b2a14" stroke="#f0a030" stroke-width="2"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">NEW syllable-cells.server.ts: 405 cells × 4 keys (audioKey, addTone from the importer)</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">CHY-16 route load (guarded, dev only) passes cells to the page</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#3b2a14" stroke="#f0a030" stroke-width="2"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">NEW SyllableGrid.svelte: grid, tone buttons, Random 20 (pickCells, seeded)</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">CHY-16 play(key) fetches R2_PUBLIC_URL/&lt;key&gt;.mp3 (S1 clips)</text></svg></figure>

*Notice: the browser never hashes; the key rule stays in the importer.*

## Settled
| Decision | Why / source |
|---|---|
| AC3 and AC4 proven on `/dev/audio`, not an M-5 screen | Loc Q6 A; DISCUSSION answered-here 1 |
| Proof of "played ba3 narrator" = request URL = key of bǎ | DISCUSSION 2 |
| Server `load` computes keys (Q2 A) | DISCUSSION Q2: 1 copy of the key rule, not 2 |
| Random 20 seeded, seed shown, `?seed=` repeats | DISCUSSION 4 |
| Hard gate: CHY-16 S2 route merged or stacked | SPEC open assumptions |

## Carried elsewhere
| Item | Where |
|---|---|
| Bundle carries cell keys for CHY-37/40 | CHY-8 follow-up request, `PARKED.md` |
| Wave E gate amended to CHY-16 S2 | Captain, WAVE-PLAN |

## Plan
| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Cells + keys on the server | AC3 | `audio.ts:15`, `:29` | `syllable-cells.server.test.ts` |
| 2 | Grid, tone buttons, mount, load guard | AC3 | `+layout.ts:8` | network: 4 keys for ba1-ba4 |
| 3 | Random 20 and picker | AC4 | `vite.config.ts:56` | `syllable-cells.test.ts`, 20/20 plays |
| 4 | Gates | CHORE | `package.json:19` | check, lint, test |
| 5 | Live proof, Loc listens | AC3, AC4 | `SyllableGrid.svelte` | F0 probe + Loc's marks |

Mutation paths: reselect cell, redraw, same seed twice, flip a verdict, ü rows. Rollback: revert; the 2-line mount goes with it.

## Today → after
| | Today | After |
|---|---|---|
| Hear ba3 | no page | tap ba, tap 3 |
| Check 20 random cells | no tool | Random 20 with verdicts |

## Out of frame
- Clips and the `missing:` check → S1. Route and `play` lib → CHY-16. Real Pinyin Table and Primer → CHY-40, CHY-37.
