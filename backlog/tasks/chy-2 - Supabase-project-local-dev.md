---
id: CHY-2
title: Supabase project + local dev
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:46'
labels:
  - slice-1
  - infra
milestone: m-0
dependencies:
  - CHY-1
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Local Supabase via CLI, hosted dev project, env wiring. Auth providers: Google + magic link (email).

```gherkin
Feature: Supabase project + local dev
  As a developer
  I want Supabase running locally and as a hosted dev project
  So that the app can sign learners in with Google or an email magic link

  Scenario: Local Supabase starts
    Given the Supabase CLI and Docker are installed
    When I run `supabase start`
    Then the command exits 0
    And it prints the local API URL, anon key and Studio URL

  Scenario: .env.example covers every key the app reads
    Given the app source reads environment variables
    When I diff the variable names read in src/ against `.env.example`
    Then every name read in src/ is listed in `.env.example`
    And `.env.example` contains no real secret values

  Scenario Outline: Auth providers are configured locally and on the hosted project
    Given `supabase/config.toml` and the hosted dev project settings
    When I look up the <provider> provider
    Then it is enabled in `supabase/config.toml`
    And it is enabled in the hosted dev project

    Examples:
      | provider         |
      | Google           |
      | email magic link |

  Scenario: README documents the Supabase steps
    Given a new developer opens README.md
    When they read the "Develop" section
    Then it lists the steps to install the CLI, run `supabase start`, copy `.env.example` to `.env` and set the Google credentials
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Local Supabase starts
- [ ] #2 Scenario: .env.example covers every key the app reads
- [ ] #3 Scenario: Auth providers are configured locally and on the hosted project
- [ ] #4 Scenario: README documents the Supabase steps
<!-- AC:END -->
