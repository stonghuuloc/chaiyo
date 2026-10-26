---
id: CHY-43
title: Từ của tôi
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:49'
labels:
  - practice
milestone: m-6
dependencies:
  - CHY-41
priority: medium
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `t3-words.html` (pushed sub-page): learner's words with per-skill memory.

```gherkin
Feature: Từ của tôi
  As a learner
  I want to see every word I have learned or saved and how well I remember it
  So that I know which words are weak

  Scenario: List with memory bars
    Given I have 30 words, some taught in lessons and some "tự thêm"
    When I open "Từ của tôi" from the Luyện tập tab
    Then I see "30 từ đã học và đã lưu"
    And each row shows hanzi, pinyin, Hán Việt, nghĩa and a 3-bar memory meter
    And the legend reads "Cột = độ nhớ trên thẻ từ. Luyện đúng thì cột tăng, quên thì từ quay lại sớm hơn."

  Scenario: Order and due note
    Given 学生 is due today with 1 bar, and 你好 is known with 3 bars
    When the list renders
    Then 学生 is above 你好
    And 学生 shows "cần ôn hôm nay"
    And a never-practised word shows "chưa ôn"

  Scenario: Search my words
    When I type "hoc" in "Tìm trong từ của bạn"
    Then only words whose hanzi, pinyin, Hán Việt or nghĩa contain "hoc" ignoring accents remain
    And with no match I see "Không có từ nào khớp “xyz”."

  Scenario: Tap opens the Word Page
    When I tap the row 学生
    Then the Word Page for 学生 opens
    And back returns to Từ của tôi

  Scenario: Brand-new learner
    Given I have no words yet
    When I open "Từ của tôi"
    Then I see "Chưa có từ nào" and "Học Bài 1 để có từ đầu tiên."
    And the button "Học Bài 1" opens the Bài 1 lesson hub
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: List with memory bars
- [ ] #2 Scenario: Order and due note
- [ ] #3 Scenario: Search my words
- [ ] #4 Scenario: Tap opens the Word Page
- [ ] #5 Scenario: Brand-new learner
<!-- AC:END -->
