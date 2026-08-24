---
tags:
  - domain/color-math
  - domain/ui
  - status/verified
---

# Where HSL Gives Out, and What the Standards Say

**2026-08-24.** HSB feels forgiving in the picker and HSL feels rough. That is
structural, not a matter of taste, and the CSS Color 4 spec has a name for the
condition. Written after the round of HSL fixes on [[decision-single-source-picker]]'s
picker; the measurements are reproducible against `src/utils/colorConversions.ts`.

Interactive version of the chart: an Artifact, "Where HSL Gives Out".

## Saturation is a ratio, not an amount

In both models saturation scales the chroma available at the current lightness
or brightness:

```
HSL  chroma = (1 − |2L − 1|) × S
HSB  chroma = B × S
```

HSB's multiplier hits zero at **one** end of its range. HSL's hits zero at
**both**. Everything below follows from that.

## How much of saturation survives

Counting, for each lightness or brightness, how many of the 101 saturation
settings still produce a *different* colour:

| | full 101 values only at | collapses at |
|---|---|---|
| HSL | L 24–76 | **both** ends, symmetrically |
| HSB | B 39–100 | the dark end only |

At L=0 and L=100 all 101 saturations give one colour. At B=100 all 101 still
work. That is the whole of "HSB seems more forgiving": HSB only loses
resolution approaching black, which you pass through, while HSL loses it
approaching white too — and white is somewhere people park.

## What the standard calls this

CSS Color 4 names it **powerless**, and the definition is worth quoting because
it is not the same as invalid or unavailable:

> Individual color syntaxes can specify that, in some cases, a given component
> of their syntax becomes a powerless color component. This indicates that the
> value of the component doesn't affect the rendered color.

> For example, in `hsl()`, the hue component is powerless when the saturation
> component is 0%; a 0% saturation indicates a grayscale color, which has no hue
> at all, so 0deg and 180deg, or any other angle, will give the exact same
> result.

Two things follow that we got wrong at first.

**Powerless is not disabled.** The component keeps its value; it simply stops
affecting the output. That argues for *remembering* a saturation set at L=0
rather than greying the control out — which is the opposite of the
recommendation in the first draft of this work. See [[decision-hsl-gesture-origin]].

**The spec does not say saturation is powerless at the extremes of L.** It names
hue-when-achromatic and gives a general rule for hue during colour-space
conversion:

> When performing color space conversion to a cylindrical polar color space,
> user agents shall treat a hue component as powerless if the chroma (or other
> measure of colorfulness, such as saturation in hsl) is less than the epsilon
> (ε) specified for that color space.

Saturation at L=0/100 is a logical consequence, not a specified case. So how the
picker behaves there is a UI decision with no standards backing either way.

There is also a separate concept, **missing** — a powerless component produced
by conversion becomes missing rather than keeping its converted value, and
authors can write it explicitly as `none`. Worth knowing if the picker ever
emits `hsl()` strings.

## The hexagon claim, partly verified

[[hexagon-is-the-cube-down-its-diagonal]] carries a note marked *"recalled, not
checked against the paper"*. Checking it:

- **Confirmed.** The RGB cube tilted onto its corner and projected onto the
  chromaticity plane perpendicular to the neutral axis "takes the shape of a
  hexagon, with red, yellow, green, cyan, blue, and magenta at its corners."
  That is the app's central geometric claim, corroborated.
- **Confirmed.** HSV was formally described by Alvy Ray Smith in *Computer
  Graphics*, August 1978 — "Color Gamut Transform Pairs", SIGGRAPH 78, pp 12–19.
- **Not confirmed.** That Smith himself coined "hexcone" for HSV and
  "double hexcone" for HSL. Those read as common later designations rather than
  his terms.
- **Still unread.** The paper itself. The PDF at `alvyray.com/Papers/CG/color78.pdf`
  did not convert to text in this environment, so the above rests on secondary
  sources. Anyone with a working PDF reader should close this out before the
  claim goes on camera — see the video plan in [[plan-teaching-rgb-to-hsb]].

## Why the fields used to stutter

Separate from the geometry, and ours rather than the model's. Each drag frame
re-derived all three HSL channels from the previous colour, replaced one, and
converted back — so 8-bit rounding compounded frame over frame. Measured across
one drag of L: saturation wandered up to 9 points, hue up to 10 degrees.

Fixed by holding the untouched channels at what the gesture started with, and
holding the *readout* too — see [[decision-hsl-gesture-origin]].

## Sources

- [CSS Color Module Level 4 — powerless components](https://drafts.csswg.org/css-color-4/#powerless), W3C
- [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV), Wikipedia — secondary, used for the hexagon projection and the Smith attribution
- [Color Gamut Transform Pairs](https://alvyray.com/Papers/CG/color78.pdf), Alvy Ray Smith, SIGGRAPH 78 — cited, not read

## Related

- [[hexagon-is-the-cube-down-its-diagonal]] — the geometry this corroborates
- [[plan-teaching-rgb-to-hsb]] — where these edge cases could become teaching material
