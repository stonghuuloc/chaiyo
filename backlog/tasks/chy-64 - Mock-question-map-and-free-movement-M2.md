---
id: CHY-64
title: 'Mock: question map and free movement (M2)'
status: To Do
assignee: []
created_date: '2026-11-01 09:05'
labels:
  - mock
milestone: m-11
dependencies:
  - CHY-56
priority: low
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today `prototype/m2-mock.html` is forward-only, one question at a time. The real HSK lets a candidate skip and return inside a section, so the mock should train that habit. Reference: Migii's runner (side panel of numbered bubbles per part).

```gherkin
Feature: Mock question map and free movement
  As a learner
  I want to skip a question and come back to it
  So that the mock trains the same habits as the real exam

  Background:
    Given I am in section "Nghe" of the HSK 1 mock

  Scenario: Map shows every question of the section
    When I open the question map
    Then I see 4 parts with 5 numbered bubbles each
    And answered, blank and current questions look different

  Scenario: Jump to any question in the section
    When I tap bubble 13
    Then question 13 is shown
    And my earlier answers are kept

  Scenario: Skip and come back
    When I tap "Câu tiếp theo" without answering question 6
    Then question 7 is shown and bubble 6 stays blank
    When I tap "Câu trước"
    Then question 6 is shown again

  Scenario: Exam mode keeps me in the current section
    Given Exam mode
    Then bubbles of section "Đọc" cannot be opened until "Nghe" ends

  Scenario: Play limits survive navigation
    Given Exam mode and the clip of question 3 has used its play limit
    When I leave question 3 and come back
    Then the clip still cannot be played again

  Scenario: Fits a 390px phone
    Given a 390px wide viewport
    Then the map opens as a sheet and the closed map never covers the answer options
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Map shows every question of the section
- [ ] #2 Scenario: Jump to any question in the section
- [ ] #3 Scenario: Skip and come back
- [ ] #4 Scenario: Exam mode keeps me in the current section
- [ ] #5 Scenario: Play limits survive navigation
- [ ] #6 Scenario: Fits a 390px phone
<!-- AC:END -->
