---
id: CHY-40
title: Bảng pinyin (W3)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - lesson
milestone: m-5
dependencies:
  - CHY-17
priority: low
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `w3-pinyin.html?open=ba`: initials × finals grid, tone sheet on tap.

```gherkin
Feature: Bảng pinyin (W3)
  As a learner
  I want a table of every syllable that I can tap to hear
  So that I can look up a sound at any time

  Scenario: Grid of initials by finals
    When I open "Bảng pinyin"
    Then I see a table with finals as columns and initials as rows, plus a row for no initial (∅)
    And cells that are not a real syllable are empty
    And the table is reference only: no scores

  Scenario: Every cell plays its 4 tones
    When I tap the cell "ba"
    Then a sheet titled "ba" opens with "Chạm một thanh để nghe. Chạm lần nữa để nghe chậm."
    And it lists 4 tones, each with pinyin, a tone contour and a sample hanzi, and each plays on tap (slowly on a second tap)
    And a tone with no sound shows "–" and is disabled

  Scenario: Deep link opens the tone sheet
    When I open `w3-pinyin.html?open=ba`
    Then the tone sheet for "ba" is open
    And with `?open=xyz` the table shows with no sheet open

  Scenario: Close the sheet and go back
    When I tap "Đóng", press Escape or tap outside the sheet
    Then the sheet closes and focus returns to the cell
    And tapping ✕ returns me to the previous screen, or to Nhập môn if I opened the table directly
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Grid of initials by finals
- [ ] #2 Scenario: Every cell plays its 4 tones
- [ ] #3 Scenario: Deep link opens the tone sheet
- [ ] #4 Scenario: Close the sheet and go back
<!-- AC:END -->
