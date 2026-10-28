---
id: CHY-63
title: Vercel deploy (preview + production)
status: To Do
assignee: []
created_date: '2026-10-28 05:59'
labels:
  - infra
milestone: m-0
dependencies:
  - CHY-2
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deploy the SvelteKit app to Vercel with production on main and a preview per PR. Needed so the hosted Supabase project has a production site_url (CHY-2 S2 Q4).

Note: the GitHub integration got linked during CHY-2 S2 (`vercel link`); AC1–2 need verifying, not building. Preview URLs are not in the hosted redirect allow-list yet.

```gherkin
Feature: Vercel deploy (preview + production)
  As a developer
  I want the app deployed to Vercel
  So that hosted auth has a real production site_url and every PR can be previewed

  Scenario: main deploys to production
    Given a commit is pushed to main
    When the Vercel production build finishes
    Then the production URL serves the app with HTTP 200

  Scenario: a PR gets a preview deployment
    Given a pull request is opened
    When the Vercel preview build finishes
    Then the PR shows a preview deployment URL

  Scenario: the build uses adapter-vercel
    Given vite.config.ts imports adapter-vercel
    When the Vercel build runs
    Then the build completes with no errors

  Scenario: Supabase env vars are set without secrets in the repo
    Given the hosted chaiyo Supabase project exists
    When I inspect the Vercel production environment variables
    Then PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY point at the hosted chaiyo project
    And the repo contains no secret values

  Scenario: README documents the deploy
    Given a new developer reads README.md
    When they look at the Develop and Deploy sections
    Then the Vercel deploy setup is documented

  Scenario: Hosted Supabase redirects return to the deployed app
    Given the hosted Supabase project Site URL is the production domain
    And the redirect allow-list includes the production domain and the preview URL pattern
    When a learner signs in with Google or the email magic link on the deployed app
    Then the learner returns to the deployed app signed in
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pushing to main deploys to production and the production URL returns HTTP 200
- [ ] #2 A pull request gets a preview deployment URL
- [ ] #3 The build uses adapter-vercel (vite.config.ts:4) and finishes with no errors
- [ ] #4 PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in Vercel production, pointing at the hosted chaiyo project, with no secrets in the repo
- [ ] #5 README Develop/Deploy documents the Vercel deploy
- [ ] #6 The hosted Supabase Site URL is the production domain and its redirect allow-list includes the production domain and the preview URL pattern, so Google and magic-link sign-in on the deployed app return the learner signed in
<!-- AC:END -->
