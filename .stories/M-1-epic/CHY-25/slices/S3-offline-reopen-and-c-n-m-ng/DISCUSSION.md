# CHY-25 S3 — discussion
ACs: AC5, AC6  ·  rev 1  ·  2026-11-06

## Decisions made alone (80% rule)
| # | Decision | Alternatives rejected | Confidence | Cost if wrong |
|---|---|---|---|---|
| D4 [AC6] | Filter `/content/` out of the shell precache. This reverses **C3 frozen rev 3** (`.stories/M-1-epic/CHY-10/slices/S2-prototype-parity/DISCUSSION.md:17`; `.stories/M-2-epic/WAVE-PLAN.md` "C3 (frozen rev 3)") and **CHY-8 S3's decision** that `static/` is precached per deploy (`.stories/M-1-epic/CHY-8/slices/S3-sinks-bundle-postgres-audio-manifest/DISCUSSION.md:7`). Without the reversal every lesson works offline and AC6 has nothing to report; a lesson is still cheap to download on open (ADR 0002 reason 4). | keep the precache and drop AC6; precache only the current sha | 85% | AC6 fails, or every lesson is offline; the reversal is recorded here for CHY-8's owner |
| D5 [AC5] | Await the cache write for `/content/current.json` too. LOC-10's bundle URL shape is unchanged; only the set of awaited paths grows. | keep `current.json` deferred and rely on `waitUntil` | 85% | an immediate offline reload can miss the sha, so AC5's same-sha check fails |
| D6 [AC5] | Navigation requests are network-first; the cached `/today` shell is used only when the network fails. `/today` is an `(app)` route and app pages are `ssr = false`, so its document is the same shell; `/` is the prerendered Landing Page and is not used. | a cache-first shell online; caching the lesson URL when it opens; leaving it to CHY-61 | 85% | a cache-first shell would serve the cached HTML online until the next SW version; Q3 records the scope |

## Review round — Loc, 2026-11-06 (resolved)
| Item | Finding | Resolution | Source |
|---|---|---|---|
| I1 [AC6] | AC6's browser check used h1-02, which exists in neither `content/` nor the fixture | use h0-00 (the Primer; in `content/` and the fixture) for the never-opened lesson | Loc |
| I5 [AC6] | the precache reversal was uncited and `current.json` sat in Locked decisions | D4 cites C3 rev 3 and CHY-8 S3; the `current.json` change moved to D5 | Loc |
| I8 [AC5] | the navigation fallback served the cached shell online too | network first; `/today` only when the network fails | Loc |
| nits | `network.test.ts` line ranges and `screens.md:114` | `:62-116`, `:90-102`, `:104-116`; the lesson screen is `docs/screens.md:126` | Loc |
