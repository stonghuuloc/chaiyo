---
id: CHY-51
title: Badges screen (U1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:53'
labels:
  - me
milestone: m-9
dependencies:
  - CHY-22
  - CHY-50
priority: low
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `u1-badges.html`: earned grid with dates, "Sắp mở" with progress, badge sheet with "Khoe với bạn bè".

```gherkin
Feature: Badges screen (U1)
  As a learner
  I want to see the badges I earned and how to unlock the rest
  So that I have small goals to aim for and can show off

  Background:
    Given I am a learner with best streak 12, 12 words, Bài 0 passed
    And I open "Huy hiệu"

  Scenario: Summary and earned grid
    Then the title reads "Có 2/9 huy hiệu"
    And the line reads "Ngon lành rồi đó. Còn 7 cái nữa, từ từ mà sưu tầm."
    And the "Đã có" grid shows "Bước đầu tiên" and "Chuỗi 7 ngày", each with "Ngày <dd/mm>"

  Scenario: Earned dates match BadgeEarned events
    Given Study emitted BadgeEarned "first" on 12/10 and BadgeEarned "streak7" on 18/10
    Then "Bước đầu tiên" shows "Ngày 12/10" and "Chuỗi 7 ngày" shows "Ngày 18/10"
    And no earned badge shows a date that has no BadgeEarned event

  Scenario: Upcoming badges show progress
    Then the section "Sắp mở" lists locked badges ordered nearest first
    And "Chuỗi 30 ngày" shows "12/30" with a progress bar
    And "Đỗ HSK 1" shows "Qua thi thử HSK 1." with no bar

  Scenario: Brand-new learner
    Given I have earned nothing
    Then the line reads "Chưa có cái nào. Cái đầu tiên gần ngay trước mắt rồi!"
    And the section "Thử mở 3 cái này trước" lists the 3 nearest badges and "Còn lại" lists the rest

  Scenario: Badge sheet for an earned badge
    When I tap "Chuỗi 7 ngày"
    Then a sheet opens with the art, "Học 7 ngày liền, không bỏ buổi nào." and "Đã có từ ngày 18/10"
    And a button "Khoe với bạn bè" is shown

  Scenario: Badge sheet for a locked badge
    When I tap "Chuỗi 30 ngày"
    Then the sheet shows "Đang ở 12/30" with a progress bar
    And there is no "Khoe với bạn bè" button

  Scenario: Share copies a public link
    Given the sheet for "Chuỗi 7 ngày" is open
    When I tap "Khoe với bạn bè"
    Then a public link for that badge is copied to the clipboard
    And a toast shows "Đã sao chép link"
    And when copying fails the toast shows "Chưa sao chép được, thử lại nhé"
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Summary and earned grid
- [ ] #2 Scenario: Earned dates match BadgeEarned events
- [ ] #3 Scenario: Upcoming badges show progress
- [ ] #4 Scenario: Brand-new learner
- [ ] #5 Scenario: Badge sheet for an earned badge
- [ ] #6 Scenario: Badge sheet for a locked badge
- [ ] #7 Scenario: Share copies a public link
<!-- AC:END -->
