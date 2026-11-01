# 0002 — Lesson content as static JSON bundles

Status: accepted (2026-11-01)

## Context

Catalog needs one Source for lesson content. Two options: a static JSON bundle per lesson, or Postgres rows read through Supabase. SRS must work offline (`PRODUCT.md`), every hanzi is tappable for lookup, and content lives in git as YAML. Either option fits the same Catalog interface.

## Decision

Lesson content reaches the phone as **one static JSON bundle per lesson**, built by the importer in CI and served by Vercel with the app (same origin). The URL carries the import's `contentSha`; the service worker caches it. Postgres rows were not chosen for lesson delivery.

A lesson bundle holds the lesson, its sentences, questions and grammar points, the Word Page data of every word it teaches, and thin Dictionary entries (hanzi, pinyin, Hán Việt, meaning) for every word in its sentences' `seg` and each char of those words.

Reasons:
1. 0 database reads per lesson open, against reads over 7 content tables (lessons, sentences, words, word_chars, chars, grammar_points, questions).
2. Offline reopen comes from the service worker; rows would need a second cache in IndexedDB.
3. A new `contentSha` is a new URL, so old caches expire with no invalidation code.
4. Bài 1 is about 2.0 KB gzip, so re-downloading all 40 HSK1 lessons after an import is cheap.

Postgres is still used for:
- the Dictionary (about 122k entries, ≈ 6.6 MB gzip — too big to bundle), for Dictionary search/lookup (X1) outside lesson text;
- `questions` and `content_versions` rows, which Attempts reference by `question_id` and `content_sha`;
- a full mirror of the content tables in `docs/content-schema.md`, so Admin screens read sentence text and per-lesson fail rates with SQL.

## Consequences

- A content fix ships as commit → CI import → Vercel deploy; there is no content-only release.
- The importer has two real sinks: the bundle and Postgres.
- Offline, tap-to-lookup works for every hanzi in an opened lesson; outside lesson text it needs the network.
- A Word Page for a word from a lesson the Learner has not opened needs the network.
