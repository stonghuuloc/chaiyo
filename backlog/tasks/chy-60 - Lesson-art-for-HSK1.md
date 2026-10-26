---
id: CHY-60
title: Lesson art for HSK1
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - content
  - art
milestone: m-12
dependencies:
  - CHY-59
priority: low
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Word art and result scenes via `scripts/gen-result-art.sh` (gpt-image-2), cast by canon role.

```gherkin
Feature: Lesson art for HSK1
  As a content author
  I want art for every HSK 1 lesson in the approved Chiikawa style
  So that lessons and results feel warm and consistent

  Scenario: Every lesson has its art
    Given the 40 HSK 1 lessons
    When I list art files for them
    Then each lesson has its word art and its result scene

  Scenario: Prompts include the lineup-only rule
    When I read the prompt for any generated image
    Then it ends with "Only characters from the lineup may appear, no other creatures or people."

  Scenario: Cast by canon role
    When a scene needs Hachiware, Chiikawa, Usagi or Momonga
    Then each character is cast in the role from the "Art — locked" table
    And for "duibuqi" and "meiguanxi" Chiikawa comforts a crying Hachiware, not the reverse

  Scenario: Re-roll a bad image
    When I run `scripts/gen-result-art.sh <name>` for one name
    Then only that image is regenerated
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Every lesson has its art
- [ ] #2 Scenario: Prompts include the lineup-only rule
- [ ] #3 Scenario: Cast by canon role
- [ ] #4 Scenario: Re-roll a bad image
<!-- AC:END -->
