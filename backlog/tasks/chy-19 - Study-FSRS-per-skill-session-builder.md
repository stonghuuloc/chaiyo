---
id: CHY-19
title: 'Study: FSRS per skill + session builder'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:50'
labels:
  - slice-1
  - core
milestone: m-3
dependencies:
  - CHY-1
priority: high
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Port `prototype/data/lexicon.js` rules into `lib/study` with ts-fsrs. Skills: thẻ từ / nghe / viết chữ, each word has its own card per skill. `session()` interleaves skills; `minutes()` estimates length.

```gherkin
Feature: Study: FSRS per skill + session builder
  As a developer
  I want Study to schedule one card per word per skill and build the daily session
  So that knowing a word on a flashcard never hides that I can't hear or write it

  Background:
    Given a Lexicon of the 10 words of Bài 1 plus 2 saved words "熊猫" and "奶茶"
    And due today: thẻ từ 你 好 您 对不起 奶茶; nghe 谢谢 再见 没关系; viết chữ 你 好

  Scenario: One Attempt schedules only its own skill's card
    Given 你好 is "known" on thẻ từ and "learning" on nghe
    When Study applies a nghe Attempt for 你好 with correct = false
    Then it emits one CardScheduled for 你好 · nghe, due within 1 day
    And it emits no CardScheduled for 你好 · thẻ từ
    And the 你好 thẻ từ card is still due in 9 days

  Scenario: Remembering pushes the card further than forgetting
    When Study applies a thẻ từ Attempt for 你 with correct = true
    And Study applies a thẻ từ Attempt for 好 with correct = false
    Then CardScheduled for 你 · thẻ từ is due later than CardScheduled for 好 · thẻ từ
    And 好 is due again within 1 day

  Scenario: Same word, three skills, three cards
    When Study applies a correct thẻ từ Attempt, a wrong nghe Attempt and a correct viết chữ Attempt for 你
    Then it emits three CardScheduled events, one per skill, each with its own due date

  Scenario: A saved word has no listening card
    Given 奶茶 is a "tự thêm" word with no recorded clip
    When Study builds the nghe session
    Then 奶茶 is not in it
    And 奶茶 is in the thẻ từ session

  Scenario: Today's session interleaves skills
    When Study builds today's session
    Then it has 10 cards: 5 thẻ từ, 3 nghe, 2 viết chữ
    And while two or more skills still have cards left, no two neighbouring cards share a skill
    And the same word never appears twice in a row
    And the session length estimate reads "≈ 3 phút" (5×10 s + 3×15 s + 2×35 s = 165 s)

  Scenario: Single-skill filter
    When Study builds the session with only "viet"
    Then it has 2 cards: 你 and 好, both viết chữ
    And the estimate reads "≈ 1 phút"

  Scenario: Study is tested through Attempts only
    Given the Study test suite
    Then every test feeds Attempt sequences to apply(state, attempt, now) and asserts on the returned events and state
    And no test imports ts-fsrs or other internals directly
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: One Attempt schedules only its own skill's card
- [ ] #2 Scenario: Remembering pushes the card further than forgetting
- [ ] #3 Scenario: Same word, three skills, three cards
- [ ] #4 Scenario: A saved word has no listening card
- [ ] #5 Scenario: Today's session interleaves skills
- [ ] #6 Scenario: Single-skill filter
- [ ] #7 Scenario: Study is tested through Attempts only
<!-- AC:END -->
