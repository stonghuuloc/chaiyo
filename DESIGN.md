---
name: Mandarin App
description: Vietnamese-first HSK1→5 Mandarin study app; ink on notebook paper, one red, frost only where it floats.
colors:
  lantern-red: "#c6301d"
  lantern-red-press: "#a72614"
  lantern-red-text: "#a72614"
  lantern-red-wash: "#f6e1db"
  sunflower: "#fec33e"
  sunflower-wash: "#fff3d6"
  freeze-blue: "#3f73b0"
  notebook-paper: "#f7f3ea"
  shaded-paper: "#efe9dc"
  ink: "#1d1814"
  graphite: "#4a423a"
  pencil: "#655c51"
  faint-pencil: "#948a7e"
  ruled-line: "#ddd5c8"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Literata, serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Literata, serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Literata, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  action:
    fontFamily: "Literata, serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.35
  tab:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1
  hanzi:
    fontFamily: "AR PL UKai CN, Kaiti SC, STKaiti, KaiTi, serif"
  pinyin:
    fontFamily: "Onest, system-ui, sans-serif"
rounded:
  cell: "12px"
  action: "18px"
  pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "20px"
  s6: "24px"
  s8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lantern-red}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    height: "62px"
  button-primary-active:
    backgroundColor: "{colors.lantern-red-press}"
  link-more:
    textColor: "{colors.lantern-red-text}"
    typography: "{typography.label}"
  chip-frost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  tab-bar:
    rounded: "{rounded.pill}"
    height: "66px"
    padding: "5px"
  tab-item:
    textColor: "{colors.graphite}"
    typography: "{typography.tab}"
  tab-item-active:
    textColor: "{colors.ink}"
  day-cell:
    backgroundColor: "rgba(255,255,255,.35)"
    textColor: "{colors.pencil}"
    rounded: "{rounded.cell}"
  day-cell-today:
    backgroundColor: "{colors.lantern-red-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cell}"
  path-mark-done:
    backgroundColor: "{colors.lantern-red}"
    textColor: "{colors.white}"
    size: "36px"
  path-mark-locked:
    backgroundColor: "{colors.shaded-paper}"
    textColor: "{colors.pencil}"
    size: "36px"
---

# Design System: Mandarin App

## Overview

**Creative North Star: "The Study Notebook"**

Every screen is a page in a neat study notebook: warm paper, ink text, thin ruled lines between sections, and one red pen for what matters today. The page is flat. Hierarchy comes from serif headings, ink weight and hairline rules, not from boxes and shadows. The cast art is the one rich, warm image on a screen; the interface around it stays quiet so the art and the character being learned carry the feeling.

Frost is the exception, never the surface. Only things that float above the page are frosted: the tab bar, small status chips over the hero art, and the selection pill. Frost is plain CSS `backdrop-filter` blur over a warm milky tint, so it stays smooth on phones. Refractive WebGL glass was tried and rejected: it stuttered on every real phone scroll.

Rejected (confirmed by the owner): kiddie or toy UI, generic app templates, busy screens, emoji in the interface.

**Key Characteristics:**
- Warm cream paper and warm near-black ink; never pure white page, never pure black text.
- One accent, Lantern Red, for progress, the next action and links. One secondary, Sunflower (the logo tile), for brand and reward fills only.
- Serif (Literata) for headings and the main action; sans (Be Vietnam Pro) for everything you scan.
- Flat page with 1px ruled lines; depth only for floating frost and the primary action.
- Solar icons (480 Design, CC BY 4.0, credit in About): **line-duotone** at rest, **bold-duotone** for selected, achieved and media controls; plain linear only for tiny glyphs (✕, chevrons, check). The duotone second layer is ink at 50% (`--duo`); on the streak flame it is a solid pale red `#f2cfc6` (`--duo-c`), never red on red. The active tab is the inverse: Lantern Red silhouette (`--duo-c`, `--duo: 1`) with Lantern Red Wash detail.

## Colors

Two colours on a warm paper-and-ink neutral range: Lantern Red and Sunflower, the logo's yellow. One exception: Freeze Blue, for the Streak Freeze only.

### Primary
- **Lantern Red** (`lantern-red`): the next action (primary button), completed path marks, streak fire, today's day cell, the filled icon of the selected tab, focus rings. Pressed state uses **Lantern Red Press** (`lantern-red-press`); quiet backgrounds use **Lantern Red Wash** (`lantern-red-wash`).
- **Lantern Red Text** (`lantern-red-text`, same value as Press): red text below 18px, such as "Xem tất cả" links and the current lesson title. Lantern Red as small text reaches only APCA Lc 68.8 on paper; this reaches Lc 76.4.

### Secondary
- **Sunflower** (`sunflower`, #fec33e): the logo tile yellow. Brand and reward fills only: the splash screen, the gate-pass celebration, milestone chips. Text and icons on it are Ink (10.97:1). Never white text on it (1.6:1). Lantern Red on it only at 24px or more, or as an icon (3.41:1). Quiet fills use **Sunflower Wash** (`sunflower-wash`, #fff3d6).
- **Freeze Blue** (`freeze-blue`): only the Streak Freeze (snowflake icon, frozen day). Nothing else is blue.

### Neutral
- **Notebook Paper** (`notebook-paper`): page background everywhere.
- **Shaded Paper** (`shaded-paper`): recessed fills such as locked lesson marks.
- **Ink** (`ink`): headings, primary text, active tab label.
- **Graphite** (`graphite`): secondary text, inactive tab labels and icons.
- **Pencil** (`pencil`): meta text, captions, day labels.
- **Faint Pencil** (`faint-pencil`): chevrons, empty future-day rings.
- **Ruled Line** (`ruled-line`): section dividers, cell borders, the path's connecting line.

### Named Rules
**The One Red Pen Rule.** Lantern Red marks what is done, what is next, or what is tappable to go further. It is never decoration, never a section background, never a heading colour except the current lesson.

**The Two Colours Rule.** The palette is Lantern Red and Sunflower on paper-and-ink neutrals. One exception: Freeze Blue, for the Streak Freeze only. No other hue: no blue for info or links, no green for success. Stroke-order animations draw in Ink with the radical in Lantern Red.

**The Sunflower Is a Reward Rule.** Sunflower fills things that celebrate or brand: the logo, the splash, a passed gate, a milestone. It is never a button, a link, a progress mark or a text colour; those stay Lantern Red. On Notebook Paper it is only 1.45:1, so never use it as a thin line or a bare outline; it must be a filled shape with Ink content.

## Typography

**Display Font:** Literata (serif)
**Body Font:** Be Vietnam Pro (with system-ui)
**Hanzi Font:** AR PL UKai CN (Kaishu) by default; Xingshu (Zhi Mang Xing) only as a learner toggle.
**Pinyin Font:** Onest. Be Vietnam Pro has no precomposed ǎ ǐ ǒ ǔ ǖ ǘ ǚ ǜ (U+01CD–01DC), so pinyin words use Onest, which is geometric like it and has the full set; elsewhere those code points fall back to Onest.

**Character:** A bookish serif for anything you would write as a heading in a notebook, paired with a clear Vietnamese-first sans that renders every diacritic cleanly at small sizes.

### Hierarchy
- **Display** (600, 36px, 1.0, -0.01em): screen title over the hero art ("Hôm nay"), white with a soft text shadow.
- **Headline** (600, 23px, 1.2): section headings ("Lộ trình", "Tuần này", "Bạn bè").
- **Title** (600, 17px, 1.3): list item titles such as lesson rows ("Bài 4 · Bạn thích gì?"), the topic part in Pencil at 500.
- **Action** (Literata 600, 21px): the primary button label only.
- **Body** (400, 16px, 1.5): running text and explanations.
- **Label** (400, 13.5px): meta lines, captions, helper text under the action.
- **Tab** (600, 11.5px): tab bar labels.

### Named Rules
**The Serif Speaks First Rule.** Headings, lesson titles and the primary action are Literata; anything a learner scans or reads in bulk is Be Vietnam Pro. Do not set body text in the serif.

## Layout

Single phone column, max 430px wide, centred on larger screens. Page gutters are 20px. Sections stack with 24px top padding and are separated by a 1px Ruled Line with 20px above it. Spacing follows a 4px base (4, 8, 12, 16, 20, 24, 32). The home screen opens with a full-bleed 400px hero image; the primary action overlaps the hero's bottom edge by 56px. Content keeps 120px clear at the bottom so the floating tab bar never covers the last row. Grids are used for fixed sets only: 7 equal day cells (6px gap), 3 friend columns (8px gap). Safe-area insets are respected at top and bottom.

## Elevation & Depth

The page is flat paper. Content has no card shadows and no boxes; depth on the page is shown by ruled lines, fills (Shaded Paper, Lantern Red Wash) and type weight. Two things lift: the primary action, which casts a warm red shadow because it is the one thing to press, and floating frost (tab bar, chips), which casts a soft brown ambient shadow.

### Shadow Vocabulary
- **Action lift** (`box-shadow: 0 10px 24px rgba(168,38,20,.28), inset 0 1px 0 rgba(255,255,255,.18)`): primary button only.
- **Frost float** (`box-shadow: 0 10px 30px rgba(45,25,10,.16), 0 1px 3px rgba(45,25,10,.08)`): tab bar and frost chips.

### Named Rules
**The Flat Page Rule.** Nothing that scrolls with the page gets a shadow. If a new screen seems to need cards, use ruled lines and fills first; layered paper is a deliberate future decision, not a default.

**The Only Frost Floats Rule.** Frost is for elements that stay above the page (navigation, status over imagery). Never use it for content cards, sheets of text or list rows.

## Shapes

Gently rounded, never sharp and never bubbly. Day cells 12px, the primary action 18px, and everything that floats or toggles is a full pill (999px). Status marks and avatars are circles (36px path marks, 38px avatars, 26px day marks). Borders are 1px Ruled Line; the current lesson mark uses a 2.5px Lantern Red ring.

## Components

### Buttons
- **Shape:** softly rounded rectangle (18px), full width, 62px tall.
- **Primary:** Lantern Red fill, white Literata label with a Solar icon left and a caret right. One per screen: the next thing to do.
- **Pressed:** Lantern Red Press, scale to 0.985 over 120ms. No hover-only affordances; this is a touch-first app.
- **Focus:** 2.5px Lantern Red outline, 3px offset.

### Chips (frost)
- **Style:** 40px pill over the hero art, Ink text at 600 15px, a 1px divider between facts.
- **Content:** status only (streak days with a bold-duotone flame in Lantern Red, freezes with a snowflake in Freeze Blue). Chips are not buttons.
- **Frost:** `rgba(250,246,238,.72)` tint, `backdrop-filter: blur(24px) saturate(175%)`, 1px white top rim, Frost float shadow.

### Lists (lesson path)
- **Rows:** 60px minimum, 36px circular mark, title + label, regular caret on the right.
- **States:** done = Lantern Red disc with a white bold check and a red connecting line; now = Lantern Red ring with a red dot, title in Lantern Red Text; locked = Shaded Paper disc with a bold-duotone lock in Pencil.

### Day cells (week strip)
- **Style:** 7 equal cells, 12px corners, 1px Ruled Line border, translucent white fill, day label in Pencil.
- **States:** studied = Lantern Red disc with a white check; frozen = Freeze Blue snowflake; today = Lantern Red Wash fill, red border, Ink bold label, empty red ring; future = empty Faint Pencil ring.

### Navigation (tab bar)
- **Style:** a floating 66px frosted pill, `position: fixed` 14px above the bottom safe area, max 402px wide. Same frost as the chips. Four tabs: Hôm nay, Lộ trình, Từ điển, Tôi. Hidden inside lessons.
- **Items:** Solar line-duotone icon (24px) over a Tab label in Graphite. The active tab swaps to bold-duotone: the silhouette is Lantern Red (`--duo-c` at `--duo: 1`) and the inner detail is Lantern Red Wash, with an Ink label. Line and bold icons are stacked and crossfade by opacity only; there is no icon scale.

### Selection pill
- **Rest:** a milky pill (`rgba(255,255,255,.62)`, white top rim, faint shadow) one slot wide, under the active tab.
- **Press / drag:** grows slightly (1.08 × 1.12) and follows the finger on a spring.
- **Release:** snaps to the nearest tab with a slight overshoot and selects it.
- Only the pill's transform changes per frame; the bar never re-renders.

## Do's and Don'ts

### Do:
- **Do** keep the page Notebook Paper and text Ink/Graphite/Pencil; separate sections with a 1px Ruled Line.
- **Do** give each screen exactly one primary action in Lantern Red.
- **Do** use Solar from `prototype/icons.svg`: line-duotone at rest, bold-duotone selected/achieved; eye / eye-closed for show / hide.
- **Do** give each clip one play button only: tapping the same clip again plays it at 0.5× (pitch kept), and the next tap plays normal speed again. No separate slow button.
- **Do** let the cast art be the only rich image on a screen, cropped 3:2, with no text inside it.
- **Do** check scrolling and floating UI on a real iPhone; desktop hides jank.

### Don't:
- **Don't** put emoji anywhere in the interface.
- **Don't** add card shadows or boxes to scrolling content (The Flat Page Rule).
- **Don't** use frost for content; only for floating navigation and status over imagery.
- **Don't** make the selected tab a red pill; the pill is milky white and only the icon is red.
- **Don't** bring back WebGL/refractive glass for anything that floats over scrolling content.
- **Don't** add another hue. Red and Sunflower are the palette; Freeze Blue is only for the Streak Freeze (The Two Colours Rule).
- **Don't** build toy-like UI: no bouncy cartoon buttons, no rainbow gradients, no busy multi-colour dashboards.
