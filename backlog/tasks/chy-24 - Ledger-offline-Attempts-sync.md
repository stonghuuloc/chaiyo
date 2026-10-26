---
id: CHY-24
title: 'Ledger: offline Attempts + sync'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - core
milestone: m-3
dependencies:
  - CHY-23
  - CHY-19
priority: high
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`record(attempt)`, `state()`, `subscribe(fn)`. IndexedDB outbox, replay of `Study.apply` over unsynced Attempts, merge with server.

```gherkin
Feature: Ledger: offline Attempts + sync
  As a learner
  I want my study to work in airplane mode and sync later
  So that I never lose progress or double-count it

  Scenario: Progress made offline survives a reopen
    Given the phone is in airplane mode
    When I finish the Từ mới section of Bài 1
    And I close and reopen the app, still offline
    Then Từ mới shows as done
    And the Streak counts today

  Scenario: Back online, Attempts sync exactly once
    Given I recorded 10 Attempts offline
    When the phone goes online
    Then the server holds those 10 Attempts
    And the outbox is empty
    And reopening the app does not upload them again

  Scenario: Duplicate replays never create duplicate Attempts
    Given the in-memory store already has Attempt "a-001"
    When record() is called again with Attempt "a-001"
    And the outbox is flushed twice
    Then the store holds exactly one Attempt "a-001"

  Scenario: state() is Study.apply folded over Attempts
    Given 3 Attempts in the outbox and 5 already on the server
    When I call state()
    Then it equals Study.apply folded over all 8 Attempts in time order

  Scenario: Another device's Attempts are merged
    Given my other phone synced 4 Attempts to the server while this phone was offline
    When this phone goes online and syncs
    Then state() includes the 4 Attempts and this phone's own
    And no Attempt appears twice

  Scenario: subscribe notifies on every state change
    Given I subscribed a listener with subscribe(fn)
    When I call record() with a new Attempt
    Then fn is called once with the new state
    And after I call the unsubscribe function, record() no longer calls fn

  Scenario: A failed upload keeps the Attempt
    Given the phone is online but the server answers with a 500
    When the outbox tries to flush
    Then the Attempts stay in the outbox
    And the next flush retries them
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Progress made offline survives a reopen
- [ ] #2 Scenario: Back online, Attempts sync exactly once
- [ ] #3 Scenario: Duplicate replays never create duplicate Attempts
- [ ] #4 Scenario: state() is Study.apply folded over Attempts
- [ ] #5 Scenario: Another device's Attempts are merged
- [ ] #6 Scenario: subscribe notifies on every state change
- [ ] #7 Scenario: A failed upload keeps the Attempt
<!-- AC:END -->
