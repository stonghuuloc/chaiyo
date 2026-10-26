---
id: CHY-11
title: Author Bài 0 Primer + syllables as YAML
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - content
milestone: m-1
dependencies:
  - CHY-8
  - CHY-9
priority: medium
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: `prototype/data/h0-00.js`, `prototype/data/syllables.js`.

```gherkin
Feature: Author Bài 0 Primer + syllables as YAML
  As a content author
  I want the pinyin Primer and the syllable list written as YAML
  So that Bài 0 and the Pinyin Table come from content/

  Scenario: Primer and syllables pass the Primer lint rules
    Given `content/lessons/hsk1/h0-00.yaml` (`kind: primer`) and `content/syllables.yaml`
    When I run the lint CLI
    Then it reports 0 errors and exits 0

  Scenario: Every referenced syllable exists
    Given the Primer cards list syllables and minimal pairs
    When the linter checks them against `syllables.yaml`
    Then each `syllables` and `pairs` entry is found
    And a card with an entry missing from `syllables.yaml` fails the lint

  Scenario: Each section has drills
    Given the 5 sections tones, finals, initials, spelling, sandhi
    When the linter counts drills
    Then each section has at least 1 drill

  Scenario: Gate pool is large enough and covers all sections
    Given the Primer gate with draw 10 and `testOut: true`
    When the linter checks the pool
    Then the pool has at least 20 questions (≥ 2 × draw)
    And it contains questions for all 5 sections
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Primer and syllables pass the Primer lint rules
- [ ] #2 Scenario: Every referenced syllable exists
- [ ] #3 Scenario: Each section has drills
- [ ] #4 Scenario: Gate pool is large enough and covers all sections
<!-- AC:END -->
