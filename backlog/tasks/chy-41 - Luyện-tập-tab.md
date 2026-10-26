---
id: CHY-41
title: Luyện tập tab
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:48'
labels:
  - slice-1
  - practice
milestone: m-6
dependencies:
  - CHY-3
  - CHY-19
priority: high
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `t3-practice.html`: "Luyện hôm nay · khoảng N phút" card with the only red "Bắt đầu", "Luyện riêng từng kỹ năng" tiles, Thi thử with level chips (locked above current), Từ của tôi link.

```gherkin
Feature: Luyện tập tab
  As a learner
  I want one tab that holds all my practice
  So that I know what to practise today and can start in one tap

  Background:
    Given I am on the "Luyện tập" tab
    And my current level is HSK 1

  Scenario: Today card shows the real mix and minutes
    Given 6 thẻ từ, 4 nghe and 2 viết chữ are due today
    When the tab opens
    Then I see "Luyện hôm nay · khoảng 3 phút"
    And I see the chips "6 thẻ từ", "4 nghe", "2 viết chữ"
    And the card has the only red button "Bắt đầu"
    And a skill with 0 due items has no chip

  Scenario: Bắt đầu runs today's mixed session
    Given 12 items are due today
    When I tap "Bắt đầu"
    Then the mixed session opens with all 12 due items, skills interleaved

  Scenario: Nothing due today
    Given no word is due today
    When the tab opens
    Then I see "Hôm nay xong bài rồi!"
    And I see "Chưa có từ nào sắp quên. Còn hứng thì luyện thêm một kỹ năng bên dưới."
    And there is no "Bắt đầu" button

  Scenario Outline: Skill tiles under "Luyện riêng từng kỹ năng"
    When I look at the tile "<tile>"
    Then its subtitle reads "<subtitle>"
    And tapping it opens "<target>"

    Examples:
      | tile      | subtitle                                       | target                    |
      | Thẻ từ    | "N từ cần ôn" or "Không có từ cần ôn"          | p1-session.html?skill=the |
      | Nghe      | "N từ cần ôn" or "Không có từ cần ôn"          | p1-session.html?skill=nghe |
      | Viết chữ  | "N từ cần ôn" or "Không có từ cần ôn"          | p1-session.html?skill=viet |
      | Nói       | "Đọc to, app chấm thanh điệu · sắp có"         | p2-skill.html?k=noi       |
      | Viết đoạn | "Mở từ HSK 3" (below HSK 3)                    | p2-skill.html?k=doan      |

  Scenario: Thi thử level chips lock above my level
    When I look at the chips under "Thi thử"
    Then HSK 1 is selectable and HSK 2 to HSK 6 show a lock icon
    And selecting HSK 1 shows "mở khi qua Bài <last lesson of HSK 1>"
    And selecting HSK 2 shows "mở khi đỗ thi thử HSK 1"
    And a level below mine shows "đã đỗ · làm lại bất cứ lúc nào"

  Scenario: Từ của tôi link
    Given I have 30 saved words
    When I look at the "Từ của tôi" section
    Then I see "30 từ đã học và đã lưu" and the first 8 hanzi
    And tapping it opens "Từ của tôi"
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Today card shows the real mix and minutes
- [ ] #2 Scenario: Bắt đầu runs today's mixed session
- [ ] #3 Scenario: Nothing due today
- [ ] #4 Scenario: Skill tiles under "Luyện riêng từng kỹ năng"
- [ ] #5 Scenario: Thi thử level chips lock above my level
- [ ] #6 Scenario: Từ của tôi link
<!-- AC:END -->
