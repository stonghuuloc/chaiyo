---
id: CHY-33
title: 'Sections: Ngữ pháp + Hội thoại'
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
  - CHY-18
priority: high
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l4-grammar.html`, `l5-dialogue.html` (Hachiware ↔ Momonga, Pinyin/Nghĩa toggles as 34px pills).

```gherkin
Feature: Sections: Ngữ pháp + Hội thoại
  As a learner
  I want to learn a pattern and hear it in a conversation
  So that I can use it in a real situation

  Scenario: Grammar explanation
    Given I open "Ngữ pháp" in Bài 1
    Then I see "Điểm ngữ pháp 1", the pattern "A + 好" with "người được chào" and "luôn có"
    And 2 examples with audio, "Hay nhầm" showing 好你 as Sai and 你好 as Đúng
    And "Xem thêm" expands extra notes and the CTA reads "Làm bài" with "3 câu luyện nhanh"

  Scenario: Grammar practice
    When I do the 3 drills
    Then I get 2 choice questions ("Chào thầy cô (lịch sự)" → 您好, "Chào cả nhóm bạn" → 你们好) and 1 ordering question "Chào các bạn!" → 你们好
    And finishing shows "Xong phần Ngữ pháp" and "Mẫu A + 好 đã vào phần ôn tập"

  Scenario: Dialogue lines play in alternating Cast voices
    Given I open "Hội thoại" part 1 of 2
    When I tap "Nghe đoạn hội thoại"
    Then lines play one after another, Hachiware's lines on the left and Momonga's on the right, each in its own voice
    And the playing line is highlighted and the CTA reads "Đang phát 2/N"
    And tapping the CTA pauses and shows "Tạm dừng"

  Scenario: Tap a single line
    When I tap one line
    Then only that line plays

  Scenario: Pinyin and Nghĩa toggles persist per learner
    Given both pills "Pinyin" and "Nghĩa" are on
    When I switch "Nghĩa" off
    Then the meanings are hidden in both parts
    And after I leave and come back for another lesson, "Nghĩa" is still off for my account

  Scenario: Dialogue question and done
    Given I heard both parts
    When I answer "Hachiware nên trả lời thế nào?" after Momonga's clip
    Then the correct answer is 没关系。 with "méi guānxi · Không sao."
    And finishing shows "Xong phần Hội thoại"
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Grammar explanation
- [ ] #2 Scenario: Grammar practice
- [ ] #3 Scenario: Dialogue lines play in alternating Cast voices
- [ ] #4 Scenario: Tap a single line
- [ ] #5 Scenario: Pinyin and Nghĩa toggles persist per learner
- [ ] #6 Scenario: Dialogue question and done
<!-- AC:END -->
