---
id: CHY-6
title: 'ADR: content delivery + schema open decisions'
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - slice-1
  - decision
milestone: m-1
dependencies: []
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Decide the open question in `docs/architecture.md` (static JSON bundle per lesson on the CDN vs Postgres rows) and `docs/content-schema.md` open decisions 1–2 (single chars inside compounds; grammar point ids).

```gherkin
Feature: ADR: content delivery + schema open decisions
  As a developer
  I want the content delivery and schema open questions decided in writing
  So that Catalog's Source adapter and the content schema can be built

  Scenario: ADR records the delivery choice
    Given `docs/adr/0001-sveltekit-over-nuxt.md` is the only ADR
    When I open `docs/adr/0002-*.md`
    Then it states one choice: static JSON bundle per lesson on the CDN, or Postgres rows through Supabase
    And it lists the reasons for the choice
    And it names what the other option is still used for (Dictionary search, Attempt foreign keys)

  Scenario: Open decision 1 is answered
    Given `docs/content-schema.md` "Open decisions"
    When I read decision 1 (single chars inside compounds in `sections.words`)
    Then it is marked decided with the answer: both 你 and 你好 are listed, or only the compound
    And the Bài 1 example in the same doc is consistent with that answer

  Scenario: Open decision 2 is answered
    Given `docs/content-schema.md` "Open decisions"
    When I read decision 2 (grammar point ids)
    Then it is marked decided: own `h1-gNN` ids, or GF0025-2021 item numbers
    And the GrammarPoint type and the `h1-g01` example are consistent with that answer

  Scenario: architecture.md no longer lists the question as open
    Given the ADR is written
    When I read `docs/architecture.md`
    Then the "Open question" section is replaced by a pointer to the ADR
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: ADR records the delivery choice
- [ ] #2 Scenario: Open decision 1 is answered
- [ ] #3 Scenario: Open decision 2 is answered
- [ ] #4 Scenario: architecture.md no longer lists the question as open
<!-- AC:END -->
