# CHY-28 S2 — discussion
ACs: AC1, AC3 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- None beyond STORY's locked list.

## Answered here (≥80% rule, CREW.md)
- [AC3] Q: "Thoát … without saving" when Attempts are append-only? A: the screen keeps Attempts in memory and hands them to the result page only when the run ends (sessionStorage); an exit writes nothing, so nothing has to be removed. Confidence 90%.
- [AC1] Q: why sessionStorage between O2 and O3? A: it survives the `goto` and a reload of the result page, dies with the tab, and keeps the record step (S3) on the page that shows the result. The prototype does the same (o2-placement.html:74-77). Confidence 85%.
- [AC1] Q: does "Không biết" need "Câu tiếp"? A: no, it answers at once (o2-placement.html:59-60). Confidence 90%.
- [AC1] Q: what counts as "no level label"? A: no level, no HSK name, no "n/10" and no progress bar; the only fixed text is the title "Kiểm tra trình độ". The local row greps the page text for those patterns. Confidence 85%.
- [AC1] Q: what if a clip fails to load (offline)? A: the item still shows its 4 options and "Không biết"; the learner can answer. No AC covers offline placement. Confidence 80%.
- [R] Q: do digit 5 / "Không biết" need Enter? A: no; 5 answers at once, same as the button and the spec (the prototype's choose-then-Enter for idk is superseded by the SPEC). Confidence 85%.
- [R] Q: Mac proof when vitest and `vite dev` fail locally ("Tsconfig not found" from rolldown, also on main)? A: Playwright runs on `vite build` + `vite preview` with a stored session forged in localStorage (auth-js getSession does not verify an unexpired token); unit suite runs on a cloud machine. Confidence 80%.
- [AC3] Q: plain goto or replace for "Thoát"? A: `replace: true` (C-M4-3 redirects use replace), so Back does not return to a half-finished test. Confidence 85%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- One silent run, easy to hard (CHY-28 AC1; docs/screens.md:107).
