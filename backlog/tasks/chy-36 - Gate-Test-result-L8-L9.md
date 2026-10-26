---
id: CHY-36
title: Gate Test + result (L8/L9)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - lesson
milestone: m-5
dependencies:
  - CHY-31
  - CHY-20
priority: high
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l8-gate.html`, `l9-result.html`. ≥80% passes; retry draws fresh questions; confetti on pass only; pass/fail Cast art.

```gherkin
Feature: Gate Test + result (L8/L9)
  As a learner
  I want a final test that unlocks the next lesson
  So that I only move on once the lesson has stuck

  Scenario: Gate runs without feedback
    Given I open "Kiểm tra Bài 1" with 10 questions from Bài 1
    Then questions mix nghe → chữ, chữ → nghĩa, nghĩa → chữ, xếp câu and gõ pinyin
    And no answer is revealed and the hint reads "Không hiện đáp án đến khi nộp bài"
    And the last button reads "Nộp bài"
    And typing "zai4jian4" for 再见 previews "zàijiàn" and is graded correct, while "zàijian" is wrong

  Scenario: Pass unlocks the next lesson
    Given I answered 9 of 10 correctly
    Then the result shows "90%", "9/10 câu đúng · cần 80%" and "Đã mở Bài 2 · +1 ngày chuỗi"
    And `GatePassed` and `LessonUnlocked` are emitted and Bài 2 opens
    And confetti plays, the pass Cast art shows and the CTA reads "Về trang chủ"

  Scenario: Fail shows calm copy and no confetti
    Given I answered 6 of 10 correctly
    Then the result shows "60%" and "Gần được rồi. Cần 80% để mở Bài 2."
    And no confetti plays, the fail Cast art shows and Bài 2 stays locked

  Scenario: Wrong answers are reviewed
    Given I missed 4 questions
    Then I see "Câu chưa đúng (4)" listing each prompt, "Bạn:" my answer struck through, and the right answer with its pinyin
    And with no mistake I see "Không sai câu nào."

  Scenario: Retry draws fresh questions and keeps the best score
    Given my best score is 70% and I score 60%
    When I tap "Làm lại"
    Then I get a new draw and order of questions
    And the result still shows "Điểm cao nhất: 70%"

  Scenario: Exit without saving
    When I tap ✕ during the Gate
    Then I see "Thoát bài kiểm tra?" and "Điểm sẽ không được lưu."
    And "Thoát" returns me to the lesson hub with no score saved
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Gate runs without feedback
- [ ] #2 Scenario: Pass unlocks the next lesson
- [ ] #3 Scenario: Fail shows calm copy and no confetti
- [ ] #4 Scenario: Wrong answers are reviewed
- [ ] #5 Scenario: Retry draws fresh questions and keeps the best score
- [ ] #6 Scenario: Exit without saving
<!-- AC:END -->
