---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# The Demo's Caption Lives In The Header

**2026-09-03.** The self-running demo's caption is a single panel that takes the empty span of the
picker's header, not a bubble that follows the ghost cursor to whatever it is working.

## What was decided

One panel, carrying the caption, the progress ticks, Back and Next, the narration switch and Skip.
It sits between the wordmark and the tool buttons where the header has room, and drops to a band
across the top of the picker when that row wraps, which is what a phone does. It is pinned so it
cannot scroll off the top when a step scrolls a target into view.

## Why

The bubble was built first, from the prototype: placed beside the target, side chosen by available
room, tail pointing at it. It reads well in a screenshot and badly in use, because the demo's
subject is never the one control. Step three says *keep an eye open for how your changes impact
other parts of the tool* while dragging the hue slider - and the bubble landed on the saturation
and brightness sliders, which are exactly the other parts. Anything near enough to point at the
target is near enough to cover its neighbours, and its neighbours are the lesson.

A caption out of the way in larger type gives up the pointing and loses nothing: the ghost cursor
is already showing where to look, which is the job the tail was doing.

Putting the controls in the same panel followed from the same move. A separate bar at the bottom of
the screen meant the demo had two places to look, neither of them where the work was.

## What was rejected

- **The bubble at the target** ([[plan-picker-demo]]'s original, and the prototype's). Above.
- **A fixed banner across the top of the viewport.** Simpler to place, but it covers the plugin
  banner and reads as browser chrome rather than as part of the tool.
- **Caption in the header, controls in a bottom bar.** Two surfaces for one thing.

## Consequences

- `ColorPicker` tags `#picker-header` and `#picker-tools`; the panel measures the gap between the
  title and the tools every frame rather than switching on a breakpoint, so a resize, a scroll, or
  the plugin banner appearing all move it with nothing else being told.
- The panel is the demo's only hit-testable chrome, tagged `data-demo-chrome` so the
  skip-on-real-input listener can tell its own controls from a click on the app.

See [[plan-picker-demo]] for the spec this amends and [[handoff-picker-demo]] for the build notes.
