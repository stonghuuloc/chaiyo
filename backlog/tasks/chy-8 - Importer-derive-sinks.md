---
id: CHY-8
title: 'Importer: derive + sinks'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - slice-1
  - content
milestone: m-1
dependencies:
  - CHY-7
priority: high
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`import(dir) → { sha } | { errors }`, all-or-nothing, idempotent. Derived fields per "Derived at import": spoken pinyin with sandhi, Hán Việt per word, `seg`, `taughtIn` + backlinks, audio keys, gate draw coverage, `content_versions`.

```gherkin
Feature: Importer: derive + sinks
  As a developer
  I want an importer that validates, derives fields and writes to a sink all-or-nothing
  So that the app only ever sees consistent, versioned content

  Scenario: Any lint error writes nothing
    Given a content folder where one word has a pinyin without tone marks
    When I call `import(dir)` with the in-memory sink
    Then the result is `{ errors }` with that error
    And the sink holds no rows and no bundle

  Scenario: Re-running the same files is a no-op
    Given a valid content folder was imported and returned sha A
    When I call `import(dir)` again with no file changes
    Then the result is `{ sha: A }`
    And `content_versions` still has exactly 1 row for A

  Scenario Outline: Each sink receives the same content
    Given a valid content folder
    When I import it with the <sink> sink
    Then the <output> contains the lesson, words, chars, sentences and questions

    Examples:
      | sink        | output                                   |
      | in-memory   | store used by tests                      |
      | JSON bundle | per-lesson JSON files                    |
      | Postgres    | rows in the content tables (per ADR 0002) |

  Scenario Outline: Sandhi derives spoken pinyin
    Given an authored citation pinyin <citation>
    When the importer derives the spoken pinyin
    Then it is <spoken>

    Examples:
      | citation  | spoken    | rule                    |
      | nǐ hǎo    | ní hǎo    | 3-3 → 2-3               |
      | bù kèqi   | bú kèqi   | 不 before tone 4 → bú   |
      | yī gè     | yí gè     | 一 by next tone         |
      | yī tiān   | yì tiān   | 一 by next tone         |

  Scenario: Author spoken override wins
    Given a word whose `spoken` field differs from the sandhi result
    When the importer derives the spoken pinyin
    Then the stored spoken pinyin equals the authored `spoken`

  Scenario: Backlinks and gate coverage are derived
    Given lesson h1-01 lists 你好 in `sections.words`
    When the importer runs
    Then Word 你好 has `taughtIn` = h1-01
    And every lesson word appears in the gate draw coverage

  Scenario: Audio manifest is emitted
    Given a valid content folder
    When the import succeeds
    Then an audio manifest is written listing one key `sha256(hanzi|voice)` per Sentence and Word
    And each Sentence's voice is its speaker's Cast voice, else the default narrator
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Any lint error writes nothing
- [ ] #2 Scenario: Re-running the same files is a no-op
- [ ] #3 Scenario: Each sink receives the same content
- [ ] #4 Scenario: Sandhi derives spoken pinyin
- [ ] #5 Scenario: Author spoken override wins
- [ ] #6 Scenario: Backlinks and gate coverage are derived
- [ ] #7 Scenario: Audio manifest is emitted
<!-- AC:END -->
