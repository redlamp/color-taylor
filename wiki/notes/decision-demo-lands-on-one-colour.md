---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: The Demo Lands on One Colour, and the Colour Editor Goes First

**2026-09-04.** Every gesture in the picker demo that could end anywhere now
ends on `LANDING` — h216, s69, b100, which is the app's own default colour — and
the script opens on the colour editor rather than on the hexagon.

## Landing on a chosen colour

A demo whose gestures stop wherever their last frame happened to fall reads as a
recording of somebody fiddling. Steps 1 and 2 both finish on the same colour,
reached from three directions: the colour box by saturation and brightness, the
hue strip by height, the hexagon by angle and radius. Step 3's gestures are all
sweeps that hand the colour back where they found it, so it survives to the
sign-off.

Two things make the arrival exact rather than approximate:

- **Every landing gesture is written in its control's own units** — saturation
  and brightness for the box, degrees for the hue strip, hue and a fraction of
  the cross-section for the hexagon — with each wobble term multiplied by
  something that vanishes at `t=1`.
- **`DemoHost.field()`**, the one thing the demo *reads* rather than works. A
  gesture on the hexagon or the box is a position, not a delta, so a step that
  means to end somewhere has to know where it began.

Because the landing colour is also the default, a visitor who has not changed
theirs is restored to what is already on screen — which is why the sign-off asks
`restoreMovesColour()` before walking home rather than discovering it after.

## Why the colour editor opens

Originally the chain did. The swap was Taylor's call and the reason is better
than the one it replaced: **the hexagon's mapping can degenerate and the colour
box's cannot.**

The field is a hexagon of radius `b/100`, so at `b=0` it is a point — every
position maps to the middle, and the lap that is the whole of that step happens
inside no pixels at all. The box has no such failure: x and y are saturation and
brightness directly, with no cross-section to collapse and no angle that is
undefined at the centre. Opening there hands the hexagon a colour at full
brightness every time.

Measured from a black start, the lap's radius went from **0 to 109–171px**,
which is what a lap from any other colour measures.

It is also the better teaching order — the control every tool has, then the one
that needs explaining — and it is what let the impact step move into the colour
editor later the same day, so the demo does its first three steps in one card
and scrolls once, at the end.

## The impact step follows the same logic

That step was made on the hexagon's two bars, because the bars are not in the
slider bank and so the bank lighting up is unmistakably somewhere else. On a
phone that reasoning inverts: the hexagon and the bank cannot be on screen at
once, so the one step whose whole subject is *what happens elsewhere* was
demonstrating it off screen. Two sliders from two different banks says the same
thing inside one card.

## Pinned by

`tests/demo.spec.ts` — "the script lands on the colour it aims at" and "a black
start still gets a full lap of the hexagon". The second samples the tip's radius
rather than reading it once, because the property is that the lap *has* a size.

See also [[decision-demo-caption-in-the-header]] and `docs/demo-script.md`,
which is the beat-by-beat script and the pacing dial.
