---
tags:
  - domain/color-math
  - status/verified
  - origin/bug
---

# Out Of Gamut Must Be Returned, Not Inferred

**2026-09-20.** An `oklch → rgb` conversion that clamps has thrown away the one
fact its caller needs. The clamped 8-bit colour is *identical* on both sides of
the gamut boundary, so no amount of inspecting the result recovers whether the
input was real. Found while building the Oklch conversions for [[plan-perceptual-color-in-color-taylor]].

## The measurement

At pure blue's own lightness and hue — Oklab `L = 0.45201`, `h = 264.052°` —
three chroma values that differ in the fourth decimal place:

| C | unclamped linear | in gamut | clamped 8-bit |
|---|---|---|---|
| 0.3131 | R = −6.7e-6 | no | `0, 0, 255` |
| 0.3132 | R = −8.0e-7 | **yes** | `0, 0, 255` |
| 0.3133 | G = −6.2e-5 | no | `0, 0, 255` |

One of those three is a colour sRGB actually holds. All three come back as the
same three bytes. The answer is not in the output.

## Why this is the interesting case and not a rounding quibble

That 0.0002-wide in-gamut sliver is the far side of the gap measured in
[[srgb-gamut-is-not-star-shaped-in-oklab]] — the gamut goes in, out, and back
in again, and the sliver *is* the blue corner. So the exact stretch where the
returned colour stops carrying information is the same stretch where a naive
binary search gets the wrong answer. A picker that clamps silently and a picker
that searches naively fail on the same colour, and neither failure is visible
from the outside.

## So the conversion returns a flag

`oklchToRgb(l, c, h)` returns `{ rgb, inGamut }` rather than an `RGB`. The
existing `linearToSrgb` keeps clamping and rounding, because everything else in
the app depends on it doing exactly that; the Ok path gets its own return shape
instead of a new mode on an old function. Callers that do not care can ignore
the flag. Callers that do care cannot get it wrong, which is the whole point of
returning it rather than documenting it.

## The epsilon is load-bearing

`1e-6` on the unclamped linear channels. That is not a round number picked for
tidiness — it has to be *tighter* than the gap it is measuring. At `1e-4` the
0.0002-wide window smears shut and the flag reports the blue corner as out of
gamut, which is precisely the bug it exists to expose. Anyone loosening it
should re-run the blue regression first.

## Related

- [[srgb-gamut-is-not-star-shaped-in-oklab]] — the gap this sits inside
- [[plan-perceptual-color-in-color-taylor]] — where the Ok work is going
- [[decision-hsb-canonical-rgb-override]] — the same family of problem one
  space down: a lossy round trip that has to be carried rather than re-derived
