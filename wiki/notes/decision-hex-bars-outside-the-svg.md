---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: The Hexagon's Bars Live Outside Its SVG

**2026-09-13.** The brightness and saturation bars come out of `#hex-svg` and become one bar component with an orientation, laid out beside the hexagon by the card. The hexagon's SVG goes back to a square viewBox of the field alone: the circle, the chain, the vertex letters, the hue line and badge.

## What the code was

`ColorHexagon.tsx` rendered one SVG whose viewBox was `SIZE` wide - the hexagon plus a gutter for the brightness bar - and grew taller (`SVG_HEIGHT_SAT`) when the saturation bar was on. `BrightnessBar` and `SaturationBar` were SVG fragments drawn inside it at hexagon user-space coordinates; their pills and tick markers were HTML floated over it at percentages of the same viewBox; and every drag, tween and tap-vs-drag decision for both bars sat in the parent. `hexConstants.ts` kept every `SAT_*` constant as a "deliberate echo" of a `BL_*` one, which is the file admitting the two were one control drawn twice.

## Why

- **Taylor's model of the card is four things**: the HSB/HSL toggle, the hexagon with its chain and hue handle, and two sliders that are the same control in two orientations. The code had the files but not the separation: the sliders shared the hexagon's coordinate space and their logic lived in the hexagon.
- **The reason they were inside is gone.** Lines used to be drawn from the bars to parts of the hexagon, which needed one coordinate space. They were removed to avoid confusion, and the impact highlight system does that job now.
- **It is what makes [[plan-narrow-widths]] stage 8 a switch.** A brightness bar that is drawn in the hexagon's viewBox cannot turn horizontal without a differently shaped viewBox, re-derived pill positions and a second copy of the drag math. A bar component with `orientation` turns under a container query.
- **The bars should be very similar to the Color Editor's sliders.** Building the bar on the same primitives as `ColorSlider` (`useDrag`, `handleStyle`, `highlight`) is the first step; folding the two into one is a later one.

## The rule the refactor is held to

Zero visual change at desktop. Every bar, pill, marker, badge and letter rect at 1376 and 800 wide, in HSB and HSL, at three brightnesses and three saturations, within 1px of the pre-refactor measurement. Every id, `data-hold`, aria-label and demo-runner target unchanged, so the presentation, the impact highlights and the tests keep working without edits.

## Rejected

- **Flip the bar inside the SVG.** A second viewBox shape and a second set of percentage positions for the horizontal case, with the drag math duplicated along the other axis. Solves stage 8 once and leaves the sliders baked into the artwork.
- **Extend `ColorSlider` directly in the same step.** The right end state, but the acceptance test above depends on the editor's sliders not changing at the same time.
