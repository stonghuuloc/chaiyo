---
id: CHY-65
title: 'Mock: warn before submitting with blank answers (M2)'
status: To Do
assignee: []
created_date: '2026-11-01 09:05'
labels:
  - mock
milestone: m-11
dependencies:
  - CHY-64
priority: low
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Needs the question map (CHY-64): only once questions can be skipped can a section be submitted with blanks.

```gherkin
Feature: Warn before submitting with blank answers
  As a learner
  I want to be told when I left questions blank
  So that I do not lose points by accident

  Scenario: Blanks trigger a warning
    Given 3 questions in the section are blank
    When I tap "Nộp bài"
    Then a sheet says "Còn 3 câu chưa làm" with "Làm tiếp" and "Nộp luôn"

  Scenario: Làm tiếp goes to the first blank
    When I tap "Làm tiếp"
    Then the first blank question is shown

  Scenario: Nộp luôn submits
    When I tap "Nộp luôn"
    Then the section is submitted and the blanks count as wrong

  Scenario: No blanks, no warning
    Given every question is answered
    When I tap "Nộp bài"
    Then the section is submitted without a sheet

  Scenario: Time-up never asks
    Given Exam mode and the timer reaches 0 with blanks
    Then the section is auto-submitted without a sheet
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Blanks trigger a warning
- [ ] #2 Scenario: Làm tiếp goes to the first blank
- [ ] #3 Scenario: Nộp luôn submits
- [ ] #4 Scenario: No blanks, no warning
- [ ] #5 Scenario: Time-up never asks
<!-- AC:END -->
