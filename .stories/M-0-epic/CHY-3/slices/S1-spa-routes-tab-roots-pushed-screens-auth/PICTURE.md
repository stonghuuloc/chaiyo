# CHY-3 S1 — picture
ACs: AC1, AC2, AC5 · Spec rev 1 · Sub-task CHY-3.1

## What this slice is about

The app gets its skeleton: 4 tab roots that show the tab bar, focus screens that hide it, and a login wall in front of both.
Every screen is an empty shell with a Vietnamese title. Content comes in later stories; the bar's looks come in S2.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-3` |
| Lands | route groups `(app)/(tabs)` + pushed routes, `TabBar`, session guard, `/login` shell, `@supabase/supabase-js` |
| Does not land | frost/fixed/safe-area (AC3) and crossfade (AC4) → S2 · login UI → CHY-26 |

## **AC1** — verbatim

> Scenario Outline: Each tab root renders
> Given I am signed in
> When I tap the tab <tab>
> Then the <tab> root screen shows
> And the tab bar is visible with <tab> selected
>
> Examples:
> | tab       |
> | Hôm nay   |
> | Lộ trình  |
> | Luyện tập |
> | Tôi       |

## **AC2** — verbatim

> Scenario Outline: Tab bar is hidden on pushed screens
> Given I am signed in
> When I open <screen>
> Then no tab bar is shown
>
> Examples:
> | screen                     |
> | a lesson section           |
> | a mixed practice session   |
> | a Gate Test                |
> | a Word Page                |
> | any other pushed screen    |

## **AC5** — verbatim

> Scenario: Unauthenticated access redirects to login
> Given I am not signed in
> When I open an app route such as /today
> Then I land on the login screen

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.html"><svg viewBox="0 0 640 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d1-title d1-desc" style="display:block;width:100%;height:auto"><title id="d1-title">Expected result: tabs show the bar, focus screens hide it, strangers go to login</title><desc id="d1-desc">A learner opens an app URL. Signed out lands on Đăng nhập. Signed in on /practice sees Luyện tập with the tab bar and Luyện tập selected. Signed in on /practice/session sees the session with no tab bar.</desc><defs><marker id="d1-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d1-ac" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="220" y="16" width="200" height="44" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="320.0" y="34.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Learner opens an app URL</text><text x="320.0" y="50.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">e.g. /practice</text><path d="M320 60 V92" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><polygon points="320,93.0 405.0,122 320,151.0 235.0,122" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="320" y="126" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Signed in?</text><path d="M235 122 H120 V170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><text x="170" y="114" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">no</text><rect x="30" y="170" width="180" height="58" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="120.0" y="195.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Đăng nhập</text><text x="120.0" y="211.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">/login, no tab bar</text><path d="M320 151 V196" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><text x="328" y="178" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">yes</text><polygon points="320,197.0 415.0,226 320,255.0 225.0,226" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="320" y="230" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Tab root?</text><path d="M415 226 H520 V280" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><text x="430" y="218" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">no — pushed</text><rect x="430" y="280" width="190" height="72" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="525.0" y="312.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Practice session</text><text x="525.0" y="328.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">/practice/session</text><text x="525" y="372" text-anchor="middle" font-size="13" fill="#f08a59" font-family="Geist Mono, ui-monospace, monospace">0 tab bars</text><path d="M320 255 V280" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><text x="328" y="272" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">yes</text><rect x="210" y="280" width="200" height="72" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="310.0" y="312.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Luyện tập root</text><text x="310.0" y="328.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">/practice</text><rect x="170" y="386" width="280" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="310.0" y="410.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Hôm nay · Lộ trình · [Luyện tập] · Tôi</text><text x="310.0" y="426.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">aria-current on Luyện tập</text><path d="M310 352 V386" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d1-ac)"/></svg></figure>

*Notice: one question (signed in?) and one route fact (tab root or not) decide every screen.*

## Requirement [AC1] [AC2] [AC5]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.html"><svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d2-title d2-desc" style="display:block;width:100%;height:auto"><title id="d2-title">Requirement: where the learner lands, and whether the bar is there</title><desc id="d2-desc">Business flow for AC1, AC2, AC5: a signed-out learner reaches login; a signed-in learner tapping any of 4 tabs sees that tab with the bar; opening a lesson section, mixed practice, Gate Test, Word Page or any other pushed screen hides the bar.</desc><defs><marker id="d2-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d2-ac" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="230" y="16" width="180" height="44" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="320.0" y="42.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Learner</text><path d="M230 38 H120 V100" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><text x="150" y="30" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">not signed in</text><path d="M300 60 V100" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M380 60 V80 H500 V100" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><text x="392" y="76" text-anchor="start" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">signed in</text><rect x="40" y="100" width="160" height="60" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="120.0" y="126.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Login screen</text><text x="120.0" y="142.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">AC5</text><rect x="220" y="100" width="160" height="60" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="300.0" y="126.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">taps a tab</text><text x="300.0" y="142.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">4 tabs</text><rect x="400" y="100" width="200" height="60" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="500.0" y="126.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">opens a focus screen</text><text x="500.0" y="142.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">lesson · test · word</text><path d="M300 160 V200" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M500 160 V200" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><rect x="220" y="200" width="160" height="76" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="300.0" y="226.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">that tab’s screen</text><text x="300.0" y="242.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">+ tab bar, tab lit</text><text x="300.0" y="258.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">AC1</text><rect x="400" y="200" width="200" height="76" rx="6" fill="#3d3a45" stroke="#f08a59" stroke-width="1.6"/><text x="500.0" y="226.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">the screen alone</text><text x="500.0" y="242.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">no tab bar</text><text x="500.0" y="258.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">AC2</text><rect x="150" y="312" width="300" height="60" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="300.0" y="338.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Hôm nay · Lộ trình · Luyện tập · Tôi</text><text x="300.0" y="354.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">one bar, one lit tab</text><path d="M300 276 V312" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d2-ac)"/></svg></figure>

*Notice: the bar belongs to the 4 tabs only; everything else the learner opens is a focus screen.*

## Solution [AC1] [AC2] [AC5]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.html"><svg viewBox="0 0 640 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d3-title d3-desc" style="display:block;width:100%;height:auto"><title id="d3-title">Solution: two route groups and one guard under (app)</title><desc id="d3-desc">Browser URL passes the unchanged Paraglide reroute and root layout with ssr false. New (app)/+layout.ts calls requireSession with the new Supabase client getSession; no session redirects to the new /login route. (tabs)/+layout.svelte renders the new TabBar using tabFor; pushed routes sit beside (tabs) and render no TabBar. The Landing page stays unchanged and public.</desc><defs><marker id="d3-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker><marker id="d3-ac" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f08a59"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="220" y="14" width="200" height="40" rx="6" fill="#363a4d" stroke="#f5f5f5" stroke-width="1.2"/><text x="320.0" y="38.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Browser URL</text><path d="M320 54 V76" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><rect x="170" y="76" width="300" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1" stroke-dasharray="4 3"/><text x="320.0" y="96.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">hooks.ts reroute · +layout.ts ssr=false</text><text x="320.0" y="112.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">unchanged</text><path d="M200 124 V150 H100 V170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><text x="108" y="162" text-anchor="start" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">/ public</text><rect x="30" y="170" width="140" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1" stroke-dasharray="4 3"/><text x="100.0" y="190.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Landing /</text><text x="100.0" y="206.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">prerendered</text><path d="M320 124 V170" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d3-ac)"/><text x="328" y="154" text-anchor="start" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">app URL</text><rect x="210" y="170" width="220" height="60" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="320.0" y="196.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">(app)/+layout.ts</text><text x="320.0" y="212.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">requireSession()</text><path d="M440 124 V150 H530 V262" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><text x="452" y="146" text-anchor="start" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">/login public</text><path d="M430 210 H500 V262" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d3-ac)"/><text x="436" y="250" text-anchor="start" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">null → 307</text><rect x="450" y="262" width="160" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="530.0" y="282.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">login/+page</text><text x="530.0" y="298.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">Đăng nhập shell</text><path d="M320 230 V262" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d3-ac)"/><rect x="210" y="262" width="220" height="44" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="320.0" y="280.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">lib/supabase.ts</text><text x="320.0" y="296.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">auth.getSession()</text><path d="M270 306 V350 H160 V370" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M370 306 V350 H470 V370" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><text x="320" y="342" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">session ✓</text><rect x="40" y="370" width="240" height="64" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="160.0" y="398.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">(tabs)/+layout.svelte</text><text x="160.0" y="414.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">children + &lt;TabBar&gt;</text><rect x="350" y="370" width="250" height="64" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="475.0" y="398.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">(app)/ pushed routes</text><text x="475.0" y="414.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">no TabBar</text><path d="M160 434 V462" fill="none" stroke="#f08a59" stroke-width="1.5" marker-end="url(#d3-ac)"/><rect x="30" y="462" width="260" height="72" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="160.0" y="486.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">today · roadmap</text><text x="160.0" y="502.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">practice · me</text><text x="160.0" y="518.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">TabBar: tabFor(path)</text><path d="M475 434 V462" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><rect x="320" y="462" width="290" height="72" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.6"/><text x="465.0" y="486.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">lesson/[id]/[section] · …/gate</text><text x="465.0" y="502.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">practice/session · word/[id]</text><text x="465.0" y="518.0" text-anchor="middle" font-size="12" fill="#bfc0c0" font-family="Geist Mono, ui-monospace, monospace">settings</text></svg></figure>

*Notice: the bar is structural — a route is inside `(tabs)` or it is not; no per-page flag.*

## Settled

| Decision | Why / source |
|---|---|
| Tab URLs `/today` `/roadmap` `/practice` `/me` | DISCUSSION.md Q1 → A (AC5 names `/today`) |
| All identifiers English; Vietnamese only in display text | Loc, 2026-10-29 → STORY.md Locked |
| Guard checks a real Supabase session; signed out → `/login` (307) | DISCUSSION.md Q2 → A |
| 4 pushed shells at final URLs + `/settings` as "any other" | DISCUSSION.md Q3 → A · SPEC.md Open assumptions |
| `/practice/session` lives outside `(tabs)` though under `/practice` | SPEC.md Behaviour [AC2] |
| S1 bar = plain links + `aria-current` | DISCUSSION.md Answered here |
| No return-to-page after login | CHY-26 "Login lands on Home or Welcome" |
| Tab 3 is Luyện tập; `docs/screens.md:9` says Từ điển (stale) | STORY.md Locked · CHY-5 syncs docs |

## Carried elsewhere

| Item | Went to |
|---|---|
| Frosted fixed bar, safe-area padding | S2 (AC3) |
| Line→fill crossfade, pill | S2 (AC4) |
| Login screen, buttons, landing after sign-in | CHY-26 |
| Signed-in visitor on `/` → `/today` | CHY-29 |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Add `@supabase/supabase-js`, browser client from public env | AC5 | `package.json:51` → new `src/lib/supabase.ts` | smoke (task 7) |
| 2 | `requireSession(getter)` + `(app)/+layout.ts` load | AC5 | new `src/lib/shell/guard.ts` | `guard.test.ts`: null → 307 `/login`; session → returned |
| 3 | `TABS` + `tabFor(pathname)` | AC1 | new `src/lib/shell/tabs.ts` | `tabs.test.ts`: 4 roots → 0..3; `/practice/session` `/word/x` `/` `/login` → null |
| 4 | `TabBar.svelte`, `(tabs)/+layout.svelte`, 4 root pages, `tab_*` messages | AC1 | `src/routes/+layout.svelte:8` · `messages/vi.json:4` | `pnpm check` + smoke |
| 5 | 5 pushed shells outside `(tabs)` | AC2 | new under `src/routes/(app)/` | `pnpm build` (route conflicts) + smoke |
| 6 | Public `/login` shell "Đăng nhập" | AC5 | new `src/routes/login/+page.svelte` | smoke: no redirect loop |
| 7 | Browser smoke: 9 URLs signed out → `/login`; magic link via Inbucket `:56324`; 4 roots lit, 5 pushed bar-less | AC1 AC2 AC5 | `supabase/config.toml:154,158` | evidence → VERIFY.md |
| 8 | `pnpm check && lint && test && build` | CHORE | `package.json` scripts | all green |

Mutation paths: session from magic-link hash **and** from persisted storage after reload — both in task 7.
Rollback: `git revert` the slice commits, drop the dependency; no migration, no hosted config change.

## Today → after

| | Today | After this slice |
|---|---|---|
| App routes | 1 (Landing `/`) | 4 tab roots + 5 pushed + `/login` |
| Signed out on `/today` | 404 | `/login` |
| Tab bars on `/practice` / `/practice/session` | — | 1 / 0 |

## Out of frame
- AC3, AC4 render on the same `TabBar` → S2 styles it; S1 leaves its markup (`nav.tabs` > `a.tab`) matching `prototype/tabs.js:1`.
- Real `/login` behaviour → CHY-26; S1 only guarantees the redirect lands there.
