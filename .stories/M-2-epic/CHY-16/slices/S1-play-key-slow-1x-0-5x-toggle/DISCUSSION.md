# CHY-16 S1 — discussion

No open question: Loc's answers (WAVE-PLAN Q4-Q7, 2026-11-07) and the prototype settle the shape. Calls made here at ≥80%, all serving [AC1], [AC2] and [AC4]:

## Q-block D1 — what does `{ slow }` mean?
| | A — omitted toggles, boolean forces (picked) | B — `slow` always required | C — no option, toggle only |
|---|---|---|---|
| caller code for a tap | `play(key)` | UI must track last key and parity | `play(key)` |
| a "play slowly" button | `play(key, { slow: true })` | same | impossible |
| state kept | player (`last`, `plays`) | UI | player |
rec: **A**. The ticket and architecture.md:33 give `play(key, { slow })` and "second tap = 0.5×", so both must work. A forced `slow` also sets the parity, so the next bare tap on that clip flips it.

## Q-block D2 — does a failed play count as a tap?
| | A — no, a failure resets the toggle (picked) | B — yes (prototype) |
|---|---|---|
| uncached clip offline, tap twice | both at 1× | second tap at 0.5× of a clip that never played |
rec: **A**. One line (`last = null`), and the retry behaves like a first tap.

## Q-block D3 — where does a key become a URL?
`createPlayer({ base })` takes the base URL and builds `<base>/<key>.mp3`; the default singleton uses `/audio`. S2 sets the base from the R2 public URL (Q4). The player never parses or validates a key.
