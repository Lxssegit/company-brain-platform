---
name: Company Brain
description: A register kept on paper. Warm off-white ground, hairline structure, numbered entries, and a single marking accent.
colors:
  paper: "#faf8f4"
  paper-raised: "#ffffff"
  paper-sunk: "#f2eee7"
  paper-deep: "#191410"
  accent: "#c4441a"
  accent-hover: "#a7360f"
  accent-wash: "#f6e7df"
  ink: "#191410"
  ink-muted: "#574e44"
  ink-subtle: "#756b60"
  rule: "rgba(25, 20, 16, .13)"
  rule-strong: "rgba(25, 20, 16, .26)"
  ok: "#1f7a4d"
  danger: "#b32d1c"
  kind-department: "#c4441a"
  kind-team: "#9a6414"
  kind-personal: "#6f6357"
typography:
  display:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontStyle: italic
    fontWeight: 400
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7.2vw, 5.75rem)"
    fontWeight: 500
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
  numeral:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    lineHeight: 1
spacing:
  scale: ["0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem", "3rem", "4rem", "6rem", "8rem", "12rem"]
---

# Company Brain — Design

## 1. Visual theme

A register, not an advertisement: the document a company keeps about itself.
Warm off-white paper, warm near-black ink, and one accent that marks rather
than decorates. Nothing glows, nothing floats. Where a surface needs an edge it
gets a hairline; where content needs order it gets a number.

The previous surface was an ember-lit dark room built around a growing tree.
That was replaced wholesale: dark ground, gold ramp, scroll-driven SVG and the
seven-limb illustration are all gone. What carried over is the accent hue,
darkened from `#ff8d38` to `#c4441a` so it holds 5.5:1 on paper, and both type
families.

## 2. Colour

One ground (`--paper`), one ink, one accent. Ink tints are the same warm black
at lower strength, never gray, and never past `--ink-subtle` — that is where
4.5:1 on paper gives out. `--ok` and `--danger` exist only for state inside the
app and are dark enough to read as text on paper.

`--accent` appears on: source numbers, entry numbers on hover, the `Wartet`
chip, primary-button hover, and focus rings. Nowhere else. There is no kicker
or eyebrow label anywhere — the headline carries its own weight.

## 3. Typography

Schibsted Grotesk carries everything structural at 500–600 weight with tight
tracking; Instrument Serif appears only in italic, as the second half of a
headline and as the numerals in the register. That contrast — a precise grotesk
against an editorial italic — is the page's signature, and it is spent
sparingly enough to stay one.

## 4. Component stylings

- **Button.** Filled rectangle, 2px radius, 1px border. Ink by default, accent
  on hover. The quiet variant is the same shape with a hairline border.
- **Chip.** 2px radius, no border, tinted ground. Four states: waiting
  (accent wash), approved (ok), in force (solid ink), superseded (paper-sunk).
- **Pane.** A product surface: title bar on `--paper-sunk`, hairline divider,
  body on white. 4px radius, 1px border, no shadow.
- **Entry.** Serif numeral, label, copy, closing hairline.

## 5. Layout

Twelve columns, `--gutter` of `clamp(1.25rem, 5vw, 5rem)`. The hero is
deliberately asymmetric — headline in columns 1–7, reading copy in 9–12 and
lower — so the eye travels a diagonal instead of straight down the middle. The
register keeps its heading sticky in columns 1–5 while the entries scroll past
in 7–12.

Section rhythm runs on the top of the spacing scale: `--s24` between sections,
`--s32` around the closing.

## 6. Depth and elevation

There is none. No box-shadow appears anywhere in the system. Separation is
drawn with `--rule` and `--rule-strong`, and stacked surfaces are offset rather
than overlapped.

## 7. Do's and don'ts

- **Do** close every list with a hairline rather than a gap alone.
- **Do** keep the accent to marks: numbers, states, focus.
- **Don't** add a shadow, a glow or a gradient. If something needs to separate,
  it gets a rule.
- **Don't** centre a hero block. The asymmetry is the composition.
- **Don't** introduce a second accent hue. State colours are not accents.
- **Don't** overlap panes so content is clipped mid-row; offset them instead.

## 8. Responsive

Single breakpoint set: 1000px collapses the twelve-column sections to one
column and unstacks the panes; 640px drops the masthead's section link, halves
the colophon and lets the actions fill the width. The type scale is `clamp()`
throughout, so nothing steps.

## 9. Agent prompt guide

When adding a surface: reach for a hairline before a border-radius, a numeral
before an icon, and the spacing scale before a hand-picked value. Ask whether
the accent is marking something. If it is only making the page prettier, it is
wrong.
