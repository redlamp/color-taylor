---
tags:
  - domain/color-math
  - status/verified
---

# RGB Waves Are Max and Min

**2026-09-06.** Sweep a colour's hue round the circle and watch its three channels. Each traces the
same wave, 120° apart: flat at the top for a third of the circle, a straight fall over a sixth, flat
at the bottom for a third, a straight rise over the last sixth. The top of the wave is the colour's
largest channel and the bottom is its smallest, and those two numbers are the *only* thing the shape
depends on. Hue is which way round the circle you are standing; the wave has no say in it.

That is the whole of HSB and HSL, read off one picture:

| Read off the wave | Is |
|---|---|
| `max` | Brightness |
| `max − min` | what Saturation measures. Over `max` in HSB; in HSL over the room left to the nearer end, `1 − abs(2L − 1)` |
| `(max + min) / 2` | Lightness |

`hsbToRgb(h, s, b)` holds `max = b` and `min = b(1 − s)` fixed while `h` moves. `hslToRgb(h, s, l)`
holds `max = l + c/2` and `min = l − c/2`. Both are one function of `(h, max, min)`: `rgbAtHue` in
`src/lab/rgbWaves.ts`, checked against both conversions at every hue in `rgbWaves.test.ts`. So one
graph serves both slider groups, and switching the editor between HSB and HSL changes the labels on
the rails and nothing else.

A grey is the case where the rails meet and the wave goes flat, which is why hue has nothing to hold
on to there - see [[research/hsl-degenerate-states]].

## Where to see it

`lab/spectrum.html` draws the waves over Channel Surfer's linear rainbow - hue across, white above
the pure hue, black below; `src/lab/linear-rainbow.webp`, from that project's `public/demo/` - beside
the picker's own Color Editor, composed the way the cube bench composes it. The graph is a picker
too: drag sideways for hue, the top rail for brightness, the bottom rail for saturation, and every
slider follows. `node scripts/build-cube-bench.mjs spectrum` makes the single-file version.

Sibling of [[hexagon-is-the-cube-down-its-diagonal]]: the same fact seen from above the cube.
Looking along the grey axis, `max − min` is how far out from the axis a colour sits, `max` is which
cross-section it sits in, and the wave is that cross-section unrolled.
