---
id: CHY-7
title: Content YAML layout + Zod schemas
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - slice-1
  - content
milestone: m-1
dependencies:
  - CHY-6
priority: high
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Types from `docs/content-schema.md`: Lesson, Word, Char, Sentence, GrammarPoint, Question, Primer, syllables.

```gherkin
Feature: Content YAML layout + Zod schemas
  As a developer
  I want typed schemas for every content type
  So that malformed YAML is rejected with an exact location

  Scenario: content/ folder layout matches the schema doc
    Given `docs/content-schema.md` "Files"
    When I list the `content/` folder
    Then it contains cast.yaml, chars/, words/, grammar/, levels/, lessons/hsk1/, syllables.yaml and mock/hsk1/

  Scenario Outline: Each type has a Zod schema accepting valid YAML
    Given a valid <type> fixture
    When the schema parses it
    Then parsing succeeds and returns the typed object

    Examples:
      | type       |
      | Lesson     |
      | Word       |
      | Char       |
      | Sentence   |
      | GrammarPoint |
      | Question   |
      | Primer     |
      | syllables  |

  Scenario Outline: Invalid YAML returns a typed error with file and path
    Given an invalid <type> fixture with a wrong field
    When the schema parses it
    Then the result is an error list
    And each error carries the file name and the field path, e.g. `words/你好.yaml` at `level`

    Examples:
      | type       |
      | Lesson     |
      | Word       |
      | Char       |
      | Sentence   |
      | GrammarPoint |
      | Question   |
      | Primer     |
      | syllables  |

  Scenario: Unit tests cover both fixtures per type
    When I run `pnpm test`
    Then there is one valid and one invalid test for each of the 8 types
    And all pass
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: content/ folder layout matches the schema doc
- [ ] #2 Scenario: Each type has a Zod schema accepting valid YAML
- [ ] #3 Scenario: Invalid YAML returns a typed error with file and path
- [ ] #4 Scenario: Unit tests cover both fixtures per type
<!-- AC:END -->
