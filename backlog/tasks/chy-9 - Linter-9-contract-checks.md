---
id: CHY-9
title: 'Linter: 9 contract checks'
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
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 9 checks in `docs/content-schema.md` "Linter" (Hán Việt, polyphones, tone marks, sandhi, 80% known chars, real glyphs, mnemonic reuse, references, audio speakers).

```gherkin
Feature: Linter: 9 contract checks
  As a content author
  I want the lesson contract enforced by a linter
  So that bad content is caught before import

  Scenario Outline: Each check fails on its own fixture
    Given a fixture that breaks only check <n>: <fails when>
    When the linter runs on it
    Then it reports exactly 1 error, named "<check>"
    And no other check reports an error

    Examples:
      | n | check            | fails when                                                           |
      | 1 | Hán Việt         | a Char reading has empty or `—` hanviet                              |
      | 2 | Polyphones       | a char with ≥2 common readings lists fewer                           |
      | 3 | Tone marks       | authored pinyin has no marks or contains digits                      |
      | 4 | Sandhi           | 一/不 sentence where derived spoken ≠ `spoken` override              |
      | 5 | 80% known chars  | a sentence uses a char not known so far and not in `unknown`         |
      | 6 | Real glyphs      | a code point in U+2E80–U+2FDF is used                                |
      | 7 | Mnemonic reuse   | `mnemonic` differs from vault `meo.py` output                        |
      | 8 | References       | unknown word/sentence/grammar/Cast id, 8–15 words broken, gate pool < 2 × draw, or lesson word untested in gate pool |
      | 9 | Audio            | speaker is not hachiware/momonga, or dialogue speakers do not alternate |

  Scenario: A clean lesson passes
    Given the Bài 1 fixture with no violations
    When the linter runs
    Then it reports 0 errors and exits 0

  Scenario: Primer skips checks 1–7 and the word-count part of 8
    Given a `kind: primer` fixture with no words or chars
    When the linter runs
    Then checks 1–7 report nothing
    And no "word count outside 8–15" error appears
    And the other parts of check 8 still apply

  Scenario: CLI exits non-zero with a readable list
    Given a content folder with 3 violations in 2 files
    When I run the lint CLI
    Then the exit code is non-zero
    And stdout lists 3 lines, each with file, path, check number and message
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Each check fails on its own fixture
- [ ] #2 Scenario: A clean lesson passes
- [ ] #3 Scenario: Primer skips checks 1–7 and the word-count part of 8
- [ ] #4 Scenario: CLI exits non-zero with a readable list
<!-- AC:END -->
