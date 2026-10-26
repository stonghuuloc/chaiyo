---
id: CHY-42
title: Mixed practice session
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:48'
labels:
  - slice-1
  - practice
milestone: m-6
dependencies:
  - CHY-41
  - CHY-18
  - CHY-35
priority: high
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `p1-session.html`: swipe flashcards (tap flip, swipe right Nhớ / left Quên, 🔊 on both faces), Nghe choice with talking stage, Viết chữ with Hanzi Writer; done screen headline by result + chips "Hẹn mai gặp lại" / "Thuộc rồi". Copy never explains the scheduler.

```gherkin
Feature: Mixed practice session
  As a learner
  I want to practise my due words with cards, listening and writing in one run
  So that I remember them before I forget

  Scenario: Flashcard flip, swipe and speaker
    Given a thẻ từ card for 学生 shows its front with "Chạm để xem nghĩa" and a 🔊 button
    When I tap the card
    Then it flips to pinyin, Hán Việt, nghĩa and an example, and the guide bar reads "vuốt thẻ"
    And the back has its own 🔊 button, and tapping 🔊 plays the word without flipping the card
    When I swipe the card right
    Then it flies off with the stamp "NHỚ" and the next card appears
    And swiping left shows the stamp "QUÊN"

  Scenario: Nghe question and a miss
    Given a Nghe item for 你好
    When the question appears
    Then I see "Nghe rồi chọn từ đúng" with 4 hanzi options, one correct, and I hear the word
    When I pick a wrong option
    Then I see the hint "Từ này sẽ quay lại cuối lượt"
    And the item returns once at the end, marked "· gặp lại", and a second miss is not queued again

  Scenario: Viết chữ with Hanzi Writer
    Given a Viết chữ item showing pinyin and nghĩa, with no outline
    When I write every character with at most 3 wrong strokes and no peek
    Then I see "Viết đúng." and the button "Tiếp"
    When I tap "Không nhớ chữ này" instead
    Then the item counts as missed and comes back at the end

  Scenario: Single skill via ?skill=
    Given I open "p1-session.html?skill=nghe"
    Then every item in the run is a Nghe item
    And skill=the and skill=viet do the same for their skill

  Scenario: Finishing records Attempts and counts the day
    Given a session of 10 items and today is not yet counted
    When I finish the last item
    Then each card result was recorded as one Attempt
    And the Streak day-counted popup appears
    And the done screen shows the per-skill score, "Hẹn mai gặp lại" for missed items and "Thuộc rồi" for the rest
    And the headline is "Ngon lành cành đào!" with 0 missed, "Xong buổi luyện rồi!" with 3 missed, "Hôm nay hơi khó nhằn ha" with 8 missed
    And no text explains the scheduler or intervals

  Scenario: Swipe works on iOS Safari and Android Chrome
    Given I am on iOS Safari or Android Chrome
    When I drag a card more than 28% of its width, or flick it fast
    Then the card is decided like pressing Nhớ or Quên
    And a short drag springs back and the page does not scroll sideways
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Flashcard flip, swipe and speaker
- [ ] #2 Scenario: Nghe question and a miss
- [ ] #3 Scenario: Viết chữ with Hanzi Writer
- [ ] #4 Scenario: Single skill via ?skill=
- [ ] #5 Scenario: Finishing records Attempts and counts the day
- [ ] #6 Scenario: Swipe works on iOS Safari and Android Chrome
<!-- AC:END -->
