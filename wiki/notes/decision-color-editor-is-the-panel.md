---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: The Color Editor Is The Panel, Not A Section In It

**2026-08-12.** The right column is named **Color Editor**, and the swatch + SB box + hue strip sit at its top level rather than inside a card of their own. They cannot be collapsed.

## What changed

Before, the column was called **Sliders** and its first child was a collapsible **Color Editor** section holding `#sb-wrapper`. Two problems in one shape:

- **The name was one level too low.** "Sliders" undersold the column: two of its four children are slider banks, but the SB box, the hex field and the colour-name search are not. Meanwhile the name that did describe the whole thing was attached to a single section inside it.
- **The column's only slack absorber was closable.** `#sb-wrapper` is what takes up the difference between this column's natural height and the hexagon's. Putting it behind a collapse meant the layout had to carry a mechanism for "what if the absorber is shut" — see [[decision-both-columns-absorb-slack]], which that mechanism's deletion is the subject of.

Promoting the box fixed both at once: the name moves up to the panel, and the absorber becomes permanent.

## The floor moved, and stopped being the binding constraint

`min-h-24` on `#sb-wrapper` came along with it. It used to be what decided how far down the two columns stayed flush — the box was the only part of either column that could give, so once it hit the floor this column overhung the hexagon, at about 1050px with `min-h-24` and 1150px with `min-h-32`.

That is no longer what binds, because `#hex-stage` now absorbs on the hexagon side too. Both columns give and they meet in the middle: measured flush at every width from 1100px down to the 768px breakpoint where they stop being columns. Below ~1000px both settle at 715px, the hexagon having reached the natural size of its fixed-width card, and the box bottoms out at 143px — well above the 96px floor. The floor is a guard now, not the constraint.

## Rejected

- **Rename only, keep the card.** Gives "Color Editor" containing "Color Editor". The inner card would have needed a new name — "Field" was the candidate — which is one more name to justify and leaves the closable-absorber problem untouched.
- **Keep it collapsible, rename nothing.** The status quo. Rejected on the user's call: the box is the panel's subject and being able to hide it earns less than the mechanism it costs.

## Verified

`h2` headings read `Hexagon / Color Editor / Equations / Settings`, with no nested "Color Editor". `#sb-wrapper` is a direct child of the h2's content column. Closing RGB + HSB/HSL + Hex hands the room to the box, 184px → 508px, columns still level. Collapsing the panel itself still gives 54px.

Unaffected surfaces, checked rather than assumed: the Figma plugin builds its own layout in `figma/ui/main.tsx` and never renders `ColorPicker`, so panel heights there are byte-identical at 300/400/560px. The presentation *does* render the full picker, on its last slide — columns level at 756/756 there, and the rename shows correctly.

An accident worth keeping: both columns now lead with an un-carded hero graphic — the wheel on the left, the SB box on the right — then carded sections below. They read as the same kind of thing for the first time.
