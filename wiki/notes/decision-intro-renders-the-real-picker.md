---
tags:
  - domain/presentation
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: The Intro Renders The Real Picker

**2026-08-25.** The app is the source of truth. The intro deck shows the app's
own components, and where it shows a hexagon that means `ColorHexagon` - not a
second renderer that happens to look like one.

> *"the app is the source of truth, the intro should stem from that, so it's not
> that we're porting to the intro, it's that we're updating the intro to match
> the state of the app"*

## This is already the deck's practice

`PresentationStage` imports `ColorSlider`, `EquationsPanel` and `ColorPicker`
itself - the last one is how `15-app` scales the running app down into the
panel's footprint and grows it out. The deck has always been assembled from the
real thing.

`HsbCircle.tsx` is the one exception, and it is the one thing that drifted.
That is not a coincidence and it is the whole argument.

## What the drift looked like

Three separate defects, all found in one sitting, all downstream of being a
second implementation:

- **Stack order.** The chain was drawn interleaved - each channel's stem then its
  own handle - so the blue stem painted over the green joint and green over red.
  `ColorHexagon` draws all stems, then all handles, which is why it cannot show
  this. Fixed, but by hand, in the copy.
- **Handle fills do not match the field underneath them.** The wheel is CSS - a
  conic gradient of `hsl(H,100%,50%)` under a white radial, then a black overlay
  for brightness - while the fills come from `hsbToRgb(h, s, brightness)`. Two
  colour models with no shared code, so they agree only by coincidence. In the
  app both come from `colorAtPoint`, the CPU twin of the shader that paints the
  field, which is why the staple holds there.
- **The selected dot and the stems disagree.** The dot is placed at
  `(S/100) x edge`, saturation only; the chain ends at chroma,
  `(S/100) x (B/100) x edge`. They coincide only at full brightness. At B=40 the
  gap is 84px on a 140px radius. Same class of bug as the `r^2` one fixed in the
  app the day before, arrived at independently.

Two of those three would not have existed if the deck rendered the component.

## Same reasoning as the plugin, third surface

[[decision-single-source-picker]] settled this for the Figma plugin on
2026-08-01, and said why:

> A hand-ported picker would have been faster to stand up and would have started
> drifting the same week.

It drifted. The deck is the third surface and gets the same rule. The mechanism
is already proven twice: `ColorHexagon` runs in a minimal configuration - `bare`,
`blBar={false}`, `satBar={false}` - which is exactly how the plugin mounts it.

## The open question: the morph

`HsbCircle` earns its keep for one thing the real component cannot do - the
clip-path morph from circle to hexagon, which is the deck's rhetorical move from
`10-hsb-circle` to `12-hexagon`. [[plan-teaching-rgb-to-hsb]] wants that slide to
read as *"a wheel is a guess at the shape - watch what the actual shape is"*, and
a morph carries that better than a cut.

So the split is not obvious, and the options are:

1. **Hand off mid-morph.** `HsbCircle` runs the morph; at the moment it is fully
   hexagonal, swap to `ColorHexagon`. Invisible only if the two agree
   geometrically at that instant - which means fixing the drift anyway, and then
   maintaining it.
2. **Cut instead of morph.** `10-hsb-circle` keeps `HsbCircle` as a circle only;
   `12-hexagon` mounts the real component. Loses the transformation, gains one
   implementation for every slide that argues the geometry is real.
3. **Teach the real component to be a circle.** Most work, removes `HsbCircle`
   entirely, and puts a presentation-only concern into the app - which
   [[decision-single-source-picker]] warns against in its closing note.

Undecided. Worth trying (2) first, because it is reversible and it answers
whether the morph is worth a second renderer at all.

## Related

- [[decision-single-source-picker]] — the same rule, settled first for the plugin
- [[plan-teaching-rgb-to-hsb]] — why the wheel-to-hexagon moment matters
- [[presentation]] — the MOC
