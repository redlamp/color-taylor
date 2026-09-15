---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: Every HTML Colour On The Field, Faded By Brightness

**2026-09-14.** With "HTML colours" on, the hexagon's field shows all 141 named colours as markers at once, each placed at its own hue and saturation on the current shape and faded by how far its brightness is from the current value. Before this, only the colours within a brightness window of the current value were drawn.

## What the code does

- Each marker sits where `pointForColor` puts the colour's own HSB on the current shape (hexagon or circle, HSB or HSL), the inverse of `colorAtPoint` in `hex/hexConstants.ts`. Built for #123, where the hover dot was landing outside the rim.
- Opacity is `0.08 + 0.92·e^(−d/20)` where `d` is the brightness distance: 1 at the current brightness, 0.155 at 50 away, 0.086 at 100 away. Dots are r=3 (from 4). The hovered dot stays solid.

## Why

- **Taylor asked what showing all of them would look like**, against three other treatments; this was the fourth and he kept it. The picker's claim is that the named colours are points in one space; a window hid most of them and made the field look sparse at extreme brightness.
- **The fade carries the third axis.** The field is two-dimensional; the brightness the marker cannot show as a position it shows as presence. A colour at the current brightness is solid, one far away is a ghost, and dragging the brightness bar sweeps the population in and out.
- **Exponential rather than linear** so the near colours separate clearly and the far ones never quite vanish - a marker at 8% is still a target to hover.

## Rejected

- **The brightness window** (the previous behaviour): sparse at the ends, and the cutoff was a cliff nothing explained.
- **Uniform markers for all 141**: the field became a starfield and the current brightness had no expression at all.

## Related

- [[hexagon-is-the-cube-down-its-diagonal]] - why every named colour has one place on the field.
- [[decision-hex-bars-outside-the-svg]] - the markers are drawn on the field alone now that the bars are outside it.
