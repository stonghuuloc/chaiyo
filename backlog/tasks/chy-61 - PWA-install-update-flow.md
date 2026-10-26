---
id: CHY-61
title: PWA install + update flow
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:54'
labels:
  - infra
milestone: m-12
dependencies:
  - CHY-3
priority: medium
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manifest + icons exist. Add install prompt, iOS add-to-home hint, new-version prompt from the service worker.

```gherkin
Feature: PWA install + update flow
  As a learner
  I want to install Chaiyo on my phone and get new versions
  So that it opens like an app and stays current

  Scenario: Android install prompt
    Given I open Chaiyo in Chrome on Android and it is installable
    Then an install prompt is offered
    When I accept
    Then the app is added to my home screen with the Chaiyo icon and opens standalone

  Scenario: iOS add-to-home hint
    Given I open Chaiyo in Safari on iOS and it is not installed
    Then I see a hint explaining how to use the Share menu → Add to Home Screen
    And the hint does not show once the app runs standalone

  Scenario: Dismissed prompt stays away
    Given I dismissed the install prompt
    When I reload
    Then it is not shown again right away

  Scenario: New version prompt
    Given the app is installed and a new version is deployed
    When the service worker finds the new version
    Then an update prompt is shown
    When I accept it
    Then the app reloads on the new version

  Scenario: Installs on iOS and Android
    Then a manual check on one iPhone and one Android phone both installs the app and passes the update prompt flow
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Android install prompt
- [ ] #2 Scenario: iOS add-to-home hint
- [ ] #3 Scenario: Dismissed prompt stays away
- [ ] #4 Scenario: New version prompt
- [ ] #5 Scenario: Installs on iOS and Android
<!-- AC:END -->
