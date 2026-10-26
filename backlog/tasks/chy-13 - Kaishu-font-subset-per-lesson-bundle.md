---
id: CHY-13
title: Kaishu font subset per lesson bundle
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - content
milestone: m-1
dependencies:
  - CHY-8
priority: low
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype ships `fonts/ukai-h1-01.woff2`. Generate the subset from the chars each bundle uses.

```gherkin
Feature: Kaishu font subset per lesson bundle
  As a developer
  I want one Kaishu woff2 per lesson containing exactly the chars it uses
  So that no hanzi shows as tofu and fonts stay small

  Scenario: One woff2 per lesson with exactly its chars
    Given the imported lessons h1-01 and h0-00
    When the importer (or its post-step) runs
    Then it emits `ukai-h1-01.woff2` and `ukai-h0-00.woff2`
    And each font's glyph set equals the set of hanzi used by that lesson, no more and no fewer

  Scenario: Adding a char to a lesson regenerates its subset
    Given h1-01's subset was emitted
    When I add a sentence with a new char to h1-01 and re-import
    Then the new `ukai-h1-01.woff2` contains the new char

  Scenario: No tofu in Bài 1
    Given the app renders Bài 1 with the generated subset
    When I open every Bài 1 section
    Then every hanzi is drawn in Kaishu
    And no empty-box (tofu) glyph appears
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: One woff2 per lesson with exactly its chars
- [ ] #2 Scenario: Adding a char to a lesson regenerates its subset
- [ ] #3 Scenario: No tofu in Bài 1
<!-- AC:END -->
