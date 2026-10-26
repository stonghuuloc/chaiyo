---
id: CHY-44
title: 'Honest entry screens: Nói, Viết đoạn'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:49'
labels:
  - practice
milestone: m-6
dependencies:
  - CHY-41
priority: low
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `p2-skill.html?k=noi|doan|thi`: how it works + sample, until E11 grading exists.

```gherkin
Feature: Honest entry screens: Nói, Viết đoạn
  As a learner
  I want to see what Nói, Viết đoạn and Thi thử will do before they exist
  So that I am never shown a fake score

  Scenario Outline: Entry screen says what it is
    When I open "p2-skill.html?k=<k>"
    Then the title is "<h>"
    And I see a 3-step "how it works" list and one sample item
    And the button "Về Luyện tập" returns to the Luyện tập tab

    Examples:
      | k    | h                                   |
      | noi  | Đọc to, app chấm phát âm            |
      | doan | Viết câu, rồi viết đoạn ngắn        |
      | thi  | Thi thử HSK 1, như thi thật         |

  Scenario: No fake scores
    Given grading is not built
    When I open any of the three screens
    Then there is no start button, no score and no recording control
    And a dashed note says what is missing, e.g. "Chưa có trong bản demo: cần máy chấm phát âm (xem kế hoạch chấm điểm Nói trong NOTES)."

  Scenario: Viết đoạn below HSK 3
    Given my level is HSK 1
    When I open "p2-skill.html?k=doan"
    Then the note reads "Mở khi bạn tới HSK 3. Bạn đang ở HSK 1."

  Scenario Outline: Thi thử note depends on the level
    Given my level is HSK 1
    When I open "p2-skill.html?k=thi&lv=<lv>"
    Then the note reads "<note>"

    Examples:
      | lv | note                                                                      |
      | 1  | Mở khi bạn qua bài cuối của HSK 1. Chưa có đề trong bản demo.             |
      | 2  | Mở khi bạn đỗ thi thử HSK 1.                                              |
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Entry screen says what it is
- [ ] #2 Scenario: No fake scores
- [ ] #3 Scenario: Viết đoạn below HSK 3
- [ ] #4 Scenario: Thi thử note depends on the level
<!-- AC:END -->
