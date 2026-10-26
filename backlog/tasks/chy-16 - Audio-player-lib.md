---
id: CHY-16
title: Audio player lib
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:49'
labels:
  - slice-1
  - audio
milestone: m-2
dependencies:
  - CHY-15
priority: high
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`play(key, { slow })`; second tap of the same clip = 0.5× with pitch kept. Port from `prototype/step.js` play().

```gherkin
Feature: Audio player lib
  As a learner
  I want to tap a clip to hear it, and tap again to hear it slowly
  So that I can catch every tone

  Scenario Outline: Tapping the same clip alternates normal and slow
    Given the clip "<key>" has not been played yet
    When I tap its play button <taps> times in a row
    Then the last play runs at playback rate <rate>
    And pitch preservation (`preservesPitch`) is on

    Examples:
      | key | taps | rate |
      | 11  | 1    | 1    |
      | 11  | 2    | 0.5  |
      | 11  | 3    | 1    |
      | 11  | 4    | 0.5  |

  Scenario: A different clip starts at normal speed
    Given I tapped clip "11" twice and it played at 0.5×
    When I tap clip "12"
    Then clip "12" plays at 1×
    And tapping clip "11" again plays it at 1×, not 0.5×

  Scenario: Opened lessons play offline
    Given I opened Bài 1 online and its clips were cached by the service worker
    And the phone is in airplane mode
    When I tap a Bài 1 clip
    Then the clip plays from the service-worker cache

  Scenario: An uncached clip offline fails quietly
    Given the phone is in airplane mode
    And the clip "99" was never cached
    When I tap its play button
    Then no sound plays
    And the app does not crash or show an uncaught error

  Scenario: Works on iOS Safari after the first gesture
    Given iOS Safari with a Bài 1 lesson step open
    When I tap a play button for the first time
    Then the clip plays
    And later taps on other clips also play without another permission prompt
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Tapping the same clip alternates normal and slow
- [ ] #2 Scenario: A different clip starts at normal speed
- [ ] #3 Scenario: Opened lessons play offline
- [ ] #4 Scenario: An uncached clip offline fails quietly
- [ ] #5 Scenario: Works on iOS Safari after the first gesture
<!-- AC:END -->
