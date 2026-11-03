---
id: CHY-70
title: 'Docs sync: CHY-6 parked doc drift'
status: To Do
assignee: []
created_date: '2026-11-03 10:00'
labels: []
milestone: m-1
dependencies: []
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix doc drift parked during CHY-6 (ADR 0002 + schema decisions): std optionality in content-classes.html, missing content -> Postgres import arrow and ADR label in stack.html, "on the CDN" wording and the "locked stack" ADR 0002 mention in architecture.md. Docs only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 content-classes.html GrammarPoint std matches content-schema.md (number[], required)
- [ ] #2 stack.html shows a content -> Postgres import arrow and the eyebrow names both ADRs
- [ ] #3 architecture.md says Vercel same origin and keeps ADR 0002 out of "locked stack"
- [ ] #4 The five fixed lines are removed from PARKED.md
- [ ] #5 Catalog: contentSha is optional (bundle results carry it, Dictionary rows none)
- [ ] #6 Catalog: search(query) replaced by entry(hanzi), exact-hanzi lookup, no free-text search
<!-- AC:END -->
