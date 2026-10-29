# CHY-3 S1 — spec
ACs: AC1, AC2, AC5  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC1] Signed in, opening `/today`, `/roadmap`, `/practice` or `/me` renders that tab root
  with its Vietnamese title (Hôm nay · Lộ trình · Luyện tập · Tôi). Verified by: page heading text.
- [AC1] Every tab root shows one tab bar with 4 links in order Hôm nay · Lộ trình · Luyện tập · Tôi.
  Exactly 1 link carries `aria-current="page"`: the one whose href equals the current path.
- [AC1] Tapping a tab link navigates client-side to that tab root; the selected link moves with it.
- [AC2] Signed in, opening any pushed screen renders no tab bar (0 `nav` tab bar elements in the DOM):
  - a lesson section → `/lesson/[id]/[section]`
  - a mixed practice session → `/practice/session`
  - a Gate Test → `/lesson/[id]/gate`
  - a Word Page → `/word/[id]`
  - any other pushed screen → `/settings` stands for the case
- [AC2] `/practice/session` sits under the Luyện tập path and still renders no tab bar.
- [AC5] Not signed in, opening any of the 4 tab roots or any pushed screen lands on `/login`
  before app content renders. Verified by: final URL `/login`, no tab bar, no tab root heading.
- [AC5] `/login` renders an empty shell titled "Đăng nhập". The screen itself is CHY-26.
- [AC5] "Signed in" = Supabase client `auth.getSession()` returns a session. A session arrives
  via a magic link whose redirect lands on an app route (`detectSessionInUrl`).
- [AC5] The Landing Page `/` and `/login` stay public: no redirect when signed out.
- [LOCK] App routes are client-rendered (`ssr = false`); the Landing Page stays prerendered.
- [LOCK] All identifiers English (URLs, files, code); Vietnamese only in display text via Paraglide messages.

## Not this slice
- AC3 (frost, fixed, safe-area) and AC4 (line→fill crossfade, pill) → S2. S1's bar is unstyled links.
- Tab root and pushed screen content → later milestones (CHY-31/32/36/41/42/45/49/50/53).
- Login screen UI, sign-in buttons, post-login landing → CHY-26.
- Signed-in visitor on `/` redirecting to `/today` → CHY-29 (Landing P1).

## Seam
Route group `src/routes/(app)/(tabs)/` whose layout renders the bar; pushed screens sit directly
under `(app)/`, outside `(tabs)`; the shared `(app)/+layout.ts` load runs the session guard.

## Test contract
- [AC1] vitest: `tabFor(pathname)` returns the tab index for each of the 4 roots, and
  `null` for `/practice/session`, `/word/x`, `/`, `/login`.
- [AC5] vitest: the guard load throws a redirect to `/login` when the session getter returns null,
  and returns the session when it returns one.
- [AC1] [AC2] [AC5] browser smoke on `pnpm dev` + local Supabase: signed out → 9 app URLs end on
  `/login`; signed in via magic link → 4 tab roots show the bar with the right `aria-current`,
  5 pushed URLs show 0 tab bars.

## Open assumptions
- [AC2] `/settings` stands for "any other pushed screen" (Settings U4 is a pushed List screen
  in `docs/screens.md`). Wrong pick costs 1 route rename; DISCUSSION.md Q3 settled the shape.
