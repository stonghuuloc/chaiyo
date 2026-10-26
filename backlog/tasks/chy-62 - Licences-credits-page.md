---
id: CHY-62
title: Licences + credits page
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - docs
milestone: m-12
dependencies:
  - CHY-50
priority: low
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Solar icons CC BY 4.0, Tatoeba CC BY 2.0 FR, CC-CEDICT/CVDICT CC BY-SA, Hanzi Writer data, chosen TTS voices.

```gherkin
Feature: Licences + credits page
  As a learner
  I want to see who made the icons, data and voices I use
  So that the app meets its licence obligations

  Scenario: Credits reachable from Tôi
    Given I am on the "Tôi" tab
    When I open the credits page
    Then I can reach it from a menu entry or the About line without leaving the app

  Scenario Outline: Every bundled third-party dataset is listed
    When I open the credits page
    Then I see "<name>" with its licence "<licence>"

    Examples:
      | name                     | licence           |
      | Solar icons (480 Design) | CC BY 4.0         |
      | Tatoeba                  | CC BY 2.0 FR      |
      | CC-CEDICT                | CC BY-SA          |
      | CVDICT                   | CC BY-SA          |
      | Hanzi Writer data        | as published      |
      | TTS voices               | the chosen voices |

  Scenario: New dataset added without credit
    Given a dataset is added to the bundle but not to the credits list
    When the credits check runs
    Then it fails and names the dataset
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Credits reachable from Tôi
- [ ] #2 Scenario: Every bundled third-party dataset is listed
- [ ] #3 Scenario: New dataset added without credit
<!-- AC:END -->
