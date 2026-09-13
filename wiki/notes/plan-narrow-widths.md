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

## Built

- Stages 1 and 2: PR #108. Editor card content below 296px splits the toolbar; below 230px the swatch stacks above the SB box.
- Stages 7 and 8: PR #110, on the bar refactor (#109, [[decision-hex-bars-outside-the-svg]]). Hexagon card content below 214px wraps the toggle; below 350px the brightness bar lies down under the saturation bar (350 rather than the geometric 468 so the two-column card at an 800px viewport, 353.98, keeps four pixels of margin).
- One column is the hexagon's width: PR #114, on #113. Below 800 the root caps at 662 (614 + padding) and centres, so every panel is the hexagon card's width; the Equations cells stack at the layout's breakpoint instead of Tailwind's 640.
- Below-260 tidy: PR #113, on #112. The horizontal pills clamp at both ends, "Hue" is hidden while stacked (it laps the field at every stacked width), "Saturation" clears the B and M letters through a px shortfall added to the stacked budget, and the lying bar's gradient follows its orientation.
- Header icon buttons: PR #112, 25px to 32px with 20px icons, the title's line box.
- Stages 5 and 6: PR #111. Rows halve where an N-across cell is square (24 down to a 906px panel, 12 down to 450, six below); the header actions take a second row below 402 (Saved) and 204 (Recent). By the rule, viewports 800–1015 now show 12 across. The Saved ceiling is 72 in the app (three banks of 24), not the 36 [[decision-saved-grows-in-banks]] reads as at first glance; the reflow does not touch capacity.

## Open

Taylor's calls, 2026-09-13 evening:

- **Hue badge over the R and C letters at hue 0 and 180: leave it.**
- **Stacked bars, both horizontal: no value pills.** The number moves onto the same row as the "Saturation" / "Brightness" title. That also removes the badge-over-title overlap's worst case and the pill clamps' reason to exist in the horizontal case.
- **Stack earlier, to keep the hexagon larger.** The threshold moves up from 350; the next measured break is 468 (where the vertical pill's clamp first shifts it). Consequence: the two-column hexagon at viewports 800 to about 915 shows stacked bars, since its card is 354 to 468 there.
- **Smooth the 630/640 padding step** (`sm:px-6` to `px-0.5`).
- **Stage 3 ties to stage 1:** when the swatch moves above the SB box (230px editor card), the steppers leave the RGB / HSB / HSL rows and the sliders take the width. Stage 4 (search and tags below) is not asked for.
- The presentation's desktop-only gate stays at 900px regardless: it gates the walkthrough's entry, not the layout ([[presentation]]).
- The two-column breakpoint moved first: 900 → **800px**, measured on `fix/column-breakpoint`; the hexagon's chrome is what bound it.
