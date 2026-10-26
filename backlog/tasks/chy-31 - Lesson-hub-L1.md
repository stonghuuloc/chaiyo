---
id: CHY-31
title: Lesson hub (L1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - lesson
milestone: m-5
dependencies:
  - CHY-30
priority: high
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `prototype/l1-hub.html`: sections, resume state, Gate unlocked after all 6 sections.

```gherkin
Feature: Lesson hub (L1)
  As a learner
  I want one page that shows where I am in a lesson
  So that I can resume or jump to a section

  Scenario: Hub header
    Given I open Bài 1
    Then I see "HSK1 · Chào hỏi · Bài 1", the title "Xin chào 你好" and "10 từ · 1 điểm ngữ pháp · khoảng 70 phút"
    And the progress reads "0/5 phần"

  Scenario Outline: Section states come from Study
    Given Study reports section "<section>" as <state>
    Then its row shows <look>

    Examples:
      | section   | state     | look                                                    |
      | Từ mới    | đang học  | "4/10 từ · tiếp ở 你好" with a half-filled mark         |
      | Ngữ pháp  | chưa học  | an empty mark and "Chào hỏi: A + 好"                    |
      | Hội thoại | chưa học  | an empty mark and "2 đoạn · 7 câu"                      |
      | Nghe & nói | chưa học | an empty mark and "5 bài · cần micro"                   |
      | Luyện viết | chưa học | an empty mark and "Viết 你 好 们"                       |

  Scenario: Resume CTA
    Given I stopped in "Từ mới" at word 5
    Then the CTA reads "Tiếp tục: Từ mới" and opens word 5

  Scenario: Gate is locked until the 6 sections are done
    Given 4 of the sections are done
    Then the row "Kiểm tra cuối bài" shows a lock and "Mở khi xong 5 phần · đạt từ 80%"
    And tapping it does nothing

  Scenario: Gate unlocks after all sections
    Given every section is done
    Then "Kiểm tra cuối bài" loses the lock and opens the Gate Test

  Scenario: Words in the lesson
    Then "Từ trong bài" lists the 10 words with pinyin
    And words not yet reached have a dashed border, explained by "Viền đứt: chưa học tới."
    And "Từ của tôi" links to the Lexicon
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Hub header
- [ ] #2 Scenario: Section states come from Study
- [ ] #3 Scenario: Resume CTA
- [ ] #4 Scenario: Gate is locked until the 6 sections are done
- [ ] #5 Scenario: Gate unlocks after all sections
- [ ] #6 Scenario: Words in the lesson
<!-- AC:END -->
