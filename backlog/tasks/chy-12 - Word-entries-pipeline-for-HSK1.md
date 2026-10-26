---
id: CHY-12
title: Word entries pipeline for HSK1
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - content
milestone: m-1
dependencies:
  - CHY-7
priority: medium
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Productionise `scripts/gen-entries.py` (now runs from a /tmp venv with /tmp sources). LLM edits CC-CEDICT senses, script rejects uncovered senses; examples from Tatoeba with source label, else "AI viết".

```gherkin
Feature: Word entries pipeline for HSK1
  As a content author
  I want the entry generator to run reproducibly and cover all HSK1 words
  So that every Word Page has checked senses and labelled examples

  Scenario: Script runs from a committed environment
    Given a fresh clone with no /tmp venv and no /tmp sources
    When I run the script through uv using the committed pyproject
    Then dependencies install from the lock
    And the script downloads its own sources (CC-CEDICT/HSK list, Tatoeba exports)
    And it writes entries without reading any path under /tmp

  Scenario: Uncovered CC-CEDICT senses are rejected
    Given the LLM output for a word leaves one CC-CEDICT sense neither covered nor dropped with a reason
    When the script validates it
    Then the word is rejected with a message naming the uncovered sense
    And nothing is written for that word

  Scenario: Examples carry their source
    Given a word with a Tatoeba sentence containing it
    When the entry is generated
    Then the example is labelled with its Tatoeba source
    And when no Tatoeba sentence fits, the example is labelled "AI viết"

  Scenario: All HSK1 words have entries with rare senses flagged
    Given the HSK1 word list
    When the script finishes
    Then every HSK1 word has an entry
    And senses marked rare appear behind the "Xem thêm N nghĩa ít gặp" fold on the Word Page

  Scenario: Loc spot-checks 20 entries before import
    Given the generated entries
    When 20 entries are picked at random and shown to Loc
    Then Loc approves them before the entries are imported
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Script runs from a committed environment
- [ ] #2 Scenario: Uncovered CC-CEDICT senses are rejected
- [ ] #3 Scenario: Examples carry their source
- [ ] #4 Scenario: All HSK1 words have entries with rare senses flagged
- [ ] #5 Scenario: Loc spot-checks 20 entries before import
<!-- AC:END -->
