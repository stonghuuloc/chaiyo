---
id: CHY-50
title: Tôi tab
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:53'
labels:
  - me
milestone: m-9
dependencies:
  - CHY-3
  - CHY-20
  - CHY-21
priority: medium
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `t4-me.html`: compact profile row; hero = current level (HSK seal, %, Bài học x/40, Từ vựng x/300, next milestone, small streak row); "Độ nhớ theo kỹ năng" bars; badges strip; menu.

```gherkin
Feature: Tôi tab
  As a learner
  I want one screen with my level progress, memory per skill and badges
  So that I can see how I am doing without any charts to decode

  Background:
    Given I am "Tống Lộc" on HSK 1 with 0 of 40 lessons passed, 12 words in my Lexicon, streak 12, best streak 12, 1 freeze
    And I open the "Tôi" tab

  Scenario: Profile row and level hero
    Then I see my name "Tống Lộc" and "Học từ tháng 10/2026"
    And the hero shows the HSK seal "HSK 1" and "HSK 1 · <pct>%"
    And "Bài học" shows "0/40" and "Từ vựng" shows "12/300" with progress bars
    And the goal line reads "Mốc tiếp theo: Thi thử HSK 1 sau Bài 40, đỗ là mở HSK 2."
    And the streak row reads "12 ngày liền", "Còn 1 lượt đóng băng", "Kỷ lục 12 ngày"

  Scenario: All numbers come from Study state
    Given Study state changes to 3 lessons passed and 40 words
    When I reload the tab
    Then "Bài học" shows "3/40" and "Từ vựng" shows "40/300"
    And the streak row shows the streak, freeze and best values from Study state
    And no number on the screen is hard-coded

  Scenario Outline: Level line changes with progress
    Given I have passed <done> of 40 lessons on HSK 1 and I am on Bài <cur>
    Then the hero line reads "<line>"

    Examples:
      | done | cur | line |
      | 0    | 1   | Vừa vào cấp, đang học Bài 1. Khởi đầu ngon rồi đó! |
      | 10   | 11  | Đang học Bài 11. Đi được một đoạn rồi, cứ đều đều nhé. |
      | 30   | 31  | Đang học Bài 31. Gần tới đích rồi! |
      | 40   | 40  | Học xong cả cấp, giờ chỉ còn thi thử thôi! |

  Scenario: Memory per skill
    Then the section "Độ nhớ theo kỹ năng" lists three skills: thẻ từ, nghe, viết
    And each skill shows "<n> nhớ chắc · <n> còn lơ mơ · <n> chưa luyện" and a bar split the same way
    And the link "Từ của tôi" is shown in the section header

  Scenario: Badges strip and menu
    Then "Huy hiệu" says "Có 2/5. Cái tiếp theo: Chuỗi 30 ngày."
    And earned badges come first, locked ones after with "<have>/<need>" progress
    And tapping a badge opens the Badges screen
    And the menu lists "Bạn bè" and "Cài đặt", plus "Báo lỗi nội dung" and "Số liệu sử dụng" only for an admin
    And the button "Đăng xuất" goes to the login screen

  Scenario: No red primary on this screen
    Then no element on the Tôi tab uses the red primary button style
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Profile row and level hero
- [ ] #2 Scenario: All numbers come from Study state
- [ ] #3 Scenario: Level line changes with progress
- [ ] #4 Scenario: Memory per skill
- [ ] #5 Scenario: Badges strip and menu
- [ ] #6 Scenario: No red primary on this screen
<!-- AC:END -->
