---
id: CHY-25
title: 'Catalog: content reads + offline'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - core
milestone: m-3
dependencies:
  - CHY-8
  - CHY-6
priority: high
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`lesson(id)`, `word(id)`, `char(hanzi)`, `lookup(sentenceId, tapIndex)`; every result carries `contentSha`.

```gherkin
Feature: Catalog: content reads + offline
  As a learner
  I want lessons, words and characters to load fast and work offline
  So that I can study anywhere

  Scenario: Bài 1 loads from the Source chosen in C1
    Given the Source chosen in C1 is configured
    When I call lesson("h1-01")
    Then the result has title "Xin chào" and level 1
    And it lists the 10 Bài 1 words from 你 to 对不起
    And it carries a non-empty contentSha

  Scenario: Word and char reads carry contentSha
    When I call word for 你好 and char("你")
    Then the word shows pinyin "nǐ hǎo" and Hán Việt "nhĩ hảo"
    And the char result carries a contentSha
    And every word result links to the lessons that teach it

  Scenario: Tap lookup on a sentence
    Given the sentence "你好！" has a seg list of word boundaries
    When I call lookup(sentenceId, 0)
    Then I get the word under the first tap with its pinyin, Hán Việt and Vietnamese meaning
    And the result carries a contentSha

  Scenario: Unknown ids fail clearly
    When I call lesson("h9-99")
    Then Catalog returns a not-found error naming "h9-99"
    And it does not return an empty lesson

  Scenario: An opened lesson works offline after reload
    Given I opened Bài 1 online
    And the phone is in airplane mode
    When I reload the app and call lesson("h1-01")
    Then the full lesson loads from the service-worker cache with the same contentSha

  Scenario: A lesson never opened is unavailable offline
    Given the phone is in airplane mode
    And I never opened Bài 2
    When I call lesson("h1-02")
    Then Catalog reports it is not available offline
    And the lesson screen shows "cần mạng"

  Scenario: Fixture source used in tests
    Given the test suite wires the fixture Source with a tiny lesson
    When tests call lesson, word, char and lookup
    Then they read from the fixture
    And no test makes a network call
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Bài 1 loads from the Source chosen in C1
- [ ] #2 Scenario: Word and char reads carry contentSha
- [ ] #3 Scenario: Tap lookup on a sentence
- [ ] #4 Scenario: Unknown ids fail clearly
- [ ] #5 Scenario: An opened lesson works offline after reload
- [ ] #6 Scenario: A lesson never opened is unavailable offline
- [ ] #7 Scenario: Fixture source used in tests
<!-- AC:END -->
