---
id: CHY-54
title: Error Reports inbox (A1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - admin
milestone: m-10
dependencies:
  - CHY-39
priority: low
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `a1-reports.html`: Mới | Đã xử lý, category chips, resolve + undo. Admin role only.

```gherkin
Feature: Error Reports inbox (A1)
  As an admin
  I want to triage content error reports from learners
  So that wrong meanings, pinyin and audio get fixed

  Background:
    Given I am signed in as an admin
    And 10 reports exist, all unresolved

  Scenario: Inbox lists new reports
    When I open "Báo lỗi nội dung"
    Then the tab "Mới" shows 10 and "Đã xử lý" shows 0
    And the chips read "Tất cả · 10", "Nghĩa sai", "Pinyin sai", "Âm thanh lỗi", "Khác" each with its count
    And each card shows the word or lesson step, category tag, reporter and "12 phút trước", and the note or "Không có ghi chú"

  Scenario: Card links to the content
    When I tap the card for the word "你好"
    Then the word page for 你好 opens
    When I tap a card for a lesson step "Bài 1 · Hội thoại · Gặp nhau"
    Then the lesson's word list opens

  Scenario: Filter by category
    When I tap "Âm thanh lỗi"
    Then only reports with that category are listed
    And with none left it shows "Mục này đang yên ắng" and "Không có báo lỗi “Âm thanh lỗi” nào đang chờ."

  Scenario: Resolve and undo persist
    When I tap "Đánh dấu đã xử lý" on report r1
    Then r1 leaves "Mới" and a toast shows "Đã xử lý xong, gọn gàng!" with "Hoàn tác"
    When I tap "Hoàn tác"
    Then r1 returns to "Mới"
    When I resolve r1 again and reload
    Then r1 is still under "Đã xử lý" showing "Đã xử lý" and "Mở lại"

  Scenario: Empty states
    Given all reports are resolved
    Then "Mới" shows "Hộp thư sạch bong!"
    Given none are resolved
    Then "Đã xử lý" shows "Chưa xử lý cái nào"

  Scenario: Non-admins cannot read reports
    Given I am signed in as a normal learner
    When I query the error reports table
    Then RLS returns no rows
    And the menu on Tôi has no "Báo lỗi nội dung" entry
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Inbox lists new reports
- [ ] #2 Scenario: Card links to the content
- [ ] #3 Scenario: Filter by category
- [ ] #4 Scenario: Resolve and undo persist
- [ ] #5 Scenario: Empty states
- [ ] #6 Scenario: Non-admins cannot read reports
<!-- AC:END -->
