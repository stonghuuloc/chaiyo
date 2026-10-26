---
id: CHY-57
title: 'Speech: scripted pronunciation scoring'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - speech
milestone: m-11
dependencies:
  - CHY-34
priority: low
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/api/speech` with server-side Azure token; scripted pronunciation assessment for repeat/read-aloud; own per-syllable tone contour check. Label "điểm ước tính"; never store audio.

```gherkin
Feature: Speech: scripted pronunciation scoring
  As a learner
  I want to read a word or sentence aloud and see which syllables were off
  So that I can fix my tones

  Background:
    Given the learner is on a "Nói" run with the reference text "没关系。"

  Scenario: Token stays on the server
    When the app asks `/api/speech` for a scoring session
    Then the response contains a short-lived token and no Azure key
    And the Azure key appears nowhere in the shipped client bundle

  Scenario: Scripted score per syllable
    When the learner records "没关系" and submits
    Then Azure scripted pronunciation assessment (zh-CN) scores it against "没关系"
    And the result lists each syllable as correct or wrong

  Scenario: Own tone contour check
    Given the learner says "guānxi" with a wrong tone on "xi"
    Then our per-syllable pitch-contour check flags "xi" as the wrong tone
    And the feedback names the expected and heard tone

  Scenario: Score label is honest
    Then the score is labelled "điểm ước tính"

  Scenario: Recording deleted after scoring
    Given a fake Scorer returns a fixed score
    When the learner submits a recording
    Then the audio blob is deleted from the device and the server after scoring
    And a test asserts no audio is persisted in storage or the database

  Scenario: Scoring fails
    Given the Scorer returns an error
    Then the learner can record again
    And the failed recording is deleted

  Scenario: Calibrated on hand-graded recordings
    Given about 20 hand-graded recordings
    When the scorer is run on them
    Then its scores agree with the hand grades within an agreed tolerance recorded in the repo
    And the "Nói" sample label on L5 is removed
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Token stays on the server
- [ ] #2 Scenario: Scripted score per syllable
- [ ] #3 Scenario: Own tone contour check
- [ ] #4 Scenario: Score label is honest
- [ ] #5 Scenario: Recording deleted after scoring
- [ ] #6 Scenario: Scoring fails
- [ ] #7 Scenario: Calibrated on hand-graded recordings
<!-- AC:END -->
