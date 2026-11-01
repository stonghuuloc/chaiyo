---
id: CHY-67
title: 'Mock result: weakest part and redo wrong answers (M3)'
status: To Do
assignee: []
created_date: '2026-11-01 09:05'
labels:
  - mock
milestone: m-11
dependencies:
  - CHY-56
  - CHY-66
priority: low
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M3 today offers only "Làm lại" and "Về Luyện tập". `prototype/p2-skill.html` already promises "Câu sai được gom lại để luyện tiếp"; this ticket delivers it.

```gherkin
Feature: Weakest part and redo wrong answers
  As a learner
  I want the result to point at what to practise next
  So that a failed mock turns into a short, targeted session

  Scenario: Weakest part is named
    Given my Nghe parts scored 5/5, 4/5, 1/5 and 3/5 and every Đọc part scored 5/5
    When I see the result
    Then it says "Yếu nhất: Nghe phần 3" with a button "Luyện dạng này"
    When I tap it
    Then the part drill for Nghe phần 3 starts

  Scenario: Tie goes to the earlier part
    Given Nghe phần 2 and Đọc phần 4 both scored 2/5 and every other part scored more
    Then the weakest part shown is "Nghe phần 2"

  Scenario: All parts perfect
    Given every part scored 5/5
    Then no weakest-part block is shown

  Scenario: Redo wrong answers
    Given 7 questions were wrong or blank
    When I tap "Làm lại câu sai"
    Then I get exactly those 7 questions in Practice mode
    And the redo never changes my best Exam score

  Scenario: Nothing wrong
    Given every question was right
    Then "Làm lại câu sai" is not shown
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Weakest part is named
- [ ] #2 Scenario: Tie goes to the earlier part
- [ ] #3 Scenario: All parts perfect
- [ ] #4 Scenario: Redo wrong answers
- [ ] #5 Scenario: Nothing wrong
<!-- AC:END -->
