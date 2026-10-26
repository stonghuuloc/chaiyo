---
id: CHY-49
title: Lộ trình tab
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:53'
labels:
  - roadmap
milestone: m-8
dependencies:
  - CHY-3
  - CHY-20
priority: medium
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `t2-roadmap.html`: sticky level strip 1–5 (locks), current-lesson card (only red CTA on current level), topic accordion, locked levels browsable with note, Thi thử row per level, HSK | Chuyên đề switch.

```gherkin
Feature: Lộ trình tab
  As a learner
  I want to see every level and lesson with its state, and why a lesson is locked
  So that I always know where I am and what opens next

  Background:
    Given I am a learner on HSK 1 who passed Bài 0 and is studying Bài 1
    And I open the "Lộ trình" tab

  Scenario: Current level shows the current lesson
    Then the header says "HSK 1 · 0/40 bài · 300 từ mới"
    And the level strip shows cells 1 to 5, with cells 2 to 5 showing a lock
    And the current-lesson card reads "Bài 1 · Xin chào 你好" and "Phần 1 · cần 80% bài kiểm tra để mở Bài 2"
    And the card has one red button "Tiếp tục Bài 1"
    And only the topic "Chủ đề 1 · Chào hỏi" is open in the accordion

  Scenario: Lesson states come from Study state
    Given Study state says Bài 0 is passed with a best score, Bài 1 is current, Bài 2 onward are not unlocked
    When I open the topic "Chủ đề 1 · Chào hỏi"
    Then the Bài 1 row reads "Đang học · phần 1"
    And a passed lesson row reads "Đã xong · điểm cao nhất <score>%" with a check mark
    And Bài 2 shows a lock and "Mở khi qua Bài 1"
    And no lesson state is hard-coded in the screen

  Scenario: Locked lesson tap shows why
    When I tap the row "Bài 2"
    Then a toast shows "Qua Bài 1 để mở Bài 2"
    And the screen does not navigate

  Scenario: A locked level is browsable
    When I tap cell 2 in the level strip
    Then the list swaps in place to HSK 2 without scrolling
    And a note reads "Mở khi đỗ thi thử HSK 1. Xem trước các bài bên dưới."
    And the first topic is open and there is no current-lesson card
    When I tap a lesson in it
    Then a toast shows "Đỗ thi thử HSK 1 để mở HSK 2"

  Scenario: Each level ends with Thi thử rows
    When I open the group "Cuối cấp" on HSK 1
    Then I see one locked row "Thi thử HSK 1" with "mở khi qua Bài 40"
    When I open the group "Cuối cấp" on HSK 3
    Then I see two locked rows "Thi thử HSK 3 · Viết" and "Thi thử HSK 3 · Nói"
    And the note "Từ HSK 3, đỗ cấp cần đỗ cả phần Viết và phần Nói." is shown

  Scenario: #lvN deep link works
    When I open "t2-roadmap.html#lv3"
    Then the HSK 3 list is shown and cell 3 in the level strip is selected
    And a chip "Bài 1 đang học" appears to jump back to the current lesson

  Scenario: Chuyên đề switch
    When I tap "Chuyên đề"
    Then the level strip is hidden and the URL hash is "#tracks"
    And each track is a catalogue entry that says "Đỗ thi thử HSK N để mở <track>" while locked
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Current level shows the current lesson
- [ ] #2 Scenario: Lesson states come from Study state
- [ ] #3 Scenario: Locked lesson tap shows why
- [ ] #4 Scenario: A locked level is browsable
- [ ] #5 Scenario: Each level ends with Thi thử rows
- [ ] #6 Scenario: #lvN deep link works
- [ ] #7 Scenario: Chuyên đề switch
<!-- AC:END -->
