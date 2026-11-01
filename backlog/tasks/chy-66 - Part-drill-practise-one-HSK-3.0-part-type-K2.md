---
id: CHY-66
title: 'Part drill: practise one HSK 3.0 part type (K2)'
status: To Do
assignee: []
created_date: '2026-11-01 09:05'
labels:
  - mock
  - practice
milestone: m-11
dependencies:
  - CHY-56
priority: low
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Short drill of one HSK 3.0 part type (e.g. Nghe phần 3), about 5 minutes, built from words already taught. Entry: Luyện tập → Thi thử block → "Luyện theo dạng" (K2). Reuses the M2 part renderers (`pic3`, `ans3`, `pic6`, `qa3`, `rpic6`, `reply6`, `gap6`, `star3`). Reference: Migii's per-part question bank (HSK 1 Nghe: 345–421 questions per part).

```gherkin
Feature: Part drill
  As a learner
  I want to drill one exam part in a few minutes
  So that I can fix my weakest question type without sitting a full mock

  Scenario Outline: One drill per part type
    When I open "Luyện theo dạng" for HSK 1 and pick "<part>"
    Then I get 10 questions of type "<type>"

    Examples:
      | part         | type   |
      | Nghe phần 1  | pic3   |
      | Nghe phần 2  | ans3   |
      | Nghe phần 3  | pic6   |
      | Nghe phần 4  | qa3    |
      | Đọc phần 1   | rpic6  |
      | Đọc phần 2   | reply6 |
      | Đọc phần 3   | gap6   |
      | Đọc phần 4   | star3  |

  Scenario: Only taught words
    Given I have passed up to Bài 12
    When I start any part drill
    Then every word in it was taught in Bài 0 to Bài 12

  Scenario: Not enough words yet
    Given the taught words cannot fill a drill of "Nghe phần 3"
    Then that part shows "Học thêm vài bài để mở" and cannot start

  Scenario: Practice-mode feedback
    When I answer a drill question
    Then the correct answer and its "why" are shown at once
    And listening can be replayed
    And tapping a hanzi opens the Tra nhanh sheet (X1)

  Scenario: Attempts recorded, nothing awarded
    When I finish a drill
    Then each answer is saved as an Attempt tagged with its part type
    And no Badge is earned and no Mock Test counts as passed
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: One drill per part type
- [ ] #2 Scenario: Only taught words
- [ ] #3 Scenario: Not enough words yet
- [ ] #4 Scenario: Practice-mode feedback
- [ ] #5 Scenario: Attempts recorded, nothing awarded
<!-- AC:END -->
