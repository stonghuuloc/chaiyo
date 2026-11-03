# CHY-10 S2 — picture
ACs: AC2, AC3 · Spec rev 1 · Sub-task CHY-10 S2

## What this slice is about

Adds one test that imports Bài 1 and checks it against the prototype: words, sentences, dialogue, grammar and 19 questions, plus a table showing each of the 7 sections has everything its prototype page reads. The app screens themselves come from CHY-31..35.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-10` |
| Lands | `src/lib/content/h1-01.parity.test.ts` · `fixtures/h1-01.prototype-questions.json` |
| Does not land | content authoring (S1) · importer and bundle (CHY-8) · section screens (CHY-31..35) · mini-check and warm-up card derivation (CHY-32) |

## **AC2** — verbatim

> *Scenario: Importer output matches the prototype content*
> * *Given* the linted Bài 1 content
> * *When* I import it and diff the output against `prototype/data/h1-01.js`
> * *Then* the words, sentences, grammar and questions have the same hanzi, pinyin and Vietnamese text

## **AC3** — verbatim

> *Scenario Outline: Every Bài 1 section renders in the app*
> * *Given* the app reads the imported Bài 1
> * *When* I open the section <section>
> * *Then* it shows the same content as the prototype page <page>
>
> *Examples:* Khởi động · l2-warmup.html | Từ mới · l3-words.html | Ngữ pháp · l4-grammar.html | Hội thoại · l5-dialogue.html | Nghe nói · l6-listen.html | Luyện viết · l7-writing.html | Gate Test · l8-gate.html

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="expected-title expected-desc" style="display:block;width:100%;height:auto" id="d-1-expected-root"><title id="expected-title">Expected: pnpm test matches the prototype</title><desc id="expected-desc">A developer runs pnpm test. The test imports content into an in-memory store and compares it with the prototype data and a 19-question fixture. Zero mismatches, and all 7 sections are present in the coverage table.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-1-expected-root .wrap { overflow-x:auto }       #d-1-expected-root .wrap svg { min-width:640px }</style><marker id="d-1-expected-expected-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-1-expected-expected-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M320,100 L320,132" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M240,188 L240,204 Q240,212 232,212 L138,212 Q130,212 130,220 L130,236" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M400,188 L400,204 Q400,212 408,212 L502,212 Q510,212 510,220 L510,236" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M130,308 L130,324 Q130,332 138,332 L232,332 Q240,332 240,340 L240,356" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M510,308 L510,324 Q510,332 502,332 L408,332 Q400,332 400,340 L400,356" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a1)"/><path d="M320,412 L320,452" fill="none" stroke="#f08a59" stroke-width="1.2" marker-end="url(#d-1-expected-expected-a2)"/><text x="24" y="32" font-size="12" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">DEVELOPER</text><rect x="160" y="44" width="320" height="56" rx="6" fill="#2d3142"/><rect x="160" y="44" width="320" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="70" text-anchor="middle" font-size="13" font-weight="600" fill="#f5f5f5" font-family="Geist, 'PingFang SC', system-ui, sans-serif">Runs pnpm test</text><text x="320.0" y="88" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace... (line truncated to 2000 chars)</figure>

*Notice: one test run covers both ACs; the in-app render itself is not run here.*

## Requirement [AC2][AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="requirement-title requirement-desc" style="display:block;width:100%;height:auto" id="d-2-requirement-root"><title id="requirement-title">Requirement: imported lesson equals the prototype</title><desc id="requirement-desc">A reviewer opens the prototype pages and the imported lesson side by side. Words, sentences, grammar and questions match, and each of the 7 sections has everything its page shows. The real in-app screens come later.</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-2-requirement-root .wrap { overflow-x:auto }       #d-2-requirement-root .wrap svg { min-width:640px }</style><marker id="d-2-requirement-requirement-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-2-requirement-requirement-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M240,100 L240,116 Q240,124 232,124 L138,124 Q130,124 130,132 L130,156" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M400,100 L400,116 Q400,124 408,124 L502,124 Q510,124 510,132 L510,156" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M130,228 L130,244 Q130,252 138,252 L232,252 Q240,252 240,260 L240,276" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M510,228 L510,244 Q510,252 502,252 L408,252 Q400,252 400,260 L400,276" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M320,348 L320,388" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-2-requirement-requirement-a1)"/><path d="M320,444 L320,484" fill="none" stroke="#f08a59" stroke-width="1.2" stroke-dasharray="5,4" marker-end="url(#d-2-requirement-requirement-a2)"/><rect x="160" y="44" width="320" height="56" rx="6" fill="#2d3142"/><rect x="160" y="44" width="320" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="70" text-anchor="middle" font-size="13" font-weight="600" fill="#f5f5f5" font-family="Geist, 'PingFang SC', system-ui, sans-serif">Reviewer</text><text x="320.0" y="88" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace">opens both side by side</text><rect x="20" y="156" width="220" height="72" r... (line truncated to 2000 chars)</figure>

*Notice: AC3 is proven at bundle level because the section screens do not exist yet.*

## Solution [AC2][AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><?xml version="1.0" encoding="UTF-8"?><svg style="display:block;width:100%;height:auto" viewBox="0 0 640 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="solution-title solution-desc" style="display:block;width:100%;height:auto" id="d-3-solution-root"><title id="solution-title">Solution: what S2 adds to chaiyo</title><desc id="solution-desc">New: a parity test and a 19-question fixture. Unchanged and read only: the prototype data and pages l2 to l8. Other lanes: the importer (CHY-8), content from S1, words (CHY-12) and section screens (CHY-31 to 35, later).</desc><defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Serif:ital@0;1&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;family=Noto+Sans+TC:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400&amp;display=swap');       #d-3-solution-root .wrap { overflow-x:auto }       #d-3-solution-root .wrap svg { min-width:640px }</style><marker id="d-3-solution-solution-a1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d-3-solution-solution-a2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%%" height="100%%" fill="#2d3142"/><path d="M280,108 L280,130 Q280,138 272,138 L116,138 Q108,138 108,146 L108,164" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><path d="M320,108 L320,164" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><path d="M360,108 L360,130 Q360,138 368,138 L524,138 Q532,138 532,146 L532,164" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><path d="M108,280 L108,320" fill="none" stroke="#bfc0c0" stroke-width="1.2" marker-end="url(#d-3-solution-solution-a1)"/><rect x="228" y="44" width="184" height="64" rx="6" fill="#2d3142"/><rect x="228" y="44" width="184" height="64" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="240" y="62" font-size="12" fill="#f08a59" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">NEW</text><text x="240" y="82" font-size="13" font-weight="600" fill="#f5f5f5" font-family="Geist, 'PingFang SC', system-ui, sans-serif">h1-01.parity.test.ts</text><text x="240" y="100" font-size="12" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace">src/lib/content/</text><rect x="12" y="164" width="196" height="116" rx="6" fill="#2d3142"/><rect x="12" y="164" width="196" height="116" rx="6" fill="#2d3142" stroke="#bfc0c0" stroke-width="1" stroke-dasharray="4,3"/><text x="24" y="182" font-size="12" fill="#bfc0c0" font-family="'Geist Mono', 'PingFang SC', ui-monospace, monospace" letter-spacing="0.06em">OTHER LANE</tex... (line truncated to 2000 chars)</figure>

*Notice: one new test file and one fixture; everything else is read, never changed.*

## Settled

| Decision | Why / source |
|---|---|
| Khởi động for Bài 1 is `warmup: {}`; the 6 l2 words are covered by `words.ids` | 10.Q2 A, Captain under Loc 80% rule; docs rule 5 |
| The 19 prototype questions become a fixture; prototype stays frozen | 10.Q3 A, same source; `h1-01.js` holds none of them |
| AC3 proven at bundle level per section | Captain default 2026-11-03; `DISCUSSION.md` |
| Word pinyin compared without spaces; sentence pinyin exact | CHY-12 rewrites word `pinyin` (C4); advisor round 2 |
| `senses[0].vi` equals the prototype gloss | C4: hand senses kept first and verbatim (CHAA-24) |
| Options compared as sets; order, tone, typePinyin, readAloud, freeAnswer have their own resolvers | `PLAN.md` Task 2; advisor round 1 |

## Carried elsewhere

| Item | Where |
|---|---|
| 3 mini-checks after words 3, 6, 9 in `l3-words.html:62` | derived, CHY-32 |
| `scene.cast` [panda, fawn] vs prototype Cast redpanda/takin | parked, `PARKED.md` |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Transcribe the 19 prototype questions into a fixture | AC2 | `l4-grammar.html:118`, `l5-dialogue.html:135`, `l6-listen.html:243`, `l8-gate.html:155` | question comparison in Task 2 |
| 2 | Parity test: words, sentences, dialogue, grammar, questions | AC2 | `prototype/data/h1-01.js:12,37,49,54` | `pnpm test -- h1-01.parity` |
| 3 | Seven-row section coverage table | AC3 | `l2-warmup.html:33`, `l3-words.html:62`, `l7-writing.html:57`, `l8-gate.html:155` | same file; negative control on an in-memory clone |
| 4 | Prove: full test, check, lint, `import:content` memory sink | AC2, AC3 | `content.test.ts:14-19` pattern, `vite.config.ts:33` | `pnpm test`, `pnpm check`, `pnpm lint` |

Mutation paths: read-only test, negative controls edit an in-memory clone. Rollback: `git revert`.

## Today → after

| | Today | After |
|---|---|---|
| prototype vs imported Bài 1 comparison | none | 10 words, 9 sentences, 2 parts, 1 grammar, 19 questions |
| section coverage | none | 7 rows, one per prototype page |
| questions in a diffable form | inline in 4 HTML pages | 19-row fixture |

## Out of frame
- Content authoring (chars, questions) → S1; importer, memory sink and bundle field names → CHY-8 (C2, C3)
- In-app rendering → CHY-31..35; warm-up and mini-check derivation → CHY-32; senses regeneration → CHY-12
