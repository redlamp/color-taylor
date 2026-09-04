---
tags:
  - domain/color-math
  - status/verified
  - origin/external-research
---

# Oklab And The Perceptual Colour Spaces

**2026-09-01.** The landscape around Oklab: what came before it, what the "Ok"
means, what people criticise, and what has been built since. Gathered while
scoping whether Color Taylor should learn a perceptual model — see
[[plan-perceptual-color-in-color-taylor]] for the recommendation that came out
of it. Every number here was computed locally and is reproducible.

## CIELAB, 1976

The CIE's attempt at a perceptually uniform space, built on opponent-process
theory: the retina does not send R, G and B to the brain, it sends *light/dark*,
*red/green* and *blue/yellow*. So `L*` is lightness 0–100, `a*` is green↔red,
`b*` is blue↔yellow. The lightness curve is roughly a cube root, fitted to the
Munsell value scale.

The design goal was that plain Euclidean distance would equal perceived
difference — ΔE. It did not hold. The existence of ΔE94 and then ΔE2000, with
hue-dependent weighting terms bolted on, is the field conceding that distances
in CIELAB do not mean what they were meant to.

**LCH is CIELAB in polar coordinates.** `C = √(a² + b²)`, `H = atan2(b, a)`.
Lossless coordinate change, same space. Oklab→Oklch is the identical
relationship — which means Oklch is the natural view for a picker whose radius
is already chroma, i.e. ours.

## What "Ok" stands for

Björn Ottosson's own joke: it is *an OK Lab*. Not an acronym and no grand claim.
Published as a blog post in December 2020, and in CSS within about two years.

## What Oklab changed

Same skeleton as CIELAB — cone response, a nonlinearity, a linear map to
opponent axes — with three decisions redone:

- The cube root is applied to **LMS cone response** directly, not to XYZ ratios.
- Coefficients are **fitted to modern datasets** — CAM16-UCS for uniformity, the
  Ebner–Fairchild data for hue constancy — rather than derived from 1970s work.
- **D65 white point**, matching sRGB. CSS's `lab()`/`lch()` are **D50** while
  `oklab()`/`oklch()` are D65. Converting between them by hand without adapting
  is a real trap.

The thing he optimised for is **straight constant-hue lines**. Measured: the
midpoint of a blue→white ramp interpolated in CIELAB is `179,139,255` — visibly
lilac, because CIELAB's hue lines bend in exactly that region. In sRGB it is
`128,128,255`. Oklab holds the hue.

And the whole transform is two matrices and a cube root — no surround or
adaptation parameters like CAM16 — so it is cheap enough to run per-pixel in a
fragment shader. That is the design brief: CAM16-UCS quality at CIELAB cost.

## Criticisms

- **Helmholtz–Kohlrausch is not modelled at all.** Saturated colours look
  brighter than their `L` claims. This is the substantive one, and it means even
  a constant-`L` sweep is not perfectly flat to the eye. See
  [[constant-lightness-needs-the-hsl-family]].
- **The blue-purple hue shift survives**, reduced but not gone. Ottosson says so.
- **Chroma is not uniform across lightness** — a 0.05 chroma step at `L=0.2` and
  at `L=0.9` are not equal steps.
- **It is not an appearance model.** No surround, no adaptation, no absolute
  luminance, so it cannot say how a colour looks in a dark room versus daylight.
- **It inherits CAM16's errors**, having been fitted partly against CAM16-UCS
  predictions rather than raw perceptual data.
- **Published as a blog post, not a peer-reviewed paper.** Heavily scrutinised
  since, and W3C adopted it anyway, but worth knowing.

## What came after

| Space | What it is for | culori | colorjs.io |
|---|---|---|---|
| **Oklrab / Oklrch** | Ottosson's own revision: `Lr` is `L` pushed through a toe function so lightness lines up with CIELAB's `L*`. Plain Oklab drifts in the darks | — | yes |
| **CAM16-UCS** | The CIE's current appearance model. More accurate, needs viewing conditions, far heavier | — | yes |
| **HCT** | Google. Hue and Chroma from CAM16, Tone from CIELAB `L*`. Ships in Material You | — | yes |
| **Jzazbz / JzCzhz** | Built for HDR and wide gamut. Awkward near black | yes | yes |
| **ICtCp** | ITU-R BT.2100, Dolby. Excellent hue linearity, used in HDR broadcast | yes | yes |
| **OkHSL / OkHSV** | Ottosson's picker parameterisations. In no standard | yes | yes |

Versions checked on 2026-09-01: culori 4.0.2, colorjs.io 0.7.1.

**That `Lr` revision is a tell.** The toe function it uses is the same
`toe`/`toe_inv` pair inside OkHSL and OkHSV — the correction was needed badly
enough to appear in both places.

**HCT is the more telling entry.** Google did not pick a winner; they took hue
and chroma from one space and lightness from another, because no single space
was best at all three.

## The honest summary

"Uniform" is not a property a space has. It is a claim measured against a
dataset — Munsell, MacAdam, RIT-DuPont, Ebner–Fairchild — and those datasets
disagree with each other. Optimise for one and you underperform on another.
That is why there is a zoo rather than an answer, and why Oklab winning CSS is a
story about *good enough and cheap enough*, not about being right.

Which is a better closing line for the deck than "HSB is a useful lie." Every
one of these is a useful lie; HSB's is just the oldest and most convenient.

## Sources

- Björn Ottosson, "A perceptual color space for image processing" (Oklab), 2020
  — <https://bottosson.github.io/posts/oklab/>
- Björn Ottosson, "Okhsv and Okhsl", 2021 —
  <https://bottosson.github.io/posts/colorpicker/>
- Björn Ottosson, "sRGB gamut clipping" —
  <https://bottosson.github.io/posts/gamutclipping/>
- CSS Color Module Level 4 — <https://www.w3.org/TR/css-color-4/>
- HSLuv, Alexei Boronine — <https://www.hsluv.org/>
- Material Color Utilities (HCT) —
  <https://github.com/material-foundation/material-color-utilities>

## Related

- [[constant-lightness-needs-the-hsl-family]] — the finding that matters most to us
- [[srgb-gamut-is-not-star-shaped-in-oklab]] — the measurement that broke a naive algorithm
- [[plan-perceptual-color-in-color-taylor]] — what to actually build
- [[research/hsl-degenerate-states]] — the same kind of survey, one model down
- [[hexagon-is-the-cube-down-its-diagonal]] — the geometry all of this is measured against
