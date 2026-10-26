---
id: CHY-1
title: Git repo + CI checks
status: In Progress
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-26 09:02'
labels:
  - slice-1
  - infra
milestone: m-0
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The repo has no git history yet. Put it under git and run the existing scripts in CI.

```gherkin
Feature: Git repo + CI checks
  As a developer
  I want the repo under git with CI running the existing scripts
  So that every push and PR is checked automatically

  Scenario: Repo initialised with a clean first commit
    Given the chaiyo folder has no git history
    When I run `git init` and make the first commit
    Then `git log --oneline` shows exactly 1 commit
    And `git status --short` prints nothing
    And `git ls-files` lists no path under node_modules, .env, src/lib/paraglide or .svelte-kit

  Scenario Outline: Ignored paths never get committed
    Given the first commit exists
    When I create <path> and run `git status --short`
    Then <path> does not appear in the output

    Examples:
      | path                    |
      | node_modules/x/index.js |
      | .env                    |
      | src/lib/paraglide/m.js  |
      | .svelte-kit/output      |

  Scenario Outline: CI runs every script on push and PR
    Given the workflow file exists in .github/workflows
    When I push a branch or open a pull request
    Then GitHub Actions starts a run that executes `pnpm <script>`

    Examples:
      | script |
      | check  |
      | lint   |
      | test   |
      | build  |

  Scenario: CI is green on main
    Given the first commit is pushed to main
    When the CI run on main finishes
    Then `pnpm check`, `pnpm lint`, `pnpm test` and `pnpm build` all pass
    And the commit shows a green check on GitHub

  Scenario: CodeRabbit reviews every pull request
    Given the repo is public on GitHub
    And the CodeRabbit GitHub app is installed on it on the free open-source plan
    When I open a pull request
    Then CodeRabbit posts a review on that pull request
    And the repo is billed $0 for CodeRabbit

  Scenario: Ignored art and audio live on R2
    Given `assets/**/*.png` and `prototype/audio/` are ignored by git
    When I run the upload script
    Then every ignored PNG and mp3 exists on R2 under the same relative path
    And on a fresh clone the pull script restores them so every `../assets/` path in prototype/ loads
    And this runs before the repo is made public

  Scenario: No retired cast name in committed files
    Given the files staged for the first commit, excluding backlog/ and .stories/
    When I search them case-insensitively for chiikawa, hachiware, usagi, momonga and nagano
    Then there are no matches
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Repo initialised with a clean first commit
- [ ] #2 Scenario: Ignored paths never get committed
- [ ] #3 Scenario: CI runs every script on push and PR
- [ ] #4 Scenario: CI is green on main
- [ ] #5 Scenario: CodeRabbit reviews every pull request
- [ ] #6 Scenario: Ignored art and audio live on R2
- [ ] #7 Scenario: No retired cast name in committed files
<!-- AC:END -->
