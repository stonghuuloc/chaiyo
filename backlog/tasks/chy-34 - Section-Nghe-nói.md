---
id: CHY-34
title: 'Section: Nghe & nói'
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
  - CHY-18
priority: high
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l6-listen.html`. Listening is real; pronunciation result stays a labelled sample until E11 Speech lands.

```gherkin
Feature: Section: Nghe & nói
  As a learner
  I want to listen and then say the words aloud
  So that I train my ears and my mouth

  Scenario: Listening questions are real
    Given I open "Nghe & nói" (5 steps)
    Then I get a tone question (4 contours, answer hǎo), a word question and a meaning question, each with the talking Hachiware clip
    And my answers are graded and recorded as Attempts

  Scenario: Real mic level meter
    Given I am on "Đọc to câu này" with 不客气。
    When I hold the red button "Giữ để nói"
    Then the microphone turns on and I see live level bars and a timer "0:03"
    And the button reads "Thả khi nói xong"
    And holding under 0.7 seconds shows "Ngắn quá — giữ nút lâu hơn một chút rồi nói."

  Scenario: Recording is never uploaded or stored
    When I release the button after speaking
    Then the audio is analysed live in the browser and discarded
    And no network request carries audio and nothing is saved on the device or server

  Scenario: Pronunciation result is labelled as a sample
    When I finish a recording
    Then I see per-sound tiles (不 bú ✓, 客 kè ✓, 气 qi weak) and "Đúng 2/3 âm · đủ để qua"
    And "Kết quả mẫu (chưa chấm thật)" is visible
    And the hint under the button reads "Chưa chấm điểm thật · kết quả chỉ là mẫu"

  Scenario: Microphone not available
    Given the browser blocks the microphone
    When I press the red button
    Then I see "Không dùng được micro — bỏ qua phần nói, phần học vẫn tính là xong."
    And the button reads "Bỏ qua" and the section can still be completed

  Scenario: Free answer reveals the answer after speaking
    Given "Bạn làm đổ trà của bạn mình. Nói gì?"
    Then the answer 对不起！ and "Xin lỗi!" only appears after I speak or skip
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Listening questions are real
- [ ] #2 Scenario: Real mic level meter
- [ ] #3 Scenario: Recording is never uploaded or stored
- [ ] #4 Scenario: Pronunciation result is labelled as a sample
- [ ] #5 Scenario: Microphone not available
- [ ] #6 Scenario: Free answer reveals the answer after speaking
<!-- AC:END -->
