---
id: CHY-59
title: HSK1 Bài 2–40 content
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - content
milestone: m-12
dependencies:
  - CHY-10
priority: medium
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bulk author from the vault once Bài 1 proved the pipeline. Roadmap titles in `prototype/data/roadmap.js` are a draft outline.

```gherkin
Feature: HSK1 Bài 2–40 content
  As a content author
  I want lessons 2 to 40 imported and checked by the pipeline
  So that the HSK 1 roadmap is fully playable

  Background:
    Given Bài 1 already passes the importer and linter
    And the roadmap lists 40 HSK 1 lessons in 9 topics

  Scenario: Author the lessons from the vault
    When I run the importer for Bài 2 to Bài 40
    Then 39 lesson YAML files are written with the lesson numbers and titles from the roadmap outline

  Scenario: All 40 lessons pass the linter
    When I run the linter over Bài 1 to Bài 40
    Then it exits with code 0
    And it reports 0 errors

  Scenario: A bad lesson fails the run
    Given a lesson uses a word not taught in this or an earlier lesson
    When I run the linter
    Then it exits with a non-zero code and names the lesson and the word

  Scenario: Audio rendered for all
    When the audio render step runs
    Then every word, example and dialogue line in the 40 lessons has an audio file
    And no content item has a missing audio reference

  Scenario: Roadmap titles stay in sync
    Then every lesson title in the roadmap matches the lesson's content title
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Author the lessons from the vault
- [ ] #2 Scenario: All 40 lessons pass the linter
- [ ] #3 Scenario: A bad lesson fails the run
- [ ] #4 Scenario: Audio rendered for all
- [ ] #5 Scenario: Roadmap titles stay in sync
<!-- AC:END -->
