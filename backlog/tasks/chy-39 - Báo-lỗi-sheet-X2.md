---
id: CHY-39
title: Báo lỗi sheet (X2)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - lesson
milestone: m-5
dependencies:
  - CHY-30
  - CHY-23
priority: low
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Report a content error from a lesson step or Word Page.

```gherkin
Feature: Báo lỗi sheet (X2)
  As a learner
  I want to report a content error in two taps
  So that the admin can fix it

  Scenario: Open and send in two taps
    Given I am on a lesson step or a Word Page
    When I open "Báo lỗi", pick "Pinyin sai" and tap "Gửi"
    Then I see the toast "Đã gửi. Cảm ơn bạn!"
    And "Gửi" is disabled until a category is picked

  Scenario Outline: Categories
    When I open the sheet
    Then I can pick one of the chips "<category>"

    Examples:
      | category      |
      | Nghĩa sai     |
      | Pinyin sai    |
      | Hán Việt sai  |
      | Âm thanh lỗi  |
      | Khác          |

  Scenario: Report stores its context
    Given I report on lesson 1, step 3 of "Từ mới", word 你好, with the note "Hán Việt lệch"
    When I send it
    Then the report stores lesson id, step id, word id, the content sha of that content, the category and the free text "Hán Việt lệch"
    And the note is optional ("Ghi chú (không bắt buộc)")

  Scenario: Report reaches the Admin inbox
    When I send a report
    Then it appears in the Admin error-reports inbox (E10) as "Mới"

  Scenario: Offline report is sent later
    Given I am offline
    When I send a report
    Then it is queued and sent when the connection returns
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Open and send in two taps
- [ ] #2 Scenario: Categories
- [ ] #3 Scenario: Report stores its context
- [ ] #4 Scenario: Report reaches the Admin inbox
- [ ] #5 Scenario: Offline report is sent later
<!-- AC:END -->
