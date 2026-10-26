---
id: CHY-18
title: Talking Cast component
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:50'
labels:
  - slice-1
  - audio
  - ui
milestone: m-2
dependencies:
  - CHY-16
priority: medium
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hachiware speaks in listening steps: 3 art frames swapped by clip loudness + bob. Port `prototype/talk.js`.

```gherkin
Feature: Talking Cast component
  As a learner
  I want Hachiware to speak the clip with a moving mouth in listening steps
  So that listening feels like someone talking to me

  Scenario Outline: Mouth frame follows clip loudness
    Given the Hachiware art has 3 frames: closed, half, open
    And a clip is playing
    When the clip loudness (0 to 1) is <level>
    Then the stage shows the <frame> frame

    Examples:
      | level | frame  |
      | 0.05  | closed |
      | 0.30  | half   |
      | 0.80  | open   |

  Scenario: Hachiware bobs with the sound
    Given a clip is playing and its loudness is high
    Then the picture moves up and tilts a little
    And when the clip ends the picture returns to rest with the closed frame

  Scenario: Tap replays
    Given the clip has finished
    When I tap Hachiware or the ▶ button
    Then the clip plays again
    And a second tap on the same clip plays it at 0.5×

  Scenario: Reduced motion shows a static frame
    Given my device has "reduce motion" turned on
    When a listening step plays its clip
    Then the stage shows one static frame, with no mouth swapping and no bob
    And the clip still plays and the ▶ button still replays it
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Mouth frame follows clip loudness
- [ ] #2 Scenario: Hachiware bobs with the sound
- [ ] #3 Scenario: Tap replays
- [ ] #4 Scenario: Reduced motion shows a static frame
<!-- AC:END -->
