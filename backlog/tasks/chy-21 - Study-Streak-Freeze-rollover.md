---
id: CHY-21
title: 'Study: Streak + Freeze rollover'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:51'
labels:
  - slice-1
  - core
milestone: m-3
dependencies:
  - CHY-19
priority: high
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A day counts on finishing one section or one practice session. +1 Freeze per 7 counted days in a row, max 2, auto-spent on a missed day; a frozen day keeps but doesn't add; no Freeze → Streak 0, Badges kept. Learner timezone.

```gherkin
Feature: Study: Streak + Freeze rollover
  As a developer
  I want rollover to count days, earn and spend Freezes, and reset the Streak
  So that the phone and the nightly server job always agree

  Background:
    Given the learner's timezone is "Asia/Ho_Chi_Minh"
    And the learner has a Streak of 12, 1 Freeze, and today is T6 and not yet counted

  Scenario: Finishing a section counts today
    When Study applies the Attempt that finishes a section at 21:00 on T6
    And rollover runs for T6
    Then it emits DayCounted for T6
    And the Streak is 13

  Scenario: Two sections in one day count once
    When Study applies Attempts finishing 2 sections on T6
    And rollover runs for T6
    Then DayCounted is emitted exactly once for T6
    And the Streak is 13, not 14

  Scenario: A practice session also counts
    When Study applies Attempts that finish one practice session on T6
    And rollover runs for T6
    Then it emits DayCounted for T6

  Scenario: Missed day with a Freeze keeps the Streak without adding
    Given the learner counted T2 and T3 and nothing on T4
    When rollover runs for T4
    Then it emits FreezeSpent for T4
    And the Streak stays 12 and the Freeze count drops from 1 to 0
    And no DayCounted is emitted for T4

  Scenario: Missed day without a Freeze resets the Streak
    Given the learner has 0 Freezes and nothing counted on T4
    When rollover runs for T4
    Then it emits StreakReset
    And the Streak is 0
    And earned Badges are unchanged

  Scenario: Seventh counted day earns a Freeze
    Given the Streak is 6 with 0 Freezes
    When the learner counts day 7
    Then it emits FreezeEarned and the Freeze count is 1

  Scenario: Freeze cap is 2
    Given the Streak is 13 with 2 Freezes
    When the learner counts day 14
    Then no FreezeEarned is emitted
    And the Freeze count stays 2

  Scenario: Day boundary uses the learner's timezone
    Given the learner is in "Asia/Ho_Chi_Minh" (UTC+7)
    When Study applies a section-finish Attempt at 2026-10-23T17:30Z, which is 00:30 on 24 Oct locally
    Then DayCounted is emitted for 24 Oct, not 23 Oct

  Scenario: A DST change does not lose or double a day
    Given the learner's timezone is "America/New_York"
    And the learner counts a day on the Saturday before a DST change and on the Sunday and Monday after it
    When rollover runs for each day
    Then DayCounted is emitted once per calendar day
    And no FreezeSpent or StreakReset is emitted
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Finishing a section counts today
- [ ] #2 Scenario: Two sections in one day count once
- [ ] #3 Scenario: A practice session also counts
- [ ] #4 Scenario: Missed day with a Freeze keeps the Streak without adding
- [ ] #5 Scenario: Missed day without a Freeze resets the Streak
- [ ] #6 Scenario: Seventh counted day earns a Freeze
- [ ] #7 Scenario: Freeze cap is 2
- [ ] #8 Scenario: Day boundary uses the learner's timezone
- [ ] #9 Scenario: A DST change does not lose or double a day
<!-- AC:END -->
