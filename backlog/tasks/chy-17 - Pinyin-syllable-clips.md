---
id: CHY-17
title: Pinyin syllable clips
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:49'
labels:
  - audio
milestone: m-2
dependencies:
  - CHY-15
  - CHY-11
priority: medium
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
~1,600 clips (syllables × 4 tones) for the Primer and Pinyin Table; prototype used edge-tts in `prototype/audio/py/`.

```gherkin
Feature: Pinyin syllable clips
  As a learner
  I want to tap any cell of the Pinyin Table and hear the syllable in each tone
  So that I learn tones by ear

  Scenario: Every syllable in every tone has a clip
    Given "syllables.yaml" lists every valid pinyin syllable (initial × final)
    When I run the syllable-clip check
    Then it exits with code 0
    And it prints "missing: 0" for the 4 tones of every syllable

  Scenario: A missing clip fails the check
    Given the clip for "ba" tone 3 is deleted from the bucket
    When I run the syllable-clip check
    Then it exits with code 1
    And it prints "missing: ba3"

  Scenario Outline: A cell plays the right tone
    Given the Pinyin Table is open
    When I tap the cell "<syllable>" and then the tone button <tone>
    Then the clip played is "<syllable><tone>" in the narrator voice
    And the tone I hear is <contour>

    Examples:
      | syllable | tone | contour           |
      | ba       | 1    | high and level    |
      | ba       | 2    | rising            |
      | ba       | 3    | falling then rising |
      | ba       | 4    | falling           |

  Scenario: Tap test on 20 random cells
    Given the Pinyin Table is open
    When I tap 20 randomly chosen syllable × tone cells
    Then every one of the 20 plays a clip
    And Loc confirms by ear that each clip has the tone of the cell
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Every syllable in every tone has a clip
- [ ] #2 Scenario: A missing clip fails the check
- [ ] #3 Scenario: A cell plays the right tone
- [ ] #4 Scenario: Tap test on 20 random cells
<!-- AC:END -->
