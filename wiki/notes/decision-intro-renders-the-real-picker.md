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

## Settled: the morph, by teaching the component to be a circle

**2026-08-25, same day.** The note left three options and leaned toward the
cheap one. Option 3 won instead - `ColorHexagon` learned to be a circle - and
`HsbCircle.tsx` is deleted.

What made it cheap was noticing the shapes differ in exactly one number. The
hexagon's edge distance varies with angle; a circle's does not. So:

```ts
export function shapeEdgeDist(angle: number, r: number, mix: number): number {
  if (mix >= 1) return hexEdgeDist(angle, r);
  return r + (hexEdgeDist(angle, r) - r) * mix;
}
```

`mix` of 0 is the circle, 1 the hexagon, and everything between is a real shape
rather than a crossfade of two pictures. One `shapeMix` prop feeds the shader's
edge, the outline polygon, the brightness cross-section, `colorAtPoint` for the
handle fills and `getHsbFromPosition` for the pointer - so the picker is
coherent at every frame, not only at the ends, and stays draggable mid-morph.

The worry in option 3 was putting a presentation-only concern into the app. It
turned out not to be one: the interpolated edge *is* the deck's argument, and it
is the app's own geometry saying it. The prop defaults to 1, so the picker and
the plugin are untouched.

Two things fell out of it:

- The wheel slide now renders `ColorHexagon`, so the drift catalogued above
  cannot come back on either slide. There is no second renderer left in the deck.
- The shader's edge was a hard `discard` with `antialias: false`, which a
  straight hexagon edge hid and a slowly curving one did not. Feathered over a
  device pixel, which quietly improves the app too.

`tests/intro-shape-morph.spec.ts` holds it, by measuring the outline's
longest-to-shortest vertex radius: 1 is a circle, `2/sqrt(3)` a hexagon, and a
sample strictly between the two during the transition is the proof it
interpolates rather than cuts. Measured under Playwright, since the preview pane
never composites frames and every reading taken there is an intermediate value.

## Related

- [[decision-single-source-picker]] — the same rule, settled first for the plugin
- [[plan-teaching-rgb-to-hsb]] — why the wheel-to-hexagon moment matters
- [[presentation]] — the MOC
