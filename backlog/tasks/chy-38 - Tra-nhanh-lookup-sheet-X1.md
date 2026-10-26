---
id: CHY-38
title: Tra nhanh lookup sheet (X1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - lesson
milestone: m-5
dependencies:
  - CHY-30
  - CHY-25
priority: medium
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tap any hanzi in lesson text → sheet with reading, Hán Việt, meaning → Word Page for taught words; save untaught word to Lexicon as "tự thêm". Known prototype gap: L5 has no tap-to-lookup.

```gherkin
Feature: Tra nhanh lookup sheet (X1)
  As a learner
  I want to tap any hanzi and see what it means
  So that I never lose my place in the lesson

  Scenario Outline: Tap works in every lesson text
    Given I am on <screen>
    When I tap a hanzi
    Then a sheet opens with its reading, Hán Việt and meaning
    And the sheet does not cover the tapped text

    Examples:
      | screen                     |
      | a dialogue line in Hội thoại |
      | a grammar example          |
      | a word card in Từ mới      |

  Scenario: Longest match with option to shrink
    When I tap 谢 inside 谢谢
    Then the sheet shows the longest dictionary match 谢谢
    And I can shrink it to the single character 谢

  Scenario: Taught word opens the Word Page
    Given the tapped word is taught in a lesson
    Then the sheet offers "Xem chi tiết"
    And tapping it opens the Word Page (W1)

  Scenario: Untaught word can be saved
    Given the tapped word is not taught yet
    When I tap "Thêm vào từ của tôi"
    Then I see "Đã thêm <hanzi> vào Từ của tôi"
    And the word appears in Từ của tôi marked "tự thêm"
    And it joins the daily review

  Scenario: Already saved word
    Given the tapped word is already in my Lexicon
    Then the sheet shows no add button
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Tap works in every lesson text
- [ ] #2 Scenario: Longest match with option to shrink
- [ ] #3 Scenario: Taught word opens the Word Page
- [ ] #4 Scenario: Untaught word can be saved
- [ ] #5 Scenario: Already saved word
<!-- AC:END -->
