# CHY-2 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-10-28] Resend custom SMTP for hosted auth email — needs a domain; no AC covers it (CHY-2 S2 Q5)
- [2026-10-28] Email scanners can consume the magic-link ConfirmationURL before the user opens the mail, which invalidates the code too; needs an interstitial confirm page (login UI, CHY-26). CodeRabbit config.toml:252 on PR #6
