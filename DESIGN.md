---
name: Company Brain
description: An ember-lit knowledge system where warmth signals that something is alive and permitted.
colors:
  night: "#170d09"
  panel: "#1e120c"
  panel-raised: "#251710"
  ember: "#ff8d38"
  gold: "#ffb45a"
  gold-hover: "#ffc47a"
  selection: "#ffc985"
  root: "#d66527"
  core-light: "#fff1b9"
  spark: "#ffe0a2"
  cream: "#fff5e5"
  on-night-muted: "rgba(255, 245, 229, .68)"
  on-night-subtle: "rgba(255, 245, 229, .54)"
  hairline: "rgba(255, 225, 178, .16)"
  hairline-strong: "rgba(255, 225, 178, .3)"
  day: "#f7eee2"
  day-raised: "#fffaf2"
  day-ink: "#29150d"
  day-ink-strong: "#543c2e"
  day-ink-muted: "#6a5041"
  day-accent: "#a8481a"
  ok: "#74c49b"
  ok-text: "#bfe6d1"
  danger: "#ff8a75"
  danger-text: "#ffc9bf"
  code-ground: "#100906"
  code-text: "#ffd9a4"
  ember-bloom: "rgba(255, 137, 47, .75)"
  ember-bloom-strong: "rgba(255, 137, 47, .9)"
  story-wash: "rgba(130, 47, 18, .3)"
  dawn-wash: "rgba(255, 170, 92, .2)"
  horizon-rule: "rgba(255, 168, 84, .55)"
  ramp-1: "#ff7b2d"
  ramp-2: "#ff8c3d"
  ramp-3: "#ff9c4d"
  ramp-4: "#ffb45a"
  ramp-5: "#ffc16d"
  ramp-6: "#ffd18a"
  ramp-7: "#ffe0a8"
typography:
  display:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.99
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  display-section:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 0.99
    letterSpacing: "-0.02em"
  page:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  page-compact:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
  lead:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.06em"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  xs: "2px"
  code: "6px"
  sm: "7px"
  md: "10px"
  pill: "99px"
spacing:
  xs: "7px"
  sm: "11px"
  md: "18px"
  lg: "26px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#241109"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "#ffc47a"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-night-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "30px"
  input:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "11px 13px"
  pill-status:
    backgroundColor: "transparent"
    textColor: "{colors.on-night-subtle}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
---

# Design System: Company Brain

## Overview

**Creative North Star: "The Ember in the Dark Room"**

The system behaves like a single warm light in an unlit room. The ground is
near-black with red in it, not neutral grey, and every accent sits on one warm
ramp running from deep rust through ember orange to pale gold. Nothing here is
cool-toned. Colour is not decoration in this system: it is the signal that
something is alive, permitted, or currently selected. A screen that glows
everywhere has stopped saying anything.

The product's own metaphor drives the visual one. A company brain is a tree that
grows from a root, and the marketing surface renders that literally as a glowing
tree drawn limb by limb as the reader scrolls. The authenticated surface then
deliberately turns the light down: the same palette, the same faces, but colour
withdrawn to actions, selection and state, because someone in the middle of a
task is not there to be impressed.

The result is two registers of one world. Marketing is allowed to be scenic —
display serif at 96px, a canopy of light, one authored scroll moment. The app is
restrained — one family, a fixed rem scale, panels that sit a shade above the
ground rather than casting shadows. The serif crosses that border exactly once
per screen, on the page title, and never touches a label, a control or a value.

**Key Characteristics:**

- One warm ramp; no cool hue anywhere in the system.
- Light-as-material: glow means emission, not depth. Depth is tonal.
- Two registers, one palette: scenic marketing, restrained product.
- Text tints are the foreground at lower opacity, never grey.
- Motion earns its place once per surface, then stops.

## Colors

A single warm ramp from near-black through ember to pale gold, with one cream
daylight surface as its counterweight and two semantic signals held far enough
away that neither reads as a primary action.

### Primary

- **Ember Gold** (`#ffb45a`): The one accent. Primary buttons, current selection,
  focus rings, the emphasised half of a display headline, links in the footer. It
  carries 10.86:1 against the ground, so it is legible at any size.
- **Live Ember** (`#ff8d38`): The hotter core of the ramp, reserved for emitted
  light — the tree's glow, the scroll progress fill, the ambient bloom behind the
  hero. Not used for text.

### Neutral

- **Deep Ember Black** (`#170d09`): The ground. Near-black with red in it; a
  neutral grey ground makes the whole ramp read as dirt.
- **Raised Ember Black** (`#1e120c`) and **Panel Ember Black** (`#251710`): The
  two surfaces above the ground. Panels sit on the first; inputs and code blocks
  sink to the second. Depth is these three tones plus a hairline, never a shadow.
- **Warm Cream** (`#fff5e5`): The foreground. Secondary text is this same cream at
  `.68`, tertiary at `.54` — never a grey.
- **Ember Hairline** (`rgba(255, 225, 178, .16)`): Every border in the system. A
  warm line at low alpha, not a grey stroke.

### Tertiary

- **Daylight Cream** (`#f7eee2`) with **Bark Ink** (`#29150d`): The one light
  surface, used where a long list has to be read rather than admired. It reads as
  the same world seen in daylight, not as a second theme.
- **Branch Ramp** (`#ff7b2d`, `#ff8c3d`, `#ff9c4d`, `#ffb45a`, `#ffc16d`,
  `#ffd18a`, `#ffe0a8`): Seven steps of the same ramp, one per branch of the
  knowledge tree. They differentiate without introducing a second hue.

### Named Rules

**The One Ramp Rule.** Every colour in the system is a step on the rust → ember →
gold ramp, plus the two semantic signals. There is no blue, no violet, no grey. A
proposed colour that cannot be placed on that ramp does not belong to this system.

**The Tinted Text Rule.** Secondary and tertiary text is the cream foreground at
reduced opacity, never a grey. The alpha floor is `.52`; below that, 4.5:1 against
the ground gives out.

**The Semantic Distance Rule.** Only two semantic colours exist — Sage Confirm
(`#74c49b`) and Warm Alarm (`#ff8a75`) — and both are deliberately far enough
from the accent that a status pill can never be mistaken for a button.

## Typography

**Display Font:** Instrument Serif (with ui-serif, Georgia, serif)
**Body Font:** Schibsted Grotesk (with ui-sans-serif, system-ui)
**Label/Mono Font:** none. Monospace appears only for literal keys and shell
commands, using the platform mono stack.

**Character:** A high-contrast editorial serif against a plain, characterful
grotesk. The serif supplies the warmth the product is claiming; the grotesk stays
out of the way while someone is working. Both are self-hosted under the SIL Open
Font License, so the pages ship no third-party request.

### Hierarchy

- **Display** (400, `clamp(2.6rem, 5.6vw, 4.5rem)`, 0.99, -0.02em): Marketing
  headlines only, capped at 4.5rem. The cap is set by the longest headline the
  page carries, not by how large the face can go: a full sentence at 6rem took a
  third of the viewport and left nothing above the fold. The emphasised clause is
  set in italic gold.
- **Headline** (400, 2.25rem, -0.02em): The single serif moment on an
  authenticated screen — the page title, nothing else.
- **Title** (600, 1.375rem, grotesk): Panel and section headings inside the app.
- **Body** (400, 1rem, 1.6): Reading text, held to roughly 62ch.
- **Label** (500, 0.875rem): Field labels, navigation, metadata. Never smaller
  than 0.8125rem anywhere in the system.

### Named Rules

**The One Serif Per Screen Rule.** The display serif appears once on an
authenticated screen, as its title. A serif label, a serif button, or a serif
value is always wrong; product UI reads in the grotesk.

**The -0.02em Floor Rule.** Display tracking never goes tighter than -0.02em. The
system previously ran -0.059em at 118px and the letterforms collided.

**The 13px Floor Rule.** No real text renders below 0.8125rem, and 0.75rem is
reserved for the uppercase branch-kind label alone. Metadata that will not fit at
0.8125rem is metadata the screen does not need.

**The Ten Steps Rule.** The whole system runs on ten sizes — 0.75, 0.8125, 0.875,
0.9375, 1, 1.125, 1.375, 1.75, 2, 2.25rem — plus two display clamps. An
eleventh step is drift, not a design decision; snap to the nearest existing step.

## Layout

Marketing runs edge-to-edge with fluid `clamp()` padding and full-viewport
sections; the app runs a fixed 1120px measure centred under a sticky bar, with
`clamp(18px, 4vw, 40px)` gutters. Reading text is held to `62ch`.

Rhythm is loose rather than an enforced 4pt grid: roughly 7 / 11 / 18 / 26 / 40px
between related, grouped, separated and sectioned content. Spacing above a
heading always exceeds spacing below it.

Responsive behaviour is structural, not fluid. Below 1100px the marketing hero
collapses from two columns to one and its ambient light moves behind the copy.
Below 760px the tree's floating branch labels are replaced by a caption naming
the limb currently growing — content moves, it is never clipped. Below 640px the
app bar drops the wordmark and the secondary context rather than wrapping.

## Elevation & Depth

**This system has no shadow vocabulary for depth.** Depth is tonal: three ground
tones (`#170d09` → `#1e120c` → `#251710`) plus a warm hairline. A panel is a
lighter tone with a border, not a floating card.

The only `box-shadow` in the system is emitted light — the glow on the tree's
limbs, the bloom under a primary button, the halo on a lit branch tip. That is a
material property of a thing that shines, not a depth cue for a thing that
hovers.

### Named Rules

**The Glow-Is-Light Rule.** A zero-offset coloured shadow is only permitted on an
element that is supposed to be emitting light. Everything else uses tone and a
hairline. A glowing card is a category error.

## Shapes

Two radii and a pill. Panels, code blocks and states use 10px; inputs and inner
blocks use 7px; every button, status pill and branch label is fully rounded
(99px). Dots — branch kinds, status indicators, the tree's tips — are true
circles.

Borders are always a single warm hairline. There is no thick border, no coloured
left border, and no hard-offset shadow anywhere in the system.

## Components

### Buttons

- **Shape:** Fully rounded pill (99px), never wrapping.
- **Primary:** Ember Gold ground with near-black text (`#241109`), 10px/16px
  padding, plus an offset ember bloom in marketing contexts.
- **Quiet:** Transparent with a hairline border and cream text; the border
  strengthens and the surface lifts to `--night-raised` on hover.
- **Ghost:** No border, muted text, used for app-bar actions.
- **States:** hover, `:focus-visible` (2px gold ring, 3px offset), `:active`
  (1px translate), `:disabled` (0.5 opacity, not-allowed), and `aria-busy`
  (progress cursor plus an inline spinner that only exists while busy).
- **Critical:** `background: transparent` is set on the base class. Without it a
  `<button>` inherits the UA's grey `buttonface` while the same class on an `<a>`
  renders correctly.

### Cards / Containers

- **Corner Style:** 10px.
- **Background:** Panel Ember Black (`#1e120c`), never the page ground.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** one warm hairline.
- **Internal Padding:** `clamp(20px, 3vw, 30px)`.

### Inputs / Fields

- **Style:** Sunk one tone to `#251710`, 7px radius, hairline border.
- **Focus:** Border shifts to gold with a soft gold ring at zero offset.
- **Error:** `aria-invalid` turns the border Warm Alarm; the message sits below
  in a bordered note, not as a floating tooltip.
- **Disabled:** 0.55 opacity, not-allowed cursor.
- **Code fields** widen letter-spacing to `.28em` with tabular figures.

### Navigation

Sticky app bar with a blurred, translucent ground and a hairline underneath.
Brand mark plus wordmark on the left with the current context after a divider;
user, tree link and sign-out on the right. Below 640px the wordmark and context
drop out so the bar stays one line.

### Branch Tree (signature component)

A nested list with a hairline rail down each level and a short connector into
each row. Every branch kind carries its own step of the branch ramp as a 9px
dot; the kind name follows the branch name in small caps rather than being pushed
to the far edge. Current branch is marked with `aria-current="page"` and a
10%-tinted gold row.

### Growing Tree (signature component)

The marketing tree is one SVG whose limbs each carry `pathLength="1"`. Scroll
progress is written to a single custom property and each limb draws itself via
`stroke-dashoffset` inside its own window. Labels are HTML, so they stay at a
readable pixel size, but their positions are read back out of the rendered SVG
with `getScreenCTM()` — which is what keeps a label on its own branch tip at
every aspect ratio.

## Do's and Don'ts

### Do:

- **Do** place every new colour on the rust → ember → gold ramp, or justify it as
  one of the two semantic signals.
- **Do** convey depth with the three ground tones and a hairline.
- **Do** tint secondary text from the cream foreground, never toward grey, and
  never below `.52` alpha.
- **Do** reset `background: transparent` on any button base class.
- **Do** give every interactive element hover, `:focus-visible`, active, disabled
  and busy before shipping it.
- **Do** keep one authored motion moment per surface and use `cubic-bezier(.16, 1,
  .3, 1)` at 200–300ms for everything else.

### Don't:

- **Don't** put an eyebrow or kicker label above a heading. The heading carries
  its own weight.
- **Don't** number sections (01 / 02 / 03) unless the sequence itself is
  information the reader needs.
- **Don't** use monospace as a costume for "technical". It is for keys, commands
  and code.
- **Don't** build a page out of same-size cards of dot plus heading plus text.
  The seven-branch grid became an index of rows for exactly this reason.
- **Don't** stand a Unicode glyph in for an icon. Icons are drawn SVG at a single
  1.5 stroke, from `src/components/icons.tsx`.
- **Don't** ramp a gradient from the night ground to the daylight cream. Every
  such interpolation passes through mud; use a clean edge with light spilling up
  from the day side.
- **Don't** animate `padding`, `width`, `height` or `margin`. Transform and
  opacity only.
- **Don't** let the display serif touch a label, a control, or a value.
