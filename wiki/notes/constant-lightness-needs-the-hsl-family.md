---
tags:
  - domain/color-math
  - status/verified
  - origin/user-call
---

# Constant Lightness Needs The HSL Family, Not A Better Colour Space

**2026-08-25.** The question was: *can we have HSB or HSL where rotating the hue
keeps the perceived brightness flat?* The answer is yes, and the fix is **not**
sRGB→Oklab. It is **HSV-family → HSL-family**. That distinction is structural
and it is the single most useful thing to come out of the Oklab research.

## Why a V-based model can never do it

`V` (our `B`) means *how far toward this hue's own maximum*. Each hue's maximum
sits at a different lightness:

| | red | yellow | green | cyan | blue | magenta |
|---|---|---|---|---|---|---|
| Oklab `L` at S=100, B=100 | 0.628 | 0.968 | 0.866 | 0.905 | **0.452** | 0.702 |

Yellow's ceiling is more than twice as light as blue's. So a `V`-based model
cannot hold lightness constant **in any colour space** — the constancy is ruled
out by what `V` means, not by which space measures it.

`L`, by contrast, is assigned directly and never consults the hue. Any
HSL-shaped model with a *perceptual* lightness gets constancy for free.

Plain HSL fails only because its `L` is `(max + min) / 2` of **gamma-encoded**
channels — an arithmetic midpoint, not a perceptual one.

## Measured

Oklab lightness across six hues, spread = max − min:

| Model | spread |
|---|---|
| HSL `l=50%, s=100%` | 0.516 |
| HSB `b=100, s=100` | 0.516 |
| OkHSV `v=1, s=1` | 0.387 |
| **OkHSL `l=0.7`, any `s`** | **0.000** |

Reproduce with culori 4.0.2:

```js
import { converter } from 'culori';
const L = c => converter('oklab')(c).l;
[0,60,120,180,240,300].map(h => L({ mode:'okhsl', h, s:1, l:0.7 }));
// => all 0.742
```

## OkHSV does not do this, and I claimed otherwise first

Worth recording because the mistake is easy and it looks convincing. Comparing
an HSV `s=1,v=1` sweep against an OkHSV `s=1,v=1` sweep, the OkHSV one *appears*
flatter — but the two strips contain the **identical set of colours**. Both
sweep the cube's saturated edge loop; Oklab `L` runs 0.452 to 0.968 either way.
OkHSV redistributes hue *spacing*, which changes where each colour sits, not how
light it is. Blue at `V=1, S=1` is exactly as dark as before.

The narrowed 0.387 spread in the table above is a sampling artefact of taking
six evenly-spaced hues in a reordered wheel — not a flattening.

## The cost, which is unavoidable

Constant lightness means chroma varies by hue. At OkHSL `l=0.7, s=1`:

| red | yellow | green | cyan | blue | magenta |
|---|---|---|---|---|---|
| 0.171 | 0.174 | 0.176 | **0.135** | 0.149 | 0.157 |

`s=100` means *as colourful as this hue can be at this lightness*, not a fixed
amount of colour.

**The trilemma: constant lightness · constant chroma · full gamut — pick two.**

- HSB / OkHSV — full gamut, neither constancy
- **OkHSL / HSLuv** — constant lightness, chroma varies, full use of the gamut at that `L`
- **HPLuv** — constant lightness *and* constant chroma, capped by the weakest hue, noticeably pastel

## HSLuv is the same idea, eight years earlier

Alexei Boronine's HSLuv (CIELUV-based) predates Oklab and is pitched almost
exactly in these terms — "HSL that makes sense". Same constant-lightness
property, older lightness function. Oklab's hue behaviour is better, so OkHSL is
the one to build on, but HSLuv is a useful second implementation to test against.

## The caveat

Even "constant lightness" is not perceptually exact, because of the
**Helmholtz–Kohlrausch effect**: saturated colours read brighter than their
lightness value says. Neither Oklab nor CIELUV models it. A vivid blue at
`l=0.65` still feels more present than a grey at `l=0.65`. Correcting needs
CAM16 with an H-K extension, or an empirical fudge.

## Related

- [[plan-perceptual-color-in-color-taylor]] — what this implies for the app
- [[oklab-and-the-perceptual-color-spaces]] — the surrounding landscape
- [[decision-brightness-axis-not-luminance]] — the earlier decision this reopens
- [[research/hsl-degenerate-states]] — how HSB and HSL differ where they give out
