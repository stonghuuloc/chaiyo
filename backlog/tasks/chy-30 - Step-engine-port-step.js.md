---
id: CHY-30
title: Step engine (port step.js)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - lesson
milestone: m-5
dependencies:
  - CHY-4
  - CHY-24
  - CHY-25
priority: high
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Successor of `prototype/step.js`: top bar + progress, sticky CTA, `choice()` engine, done step, resumable on exit. Screens record Attempts and react to Study events; no rule lives in a screen.

```gherkin
Feature: Step engine (port step.js)
  As a developer
  I want one engine that every lesson section runs on
  So that screens only render and every rule stays in Study

  Scenario: Top bar and sticky CTA
    Given a section with 6 steps is open
    Then the top bar shows ✕ "Lưu và về bài học", 6 progress segments and a counter like "2/6"
    And the CTA is sticky at the bottom and disabled until the step allows it

  Scenario: Choice step with feedback
    Given a choice step with answer "好"
    When I pick "好" and press "Kiểm tra"
    Then the right option is marked and I see "Đúng rồi."
    And the CTA becomes "Tiếp"
    When I pick a wrong option instead
    Then I see "Chưa đúng. Đáp án là …" and the hint "Câu này sẽ quay lại ở phần ôn"

  Scenario: Choice step without feedback (test runners)
    Given a Gate or Placement question
    When I pick an option and press "Câu tiếp"
    Then no right/wrong is shown and the next question opens
    And the last question's button reads "Nộp bài"

  Scenario: Every answer becomes an Attempt
    When I answer any step
    Then `Ledger.record` is called once with the question, my pick and whether it was correct
    And the screen contains no rule about streaks, unlocks or review scheduling

  Scenario: Leaving mid-section resumes at the same step
    Given I am on step 4 of a section
    When I tap ✕ and later reopen the section
    Then I land on step 4 again with the same progress bar

  Scenario: Done step counts the day and pops the streak popup
    Given I finish the last step of a section
    Then I see the done step with a check mark, "Xong phần …" and a button "Phần tiếp theo"
    And when Study emits `DayCounted` the streak popup shows "Chuỗi lên N ngày!"
    And when `DayCounted` does not fire no popup shows
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Top bar and sticky CTA
- [ ] #2 Scenario: Choice step with feedback
- [ ] #3 Scenario: Choice step without feedback (test runners)
- [ ] #4 Scenario: Every answer becomes an Attempt
- [ ] #5 Scenario: Leaving mid-section resumes at the same step
- [ ] #6 Scenario: Done step counts the day and pops the streak popup
<!-- AC:END -->
