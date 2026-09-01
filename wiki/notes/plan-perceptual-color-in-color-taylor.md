---
tags:
  - domain/color-math
  - domain/ui
  - domain/presentation
  - status/draft
  - origin/user-call
---

# Plan: Perceptual Colour In Color Taylor

**2026-08-25.** How much of the Oklab world the app should learn, and where the
complexity cliff actually is. Draft — nothing here is built, and no issue is
filed yet. Research behind it: [[oklab-and-the-perceptual-color-spaces]].

## The cliff is not the count, it is the category change

Everything the app shows today — RGB, HSB, HSL — is **one idea**: different
coordinate systems on the same cube. The hexagon is what makes that visible and
it is why the tool works. There are three tiers, and each is a jump rather than
one more option:

1. **Same cube, new coordinates** — RGB, HSB, HSL, HWB. What we have.
2. **Same colours, new geometry** — Oklab / Oklch / OkHSL. The cube stops being a cube.
3. **A different cube** — sRGB, Display P3, Rec.2020. The corners move.

A user shown `HSB · HSL · OkHSL · P3` in one tab strip will assume those are four
flavours of the same thing. They are not, and *that* is what breaks people — not
the number of modes. A menu also implies "pick your favourite" when the real
lesson is that these answer different questions.

## Recommendation

**Add OkHSL as a fourth mode. Add Oklch as a readout beside it. Do not add
OkHSV. Do not make P3 a mode.**

### Why OkHSL and not OkHSV

Both normalise the gamut's lopsidedness away, but they buy different things with
it. OkHSV's normalisation buys comfort and nothing else. OkHSL's buys **constant
perceptual lightness across hue** — see
[[constant-lightness-needs-the-hsl-family]] — which is not hiding a lesson, it
*is* the lesson, and a user can prove it to themselves in one drag of the hue
wheel. Nothing else in this survey is that demonstrable.

It also slots into machinery we already have: `blMode: 'lightness'` is the same
shape, with a lightness that finally means something.

> Recorded honestly: the first recommendation in this session was Oklch *instead
> of* the OkHSL/OkHSV pair, on the grounds that normalisation hides the lesson.
> That is right about OkHSV and wrong about OkHSL, and the two were lumped
> together without checking. The measurement is what changed the answer.

### Why Oklch as well

It is what CSS speaks, it is in `src/index.css` already, and Tailwind v4 ships
its palette in it. Users will meet Oklch; they will never meet OkHSL outside a
picker's internals. But its `C` is absolute, so at a fixed `L` many `(L, C, H)`
combinations are out of gamut — dead zones a picker must not have. Hence: OkHSL
for dragging, Oklch for reading and for copying into CSS.

### Why P3 is a boundary, not a mode

A gamut multiplies every other mode, and combinatorial settings are how tools
become unlearnable. Draw it instead: in an Oklab view the sRGB rim is a curve and
P3's is a second curve outside it. One extra outline teaches *your hexagon is one
gamut, here is a bigger one*, with no new state at all.

## Structural cost

- `BLMode = 'brightness' | 'lightness'` spans 12 files with **30 explicit
  two-way branches**, and is encoded as a *boolean* where it matters most —
  `draw(…, lightnessMode: boolean, …)` and `uMode < 0.5` in the shader. Keep it
  at two values and let Oklab be a **view** of the whole component rather than a
  third tab, or those 30 branches become 30 four-way ones.
- The shader needs the conversion in **GLSL**, which no JS library provides. A
  dependency solves only half the problem; culori's value here is as a **test
  oracle**, not a runtime.
- The canonical-state machinery is the real risk. `rgbOverride` exists because
  round-trips are lossy; Ok round-trips are lossier (cube root plus gamut
  clipping), so `hslOrigin` needs an Ok twin. That machinery is where the stuck
  stepper and the cross-channel stutter lived — see [[decision-hsl-gesture-origin]].
- Port Ottosson's analytic `compute_max_saturation`; do **not** substitute a
  numeric search. [[srgb-gamut-is-not-star-shaped-in-oklab]] is why.

Rough sizing: an Oklch readout alone is about a day. OkHSL as an editing model
with the view, the shader and the gesture origin is about three days plus an
edge-case tail.

## The deck gets more than the picker

The deck is linear and narrated, so it can carry a lot — things arrive in order,
and by `12-hexagon` the reader has earned the geometry. The picker shows
everything at once, so it can carry very little. Put the Ok material in the deck
generously and in the picker as one extra view.

### The slide that does not exist yet

**The hexagon, told the truth.** Take the picker's own pixels and move each one
to where Oklab puts it. Nothing is recoloured, only relocated — so every
difference is a claim the current geometry makes that is not true:

| | red | yellow | green | cyan | blue | magenta |
|---|---|---|---|---|---|---|
| HSV hue | 0° | 60° | 120° | 180° | 240° | 300° |
| Oklab hue | 29.2° | 109.8° | 142.5° | 194.8° | 264.1° | 328.4° |
| max chroma | 0.258 | 0.211 | 0.295 | **0.155** | 0.313 | **0.322** |

Arcs between landmarks are 60° each by construction in HSV; in Oklab they run
from **32.7°** (yellow→green) to **80.5°** (red→yellow). And the corners are not
equidistant from the centre either — cyan reaches less than half as far as
magenta. The regular hexagon is making two silent claims, *all six are equally
colourful* and *the six are evenly spaced*, and neither survives.

What does survive is that the corners are still cube corners. Same solid, seen
through the eye instead of through the arithmetic.

It sits naturally right after `12-hexagon` — same figure, one cut, visibly bent
— and it earns the OkLab rung [[plan-teaching-rgb-to-hsb]] already has pencilled
in at the 10:00 mark. Pulling the brightness down in that view is the sharpest
demonstration available that HSB's brightness is not perceptual lightness: the
hexagon shrinks uniformly because `max(R,G,B)` scales a linear quantity, while
the Oklab shape shrinks *and changes proportions*, because `L` is a cube root.

## What we already have that helps

- The circle renderer. `shapeMix: 0` on `ColorHexagon` is a first-class circle as
  of [[decision-intro-renders-the-real-picker]], and a perceptual picker is a
  circle, not a hexagon.
- `ColorSpace = 'srgb' | 'linear'`, threaded through `sliderGradients.ts`, the
  bars and `uLinear` in the shader. That is the web/game boundary sitting in the
  picker already, currently unlabelled as such.

## Open

- Does the Oklab view replace the hexagon on screen, or sit beside it?
- Is `#72`'s callout the place to explain the tier change, or does it need its own?
- Worth checking what the Figma plugin receives on a **Display P3** document —
  the plugin API hands over `{r, g, b}` floats without naming a space.

## Related

- [[constant-lightness-needs-the-hsl-family]] — the finding that drove the recommendation
- [[oklab-and-the-perceptual-color-spaces]] — the survey and the sources
- [[srgb-gamut-is-not-star-shaped-in-oklab]] — the implementation trap
- [[hexagon-is-the-cube-down-its-diagonal]] — the geometry being retold
- [[decision-brightness-axis-not-luminance]] — the earlier call this revisits
- [[plan-teaching-rgb-to-hsb]] — the deck's ladder, which already ends here
