---
id: CHY-23
title: 'Postgres: learner tables + RLS'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:52'
labels:
  - slice-1
  - core
  - infra
milestone: m-3
dependencies:
  - CHY-2
  - CHY-6
priority: high
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Profiles, Attempts (append-only, `question_id` + `content_sha`), settings, follows. Content tables read-only for learners.

```gherkin
Feature: Postgres: learner tables + RLS
  As a developer
  I want learner tables with row-level security
  So that a learner can only touch their own data

  Background:
    Given two learners, Linh and Nam, each with a profile, settings and Attempts

  Scenario: Migrations apply cleanly on a fresh database
    Given an empty Postgres database
    When I run all files in "supabase/migrations" in order
    Then the command exits with code 0
    And the tables profiles, attempts, settings and follows exist
    And RLS is enabled on each of them

  Scenario: A learner cannot read another learner's Attempts or settings
    When Linh queries attempts and settings
    Then she gets only her own rows
    And Nam's rows are not returned

  Scenario: A learner cannot write to another learner's rows
    When Linh inserts an Attempt with Nam's learner id
    And Linh updates Nam's settings
    Then Postgres rejects the statement with an RLS violation
    And Nam's rows are unchanged

  Scenario: Attempts are append-only
    When Linh updates or deletes one of her own Attempts
    Then Postgres rejects the statement
    And the Attempt row is unchanged

  Scenario: Attempt insert is idempotent by Attempt id
    Given Linh inserts an Attempt with id "a-001"
    When Linh inserts the same Attempt id "a-001" again
    Then the second insert succeeds without error
    And attempts holds exactly one row with id "a-001"

  Scenario: Attempts record which content they answered
    When Linh inserts an Attempt without question_id or content_sha
    Then Postgres rejects it for a missing required column

  Scenario: Content tables are read-only for learners
    When Linh selects from lessons and words
    Then she gets rows
    When Linh inserts, updates or deletes a row in lessons
    Then Postgres rejects it with an RLS violation
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Migrations apply cleanly on a fresh database
- [ ] #2 Scenario: A learner cannot read another learner's Attempts or settings
- [ ] #3 Scenario: A learner cannot write to another learner's rows
- [ ] #4 Scenario: Attempts are append-only
- [ ] #5 Scenario: Attempt insert is idempotent by Attempt id
- [ ] #6 Scenario: Attempts record which content they answered
- [ ] #7 Scenario: Content tables are read-only for learners
<!-- AC:END -->
