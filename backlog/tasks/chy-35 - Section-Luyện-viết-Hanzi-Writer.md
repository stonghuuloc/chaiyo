---
id: CHY-35
title: 'Section: Luyện viết (Hanzi Writer)'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - lesson
milestone: m-5
dependencies:
  - CHY-30
priority: high
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l7-writing.html`: traced then from memory, no outline, `drawingWidth: 48`, radStrokes patch.

```gherkin
Feature: Section: Luyện viết (Hanzi Writer)
  As a learner
  I want to write each character, first traced and then from memory
  So that I remember the strokes

  Scenario: Trace round then memory round
    Given the lesson has characters 你, 好 and 们
    When I open "Luyện viết"
    Then each character has 2 rounds, 6 steps in total with counter "1/6"
    And round 1 shows the faint outline with "Lần 1: viết theo nét mờ"
    And round 2 shows no outline with "Lần 2: tự viết, không có nét mờ"

  Scenario: Stroke feedback and tools
    Given I am writing 你
    Then the stroke counter reads "nét 0/7" and rises with every correct stroke
    And "Xem mẫu" animates the character, "Gợi ý" highlights the next stroke and "Viết lại" restarts the round
    And the radical is red (patched in for characters whose Hanzi Writer data has no `radStrokes`, e.g. 再 见 气) and the pen width is 48

  Scenario: Mistakes are recorded as Attempts
    When I finish a round with 2 wrong strokes
    Then I see "Viết xong · 2 nét sai" and an Attempt for that character is recorded with 2 mistakes
    And a round with no wrong stroke shows "Viết xong · không sai nét nào"

  Scenario: Skip a character
    When I tap "Bỏ qua chữ này" on 你
    Then I jump to 好 round 1 and no Attempt is recorded for 你

  Scenario: Done screen lists only practised characters
    Given I skipped 好 and wrote 你 and 们
    When I reach the end
    Then I see "Xong phần Luyện viết" and "Bạn đã viết 2 chữ: 你 và 们"
    And 好 is not listed

  Scenario: Stroke data cannot load
    Given there is no network for the stroke data
    Then I see "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại."
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Trace round then memory round
- [ ] #2 Scenario: Stroke feedback and tools
- [ ] #3 Scenario: Mistakes are recorded as Attempts
- [ ] #4 Scenario: Skip a character
- [ ] #5 Scenario: Done screen lists only practised characters
- [ ] #6 Scenario: Stroke data cannot load
<!-- AC:END -->
