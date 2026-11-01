---
id: CHY-68
title: Mic and headphone check before speaking
status: To Do
assignee: []
created_date: '2026-11-01 09:05'
labels:
  - speech
milestone: m-11
dependencies: []
priority: low
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Without a check, a dead mic looks like bad pronunciation. Runs before the first question of K2 Nói and of a mock's Nói part. The check records nothing (CONTEXT.md: the app keeps no audio of Learners). Reference: Migii's HSKK pre-check.

```gherkin
Feature: Mic and headphone check
  As a learner
  I want to know my mic and headphones work before I speak
  So that a bad score never comes from broken hardware

  Scenario: Level meter reacts to my voice
    Given I open "Nói" on K2
    When I speak
    Then the level meter moves
    And after a clear peak it reads "Mic ổn" and "Bắt đầu" is enabled

  Scenario: Test sound for headphones
    When I tap the speaker icon
    Then a short zh-CN test clip plays

  Scenario: Permission denied
    Given the browser denies mic access
    Then the screen explains how to allow the mic for this site
    And "Bắt đầu" stays disabled

  Scenario: Silent mic
    Given the mic gives no signal for 5 seconds
    Then the screen says "Không nghe thấy gì" with "Thử lại"
    And "Bắt đầu" stays disabled

  Scenario: Asked once per app session
    Given the check passed earlier in this app session
    When I open another speaking run
    Then the check is skipped

  Scenario: Nothing is recorded
    Then the check keeps no audio on the device or the server
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Level meter reacts to my voice
- [ ] #2 Scenario: Test sound for headphones
- [ ] #3 Scenario: Permission denied
- [ ] #4 Scenario: Silent mic
- [ ] #5 Scenario: Asked once per app session
- [ ] #6 Scenario: Nothing is recorded
<!-- AC:END -->
