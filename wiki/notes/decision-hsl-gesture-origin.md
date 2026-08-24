---
tags:
  - domain/ui
  - domain/color-math
  - status/adopted
  - origin/user-call
---

# Decision: An HSL Gesture Holds What It Started From

**2026-08-24.** HSB is the canonical state; HSL is derived from the colour on
every read, edited, and converted back. That trip loses information twice, and
both losses are fixed by carrying an origin for the duration of a gesture rather
than re-deriving each frame. Implemented in `src/utils/hslWrite.ts`.

## The two losses

**The neutral axis has no hue or saturation to derive.** Black, white and grey
all convert back as `h = 0, s = 0`. Dragging lightness to either end and
returning turned `#441745` into `#2E2E2E`. See [[hsl-degenerate-states]] for
what the standards call this.

**Re-deriving compounds rounding.** The colour is 8-bit. Reading all three
channels off the previous frame's rounded colour, replacing one, and converting
back feeds the error forward. Across one drag of L, saturation wandered up to 9
points and hue up to 10 degrees while the dragged value was perfectly smooth.

## The rule

A gesture captures `{h, s, l}` on its first write and holds it until the pointer
lifts. The channel being dragged takes the new value; **the other two come from
the origin, not from the colour**. Drift becomes zero by construction, and
"saturation only changes saturation" becomes true rather than approximately true.

Cleared at *both* ends of a pointer press. Clearing only on pointerup left a
wheel adjust — which has no pointerup — able to hand a stale origin to the next
gesture.

## Two halves, and why one is not enough

Freezing the write alone took saturation drift from 9 points to 3, not to 0. The
readout was still re-deriving from an 8-bit colour every frame: a perfectly
steady colour underneath a jittering number. So `hslIntent` holds what the
gesture asked for and is displayed in place of the derived value while the
gesture is in flight.

## The intent outlives the gesture, guarded by a match test

First version cleared the intent on pointerup. Two things were wrong with that.

A saturation set at L=0 or L=100 snapped back to 0 the moment you let go, so the
control read as refusing to move. CSS Color 4 calls saturation there
**powerless** rather than unavailable - the value still exists, it just stops
affecting the colour - and remembering it is what that looks like in a picker.
This replaces an earlier plan to grey the control out; see [[hsl-degenerate-states]].

The other was a settle on release, `S 64 -> 62` at L=95, which the first draft of
this note defended as "the honest derived value". That was wrong. Both triples
convert to the *same RGB* - neither is more correct - so the one the user
actually set is the better thing to show.

**The intent is used only while converting it reproduces the current RGB
exactly.** That check is the whole safety argument: anything else that sets a
colour - the hex field, an RGB slider, a swatch, a tween - moves the colour out
from under it and it stops being used. There is no invalidation to remember to
write anywhere, so nothing can drift apart. Verified: with a remembered
`299 / 90 / 40`, typing `#2E8B57` drops straight to the derived `146 / 51 / 36`.

## What we deliberately did not do

**Resurrect saturation mid-range.** Hue is recovered whenever the colour is on
the neutral axis, including plain grey at a normal lightness. Saturation is only
recovered at the ends of L, where it is forced to zero. A mid-range `S=0` is
taken at face value - there the user asked for grey, and restoring a saturation
would fight them.

## One implementation, two hosts

The app's `ColorPicker` and the plugin's `figma/ui/main.tsx` had grown two copies
of this conversion, and only the app's was ever fixed — so the panel kept the
bugs after the app lost them. Both call `writeHslChannel` now. **Anything that
writes an HSL channel goes through that function**; a third copy is the failure
mode to watch for.

## Related

- [[hsl-degenerate-states]] — the measurements, and what CSS Color 4 calls this
- [[decision-single-source-picker]] — the same one-implementation argument, for the picker as a whole
