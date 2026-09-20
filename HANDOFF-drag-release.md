# Handoff: the drag never ends in the CIE lab

**2026-09-20.** Branch `lab/oklch`, tip `315865b`. Unresolved, wrongly diagnosed twice.

## The symptom, in Taylor's words

> "When I press I drag, I seem to have to press AGAIN (not just release) to end the drag."

This is the key fact and it arrived late. **A second `pointerdown` ends the drag; the
`pointerup` does not.** Reproduced by hand on the CIE lab page (`/lab/cie.html`), on the
brightness/saturation value pills in panel 1 (`#bl-handle`, `#sat-handle` in
`src/components/hex/HexBar.tsx`).

It does **not** happen in the main app at `/#/`, which uses the same components.

## Read this before anything else

The symptom says `pointerup` is not reaching the window listener. Everything else in this
document is subordinate to that. The previous three diagnoses all assumed it was reaching
it and something downstream was wrong. They were all wrong.

Where to look, in the order I would look:

1. **Is `pointerup` fired at all?** Put a capture-phase listener on `window` in the lab page
   and log `pointerdown` / `pointerup` / `pointercancel` / `lostpointercapture` /
   `dragstart` / `dragend`. If `pointerup` never arrives, the question is what swallowed it.
2. **Native drag.** If a press turns into an HTML5 drag-and-drop gesture, the browser
   swallows `pointerup` and fires `dragend` instead. `grab()` in `HexBar` calls
   `preventDefault()`, but the **track's** own `onPointerDown` only calls
   `stopPropagation()` - it does not `preventDefault()`. Check whether a native drag or a
   text-selection drag starts. `dragstart` in the log above answers this immediately.
3. **Pointer capture.** If any element calls `setPointerCapture` and is then unmounted, the
   release can be delivered nowhere. Check for `setPointerCapture` anywhere in the lab's
   hosting and in `@base-ui` components mounted near the hexagon.
4. **Element identity.** The pill is `#bl-handle`. Confirm with a MutationObserver that it
   is not being replaced mid-gesture. It *is* replaced by `#bl-value` when `stacked` flips
   (`ColorHexagon.tsx`, `HEX_STACKED_BARS_MAX = 468`), but see "ruled out" below.

## Ruled out, with evidence - do not re-litigate these

- **Not the drag handlers.** `HexBar` and `useDrag` handle `pointerup`, `pointerleave`,
  `pointercancel` and window `blur`. The main app uses the identical code and works;
  118 Playwright tests pass against it, including specs that drag these handles.
- **Not the missing `pointercancel`/`blur` listeners.** They were genuinely missing and were
  added in `ef8ebd5` and `57c2330`. Correct fixes, unrelated to this bug.
- **Not the 468px stack threshold.** Eight consecutive real-input gestures at 1536x864 held
  the card at 470px throughout with zero pill unmounts. Hardened anyway in `315865b`.
- **Not `Fit` / `container-type: size`, not the 2x2 grid, not `Panel`, not the tab wrapper.**
  A nine-level bisection added each layer in turn; every one released correctly.
- **Not a tooltip on the pill.** `HexBar.tsx` contains no `Tooltip` at all.

## What was changed, and what to consider reverting

`315865b` fixed a real and separate problem: a pointer move cost **2176ms** in the lab
against **56ms** in the app, because mounting the xyY solid redrew up to 16.7M points per
reported move. The morph and solid now read a `useDeferredValue` copy and coalesce to one
draw per animation frame; measured 2176ms -> 287ms.

That fix is worth keeping on its own merits, but **it is not this bug** and I wrongly told
Taylor it probably was. A frozen page merely resembles a stuck drag. If reverting it helps
isolate the real fault, revert it - nothing depends on it.

## `?perf` prints nothing for Taylor

`src/lab/perf.ts` gates on `new URLSearchParams(location.search).has('perf')` and prints
one console line per frame that did work. Taylor reports no output. Either he is on a build
that predates `315865b`, or the gate does not fire the way he is loading the page - note
that a standalone `dist-lab/*.html` opened from disk is a `file://` URL. **Verify the switch
actually works before trusting any instrumentation built on it.**

## State of the branch

`lab/oklch` at `315865b`, pushed, everything else green: 118 Playwright, 307 unit, lint
0 errors, typecheck clean. Two lab pages (`/lab/oklch.html`, `/lab/cie.html`), the Oklab
and Oklch conversions, the gamut solver, the CIE data and gamut definitions, and five wiki
notes. Nothing merged toward `dev`.

A regression spec is parked at `docs/parked/cie-lab-hexagon.spec.ts.parked`. It is right in
shape but the lab page it loads starved three neighbouring specs, so it was not landed.

## Honest assessment

I burned a great deal of Taylor's budget on this by theorising instead of bisecting, and by
chasing a latency problem that resembled the symptom rather than establishing the symptom
first. The single question I should have asked on the first report - "does the release do
nothing, or does a second press end it?" - would have pointed straight at `pointerup` not
arriving, and none of the three wrong diagnoses would have happened.
