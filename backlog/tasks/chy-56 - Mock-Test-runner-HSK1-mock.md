---
id: CHY-56
title: Mock Test runner + HSK1 mock
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - mock
milestone: m-11
dependencies:
  - CHY-20
  - CHY-8
priority: low
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Needs the `MockSection` type (timing, play limits, HSKK parts; content-schema open decision 4). Screens M1 list → M2 exam/practice → M3 result + review.

```gherkin
Feature: Mock Test runner + HSK1 mock
  As a learner
  I want to take a full HSK 1 exam like the real one
  So that I know whether I am ready for the next level

  Background:
    Given a HSK 1 mock exists with sections that define timing and listening play limits

  Scenario: Unlock rule matches the roadmap
    Given I am on HSK 1 and have passed up to Bài 39
    When I open "Thi thử" on Luyện tập or the roadmap row "Thi thử HSK 1"
    Then it is locked with "Qua Bài 40 để mở thi thử HSK 1"
    When I pass Bài 40
    Then "Thi thử HSK 1" opens
    And the HSK 2 mock shows "mở khi đỗ thi thử HSK 1"

  Scenario: M1 mock list
    Given the HSK 1 mock is unlocked
    When I open the mock list for HSK 1
    Then I see the generated mock and the "Official" mock, each with my best Exam score
    And I can choose "Exam" or "Practice"

  Scenario: Exam mode
    When I start the HSK 1 mock in Exam mode
    Then a timer runs per section
    And each listening clip plays only as many times as its play limit allows
    And answers are not shown until the end
    When time runs out
    Then the test is auto-submitted

  Scenario: Practice mode
    When I start the HSK 1 mock in Practice mode
    Then there is no timer and listening can be replayed
    And after each answer the correct answer is shown

  Scenario: Leaving an Exam midway
    Given I am halfway through an Exam
    When I tap to leave
    Then I am asked to confirm
    And on confirm the Exam attempt is discarded

  Scenario: M3 result and review
    When I submit an Exam
    Then I see a score per section against the HSK pass mark
    When I tap "Xem lại đáp án"
    Then every question shows my answer and the correct one

  Scenario: Passing an Exam earns a badge, Practice does not
    Given I score above the pass mark in Exam mode
    Then the "Đỗ HSK 1" badge is earned
    Given I score above the pass mark in Practice mode
    Then no badge is earned

  Scenario: One HSK1 mock playable in Exam and Practice modes
    Then the single HSK 1 mock completes end-to-end in Exam mode and in Practice mode
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Unlock rule matches the roadmap
- [ ] #2 Scenario: M1 mock list
- [ ] #3 Scenario: Exam mode
- [ ] #4 Scenario: Practice mode
- [ ] #5 Scenario: Leaving an Exam midway
- [ ] #6 Scenario: M3 result and review
- [ ] #7 Scenario: Passing an Exam earns a badge, Practice does not
- [ ] #8 Scenario: One HSK1 mock playable in Exam and Practice modes
<!-- AC:END -->
