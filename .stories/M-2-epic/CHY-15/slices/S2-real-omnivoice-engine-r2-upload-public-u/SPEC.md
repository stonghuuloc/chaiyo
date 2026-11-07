# CHY-15 S2 — spec
ACs: AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 0 (frame; confirmed once CHY-14 S2 / CHAA-55 lands)

## Behaviour
- [AC5] `pnpm render:audio <manifest>` reads `{ sha, entries }`, calls S1's `render` with an OmniVoice engine and an R2 bucket adapter, and prints `<uploaded> uploaded, <skipped> skipped`.
- [AC5] The bucket adapter (S3 API on `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`) puts `<key>.mp3` as `audio/mpeg`; `has` is a HEAD.
- [AC5] Engine: local OmniVoice, voice per Cast id from CHY-14 S2's voice pin (ADR 0003), output encoded to mp3. Runs on Loc's MacBook.
- [AC5] After rendering Bài 1, `GET <R2_PUBLIC_URL>/<key>.mp3` for a Bài 1 sentence answers 200 `audio/mpeg` and the clip plays; CORS GET allows the app origin.
- [NFR] A missing `R2_*` or `R2_PUBLIC_URL` prints the name and exits 2 before any engine call; no key or env value is printed.
- [CHORE] `package.json` +1 script, `.env.example` R2 public block.

## Open assumptions
- [AC5] Needs CHY-14 S2 (voice pin) and a new public bucket (Loc, Q4 A).
