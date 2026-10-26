---
id: CHY-27
title: Welcome first run (O1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:50'
labels:
  - auth
milestone: m-4
dependencies:
  - CHY-26
  - CHY-23
priority: medium
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `prototype/o1-welcome.html`: name + photo → reminder time + channels (Push/Email/Telegram, real permission prompt) → placement offer.

```gherkin
Feature: Welcome first run (O1)
  As a learner
  I want to confirm my name and photo, pick a reminder time and channels, then choose where to start
  So that friends see the right profile and reminders reach me

  Scenario: Name and photo prefilled from Google
    Given I signed in for the first time as Google account "Tống Lộc", "tong.loc@gmail.com"
    Then I see "Chào bạn!" and "Đây là tên và ảnh bạn bè sẽ thấy. Lấy từ tài khoản Google, sửa được."
    And the field "Tên hiển thị" holds "Tống Lộc" (max 30 characters)
    And "Tiếp" is disabled while the name is empty

  Scenario: Reminder time presets and custom time
    Given I am on "Nhắc học mỗi ngày"
    Then I see presets 07:00 Sáng, 12:30 Trưa, 21:00 Tối with 21:00 selected
    When I choose "Giờ khác" and pick 06:15
    Then no preset is selected and the reminder time is 06:15

  Scenario Outline: Push permission
    Given I switch on "Thông báo"
    When the browser's real permission prompt is answered "<answer>"
    Then <result>
    And "Email" and "Telegram" can still be switched and I can still tap "Tiếp"

    Examples:
      | answer  | result                                                                                                                                                  |
      | granted | the switch is on and the subtitle reads "Trên máy này"                                                                                                  |
      | denied  | the switch is off and disabled and I see "Trình duyệt đang chặn thông báo. Nhắc qua Email hoặc Telegram, hoặc bật lại trong cài đặt trình duyệt."       |

  Scenario: No channel chosen
    Given "Thông báo", "Email" and "Telegram" are all off
    Then I see "Không chọn kênh nào: sẽ không có lời nhắc" under "Tiếp"
    And I can still continue

  Scenario: Settings persist to the profile
    Given I set name "Lộc", a new photo, reminder 07:00, Email on, Telegram off, Push off
    When I finish the flow
    Then my profile stores name "Lộc", the photo, reminder 07:00 and those channel settings
    And the step shows "Đổi lúc nào cũng được ở Tôi → Cài đặt."

  Scenario Outline: Placement offer
    Given I am on "Bạn đã biết tiếng Trung chưa?"
    When I tap "<button>"
    Then <result>

    Examples:
      | button               | result                                                   |
      | Học từ đầu           | I land on Home with Bài 0 as the current lesson          |
      | Kiểm tra trình độ    | the Placement Test starts                                |
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Name and photo prefilled from Google
- [ ] #2 Scenario: Reminder time presets and custom time
- [ ] #3 Scenario: Push permission
- [ ] #4 Scenario: No channel chosen
- [ ] #5 Scenario: Settings persist to the profile
- [ ] #6 Scenario: Placement offer
<!-- AC:END -->
