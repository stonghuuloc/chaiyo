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
Prototype `l4-grammar.html`, `l5-dialogue.html` (red panda ↔ takin, Pinyin/Nghĩa toggles as 34px pills).

```gherkin
Feature: Sections: Ngữ pháp + Hội thoại
  As a learner
  I want to learn a pattern and hear it in a conversation
  So that I can use it in a real situation

  Scenario: Grammar explanation
    Given I open "Ngữ pháp" in Bài 1
    Then I see "Điểm ngữ pháp 1/2", the pattern "A + 好" with "người được chào" and "luôn có"
    And 2 examples with audio, "Hay nhầm" showing 好你 as Sai and 你好 as Đúng
    And "Xem thêm" expands extra notes and the CTA reads "Làm bài" with "3 câu luyện nhanh"

  Scenario: Grammar practice
    When I do the 3 drills of point 1
    Then I get 2 choice questions ("Chào thầy cô (lịch sự)" → 您好, "Chào cả nhóm bạn" → 你们好) and 1 ordering question "Chào các bạn!" → 你们好
    And then I see "Điểm ngữ pháp 2/2" with the pairs 谢谢 → 不客气 and 对不起 → 没关系, and "Hay nhầm" showing 谢谢！没关系。 as Sai
    When I do its 3 choice drills (谢谢 → 不客气, 对不起 → 没关系, dropped the teacher's pen → 对不起)
    Then finishing shows "Xong phần Ngữ pháp" and "Mẫu A + 好 và các câu đáp đã vào phần ôn tập"

  Scenario: Dialogue lines play in alternating Cast voices
    Given I open "Hội thoại" part 1 of 2
    When I tap "Nghe đoạn hội thoại"
    Then lines play one after another, the red panda's lines on the left and the takin's on the right, each in its own voice
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

  Scenario: Pinyin default follows the level, drills never show pinyin
    Given I never touched the "Pinyin" pill
    When I open "Ngữ pháp" or "Hội thoại" in an HSK1 or HSK2 lesson
    Then pinyin shows under the explanation, examples and dialogue lines
    And in an HSK3 lesson it is hidden until I switch the pill on
    And no grammar drill or dialogue question shows pinyin in its prompt or options, whatever the pill says

  Scenario: Dialogue question and done
    Given I heard both parts
    When I answer "Gấu Đỏ nên trả lời thế nào?" after the takin's clip
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
- [ ] #7 Scenario: Pinyin default follows the level, drills never show pinyin
<!-- AC:END -->
