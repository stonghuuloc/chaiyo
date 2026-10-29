---
id: CHY-3
title: App shell + tab bar
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-28 19:35'
labels:
  - slice-1
  - ui
milestone: m-0
dependencies:
  - CHY-1
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SPA app routes (ssr=false) behind auth, tab roots Hôm nay · Lộ trình · Luyện tập · Tôi, pushed screens without the tab bar. Port the frost tab bar with the line→fill crossfade from `prototype/tabs.js` + `roots.css`.

```gherkin
Feature: App shell + tab bar
  As a learner
  I want a four-tab app that only shows the tab bar on tab roots
  So that I can move between Hôm nay, Lộ trình, Luyện tập and Tôi, and focus inside lessons

  Scenario Outline: Each tab root renders
    Given I am signed in
    When I tap the tab <tab>
    Then the <tab> root screen shows
    And the tab bar is visible with <tab> selected

    Examples:
      | tab       |
      | Hôm nay   |
      | Lộ trình  |
      | Luyện tập |
      | Tôi       |

  Scenario Outline: Tab bar is hidden on pushed screens
    Given I am signed in
    When I open <screen>
    Then no tab bar is shown

    Examples:
      | screen                     |
      | a lesson section           |
      | a mixed practice session   |
      | a Gate Test                |
      | a Word Page                |
      | any other pushed screen    |

  Scenario: Tab bar is frosted, fixed and safe-area aware
    Given I am on a tab root on a phone with a home-indicator inset
    When I scroll the page content under the tab bar
    Then the bar stays fixed at the bottom
    And the content behind it is blurred through `backdrop-filter`
    And the bar's bottom padding includes `env(safe-area-inset-bottom)`

  Scenario: Selecting a tab crossfades line icon to fill icon
    Given the Hôm nay tab is selected
    When I tap Lộ trình
    Then the Hôm nay icon fades from fill back to line
    And the Lộ trình line icon fades out while its fill icon pops in
    And the motion matches `prototype/tabs.js` when checked on a real phone

  Scenario: Unauthenticated access redirects to login
    Given I am not signed in
    When I open an app route such as /today
    Then I land on the login screen

  Scenario: Offline with an expired token keeps me in the app
    Given I signed in earlier and my access token has expired
    And Supabase cannot be reached
    When I open an app route such as /today
    Then the /today screen shows
    And I am not sent to the login screen
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scenario: Each tab root renders
- [x] #2 Scenario: Tab bar is hidden on pushed screens
- [ ] #3 Scenario: Tab bar is frosted, fixed and safe-area aware
- [ ] #4 Scenario: Selecting a tab crossfades line icon to fill icon
- [x] #5 Scenario: Unauthenticated access redirects to login
- [x] #6 Scenario: Offline with an expired token keeps me in the app
<!-- AC:END -->
