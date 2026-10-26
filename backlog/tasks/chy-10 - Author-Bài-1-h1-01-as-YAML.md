---
id: CHY-10
title: Author Bài 1 (h1-01) as YAML
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - slice-1
  - content
milestone: m-1
dependencies:
  - CHY-8
  - CHY-9
priority: high
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: the vault lesson + `prototype/data/h1-01.js`. This is the slice's only lesson.

```gherkin
Feature: Author Bài 1 (h1-01) as YAML
  As a content author
  I want Bài 1 "Xin chào" (你好) written as YAML
  So that the slice's only lesson comes from content/ and not from prototype data

  Scenario: Bài 1 files pass the linter
    Given `content/lessons/hsk1/h1-01.yaml` and its words, chars and sentences
    When I run the lint CLI on `content/`
    Then it reports 0 errors and exits 0

  Scenario: Importer output matches the prototype content
    Given the linted Bài 1 content
    When I import it and diff the output against `prototype/data/h1-01.js`
    Then the words, sentences, grammar and questions have the same hanzi, pinyin and Vietnamese text

  Scenario Outline: Every Bài 1 section renders in the app
    Given the app reads the imported Bài 1
    When I open the section <section>
    Then it shows the same content as the prototype page <page>

    Examples:
      | section   | page             |
      | Khởi động | l2-warmup.html   |
      | Từ mới    | l3-words.html    |
      | Ngữ pháp  | l4-grammar.html  |
      | Hội thoại | l5-dialogue.html |
      | Nghe nói  | l6-listen.html   |
      | Luyện viết| l7-writing.html  |
      | Gate Test | l8-gate.html     |
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Bài 1 files pass the linter
- [ ] #2 Scenario: Importer output matches the prototype content
- [ ] #3 Scenario: Every Bài 1 section renders in the app
<!-- AC:END -->
