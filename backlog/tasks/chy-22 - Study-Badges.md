---
id: CHY-22
title: 'Study: Badges'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - core
milestone: m-3
dependencies:
  - CHY-21
priority: medium
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Badge list from the prototype (`assets/badges/`: first, streak7, streak30, words100, hsk1 + locked ones in `u1-badges.html`).

```gherkin
Feature: Study: Badges
  As a learner
  I want a permanent badge when I reach a milestone
  So that my effort stays recognised even after I lose a Streak

  Scenario Outline: Reaching a milestone earns its badge
    Given the learner has not earned "<badge>"
    When <action>
    Then Study emits BadgeEarned for "<badge>" titled "<title>"

    Examples:
      | badge     | title            | action                                          |
      | first     | Bước đầu tiên    | the learner passes the Bài 0 Gate Test          |
      | streak7   | Chuỗi 7 ngày     | the Streak reaches 7                            |
      | streak30  | Chuỗi 30 ngày    | the Streak reaches 30                           |
      | streak100 | Chuỗi 100 ngày   | the Streak reaches 100                          |
      | words100  | 100 từ           | the Lexicon reaches 100 words                   |
      | words300  | 300 từ           | the Lexicon reaches 300 words                   |
      | write50   | Viết chữ đẹp     | the learner writes 50 characters correctly      |
      | hsk1      | Đỗ HSK 1         | the learner passes the HSK 1 Mock Test in Exam mode |
      | hsk2      | Đỗ HSK 2         | the learner passes the HSK 2 Mock Test in Exam mode |

  Scenario: Each badge fires exactly once
    Given the learner earned "streak7" at Streak 7
    When the Streak is reset and reaches 7 again
    Then no second BadgeEarned for "streak7" is emitted

  Scenario: Replaying the same Attempts does not fire badges again
    Given the learner's Attempts already produced BadgeEarned for "first"
    When Study replays the same Attempts from the start with the earned badges in state
    Then no BadgeEarned is emitted

  Scenario: Badges survive a Streak reset
    Given the learner earned "streak7" and has a Streak of 9 with 0 Freezes
    When a day is missed and rollover emits StreakReset
    Then the Streak is 0
    And "streak7" is still in the earned badges

  Scenario: A Mock Test in Practice mode earns nothing
    When the learner finishes the HSK 1 Mock Test in Practice mode with a passing score
    Then no BadgeEarned for "hsk1" is emitted
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Reaching a milestone earns its badge
- [ ] #2 Scenario: Each badge fires exactly once
- [ ] #3 Scenario: Replaying the same Attempts does not fire badges again
- [ ] #4 Scenario: Badges survive a Streak reset
- [ ] #5 Scenario: A Mock Test in Practice mode earns nothing
<!-- AC:END -->
