---
id: CHY-46
title: Streak + Freeze popups and rules sheet
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:50'
labels:
  - slice-1
  - home
milestone: m-7
dependencies:
  - CHY-45
  - CHY-21
priority: high
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `prototype/streak.js`: day-counted popup and freeze-used popup are twins (340px centered card; flame flickers + small flames rise / snowflake spins + snow falls), rules sheet from chip, week strip or "Đóng băng là gì?". Freeze is never a button.

```gherkin
Feature: Streak + Freeze popups and rules sheet
  As a learner
  I want the app to celebrate a counted day and tell me when a freeze saved my streak
  So that I understand my streak without managing it

  Scenario: Day-counted popup once per day
    Given streak 12, best 12, 1 freeze, today T6 not counted
    When I finish a lesson section and a DayCounted event is emitted
    Then a centered card shows a flame and "Kỷ lục mới 13 ngày!"
    And it says "Hôm nay đã tính rồi, lửa đang cháy đượm. Mai ghé tiếp là thành 14 nha."
    And today's circle in the week strip is stamped and the button reads "Tuyệt!"
    When I finish another section the same day
    Then no second popup appears

  Scenario Outline: Day-counted headline and freeze note
    Given best streak <best>, new streak <n> and <f> freezes held
    When the day-counted popup shows
    Then the headline is "<headline>"
    And the note reads "<note>"

    Examples:
      | best | n  | f | headline            | note                                                           |
      | 12   | 13 | 1 | Kỷ lục mới 13 ngày! | Thêm 1 ngày nữa là được thêm 1 lượt đóng băng.                 |
      | 12   | 14 | 1 | Kỷ lục mới 14 ngày! | Được tặng 1 lượt đóng băng! Lỡ bận một hôm thì chuỗi vẫn giữ.  |
      | 20   | 6  | 2 | Chuỗi lên 6 ngày!   | (no note, freezes are full)                                    |

  Scenario: Freeze-used popup once after FreezeSpent
    Given I missed T4 and a FreezeSpent event was emitted overnight, streak 12, 1 freeze left
    When I open Home
    Then a centered card shows a snowflake and "Chuỗi vẫn còn nguyên!"
    And it says "Hôm T4 bạn nghỉ, 1 lượt đóng băng đã tự giữ chuỗi 12 ngày cho bạn. Hôm nay học để chuỗi chạy tiếp nhé."
    And the note reads "Còn 1 lượt. Học đủ 7 ngày liền được tặng thêm 1." and the button reads "Học ngay thôi"
    When I reopen Home later the same day
    Then the popup does not show again

  Scenario Outline: Particles follow the motion preference
    Given my device <pref>
    When the <popup> popup opens
    Then <result>

    Examples:
      | pref                      | popup        | result                                                    |
      | allows motion             | day-counted  | the flame flickers and small flames rise                  |
      | allows motion             | freeze-used  | the snowflake spins and snow falls                        |
      | prefers reduced motion    | day-counted  | no particles are created and the flame stays still        |
      | prefers reduced motion    | freeze-used  | no particles are created and the snowflake stays still    |

  Scenario Outline: Rules sheet opens from three places
    When I tap <entry>
    Then the sheet "Lượt đóng băng là gì?" opens from the bottom
    And it shows "Bạn đang có 1/2 lượt" and 4 rules
    And "Hiểu rồi" closes it

    Examples:
      | entry                  |
      | the streak chip        |
      | the week strip         |
      | "Đóng băng là gì?"     |

  Scenario: Freeze is never a button
    When I look at Home, both popups and the rules sheet
    Then there is no control to spend, buy or activate a freeze
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Day-counted popup once per day
- [ ] #2 Scenario: Day-counted headline and freeze note
- [ ] #3 Scenario: Freeze-used popup once after FreezeSpent
- [ ] #4 Scenario: Particles follow the motion preference
- [ ] #5 Scenario: Rules sheet opens from three places
- [ ] #6 Scenario: Freeze is never a button
<!-- AC:END -->
