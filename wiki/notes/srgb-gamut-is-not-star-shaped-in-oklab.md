---
tags:
  - domain/color-math
  - status/verified
  - origin/bug
---

# The sRGB Gamut Is Not Star-Shaped In Oklab

**2026-08-25.** Walking outward from the neutral axis at fixed lightness and
hue, the sRGB gamut can go **in, out, and back in again**. A binary search that
assumes one contiguous interval stops at the first exit and returns the wrong
answer. Found while trying to draw an Oklab view of the hexagon; it clipped blue.

## The measurement

At pure blue's own lightness and hue — Oklab `L = 0.45201`, `h = 264.052°` —
scanning chroma from 0 to 0.40 in 4000 steps:

```
in-gamut C runs:  [0.0000 .. 0.2658]   [0.3131 .. 0.3133]
```

Two disjoint runs. The second is the blue corner itself, **0.0002 wide**. What
happens in between:

| C | linear R | linear G | linear B | |
|---|---|---|---|---|
| 0.2640 | 0.0001 | 0.0312 | 0.7794 | in |
| 0.2680 | −0.0001 | 0.0289 | 0.7960 | out |
| 0.3000 | −0.0006 | 0.0091 | 0.9374 | out |
| 0.3132 | −0.0000 | 0.0000 | 0.9999 | **in** |
| 0.3150 | 0.0001 | −0.0013 | 1.0087 | out |

Red dips a fraction below zero across the middle and returns to exactly zero at
the corner.

## Invisible geometry, visible bug

The gap is **0.0006 deep in linear terms** — far below 8-bit quantisation, so no
human will ever see it. But a naive cusp finder returns `C = 0.288` instead of
`0.313`, and the "pure blue" it then renders is `0,55,255`. That green 55 is
plainly visible.

So: the defect is imperceptible, the consequence of mishandling it is not.

## Why it happens, and why it is not Oklab's fault

The RGB cube is convex in **linear** RGB. Oklab applies a cube root to LMS,
which is not an affine transform, so convexity is not preserved. The cube's
corners stay sharp while its faces bow inward. Every perceptual space does this;
CIELAB does it worse. It is a fact about the *gamut's shape*, not a flaw in the
space.

## What to do instead

- **Trace the boundary, do not search for it.** The fully-saturated locus *is*
  the cube's six edges — `(1,t,0)`, `(t,1,0)`, `(0,1,t)`, `(0,t,1)`, `(t,0,1)`,
  `(1,0,t)`. Walk them, convert each to Oklab, and the corners are exact by
  construction. This is what the diagrams ended up doing.
- **Ottosson uses an analytic `compute_max_saturation`** — a polynomial fit per
  hue sector plus Halley refinement on the boundary equation — precisely because
  searching is unreliable here. If we port OkHSL, port that, do not substitute a
  search.
- **CSS Color 4's gamut mapping** binary-searches chroma but validates with a ΔE
  check against the clipped colour, so it degrades gracefully instead of
  trusting the interval assumption.

## If we implement this

Generate a few thousand reference conversions from culori and assert against
them. That is how this class of error gets caught before it reaches the picker,
rather than by noticing blue looks wrong.

## Related

- [[oklab-and-the-perceptual-color-spaces]] — the wider survey
- [[plan-perceptual-color-in-color-taylor]] — where this would bite
- [[hexagon-is-the-cube-down-its-diagonal]] — the cube whose corners these are
