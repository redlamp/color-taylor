---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: Recent And Saved Move To A Swatches Panel

**2026-09-06.** Recent and Saved leave the Hexagon card for a full-width panel of their own, **Swatches**, between the top row and Equations. Saved has no caption: the panel's title is its title, and Sort, Defaults and Clear ride on that header row while the panel is open. Recent sits under it as a section of its own, closed by default. A row holds 24 swatches. Drafted on the design canvas first, then built.

In the same pass the Color Editor lost its "Hex and HTML Colors" card: the hex field moved up onto the toggle row, at the right end and stepper-wide so it lines up with the number fields, and the search / colour-name / show-on-hex row sits flat under a rule. The second swatch that sat beside the hex field went with the card - the swatch at the top of the panel is the swatch. Follows on from [[decision-color-editor-is-the-panel]].

## Why a panel

Two things were being asked of the Hexagon card's bottom edge. Collapsed, Recent and Saved were two 50px rows under the wheel that did nothing but say they were there; open, they were two 12-wide grids squeezed into a 588px column. A panel across both tracks gives them the full width, so a row holds 24 at the size the swatches already were, and gives the wheel its card back.

Height was the constraint the user set. Of the shapes tried on the canvas - compact rows kept in the card, side-by-side sections in a panel, stacked full-width sections - the stacked panel with Saved unlabelled came out at 191px open against the 231px the labelled version cost, and 151px with Recent closed. The one further cut, putting the two lists side by side at 12 each, undoes the 24-wide row and was not taken.

## The header actions

Sort, Defaults and Clear belong to Saved, and Saved's caption is gone, so they sit on the Swatches header. CollapsibleSection already hides `headerRight` while a section is closed, which is what makes this safe: a closed panel shows a title and nothing to act on. The one thing to watch is the two Clear buttons - Saved's on the panel header, Recent's on its own row - which both ask for a second click, as before.

They stand at the height of the pressed pills in the toggle groups beside them, 25px, not the 32px control. The user asked for that match; the constant is `PILL_H` in SwatchLibrary and is the only place the number lives.

## Who owns the lists

The swatch library came out of `ColorHexagon` into `SwatchLibrary.tsx` - a hook for the state (`useSwatchLibrary`) and a component for the two layouts. The **host** calls the hook: the app, because the lists render in a different panel from the wheel; the plugin, because it still wants them under the wheel in the sidebar shape (`layout="sections"`, flush, 12 to a row - nothing there changed on screen). The hexagon gets one callback back, `onRecordColor`, for the clicks that record a colour at once: a vertex letter, a bar marker, an HTML colour on the field.

The bank became a parameter of the same rule as [[decision-saved-grows-in-banks]]: 24 in the app, 12 in the plugin, three banks the ceiling either way. Recent keeps the same number.

## Rejected

- **Keep them in the card, slimmer.** Two 34px pills side by side under the wheel. Saves height but the open state needs the full width, so the row has to reflow when either opens - and the wheel still shares its card with a list.
- **Recent above Saved.** The order they had. Saved is the library and Recent the scratch list, so Saved takes the title and Recent goes under it.
- **A caption on Saved.** Costs the 40px the user was trying to get back, to say what the panel title already says.
