---
id: CHY-37
title: Bài 0 Primer (L0)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - lesson
milestone: m-5
dependencies:
  - CHY-30
  - CHY-11
  - CHY-17
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l0-hub.html`, `l0-section.html?s=tones|finals|initials|spelling|sandhi`, `l0-gate.html`. "Đã biết pinyin" test-out goes straight to the gate.

```gherkin
Feature: Bài 0 Primer (L0)
  As a learner
  I want to learn to read and hear pinyin before any words
  So that Bài 1 starts on firm ground

  Scenario: Hub
    Given I open Bài 0
    Then I see "Nhập môn 拼音", "5 phần · không học từ mới · khoảng 25 phút" and "0/5 phần"
    And rows for the 5 sections, "Bảng pinyin" and "Kiểm tra Nhập môn"
    And the CTA reads "Bắt đầu: Thanh điệu"

  Scenario Outline: Section works end to end
    When I open section "<section>" and read its cards and answer its practice questions
    Then every sound chip plays on tap and plays slowly on a second tap
    And finishing shows "Xong phần <section>" and "N/M câu luyện đúng"

    Examples:
      | section      |
      | Thanh điệu   |
      | Vận mẫu      |
      | Thanh mẫu    |
      | Quy tắc viết |
      | Biến điệu    |

  Scenario: Test out with "Đã biết pinyin"
    Given I have done no section
    When I tap "Đã biết pinyin? Làm bài kiểm tra luôn"
    Then the Primer Gate opens straight away

  Scenario Outline: Gate is 10 of 25 and needs 80%
    Given I start "Kiểm tra Nhập môn": 10 questions drawn from a pool of 25, 2 from each of the 5 sections, no answer shown until the end
    When I answer <right> of 10 correctly
    Then I see <result>

    Examples:
      | right | result                                                                                         |
      | 9     | "90%", "Đã mở Bài 1", "Chaiyo!", confetti, and the CTA "Học Bài 1"                              |
      | 7     | "Gần được rồi. Cần 80% để mở Bài 1.", no confetti, and the CTAs "Làm lại" and "Ôn lại các phần" |

  Scenario: Primer Attempts feed only per-tone accuracy
    When I answer any Primer question
    Then the Attempt updates my per-tone accuracy
    And no word is added to the Lexicon and no review card is created

  Scenario: Pinyin renders in Onest
    Given a screen shows ǎ ǐ ǒ ǔ ǖ
    Then those glyphs come from the Onest font with no fallback glyph and no stacked combining mark
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Hub
- [ ] #2 Scenario: Section works end to end
- [ ] #3 Scenario: Test out with "Đã biết pinyin"
- [ ] #4 Scenario: Gate is 10 of 25 and needs 80%
- [ ] #5 Scenario: Primer Attempts feed only per-tone accuracy
- [ ] #6 Scenario: Pinyin renders in Onest
<!-- AC:END -->
