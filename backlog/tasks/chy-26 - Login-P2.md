---
id: CHY-26
title: Login (P2)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-28 17:35'
labels:
  - slice-1
  - auth
milestone: m-4
dependencies:
  - CHY-2
  - CHY-4
priority: high
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototype `prototype/p2-login.html`: cast art, red logo, tagline, red "Tiếp tục với Google", "Dùng email" → sent screen with 60 s resend; `?s=expired` banner; restore sheet for an account pending deletion.

```gherkin
Feature: Login (P2)
  As a learner
  I want to sign in with Google or an email link, with no password
  So that I land in the app with my progress

  Background:
    Given I am signed out and open the login screen
    And I see the logo, the tagline "Mỗi ngày một chút. 加油!" and the buttons "Tiếp tục với Google" and "Dùng email"

  Scenario Outline: Login lands on Home or Welcome
    Given my account <history>
    When I sign in with <method>
    Then I land on <screen>

    Examples:
      | history                    | method                          | screen                         |
      | has never signed in        | "Tiếp tục với Google"           | Welcome "Chào bạn!" (O1)       |
      | has finished onboarding    | "Tiếp tục với Google"           | Home                           |
      | has never signed in        | the link opened from my email   | Welcome "Chào bạn!" (O1)       |
      | has finished onboarding    | the link opened from my email   | Home                           |

  Scenario: Magic link sent, resend locked for 60 seconds
    When I tap "Dùng email", type "tong.loc@gmail.com" and tap "Gửi link"
    Then I see "Mở email của bạn", "Đã gửi link tới tong.loc@gmail.com" and "Không thấy? Xem mục Spam."
    And the button reads "Gửi lại sau 60s", is disabled and counts down each second
    And after 60 seconds it reads "Gửi lại link" and is enabled
    And tapping "Đổi email" returns me to the email form

  Scenario: Invalid email is rejected
    Given I am on the email form
    When I type "tong.loc@" and tap "Gửi link"
    Then I see "Email chưa đúng" and no link is sent

  Scenario: Expired magic link shows the banner
    When I open the login screen with an expired magic link (`?s=expired`)
    Then I see the email form with "tong.loc@gmail.com" prefilled
    And I see the banner "Link đã hết hạn. Gửi link mới nhé."

  Scenario: Account pending deletion shows the restore sheet
    Given my account will be removed in 5 days
    When I sign in with Google
    Then I see the sheet "Khôi phục tài khoản?" with "tong.loc@gmail.com sẽ bị xoá sau 5 ngày. Khôi phục để giữ bài học và từ vựng."
    And "Khôi phục" cancels the deletion and takes me to Home
    And "Để sau" closes the sheet and leaves me on the login screen
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Login lands on Home or Welcome
- [ ] #2 Scenario: Magic link sent, resend locked for 60 seconds
- [ ] #3 Scenario: Invalid email is rejected
- [ ] #4 Scenario: Expired magic link shows the banner
- [ ] #5 Scenario: Account pending deletion shows the restore sheet
- [ ] #6 Google and magic-link sign-in on a Vercel preview URL (https://chaiyo-git-<branch>-stonghuulocs-projects.vercel.app/auth/callback) returns the learner signed in (carried from CHY-63 AC6)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Carried from CHY-63: (1) callers must send a path such as /auth/callback as redirectTo/emailRedirectTo — the hosted allow-list wildcard is https://chaiyo-*-stonghuulocs-projects.vercel.app/**, so a bare preview origin (no trailing /) falls back to site_url. (2) Parked: Resend click tracking rewrites magic links through awstrack.me; consider disabling it for auth mail (.stories/M-0-epic/CHY-63/PARKED.md). (3) Previews sit behind Vercel deployment protection (Q4-A), so learner-facing preview sign-in needs the tester to be logged in to Vercel.
<!-- SECTION:NOTES:END -->
