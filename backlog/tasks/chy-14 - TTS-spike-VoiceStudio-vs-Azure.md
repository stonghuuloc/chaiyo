---
id: CHY-14
title: 'TTS spike: VoiceStudio vs Azure'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:48'
labels:
  - slice-1
  - decision
  - audio
milestone: m-2
dependencies: []
priority: high
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spike from NOTES.md: polyphone control (行), 一/不 and 3-3 sandhi, model-weight licences, Cast voices (Hachiware, Momonga, narrator).

```gherkin
Feature: TTS spike: VoiceStudio vs Azure
  As a developer
  I want to pick the TTS engine by ear on the risky readings
  So that every lesson clip has correct tones and each Cast member keeps one voice

  Scenario: Same 30 sentences rendered by both engines
    Given a test set of 30 sentences covering polyphones, sandhi and Cast lines
    When the spike script renders the set with VoiceStudio and with Azure TTS
    Then the folder "spike/voicestudio/" holds 30 mp3 files
    And the folder "spike/azure/" holds 30 mp3 files
    And both folders use the same file names, so clip N is comparable across engines

  Scenario Outline: The test set covers the readings that break TTS
    Given the 30-sentence test set
    Then it contains at least one sentence with <case>
    And the listening sheet records the expected reading "<expected>" next to that sentence

    Examples:
      | case                         | expected         |
      | 行 as háng (银行)            | yín háng         |
      | 行 as xíng (不行)            | bù xíng          |
      | 不 before a tone-4 syllable  | bú (不客气)      |
      | 一 before each tone          | yī / yí / yì     |
      | two tone-3 syllables (你好)  | ní hǎo           |
      | a Hachiware line             | Hachiware voice  |
      | a Momonga line               | Momonga voice    |

  Scenario: Loc picks by ear
    Given the listening sheet lists each of the 30 sentences with clip A and clip B, engine order shuffled
    When Loc listens and marks the better clip for each sentence
    Then the sheet shows a tally per engine
    And Loc names one engine as the winner

  Scenario: ADR records the choice, licence status and Cast voice map
    Given Loc has named the winning engine
    When the ADR file "docs/adr/0002-tts-engine.md" is written
    Then it states the chosen engine and the tally from the listening sheet
    And it states the licence status of the model weights (allowed for commercial use: yes or no, with the licence name)
    And it maps hachiware, momonga and the narrator to one fixed voice id each

  Scenario: The content-schema open decision is closed
    Given "docs/content-schema.md" lists open decision 3 "Cast voice per member (and gender) waits on the VoiceStudio spike"
    When the ADR is merged
    Then open decision 3 is removed from the list or links to the ADR
    And "content/cast.yaml" gets the voice ids from the ADR map
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Same 30 sentences rendered by both engines
- [ ] #2 Scenario: The test set covers the readings that break TTS
- [ ] #3 Scenario: Loc picks by ear
- [ ] #4 Scenario: ADR records the choice, licence status and Cast voice map
- [ ] #5 Scenario: The content-schema open decision is closed
<!-- AC:END -->
