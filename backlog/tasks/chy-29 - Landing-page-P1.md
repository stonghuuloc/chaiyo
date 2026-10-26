---
id: CHY-29
title: Landing page (P1)
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - ui
milestone: m-4
dependencies:
  - CHY-4
priority: low
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pre-rendered `+page`. Already scaffolded; needs final copy and the CTA to login.

```gherkin
Feature: Landing page (P1)
  As a learner
  I want a fast page that tells me what Chaiyo is and lets me start
  So that I can sign in in one tap

  Scenario: Page is pre-rendered and fast
    When I open the landing page on a mobile profile
    Then the Lighthouse mobile performance score is at least 90

  Scenario: CTA leads to login
    When I tap the main call-to-action
    Then I land on the login screen (P2)

  Scenario: Copy is in the warm voice
    When I read the landing page
    Then all text is Vietnamese in the same warm, playful voice as the app, with no placeholder text left
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Page is pre-rendered and fast
- [ ] #2 Scenario: CTA leads to login
- [ ] #3 Scenario: Copy is in the warm voice
<!-- AC:END -->
