---
id: CHY-20
title: 'Study: sections, Gate Test, unlocks, placement'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:51'
labels:
  - slice-1
  - core
milestone: m-3
dependencies:
  - CHY-19
priority: high
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rules from CONTEXT.md: section done, Gate Test ≥80% with best score kept, unlock order, Placement blocks + 20 new cards/day.

```gherkin
Feature: Study: sections, Gate Test, unlocks, placement
  As a developer
  I want Study to decide section completion, Gate results, unlocks and placement
  So that progress is the same on the phone and on the server

  Background:
    Given Bài 1 has 5 sections: Từ mới, Ngữ pháp, Hội thoại, Nghe & nói, Luyện viết
    And the Gate Test "Kiểm tra cuối bài" draws 10 questions
    And Bài 2 is locked

  Scenario: Finishing the last question of a section emits SectionDone
    Given the learner has answered 9 of 10 questions in Từ mới
    When Study applies the Attempt for the last question
    Then it emits SectionDone for Bài 1 · Từ mới
    And the Gate Test stays locked until all 5 sections have emitted SectionDone

  Scenario Outline: Gate pass line is exactly 80%
    Given all 5 sections of Bài 1 are done
    When Study applies 10 Gate Attempts with <correct> correct
    Then the score is <pct>%
    And <result>

    Examples:
      | correct | pct | result                                    |
      | 7       | 70  | no GatePassed and no LessonUnlocked       |
      | 8       | 80  | GatePassed and LessonUnlocked for Bài 2   |
      | 10      | 100 | GatePassed and LessonUnlocked for Bài 2   |

  Scenario: Gate fail, retry, pass unlocks the next lesson once
    Given all 5 sections of Bài 1 are done
    When Study applies a Gate run with 6 of 10 correct
    And Study applies a retry run with 9 of 10 correct
    Then it emits GatePassed once and LessonUnlocked for Bài 2 once
    And when the learner takes the Gate again and scores 10 of 10, no second LessonUnlocked is emitted

  Scenario: Best score is kept
    Given the learner passed the Gate with 9 of 10
    When Study applies a retry run with 6 of 10
    Then the best score in state is still 90%
    And Bài 2 stays unlocked

  Scenario: Quitting midway saves no score
    Given the learner answered 4 Gate questions and left
    Then state holds no new Gate score for Bài 1

  Scenario: Placement into HSK 2 passes HSK 1 and caps new cards
    Given a new learner whose placement run cleared the HSK 1 block and stopped at HSK 2
    When Study applies the placement result
    Then every HSK 1 lesson, including Bài 0, is marked passed
    And the first HSK 2 lesson is unlocked
    And the words of HSK 1 lessons are in the Lexicon as "new", not yet reviewed

  Scenario: Placed learner gets 20 new cards a day
    Given the learner was placed into HSK 2 and the Lexicon holds hundreds of "new" HSK 1 cards
    When Study builds today's session
    Then it contains at most 20 new cards
    And the next day's session adds up to 20 more new cards until the HSK 1 words are used up

  Scenario: A weak result later never sends the learner back down
    Given the learner was placed into HSK 2
    When Study applies a Gate run with 3 of 10 correct on an HSK 2 lesson
    Then the HSK 1 lessons are still passed
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Finishing the last question of a section emits SectionDone
- [ ] #2 Scenario: Gate pass line is exactly 80%
- [ ] #3 Scenario: Gate fail, retry, pass unlocks the next lesson once
- [ ] #4 Scenario: Best score is kept
- [ ] #5 Scenario: Quitting midway saves no score
- [ ] #6 Scenario: Placement into HSK 2 passes HSK 1 and caps new cards
- [ ] #7 Scenario: Placed learner gets 20 new cards a day
- [ ] #8 Scenario: A weak result later never sends the learner back down
<!-- AC:END -->
