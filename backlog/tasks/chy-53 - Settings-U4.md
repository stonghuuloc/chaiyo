---
id: CHY-53
title: Settings (U4)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:53'
labels:
  - me
milestone: m-9
dependencies:
  - CHY-23
  - CHY-50
priority: medium
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `u4-settings.html`: profile, Reminders, Xingshu toggle, hide profile, delete account (pending deletion with restore).

```gherkin
Feature: Settings (U4)
  As a learner
  I want to control my profile, reminders, font and privacy
  So that the app fits me and I can leave safely

  Background:
    Given I am "Tống Lộc" with email "tong.loc@gmail.com" and open "Cài đặt"

  Scenario: Edit profile
    When I change "Tên hiển thị" to "Lộc T"
    Then the avatar initials update and the name is saved
    When I clear the name field and leave it
    Then the previous name is restored
    When I pick a photo
    Then it is cropped square, saved, and a toast shows "Ảnh đẹp đó!" and "Bỏ ảnh" appears

  Scenario Outline: Reminder time
    When I tap the time "<time>"
    Then "<time>" is selected and saved

    Examples:
      | time  |
      | 07:00 |
      | 12:30 |
      | 21:00 |

  Scenario: Custom reminder time
    When I choose "Giờ khác" and enter 20:15
    Then no preset is selected and 20:15 is saved

  Scenario: Reminder changes apply to the next Notify run
    Given the reminder is 21:00 by Email
    When I change it to 07:00 and switch Email off and Telegram on
    Then the next Notify run uses 07:00 and sends only via Telegram

  Scenario: No channel selected
    When I switch off Thông báo, Email and Telegram
    Then I see "Không chọn kênh nào: sẽ không có lời nhắc."

  Scenario: Browser blocks push
    Given the browser permission for notifications is denied
    When I switch on "Thông báo"
    Then it stays off and I see "Trình duyệt đang chặn thông báo. Nhắc qua Email hoặc Telegram, hoặc bật lại trong cài đặt trình duyệt."

  Scenario: Connect Telegram
    When I switch on "Telegram"
    Then a sheet "Kết nối Telegram" shows 3 steps and buttons "Mở Telegram" and "Tôi đã bấm Start"
    When I tap "Tôi đã bấm Start"
    Then a toast shows "Telegram đã kết nối" and the row reads "Đã kết nối @ChaiyoBot"

  Scenario: Xingshu font toggle
    When I pick "Hành thư"
    Then Chinese characters on cards and lessons use the Xingshu style
    And the note says it is only a preview
    When I pick "Khải thư"
    Then the default Kaishu style returns

  Scenario: Hide public profile
    When I switch on "Ẩn hồ sơ công khai"
    Then a toast shows "Hồ sơ đã ẩn" and other learners can no longer find me

  Scenario: Delete puts the account in pending deletion
    When I tap "Xoá tài khoản"
    Then a sheet says the account is kept 7 days and the red button "Xoá tài khoản" is disabled
    When I type "XOÁ" and tap "Xoá tài khoản"
    Then a banner shows "Đang chờ xoá · còn 7 ngày" and the settings are locked
    And the account state is Pending deletion

  Scenario: Typing the wrong word keeps delete disabled
    When I type "xoa" in the confirmation box
    Then "Xoá tài khoản" stays disabled

  Scenario: Login within the window restores the account
    Given my account is Pending deletion with 5 days left
    When I log in with Google
    Then I am offered to restore, and after "Khôi phục tài khoản" a toast shows "Mừng bạn quay lại!"
    And all my words, streak and friends are intact
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Edit profile
- [ ] #2 Scenario: Reminder time
- [ ] #3 Scenario: Custom reminder time
- [ ] #4 Scenario: Reminder changes apply to the next Notify run
- [ ] #5 Scenario: No channel selected
- [ ] #6 Scenario: Browser blocks push
- [ ] #7 Scenario: Connect Telegram
- [ ] #8 Scenario: Xingshu font toggle
- [ ] #9 Scenario: Hide public profile
- [ ] #10 Scenario: Delete puts the account in pending deletion
- [ ] #11 Scenario: Typing the wrong word keeps delete disabled
- [ ] #12 Scenario: Login within the window restores the account
<!-- AC:END -->
