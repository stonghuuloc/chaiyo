---
id: CHY-48
title: 'Reminder channels: Web Push, Email, Telegram'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:51'
labels:
  - home
  - infra
milestone: m-7
dependencies:
  - CHY-47
  - CHY-27
priority: medium
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adapters: Web Push (VAPID + service worker), Resend, Telegram bot link flow.

```gherkin
Feature: Reminder channels: Web Push, Email, Telegram
  As a learner
  I want my Reminder on push, email or Telegram, whichever I switch on
  So that the nudge reaches me where I look

  Scenario: Web Push test Reminder
    Given I switched on "Thông báo" in settings and allowed notifications on my phone
    When a test Reminder is sent through the Web Push adapter (VAPID)
    Then my service worker shows the notification on that real device

  Scenario: Email test Reminder
    Given "Email" is on for a real account
    When a test Reminder is sent through Resend
    Then the email arrives in that inbox

  Scenario: Telegram link flow
    Given I open "Kết nối Telegram" in settings
    When I tap "Mở Telegram", then "Start" in @ChaiyoBot, then "Tôi đã bấm Start"
    Then the bot link is stored for my account
    And settings show "Đã kết nối @ChaiyoBot"
    And a test Reminder arrives in my Telegram chat

  Scenario: Dead push token removed after 410
    Given a stored push subscription whose endpoint answers HTTP 410
    When a Reminder is sent to it
    Then the subscription is deleted
    And the next Reminder does not try it again

  Scenario: Push blocked by the browser
    Given the browser blocks notifications
    When I look at settings
    Then I see "Trình duyệt đang chặn thông báo. Nhắc qua Email hoặc Telegram, hoặc bật lại trong cài đặt trình duyệt."

  Scenario: One channel failing does not stop the others
    Given push, email and Telegram are all on and Telegram returns an error
    When the Reminder is sent
    Then push and email are still delivered
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Web Push test Reminder
- [ ] #2 Scenario: Email test Reminder
- [ ] #3 Scenario: Telegram link flow
- [ ] #4 Scenario: Dead push token removed after 410
- [ ] #5 Scenario: Push blocked by the browser
- [ ] #6 Scenario: One channel failing does not stop the others
<!-- AC:END -->
