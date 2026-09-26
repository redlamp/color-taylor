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

## The epsilon is load-bearing, and the hazard runs the other way

`1e-6` on the unclamped linear channels. **Corrected 2026-09-20**, after an
adversarial review measured it properly: the first version of this note said the
danger was *loosening* the epsilon, and that is backwards. Scanning chroma at
blue’s own `L = 0.45201`, `h = 264.052`:

| epsilon | in-gamut runs |
|---|---|
| `0` | `[0 .. 0.2655870]` — **one run** |
| `1e-8` | `[0 .. 0.2655880]` — still one |
| `1e-7` | `[0 .. 0.2655890]` `[0.3132120 .. 0.3132120]` |
| `1e-6` | `[0 .. 0.2656050]` `[0.3131970 .. 0.3132130]` |
| `1e-4` | `[0 .. 0.2673680]` `[0.3114620 .. 0.3132370]` — wider, not shut |

Loosening widens the needle. **Tightening deletes it.** At this hue the exact
gamut has a single run and the blue corner is not in it — the corner is reached
exactly only at its own hue, `264.05202064`, and `264.052` is the rounding
everyone writes. So the needle at the rounded hue is a thing the tolerance
creates, not a thing the gamut has.

That is not an argument against the tolerance. An 8-bit screen cannot tell a
linear channel at `-8e-7` from one at `0`, so calling it in gamut is the honest
answer. But it means anything downstream that recovers the blue corner does so
*because* of the epsilon: set it to `1e-8` and a cusp finder at `(0.45201,
264.052)` reverts from `0.3132` to `0.2656` with no code change and nothing to
say why. Tighten it only with the blue regression in front of you.

## Related

- [[srgb-gamut-is-not-star-shaped-in-oklab]] — the gap this sits inside
- [[plan-perceptual-color-in-color-taylor]] — where the Ok work is going
- [[decision-hsb-canonical-rgb-override]] — the same family of problem one
  space down: a lossy round trip that has to be carried rather than re-derived
