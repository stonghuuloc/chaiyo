---
id: CHY-45
title: Hôm nay tab
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:49'
labels:
  - slice-1
  - home
milestone: m-7
dependencies:
  - CHY-3
  - CHY-20
  - CHY-21
priority: high
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `home-glass.html`: Chiikawa state scene (`assets/home/`), one Next CTA (due practice → current lesson → mock at level end → "Xong hôm nay"), roadmap slice, week strip, streak chip, friends strip, "Luyện hôm nay" row.

```gherkin
Feature: Hôm nay tab
  As a learner
  I want Home to tell me the one thing to do now
  So that I open the app and just start

  Scenario Outline: Next CTA follows the priority order
    Given reviews due is <due>
    And the current lesson is <lesson>
    And the level is <level>
    When I open "Hôm nay"
    Then the one Next CTA is "<cta>"

    Examples:
      | due | lesson          | level          | cta                                  |
      | 12  | Bài 1           | in progress    | Luyện hôm nay (reviews first)        |
      | 0   | Bài 1, Từ mới   | in progress    | Tiếp tục Bài 1                       |
      | 0   | none left       | finished       | Thi thử (mock list for that level)   |
      | 0   | none left       | not applicable | "Xong hôm nay", no action button     |

  Scenario Outline: Scene matches the state
    Given the learner state is <state>
    When Home opens
    Then the hero image is "<image>"

    Examples:
      | state                   | image                           |
      | reviews due             | assets/home/reviews-due.png     |
      | lesson next             | assets/home/lesson-next.png     |
      | day done                | assets/home/day-done.png        |
      | streak at risk          | assets/home/streak-at-risk.png  |
      | freeze used             | assets/home/freeze-used.png     |

  Scenario: Practice row under the CTA
    Given 6 thẻ, 4 nghe and 2 viết are due
    When Home opens
    Then I see the row "Luyện hôm nay · khoảng 3 phút" with "6 thẻ · 4 nghe · 2 viết"
    And tapping it starts the mixed session

  Scenario: Week strip and streak chip
    Given streak 12, 1 freeze, today T6 not counted
    When Home opens
    Then the chip reads "12 ngày" and "1"
    And the week strip shows T2, T3 ticked, T4 snowflake, T5 ticked, T6 as today
    And the line under it reads "T4 bạn nghỉ nên app dùng 1 lượt đóng băng. Học xong một phần bài hôm nay là chuỗi lên 13."

  Scenario: Day already counted
    Given streak 13 and today T6 counted
    When Home opens
    Then the line reads "Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!"
    And T6 is ticked

  Scenario: Roadmap slice and friends strip
    When I scroll Home
    Then I see Bài 0 done, Bài 1 now, Bài 2 and Bài 3 locked with "Mở khi qua Bài 1"
    And "Xem tất cả" opens Lộ trình
    And I see 3 friends with streak days and lesson number
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Next CTA follows the priority order
- [ ] #2 Scenario: Scene matches the state
- [ ] #3 Scenario: Practice row under the CTA
- [ ] #4 Scenario: Week strip and streak chip
- [ ] #5 Scenario: Day already counted
- [ ] #6 Scenario: Roadmap slice and friends strip
<!-- AC:END -->
