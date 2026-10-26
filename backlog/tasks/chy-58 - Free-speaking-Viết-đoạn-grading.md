---
id: CHY-58
title: Free speaking + Viết đoạn grading
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - speech
milestone: m-11
dependencies:
  - CHY-57
priority: low
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Azure STT + unscripted fluency + LLM rubric with Vietnamese feedback; Viết đoạn opens at HSK 3.

```gherkin
Feature: Free speaking + Viết đoạn grading
  As a learner
  I want my picture descriptions, answers and short paragraphs graded with feedback in Vietnamese
  So that I can improve beyond repeating set sentences

  Scenario: Free speaking is graded
    Given I am on a "Nói" task such as describing a picture
    When I record and submit
    Then Azure STT returns a transcript and unscripted fluency and pronunciation scores
    And an LLM rubric (task, grammar, level vocabulary, length; key points for retell) returns scores and Vietnamese feedback
    And no audio is stored

  Scenario: Rubric output labelled
    When the result is shown
    Then it carries the label "điểm ước tính"
    And the feedback text is in Vietnamese

  Scenario: Viết đoạn locked below HSK 3
    Given I am on HSK 1
    When I open "Viết đoạn"
    Then I see "Mở khi bạn tới HSK 3. Bạn đang ở HSK 1."

  Scenario: Viết đoạn at HSK 3
    Given I am on HSK 3
    When I open "Viết đoạn" and submit a paragraph for the prompt "介绍一下你的周末。"
    Then the LLM rubric marks errors per sentence with Vietnamese feedback and the label "điểm ước tính"

  Scenario: Entry screens become real
    When I open "Nói" or "Viết đoạn" from Luyện tập
    Then I get a working recording or writing flow
    And the "Chưa có trong bản demo" note is gone
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Free speaking is graded
- [ ] #2 Scenario: Rubric output labelled
- [ ] #3 Scenario: Viết đoạn locked below HSK 3
- [ ] #4 Scenario: Viết đoạn at HSK 3
- [ ] #5 Scenario: Entry screens become real
<!-- AC:END -->
