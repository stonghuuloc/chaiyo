---
id: CHY-5
title: Sync docs with the final prototype
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-30 04:39'
labels:
  - docs
milestone: m-0
dependencies: []
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`docs/screens.md` and `CONTEXT.md` still describe tab 3 as Từ điển (Lexicon + Dictionary search) and R1/R2 review screens. Prototype decisions replaced them: tab 3 = Luyện tập, no Dictionary search, one mixed session `p1-session.html`, memory per skill.

```gherkin
Feature: Sync docs with the final prototype
  As a developer
  I want the docs to describe the approved prototype
  So that nobody builds the removed Từ điển or R1/R2 screens

  Scenario: screens.md matches the prototype tab set and screens
    Given `docs/screens.md` and the files in `prototype/`
    When I compare the tab list and screen inventory against the prototype
    Then the tabs read Hôm nay, Lộ trình, Luyện tập, Tôi
    And tab 3 is Luyện tập with the single mixed session `p1-session.html`
    And every screen listed has a prototype file, and every prototype screen is listed

  Scenario: CONTEXT.md terms follow the per-skill practice model
    Given `CONTEXT.md`
    When I read the Dictionary, Lexicon and review entries
    Then they describe memory kept per skill and the Luyện tập mixed session
    And they no longer describe a Dictionary search or an R1/R2 review flow

  Scenario Outline: Removed screens are gone from both docs
    Given the updated `docs/screens.md` and `CONTEXT.md`
    When I search both files for <removed>
    Then there are no matches

    Examples:
      | removed      |
      | T3 Từ điển   |
      | R1           |
      | R2           |
      | Tra từ       |
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: screens.md matches the prototype tab set and screens
- [ ] #2 Scenario: CONTEXT.md terms follow the per-skill practice model
- [ ] #3 Scenario: Removed screens are gone from both docs
- [ ] #4 Scenario: P1 Landing, X1 Tra nhanh, M2 Mock Test runner and M3 mock result each have a prototype file in prototype/
<!-- AC:END -->
