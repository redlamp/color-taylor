---
tags:
  - domain/color-math
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: Chroma Is Made Predictable By A Safe Zone, Not By A Better Slider

**2026-09-22.** The question the Oklch lab was built to answer was how an Oklch chroma slider should behave at the edge of sRGB, where the valid range of C depends on the L and H beside it and moves as either is dragged. The answer is not a slider behavior at all. It is a rule on the pair L and C: **hold C at or under the chroma every hue can carry at this L**, the lowest of the 360 per-hue gamut edges. Inside that zone hue is free. Turn H, or turn the hexagon, and the color stays in sRGB at the same perceived lightness and chroma. In the lab this is the **Safe zone** switch on the Oklch bank; with it on, the hexagon becomes a hue dial and keeps L and C where they were.

This stays lab work for now. Taylor's call on 2026-09-22 was that it is not ready for the app; [[plan-perceptual-color-in-color-taylor]] and issue #146 hold the app-side scope.

## Why a zone

Three slider behaviors were built side by side before this and each pays for what it holds fixed:

- **Absolute C, no stop.** The number stays what you set; past the edge the color stops changing and the track is washed. Half the stepper's range is dead.
- **Absolute C, stop at the edge.** The color is always real; the number changes under you as L or H move.
- **Relative S.** A share of this hue's edge, so no gesture leaves the gamut, and the same 70% is C 0.083 at cyan and C 0.225 at magenta. A percentage is not an amount.

None of them makes a *hue sweep* safe, which is the thing a person setting a palette wants: pick a lightness and a chroma once, then walk the hues. The safe zone is that promise stated as a bound. Its price is that the bound is set by the tightest hue - cyan and yellow, whose cusps are lowest - so the zone is far narrower than what red or magenta could carry alone. The lab's landmark row exists to show that price rather than hide it.

## What the lab measured on the way

- The lightest color with a given chroma at a hue always has a channel at 255, and the darkest a channel at 0. Verified over 208 cases. That is why the red and blue marks sit where they do on the HSB bars: red at the lightest color's saturation on the brightness-100 hexagon, blue at the darkest color's brightness on its hue ray.
- The hexagon has no lightness axis. Its radius is saturation. Plotting the lightest and darkest colors by their true field position gave two loops that crossed freely - one was a saturation, the other a brightness - so the loops in panel 1 plot Oklch L as radius instead and say so. They are a graph over the field, not a map of it. The bar marks are the exact positions.
- Sampling the per-hue edges every 3 degrees puts the shared bounds within 0.00017 of a 1 degree sweep.
- The in-gamut run along an Oklab a or b axis at fixed L and other axis is a single span at every L sampled, so the axis tracks can mark it with two edges and a wash.

## Rejected

- **Nearest-point gamut mapping for the landmark swatches** as the display default. It moves both L and C and shows two changed numbers per swatch; the row keeps it, red where a value moved, but the app-side rule is the simpler clamp: hold L, reduce C.
- **A hue-basis toggle warping the loops onto the field's angle.** Built, then removed once the loops plotted lightness at each color's real hue angle, which made the warp redundant.
- **A dedicated "stop at the safe edge" mode separate from hold.** Safe zone implies hold; the old switch's row reads "Held" while it is on.

## Related

- [[out-of-gamut-must-be-returned-not-inferred]] - why the conversion reports the flag the zone depends on.
- [[srgb-gamut-is-not-star-shaped-in-oklab]] - why the per-hue edge is found analytically.
- [[plan-perceptual-color-in-color-taylor]] - the app-side plan this feeds.
