---
id: CHY-4
title: Design-system primitives in Svelte
status: To Do
assignee: []
created_date: '2026-10-23 06:43'
updated_date: '2026-10-23 06:47'
labels:
  - slice-1
  - ui
milestone: m-0
dependencies:
  - CHY-3
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the 9 templates' building blocks once. Rules: one red primary button per screen, sections split by divider lines, no emoji in UI, Solar duotone icons by meaning.

```gherkin
Feature: Design-system primitives in Svelte
  As a developer
  I want the shared UI building blocks built once
  So that every screen follows the same visual rules

  Scenario: Icon sprite is generated, never hand-edited
    Given the Iconify Solar JSON is available
    When I run `pnpm icons`
    Then the sprite is written from the Solar JSON
    And re-running it produces a byte-identical sprite
    And the sprite file contains no symbol that the script did not generate

  Scenario: Duotone colours are tunable
    Given an icon rendered from the sprite
    When I set `--duo` and `--duo-c` on its parent
    Then the icon's secondary layer takes those values

  Scenario Outline: Every primitive component exists with its variants
    Given the component library
    When I render <component>
    Then it shows <variants>

    Examples:
      | component | variants                              |
      | Button    | primary red, ink, outline             |
      | Sheet     | bottom sheet                          |
      | Dialog    | centered, max width 340px             |
      | Chip      | default                               |
      | Section   | content with a divider line           |
      | Toast     | message                               |

  Scenario: Fonts are self-hosted
    Given I load a Bài 1 lesson page with the network panel open
    When the page finishes loading
    Then Be Vietnam Pro, Onest (pinyin tone marks), the display face and the lesson's Kaishu subset are served from the app's own origin
    And no request goes to Google Fonts or another font CDN

  Scenario: Colours come from design tokens only
    Given `design.tokens.json`
    When I run `pnpm tokens`
    Then the generated CSS variables match the tokens
    And a search for hex colour literals in component files finds none
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario: Icon sprite is generated, never hand-edited
- [ ] #2 Scenario: Duotone colours are tunable
- [ ] #3 Scenario: Every primitive component exists with its variants
- [ ] #4 Scenario: Fonts are self-hosted
- [ ] #5 Scenario: Colours come from design tokens only
<!-- AC:END -->
