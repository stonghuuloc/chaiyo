---
id: CHY-69
title: 'Service worker: await bundle cache write before responding'
status: To Do
assignee: []
created_date: '2026-11-01 12:21'
labels:
  - bug
dependencies: []
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
src/service-worker/index.ts:36 calls cache.put(event.request, res.clone()) without await or event.waitUntil, so the worker can stop before the response is cached; offline reopen of a lesson bundle (ADR 0002) can then miss. Fix: await cache.put, or event.waitUntil(cache.put(...)). Found by CodeRabbit on PR #17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A bundle fetched online is in the cache once the response resolves
<!-- AC:END -->
