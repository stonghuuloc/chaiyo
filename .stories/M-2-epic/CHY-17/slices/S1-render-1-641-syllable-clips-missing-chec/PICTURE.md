# CHY-17 S1 — picture
ACs: AC1, AC2 · Spec rev 1 · Issue LOC-55

## What this slice is about
Every Pinyin syllable in each of the 4 tones gets a clip on R2, and a one-command check says which clips are missing. Nobody has to listen to 1,641 files to learn that one is absent.

| | |
|---|---|
| Repo | stonghuuloc/chaiyo |
| Lands | `scripts/check-syllable-clips.ts`, one `package.json` line, and the render run of 1,641 clips on Loc's Mac |
| Does not land | the renderer, bucket, URL (CHY-15); cell playback and the tap test (S2) |

## **AC1** — verbatim
> *Scenario: Every syllable in every tone has a clip*
> * *Given* "syllables.yaml" lists every valid pinyin syllable (initial × final)
> * *When* I run the syllable-clip check
> * *Then* it exits with code 0
> * *And* it prints "missing: 0" for the 4 tones of every syllable

## **AC2** — verbatim
> *Scenario: A missing clip fails the check*
> * *Given* the clip for "ba" tone 3 is deleted from the bucket
> * *When* I run the syllable-clip check
> * *Then* it exits with code 1
> * *And* it prints "missing: ba3"

## Expected result
<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">Developer renders the 1,641 clips once</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">Runs the check</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">missing: 0 · exit 0</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">Delete ba3 → check prints missing: ba3 · exit 1</text></svg></figure>

*Notice: one command answers "is every clip there?" and names the gap.*

## Requirement [AC1] [AC2]
<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">Every syllable × 4 tones is expected</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">Each expected clip is looked up in the store</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">All found → say &quot;missing: 0&quot; and succeed</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">Any absent → name it (ba3) and fail</text></svg></figure>

*Notice: the AC decides only the last two boxes.*

## Solution [AC1] [AC2]
<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg role="img" viewBox="0 0 640 264" style="display:block;width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a8f98"/></marker></defs><rect x="60" y="4" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="29" text-anchor="middle" fill="#e6e8ee">pnpm import:content → audio-manifest.json (unchanged)</text><line x1="320" y1="44" x2="320" y2="66" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="68" width="520" height="40" rx="6" fill="#3b2a14" stroke="#f0a030" stroke-width="2"/><text x="320" y="93" text-anchor="middle" fill="#e6e8ee">NEW scripts/check-syllable-clips.ts: 1,641 entries, 1,620 cells cross-checked vs syllables.yaml</text><line x1="320" y1="108" x2="320" y2="130" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="132" width="520" height="40" rx="6" fill="#1c2230" stroke="#4a5266" stroke-width="1"/><text x="320" y="157" text-anchor="middle" fill="#e6e8ee">HEAD R2_PUBLIC_URL/&lt;key&gt;.mp3, 8 at a time (CHY-15 bucket, unchanged)</text><line x1="320" y1="172" x2="320" y2="194" stroke="#8a8f98" marker-end="url(#a)"/><rect x="60" y="196" width="520" height="40" rx="6" fill="#3b2a14" stroke="#f0a030" stroke-width="2"/><text x="320" y="221" text-anchor="middle" fill="#e6e8ee">NEW output: missing: &lt;label&gt; lines, last line missing: &lt;n&gt;; exit 0 / 1 / 2</text></svg></figure>

*Notice: only the script is new; exit 2 means the store was unreachable, never "all missing".*

## Settled
| Decision | Why / source |
|---|---|
| Expected set = manifest entries of kind syllable: 1,620 cells + 21 chips | DISCUSSION answered-here 1; counted on main |
| Presence by HEAD on the public URL, 404/empty = missing, other = unreachable | DISCUSSION 2; SPEC behaviour 3 |
| Label `ba3`; last line `missing: <n>` | DISCUSSION 4 |
| Probe 48 clips before the full render (F0 gate ≥ 44/48) | DISCUSSION Q1; SPEC probe gate |
| Hermetic fixture proves AC2, live delete on the dev bucket confirms it | DISCUSSION 5; PLAN Task 4 |

## Carried elsewhere
| Item | Where |
|---|---|
| Syllable text the renderer sends (`BA3`) | Captain routes Task 0 result to CHY-15 S2 (DISCUSSION Routing) |
| `R2_PUBLIC_URL` name and object layout | CHY-15 S2; SPEC open assumption (2-line change) |

## Plan
| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 0 | Probe 12 syllables × 4 tones, two text forms, F0 contours (Mac, scratch) | CHORE | `audio.ts:5` | 48-row table, ≥ 44 match |
| 1 | The check script | AC1, AC2 | `audio.ts:15`, `:29`, `bundle-sink.ts:44` | hermetic fixture controls |
| 2 | Script wiring | CHORE | `package.json:19` | check, lint, test, strict tsc |
| 3 | Render + live check on the Mac | AC1 | `bundle-sink.ts:12` | `missing: 0` on the real URL |
| 4 | Delete one clip live, re-render | AC2 | `audio.ts:15` | `missing: ba3` then 0 |

Mutation paths: clean, one missing, several incl. a chip, empty file, server down, manifest without a cell, empty env, no manifest. Rollback: revert the script and line; clips stay on R2.

## Today → after
| | Today | After |
|---|---|---|
| Syllable clips on R2 | 0 of 1,641 | 1,641 |
| Learning one is gone | listen or list the bucket | `missing: ba3`, exit 1 |

## Out of frame
- Cell playback and the 20-cell tap test → S2. Renderer, bucket, voice pinning → CHY-15, CHY-14.
