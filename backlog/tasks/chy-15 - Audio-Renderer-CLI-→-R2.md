---
id: CHY-15
title: Audio Renderer CLI → R2
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:48'
labels:
  - slice-1
  - audio
milestone: m-2
dependencies:
  - CHY-14
  - CHY-8
priority: high
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`render(manifest) → { uploaded, skipped }`, key `sha256(hanzi|voice)`, normal speed only.

```gherkin
Feature: Audio Renderer CLI → R2
  As a developer
  I want a renderer that turns the audio manifest into mp3 files on R2
  So that every sentence and word has one clip and re-runs cost nothing

  Background:
    Given an audio manifest with 3 entries: "你好！" by hachiware, "你好！" by momonga, "谢谢" by narrator
    And an empty R2 bucket

  Scenario: First render uploads every clip
    When I run the renderer on the manifest
    Then the result is { uploaded: 3, skipped: 0 }
    And the bucket holds 3 mp3 objects

  Scenario: Re-running uploads nothing new
    Given the renderer has already run once on the manifest
    When I run the renderer again on the same manifest
    Then the result is { uploaded: 0, skipped: 3 }
    And the TTS engine is called 0 times

  Scenario: Key is sha256 of hanzi and voice, normal speed only
    When I run the renderer on the manifest
    Then the object key of "你好！" by hachiware is sha256("你好！|" + the hachiware voice id)
    And "你好！" by hachiware and "你好！" by momonga get two different keys
    And no object exists for a slow-speed variant, because slow play is the client replaying at 0.5×

  Scenario: Only the new entry is rendered
    Given the renderer has already run once on the manifest
    When a 4th entry "再见" by narrator is added and I run the renderer again
    Then the result is { uploaded: 1, skipped: 3 }

  Scenario: Bài 1 clips play from the R2 public URL
    Given the renderer has run on the Bài 1 manifest
    When I open the R2 public URL for the key of a Bài 1 sentence in a browser
    Then the response is HTTP 200 with content type "audio/mpeg"
    And the clip plays
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: First render uploads every clip
- [ ] #2 Scenario: Re-running uploads nothing new
- [ ] #3 Scenario: Key is sha256 of hanzi and voice, normal speed only
- [ ] #4 Scenario: Only the new entry is rendered
- [ ] #5 Scenario: Bài 1 clips play from the R2 public URL
<!-- AC:END -->
