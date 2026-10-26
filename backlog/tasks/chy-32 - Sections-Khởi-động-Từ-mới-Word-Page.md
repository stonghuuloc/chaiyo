---
id: CHY-32
title: 'Sections: Khởi động + Từ mới + Word Page'
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
  - CHY-12
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `l2-warmup.html`, `l3-words.html?w=1..10`, Word Page W1 with POS groups, examples with source label, "Xem thêm N nghĩa ít gặp".

```gherkin
Feature: Sections: Khởi động + Từ mới + Word Page
  As a learner
  I want to warm up, meet the new words, and open any word in full
  So that the words stick before the lesson moves on

  Scenario: Khởi động uses due cards and previous lesson words
    Given I have due review cards and Bài 1 words to refresh
    When I open "Khởi động"
    Then I get 6 cards rotating four types: nghe → chữ, chữ → nghĩa, nghe → pinyin, nghĩa → chữ
    And the first card says "Ôn lại Bài 1 trước khi học từ mới"
    And finishing with 5 of 6 right shows "Xong phần Khởi động" and "5/6 đúng · từ sai sẽ quay lại sớm hơn"

  Scenario: A word card in Từ mới
    Given I am on word 5 of 10
    Then I see the picture, the animated stroke order, the audio button, pinyin, "Hán Việt", the meaning, "Từng chữ" or "Cấu tạo", and "Ví dụ" with audio
    And tapping the hanzi replays the stroke animation
    And the hint reads "Kiểm tra nhanh sau từ 6"

  Scenario: Mini-check uses the talking Cast
    Given I finish word 3
    Then I see "Kiểm tra nhanh" and "Nghe rồi chọn từ đúng" with the talking Hachiware saying the clip
    And tapping Hachiware or the speaker replays it, and a second tap plays it slowly

  Scenario: Từ mới done
    When I finish word 10
    Then I see "Xong phần Từ mới" and "10 từ đã vào Từ của tôi. Chúng sẽ quay lại trong phần ôn tập."

  Scenario: Word Page renders from the C7 entry
    Given a word has a C7 entry with senses grouped by part of speech
    When I open its Word Page
    Then I see the meanings grouped by POS, each with an example
    And with 3 rare senses I see "Xem thêm 3 nghĩa ít gặp", which reads "Thu gọn" once opened

  Scenario: Examples show their source
    Given an example comes from Tatoeba
    Then it carries the label "Tatoeba" linking to `https://tatoeba.org/vi/sentences/show/<id>`
    And an AI-written example is covered by "Ví dụ: Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt"
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Khởi động uses due cards and previous lesson words
- [ ] #2 Scenario: A word card in Từ mới
- [ ] #3 Scenario: Mini-check uses the talking Cast
- [ ] #4 Scenario: Từ mới done
- [ ] #5 Scenario: Word Page renders from the C7 entry
- [ ] #6 Scenario: Examples show their source
<!-- AC:END -->
