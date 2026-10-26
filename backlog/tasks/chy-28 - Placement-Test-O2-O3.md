---
id: CHY-28
title: Placement Test (O2/O3)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:51'
labels:
  - auth
milestone: m-4
dependencies:
  - CHY-27
  - CHY-20
  - CHY-16
priority: medium
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `prototype/o2-placement.html`: one continuous run easy → hard, no level/counter shown, graded silently, stops when a level fails; result screen sets the start level. Confetti only when start level is HSK 3+.

```gherkin
Feature: Placement Test (O2/O3)
  As a learner
  I want a quick test that finds my level
  So that I skip what I already know

  Scenario: One silent run, easy to hard
    Given I start "Kiểm tra trình độ"
    Then each of the 5 levels has 10 items from the placement bank: 6 "Chọn nghĩa" (hanzi → nghĩa, no pinyin) and 4 "Nghe và chọn chữ"
    And I see no level label and no question counter
    And no answer shows right or wrong and the button reads "Câu tiếp"
    And "Không biết" counts as a wrong answer
    And clearing a level (8 of 10) moves to the next one with no announcement

  Scenario: Run stops at the first failed level
    Given I am in a level that needs 8 of 10
    When I miss my 3rd item in that level
    Then the run stops at once and the result screen opens
    And the start level is the number of levels I cleared before it

  Scenario: Exit confirm
    When I tap ✕ during the test
    Then I see "Thoát bài kiểm tra?" and "Kết quả sẽ không được lưu."
    And "Làm tiếp" keeps me in the test
    And "Thoát" leaves to Home without saving

  Scenario Outline: Result sets the start level
    Given I cleared <cleared> levels
    Then the result shows <headline>
    And the CTA reads "<cta>"
    And confetti plays: <confetti>

    Examples:
      | cleared | headline                                                                                  | cta                    | confetti          |
      | 0       | "Bạn bắt đầu ở" "Bài 0 · Nhập môn 拼音" with no shame copy                                 | Bắt đầu Bài 0          | no                |
      | 1       | "Bạn bắt đầu ở" "HSK 2" with its first lesson, "Đã mở HSK 1 · Bài 0–N"                     | Bắt đầu Bài N+1        | no                |
      | 2       | "Bạn bắt đầu ở" "HSK 3", "Đã mở HSK 1–2", "+N từ, chưa ôn", "Ôn dần ~20 từ mỗi ngày"        | Bắt đầu Bài N+1        | yes               |
      | 4       | "Bạn bắt đầu ở" "HSK 5"                                                                    | Bắt đầu Bài N+1        | yes, bigger burst |
      | 5       | "Bạn đã qua" "Cả 5 cấp HSK" and "Mọi bài đã mở."                                           | Xem Chuyên đề          | yes, bigger burst |

  Scenario: Placement Attempts feed Study placement rules
    When the test ends
    Then every answer is stored as a Placement Attempt
    And Study applies the placement rules (S2): lessons up to my start level open as "qua bằng kiểm tra" and their words join the Lexicon unreviewed
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: One silent run, easy to hard
- [ ] #2 Scenario: Run stops at the first failed level
- [ ] #3 Scenario: Exit confirm
- [ ] #4 Scenario: Result sets the start level
- [ ] #5 Scenario: Placement Attempts feed Study placement rules
<!-- AC:END -->
