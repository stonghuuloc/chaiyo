---
id: CHY-52
title: Friends + public profile (U2/U3)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:53'
labels:
  - me
  - social
milestone: m-9
dependencies:
  - CHY-23
  - CHY-50
priority: low
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `u2-friends.html`, `u3-profile.html`: leaderboard Chuỗi ngày | Từ trong tuần, search, follow, invite link; hidden profiles never listed.

```gherkin
Feature: Friends + public profile (U2/U3)
  As a learner
  I want to follow other learners and compare streaks
  So that studying feels less lonely

  Background:
    Given I am a learner with streak 12
    And I follow 3 visible learners

  Scenario: Leaderboard ranks followed learners and me
    When I open "Bạn bè"
    Then the board lists me tagged "Bạn" plus exactly the 3 learners I follow
    And the default ranking is "Chuỗi ngày", highest first, showing "<n> ngày"
    And the top 3 rows show a medal and others show their number
    When I switch to "Từ trong tuần"
    Then the same people are re-ranked by words this week, showing "<n> từ"

  Scenario: Empty board
    Given I follow nobody
    When I open "Bạn bè"
    Then I see "Chưa có ai trong bảng" and "Học một mình hơi buồn, rủ bạn vào đua cho vui nhé!"

  Scenario: Search ignores accents
    When I type "ngoc" in "Tìm bạn theo tên"
    Then learners whose name contains "Ngọc" are listed with "HSK <n> · Bài <n>"
    When I type a name nobody has
    Then I see "Không thấy ai tên “<text>”. Thử tên khác nhé."

  Scenario: Follow and unfollow persist
    When I tap "Theo dõi" on a learner
    Then a toast shows "Đã theo dõi <name>" and the button becomes "Đang theo dõi"
    And the learner appears on the leaderboard
    When I reload and tap "Đang theo dõi" on the same learner
    Then a toast shows "Đã bỏ theo dõi <name>" and the learner leaves the leaderboard
    And the follow state survives a reload

  Scenario: Invite link
    When I tap "Rủ bạn vào học chung"
    Then "chaiyo.app/moi/loc" is copied and a toast shows "Đã chép link, gửi cho bạn bè nhé!"

  Scenario: Public profile of another learner
    When I tap a learner row
    Then I see their name, "HSK <n>", "Bài <n> Đang học", streak, "Từ đã biết" and their badges
    And I see no gate scores, mistakes, email or phone
    And the main button reads "Theo dõi <name>" or "Đang theo dõi"

  Scenario: Hidden profiles never listed
    Given learner "Hidden" has turned on "Ẩn hồ sơ công khai"
    Then "Hidden" is not in the search results or on the leaderboard
    When I open their profile link directly
    Then I see "Hồ sơ đang ẩn" and "Bạn này chọn giữ hồ sơ cho riêng mình. Tôn trọng nha!"
    And an unknown link shows "Không thấy người này"

  Scenario: RLS blocks reading a hidden profile
    Given learner "Hidden" has a hidden profile
    When another learner queries Hidden's public profile row
    Then the database returns no row
    And Hidden can still read their own profile
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Leaderboard ranks followed learners and me
- [ ] #2 Scenario: Empty board
- [ ] #3 Scenario: Search ignores accents
- [ ] #4 Scenario: Follow and unfollow persist
- [ ] #5 Scenario: Invite link
- [ ] #6 Scenario: Public profile of another learner
- [ ] #7 Scenario: Hidden profiles never listed
- [ ] #8 Scenario: RLS blocks reading a hidden profile
<!-- AC:END -->
