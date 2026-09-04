---
tags:
  - domain/color-math
  - status/verified
---

# The Hexagon Is The RGB Cube Down Its Diagonal

**2026-08-13.** The picker's hexagon is not a stylised colour wheel. It is the literal silhouette of the RGB cube viewed along the line from black to white, and every geometric constant in `ColorHexagon` follows from that.

Interactive proof: `docs/prototypes/rgb-cube/index.html` — open it directly, no build step.

## What follows from it

- **`DIRS` is the three cube axes projected.** R at 0&deg;, G at 120&deg;, B at 240&deg; (`hexConstants.ts`). Viewed down the neutral diagonal, three mutually perpendicular axes project exactly 120&deg; apart.
- **Six corners, alternating primary and secondary.** Black and white are the two corners on the view axis; the other six project to a regular hexagon, R&nbsp;Y&nbsp;G&nbsp;C&nbsp;B&nbsp;M at 60&deg; intervals, which is `ColorLabels` verbatim.
- **The `60 *` in the hue formula is one sixth of a turn.** `colorConversions.ts:80-85` picks a sector by which channel is max; each sector is one edge of the silhouette.
- **Distance from the centre is saturation, and `chroma / max` is that distance normalised.** The hexagon boundary is chroma at its maximum for that brightness.
- **Brightness needs its own control because the projection loses exactly one dimension — the neutral one.** Black and white both land on the centre. The dashed limit hexagon that shrinks with brightness is the cube's cross-section at that value, so `max(R,G,B)` scaling a hexagonal cross-section is the model, not an approximation of it.
- **The three channel faces sit at the same elevation, 120&deg; apart** — `asin(1/sqrt(3))` off the perpendicular. Looking down any one channel's axis gives a *square* gradient, which is what an ordinary SB box is. The hexagon and the square are the same solid from two viewpoints.

## Two things the projection must be

**Parallel, not perspective.** Under perspective the near corner swells and the outline bulges into something close to, but never, a hexagon. The first version of the prototype used a perspective camera and the central claim was visually false.

**Aligned so red points east**, or the hexagon comes out rolled to an arbitrary angle and stops matching the app. Build the screen basis from red with its neutral component removed — the same construction `DIRS` uses.

## Verified

Prototype measures corner angles from the projection rather than asserting them: 0.0 / 60.0 / 120.0 / 180.0 / 240.0 / 300.0&deg;. Requested hue to actual hue is exact at 0, 60, 120, 180, 240, 300 and 210&deg;. Black and white converge to under 1.5px of each other at the diagonal.

## Linearity is what the vector chain rests on

**2026-09-01.** Worth stating outright, because everything downstream depends on
it: the projection is **linear**, so vector addition in cube space becomes vector
addition in the plane. That is the whole reason three straight legs along `DIRS`
add up to the colour rather than merely illustrating it.

Any non-linear reshaping of the field - the circle included - takes that away.
See [[rgb-stems-must-curve-in-circle-space]].

## What it looks like in a perceptual space

**2026-09-01.** Every geometric constant here follows from the cube. None of it
survives the move to Oklab, and the failure is measurable rather than vague: the
six corners land at 29.2, 109.8, 142.5, 194.8, 264.1 and 328.4 degrees instead of
at multiples of 60, and their distances from the centre range from 0.155 (cyan)
to 0.322 (magenta) instead of being equal.

So the regular hexagon makes two silent claims - *all six are equally colourful*
and *the six are evenly spaced* - and perception refuses both. What survives is
that the corners are still cube corners: same solid, different viewer.

That redrawing is a proposed deck slide. See
[[plan-perceptual-color-in-color-taylor]].

## Sourcing, partly closed out

Checked on 2026-08-24 - see [[hsl-degenerate-states]] for the sources.

- **The projection is confirmed.** The RGB cube tilted onto its corner and
  projected onto the plane perpendicular to the neutral axis takes the shape of
  a hexagon, with red, yellow, green, cyan, blue and magenta at its corners. The
  claim this whole note rests on holds.
- **The attribution is confirmed.** HSV was formally described by Alvy Ray Smith
  in *Computer Graphics*, August 1978 - "Color Gamut Transform Pairs", SIGGRAPH
  78, pp 12-19.
- **The "hexcone" wording is not.** That Smith himself called HSV a single
  hexcone and HSL a double hexcone reads as a common later designation rather
  than his own term. Do not attribute it to him on camera without reading the
  paper.
- **The paper is still unread.** The PDF would not convert to text in the
  environment this was checked from, so the above rests on secondary sources.

The "restoration rather than interpretation" framing survives the first two
points, which are the load-bearing ones.

## Related

- [[plan-teaching-rgb-to-hsb]] — where this sits in the intro deck and the video
- [[decision-brightness-axis-not-luminance]] — why `max(R,G,B)` is brightness and not luminance
