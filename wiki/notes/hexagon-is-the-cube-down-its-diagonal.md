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

## Worth sourcing before it goes on camera

HSV's original formulation appears to be the **single-hexcone** model, from Alvy Ray Smith's *Color Gamut Transform Pairs*, SIGGRAPH 1978, with HSL as the double hexcone. If that holds, the hexagon is in the model's own definition and the circular wheel is the later simplification — which makes the deck's move from wheel to hexagon a restoration rather than an interpretation. Recalled, not checked against the paper.

## Related

- [[plan-teaching-rgb-to-hsb]] — where this sits in the intro deck and the video
- [[decision-brightness-axis-not-luminance]] — why `max(R,G,B)` is brightness and not luminance
