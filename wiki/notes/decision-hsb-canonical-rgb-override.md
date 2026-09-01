---
tags:
  - domain/color-math
  - domain/ui
  - status/adopted
  - origin/bug
---

# Decision: HSB Is Canonical, And The Exact RGB Rides In An Override

**Decided 2026-03-30, written up 2026-09-01.** Colour state is one `HSB` in
React state. The RGB the user actually typed or dragged is held verbatim in a
ref beside it and read in preference to the derived value. Every HSB-driven
interaction nulls that ref first; every RGB-, hex- or HSL-driven one stashes an
exact RGB and derives HSB *from* it.

This is the most-referenced idea in the codebase and it had no note. Commit
`615f2d4` introduced it with one line - *"RGB override ref prevents channel
wiggle from HSB round-trip rounding"* - and `CLAUDE.md` has described it since.
It is written up now because [[plan-perceptual-color-in-color-taylor]] and the
2026-09-01 review both found the pattern implemented **three times**, and the
next step is to implement it once. A refactor should implement a decision, not
discover one.

## The fact it rests on

Stored HSB is whole numbers. An 8-bit RGB pushed through `rgbToHsb` and back
comes out different **86.4% of the time** (636,056 triples sampled at step 3;
HSL is 88.9%). The eight cube corners survive; almost nothing else does.

So a user who types `R = 137` and then drags anything HSB-driven would watch
137 become 136 or 138 - the "channel wiggle" of the original commit. And an
HSL stepper that derives its next value from rounded HSB can land two adjacent
inputs in one bucket, which is the stuck stepper at `#2B6FD6`
([[decision-hsl-gesture-origin]]).

`src/utils/colorConversions.test.ts` pins the fraction: if it ever drops below
80%, the pattern has lost its reason and the test says so.

## The pattern

```ts
const [hsb, setHsb] = useState<HSB>(…);
const rgbOverride = useRef<RGB | null>(null);
const rgb = rgbOverride.current || hsbToRgb(hsb.h, hsb.s, hsb.b);
```

- **HSB-driven** (hue wheel, SB box, bars, a tween frame, a swatch, reset):
  `rgbOverride.current = null` **first**, then `setHsb`. Miss the null and the
  stale RGB paints over the new colour.
- **RGB-driven** (a channel slider, the hex field, a selection from Figma):
  `rgbOverride.current = exact; setHsb(rgbToHsb(exact))`. The derived HSB is
  for the wheel to draw; the exact RGB is what the sliders and the hex show.
- **HSL-driven**: `writeHslChannel` returns the exact RGB alongside; stash it,
  set the HSB it returns (hue carried through, not converted). The gesture
  origin and the shown intent are the same idea applied to HSL - see
  [[decision-hsl-gesture-origin]].
- **Reading the ref during render is intentional.** The three `eslint-disable
  react-hooks/refs` comments mark it. Lifting it to state would double every
  colour render for a value that only exists to *avoid* a derivation.

## What was decided against

- **RGB canonical.** Loses intent on the neutral axis: at `s = 0` hue is
  powerless, and an RGB store forgets which hue the user was on, so a trip
  through grey snaps the wheel to red. HSB keeps `h` as state precisely so that
  cannot happen.
- **Store both.** Two truths, and every handler has to keep them agreeing.
  The override is one truth plus one exception with a clear owner.
- **Store the exact RGB in state.** Then the override *is* the state and the
  derived HSB is recomputed every render - which is RGB-canonical with extra
  steps, and inherits its neutral-axis problem.

## Where it lives - three copies

| Host | refs to `rgbOverride` | gesture origin |
|---|---|---|
| `src/components/ColorPicker.tsx` | 22 | `hslOrigin`, seeded at gesture start, cleared on pointer up/down |
| `figma/ui/main.tsx` | 11 | same, copied |
| `src/presentation/PresentationStage.tsx` | 8 | **none** - re-derives the origin on every call |

The deck's copy is the "obvious implementation" `hslWrite.ts` warns against:
it re-reads all three HSL channels from the rounded colour each write, so a
drag of L there drifts the other two. Nobody has noticed because the deck's
HSL sliders are rarely dragged. That is what three copies buy you - two right,
one quietly wrong, and no test that could tell.

**Next:** one `useColorState` hook owning the state, the override, the HSL
origin and intent, and the tween, consumed by all three hosts. The plugin's
alpha tween and the app's audio hooks stay outside it, attached through
callbacks. Tracked in the review's item 1; this note is item 2.

## Related

- [[decision-hsl-gesture-origin]] — the HSL half of the same idea
- [[decision-single-source-picker]] — one picker; this is one *state* for it
- [[research/hsl-degenerate-states]] — where the neutral axis bites
- [[decisions]]
