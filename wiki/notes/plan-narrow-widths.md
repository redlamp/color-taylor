---
tags:
  - domain/ui
  - status/draft
  - origin/user-call
---

# Plan: The Picker Down To 240px

**2026-09-13.** Taylor's direction, given while re-evaluating the 900px two-column breakpoint (#103). Realistically the Color Editor can work down to a 240px screen width, and the rest of the picker can follow, if each card reflows in stages as it narrows. The stages below are his, in his order; nothing here is built. Equations is its own topic and is not covered.

Each stage should key on the card's own width (a container query), not the viewport, so the Figma host and the presentation's fixed layout follow the same rules - [[decision-single-source-picker]].

## Color Editor

1. **The swatch moves above the SB box and hue strip**, with the hue strip on the right-hand side of the box. Today the swatch stands to the left of the box at the top of the panel ([[decision-color-editor-is-the-panel]]).
2. **Hex and blend share one row above the RGB / HSB / HSL selectors.** Today they are all one row, with the hex readout stepper-wide at the right end ([[decision-swatches-panel]]); the stepper alignment argument stops applying once the readout has its own row. Issue #105 is this stage on its own.
3. **Very narrow: drop the steppers from the RGB / HSB / HSL sliders** and let the rows be the sliders alone.
4. **The search and tags buttons for HTML colors move below** the named-color field.

## Swatches panel

5. **Recent and Saved reduce their row count in units of six: 24, 12, 6** ([[decision-swatches-panel]], [[decision-saved-grows-in-banks]]). The rule that sets each switch: a swatch stays wider than tall as the row narrows, down to a square; at a square the row halves. Below six a row a swatch may go narrower than square.
6. **Play, reset, delete and sort break onto a second row** under the expandable headers for Swatches and Recent, instead of riding on the header row.

## Hexagon

7. **The HSB / HSL toggle moves to a second row** from the hexagon's header.
8. **When the card is narrower than the hexagon needs, the vertical brightness bar becomes a horizontal slider**, matching the saturation bar and sitting below it.

## Open

- Where each stage switches. The widths are to be measured, not chosen; see the breakpoint measurement on `fix/column-breakpoint`.
- Order, Taylor's call: the two-column breakpoint moves first, then the stages in the order above.
- The two-column breakpoint moved first: 900 → **800px**, measured on `fix/column-breakpoint`. What stops it going lower is the hexagon, stages 7 and 8: the hue badge and the brightness pill collide at 794px because they are fixed-size chrome on a shrinking hexagon. So the remaining stages are what buy any width below 800, not the breakpoint.
- The presentation's desktop-only gate stays at 900px regardless: it gates the walkthrough's entry, not the layout ([[presentation]]).
