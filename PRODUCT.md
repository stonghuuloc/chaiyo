# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

SvelteKit (SPA app pages, pre-rendered Landing Page, Paraglide i18n, built-in service worker / PWA) · Supabase · Azure Speech · Cloudflare R2 · Vercel. Recorded in `docs/adr/0001-sveltekit-over-nuxt.md`.

## Users

Vietnamese-speaking adults learning Mandarin from HSK1 to HSK5: the owner and his friends. Sign-up is open but the app is unlisted, so a few strangers may arrive. They study on their phones in two situations: short sessions on the move or before bed (SRS reviews, tapping a word to look it up, keeping the Streak alive), and 1–1.5h lesson sessions at home.

## Product Purpose

Teach Mandarin step by step against the HSK 3.0 syllabus (GF0025-2021), in Vietnamese, until the learner can pass the HSK 3.0 exam level by level and speak at HSKK level. Success: learners finish lessons, pass Gate Tests and Mock Tests, and come back daily.

## Positioning

Vietnamese-first, with Hán Việt as the bridge to every character — EN-first apps (Duolingo, HelloChinese, SuperChinese) skip it. The cast acts out each word in pictures and speaks the dialogues with fixed voices. A lesson unlocks only after the previous lesson's Gate Test is passed at 80%.

## Operating Context

- Phone-first, installable PWA; also usable on desktop. Mobile data, sometimes offline (SRS reviews must work offline).
- Login required everywhere; the only public page is the Landing Page.
- A lesson runs: warm-up review → 8–15 new words → grammar → dialogue → listening/speaking → writing → Gate Test.
- Every hanzi in any text is tappable for lookup (Lexicon first, else Dictionary).
- Speaking answers are recorded in the browser and scored; audio is not kept.
- Daily Reminders by push, email or Telegram; Streaks with Streak Freezes; Badges; Public Profiles other Learners can see.
- Domain vocabulary: `CONTEXT.md`.

## Capabilities and Constraints

- UI, explanations and meanings in Vietnamese; audio is zh-CN only; English is wired for later but empty.
- Every word shows hanzi, pinyin (with tone sandhi shown), Hán Việt, Vietnamese meaning, radical breakdown, stroke order, example sentences, picture and audio.
- Lesson pages carry hundreds to thousands of tappable characters; a lookup popup must never hide the text being read.
- Content is authored as files in git and reviewed outside the app; the app never edits content.
- Undecided: visual world, Landing Page content.

## Brand Commitments

- Art: the cast v2 creatures (baby panda, red panda, sika deer fawn, takin calf) in a cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals — set in richly detailed, cozy storybook backgrounds with warm golden light. No text inside images. Images are cropped to 3:2.
- Hanzi font: Kaishu (AR PL UKai CN) by default; Xingshu (Zhi Mang Xing) only as a learner toggle. Stroke order via Hanzi Writer.
- Voice: casual, plain Vietnamese.

## Evidence on Hand

- Sample art: `assets/samples/` (apple, bank, cafe, drink, happy); cast lineup `assets/ref/cast.png`.
- Font: `assets/ukai.ttc`.
- Content data in `~/Documents/second-brain/mandarin/`: 197 character lessons, 407 character notes, 56 radicals, `_hanviet.tsv` (1,653 chars), `_readings.tsv`, frequency list.
- No real lessons, users, testimonials or usage numbers exist yet; do not invent them.

## Product Principles

- The character is the hero; every screen exists to make one word or sentence stick.
- Hán Việt is never optional — it is how a Vietnamese learner already knows half of every character.
- Short sessions must finish in under five minutes on a phone, one-handed.
- Progress is earned: gates, Streaks and Badges reward real study, never opening the app.
- Cute art, serious learning — the Cast brings warmth; the learning UI stays precise.
