---
tags:
  - domain/color-math
  - status/verified
---

# Complements Are Antipodal Only At The Corners

**2026-09-20.** In CIE xy the six hexagon landmarks sit exactly 180° from their
complements — 180.000000000, not approximately. That is what forces the hue
gaps to repeat every 120° rather than every 60°. But the property belongs to
the cube’s **corners**, not to the hue wheel, and it fails badly in between.

## Why the corners are exact

Chromaticity is a central projection from black, so if two colours sum to white
in **linear** RGB, white lies on the segment joining them and they are antipodal
about it. The six landmarks are the only fully-saturated colours whose channels
are all 0 or 255 — and 0 and 255 are the two values gamma encoding maps exactly,
to 0 and 1. So red `(1,0,0)` plus cyan `(0,1,1)` is exactly `(1,1,1)`.

## Why it fails between them

Anywhere else a channel sits mid-range, and `srgbToLinear(v) + srgbToLinear(255-v)`
is not 1, because the transfer curve is not linear. Measured at full saturation:

| HSB hue | complement pair | linear sum | separation |
|---|---|---|---|
| 0 | `255,0,0` + `0,255,255` | `1, 1, 1` | **180.000°** |
| 30 | `255,128,0` + `0,128,255` | `1, 0.432, 1` | 146.808° |
| 60 | `255,255,0` + `0,0,255` | `1, 1, 1` | **180.000°** |
| 90 | `128,255,0` + `128,0,255` | `0.432, 1, 1` | 160.458° |
| 120 | `0,255,0` + `255,0,255` | `1, 1, 1` | **180.000°** |

The worst case over the wheel is 57.7° off antipodal — a separation of 122.3°
rather than 180°. So the tidy three-fold
symmetry is a statement about six colours, not about the rim.

## And it does not survive Oklab at all

Oklab applies a cube root to LMS, which is not affine, so even the corners stop
being antipodal: red to cyan is **165.54°**. The six gaps become six different
numbers — 80.54, 32.73, 52.27, 69.28, 64.31, 60.87 — with no period at all
(gap 1 and gap 4 differ by 11.25°, where in xy they are identical to 0e0).

This matters for how the morph is described. The six-fold-to-three-fold collapse
is a **CIE xy** fact. It is the most striking thing the xy morph shows and it is
simply absent from the Oklab one, which is the target that matters for OKLCH.
Claiming it as a general lesson about perceptual colour would be wrong.

## Related

- [[hexagon-is-the-cube-down-its-diagonal]] — the corners this is about
- [[plan-perceptual-color-in-color-taylor]] — the morph slide
- [[srgb-gamut-is-not-star-shaped-in-oklab]] — the other place the cube root breaks a symmetry
