---
tags:
  - domain/color-math
  - domain/ui
  - status/open
  - origin/user-call
---

# The RGB Stems Must Curve In Circle Space

**2026-09-01.** Asked whether the intro's circle could come into the main app,
and whether the RGB vector chain could map from hexagon to circle space. Yes to
both — but the legs stop being straight, and that is not a rendering choice, it
is forced.

Interactive version: `docs/prototypes/rgb-stems-circle-space.html` — open it
directly, no build step.

## Why the chain works in the hexagon at all

[[hexagon-is-the-cube-down-its-diagonal]] is what makes it possible: the hexagon
is a **linear** projection of the RGB cube. Vector addition in cube space becomes
vector addition in the plane, so three straight legs along `DIRS` at 0°, 120° and
240° genuinely add up to the colour. The stems are not an illustration of the
sum; they *are* the sum.

## Why it breaks in the circle

Hexagon → circle is a radial stretch of `shapeEdge(θ) / hexEdge(θ)`, which at
`mix = 0` is exactly **1 at the vertices** and **1.155 at the edge midpoints**.
Angle-dependent, therefore not affine, therefore:

> the sum of the warped vectors is not the warp of the sum.

Three ways out, and only one keeps the meaning:

1. **Warp the joints, draw the legs as curves.** Sample each straight leg in
   hexagon space, push every sample through the warp, render a polyline. Chain
   still starts at the origin, passes the same joints, ends on the colour, and
   each leg still means *add this much of this channel*. **This is the one.**
2. Keep the legs straight and let them miss the tip. Breaks the invariant the
   whole picker rests on.
3. Rescale leg lengths so straight legs reach the warped tip. Underdetermined —
   two equations, three unknowns — so solvable, but the lengths stop being R, G
   and B, which destroys the reason for drawing them.

## Chords are close and wrong

Connecting the warped joints with straight lines looks nearly right, which is
the trap. The points along a chord do not correspond to intermediate channel
values, so leg hover and leg dragging — `handleDotMouseDown` with the leg flag —
would be selecting from a curve that is not the one drawn.

## The first leg never bends

It runs from the centre along a channel axis, and all three axes point at
vertices, where the stretch is exactly 1. So whichever channel `getOrder` puts
first is always straight, and only the later legs bow. The chain starts honest
and accumulates distortion, which is close to the right story to tell.

## The app's circle should mean chroma, not saturation

The deck's wheel deliberately reads radius = **saturation**, ignoring
brightness, because it is the naive wheel `12-hexagon` exists to correct. Under
that reading the chain needs scaling by `1/b` to reach the tip, which **diverges
as brightness approaches zero** — at B=10 the chain is ten times too long.

An app circle should keep radius = **chroma**, which the app already teaches.
Then the warp is purely angular, bounded at 1.155, and the chain behaves at
every brightness.

## Which means one prop has to become two

`shapeMix` currently conflates two independent things:

1. the boundary shape — hexagon ↔ circle
2. the radial semantics — `shapeLimitScale` opens the cross-section bound out to
   the full edge as `mix → 0`, and the tip switches from chroma to saturation

The deck wants them coupled. The app wants the shape without the semantics
change. Splitting them is the actual work.

## Before this ships

Three callsites still use hexagon-only geometry, all of them app features the
deck never exercises because it runs `wheelAdjusts={false}`:

- `ColorHexagon.tsx:1694` — **the click-to-select hit test**. At `shapeMix: 0`
  clicks in the absent corners register, and clicks near the rim at edge-midpoint
  angles are rejected. This is the one that matters.
- `ColorHexagon.tsx:1137` — the named-colour hover dot
- `ColorHexagon.tsx:1162` — the `NAMED_COLORS` scatter

Plus: a UI control, a `localStorage` key, and a `color-taylor:reset-all`
listener for it — the root `CLAUDE.md` warns that a new key without that
listener survives a reset.

Rough sizing: about a day, almost none of it the maths. No issue filed.

## Related

- [[hexagon-is-the-cube-down-its-diagonal]] — the linearity this all rests on
- [[plan-perceptual-color-in-color-taylor]] — the other reason to want a circle
- [[decision-intro-renders-the-real-picker]] — where `shapeMix` came from
- [[color-models]] — the MOC
