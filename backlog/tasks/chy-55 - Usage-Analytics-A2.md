---
id: CHY-55
title: Usage Analytics (A2)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - admin
milestone: m-10
dependencies:
  - CHY-23
priority: low
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `a2-usage.html`: raw numbers only — active learners, gate fail per lesson, drop-off per section, reminder sent → opened → studied, 7 | 30 days.

```gherkin
Feature: Usage Analytics (A2)
  As an admin
  I want raw usage numbers computed from our own data
  So that I can see where learners drop off, without a third-party tracker

  Background:
    Given I am signed in as an admin
    And I open "Số liệu sử dụng" on the 7-day range

  Scenario: Active learners
    Then "Người đang học" lists "Hôm nay", "7 ngày", "30 ngày" with a count each
    And each count is the number of learners who opened a lesson in that window

  Scenario: Gate fail per lesson
    Then "Kiểm tra cổng bài" has columns "Lượt thi", "Trượt", "Trượt/thi"
    And the row "Bài 1" shows "9", "4" and "4/9"

  Scenario: Drop-off per section
    Then for each lesson, 7 bars show learners reaching "Khởi động", "Từ mới", "Ngữ pháp", "Hội thoại", "Nghe", "Luyện viết", "Kiểm tra"
    And bar length is relative to the number who started the lesson

  Scenario: Reminder effectiveness
    Then for each channel (Email, Telegram, Thông báo đẩy) I see "Đã gửi", "Đã mở", "Đã học" counts
    And bar length is relative to "Đã gửi"

  Scenario: Switch to 30 days
    When I tap "30 ngày"
    Then every table recalculates for "30 ngày qua"
    And the choice is remembered on reload

  Scenario: Raw numbers only
    Then the screen shows raw counts, no verdict percentages and no trend charts
    And it shows the note "Ít người dùng: số thô, chưa đủ để kết luận."

  Scenario: Numbers computed from Attempts and Notify logs, no third-party tracker
    When the page loads
    Then every figure is derived from the Attempts table and the Notify send log
    And the page makes no request to any third-party analytics domain
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Active learners
- [ ] #2 Scenario: Gate fail per lesson
- [ ] #3 Scenario: Drop-off per section
- [ ] #4 Scenario: Reminder effectiveness
- [ ] #5 Scenario: Switch to 30 days
- [ ] #6 Scenario: Raw numbers only
- [ ] #7 Scenario: Numbers computed from Attempts and Notify logs, no third-party tracker
<!-- AC:END -->
