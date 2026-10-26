---
id: CHY-47
title: 'Notify: nightly rollover + Reminders'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - home
  - infra
milestone: m-7
dependencies:
  - CHY-21
  - CHY-23
priority: medium
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Edge Function on pg_cron every 15 min: `Study.rollover` per learner, then `sendReminders(now)` at the learner's time. At most one Reminder/day; none if the day already counts.

```gherkin
Feature: Notify: nightly rollover + Reminders
  As a developer
  I want a 15-minute job that rolls the streak over and sends one Reminder per learner
  So that learners are nudged only when it helps and the server agrees with the phone

  Background:
    Given pg_cron calls the Edge Function every 15 minutes
    And Notify runs against fake channels in tests

  Scenario: Learner who already studied gets nothing
    Given Lan's Reminder time is 20:00 and today already counts toward her Streak
    When sendReminders runs at 20:00 her local time
    Then the fake channels receive 0 messages for Lan
    And the result has Lan in skipped

  Scenario: Learner who has not studied gets exactly one Reminder
    Given Minh's Reminder time is 20:00, today does not count, push and email are on
    When sendReminders runs at 20:00 his local time
    Then each enabled channel receives 1 Reminder for Minh and he is in sent
    When the job runs again at 20:15, 20:30 and 20:45
    Then the fake channels receive no further message for Minh

  Scenario: Reminder fires at the learner's own time and timezone
    Given Minh is on Asia/Ho_Chi_Minh at 20:00 and Huy is on America/New_York at 20:00
    When the job runs at 13:00 UTC
    Then Minh gets a Reminder
    And Huy does not

  Scenario: No channel selected
    Given a learner who has turned off push, email and Telegram
    When sendReminders runs at their time
    Then nothing is sent and the learner is in skipped

  Scenario: Rollover on server equals phone
    Given an Attempt sequence with a missed day, one Freeze held, streak 12
    When Study.rollover runs on the Edge Function and on the phone for the same day and timezone
    Then both return the same Streak, Freezes and events (FreezeSpent)

  Scenario: Rollover runs before Reminders
    Given a learner missed yesterday and has no Freeze
    When the job runs
    Then rollover emits StreakReset first
    And only then is the Reminder decision made
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Learner who already studied gets nothing
- [ ] #2 Scenario: Learner who has not studied gets exactly one Reminder
- [ ] #3 Scenario: Reminder fires at the learner's own time and timezone
- [ ] #4 Scenario: No channel selected
- [ ] #5 Scenario: Rollover on server equals phone
- [ ] #6 Scenario: Rollover runs before Reminders
<!-- AC:END -->
