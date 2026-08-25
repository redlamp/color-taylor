# Presentation

The intro deck: the argument it makes, how it is delivered, and where it is going.
Code conventions for the section live in `src/presentation/CLAUDE.md`.

## Where it lives

Reachable in production at `/color-taylor/intro`, deliberately unadvertised -
`VITE_INTRO_ENABLED` gates only the Intro button on the picker, not the route.
`public/intro/index.html` is the static front door, because GitHub Pages has no
rewrite rules. The hash route is `#/intro`; `#/presentation` still resolves as a
silent alias.

## The argument

- [[hexagon-is-the-cube-down-its-diagonal]] - the geometry the whole deck builds
  toward, and the one claim in it still resting on secondary sources
- [[plan-teaching-rgb-to-hsb]] - the ladder, the proposed slide rewrites and the
  video running order. The source script; do not write a second one.

## How it is built

- [[decision-intro-renders-the-real-picker]] - the deck renders `ColorSlider`,
  `EquationsPanel` and `ColorPicker` already. `HsbCircle` was the exception and
  the one thing that drifted. #81.

## Structure

- [[plan-intro-two-paths]] - a fork after the opening: the Macintosh history, or
  straight to the colour models. Plus a period frame for the history path.
  Issues #79 (fork) and #80 (frame).

## Delivery

- [[plan-narrated-intro]] - recording Taylor giving it, and playing that back
  alongside the deck. Issues #77 (playback) and #78 (recording).
  Recorded first and transcribed, not scripted first and read.

## Open

- #52 - polish, and flipping the button on. Narrowed since the route stopped
  being gated.
- Deep links do not resume: `#/intro/7` opens on slide 1, because
  `PresentationShell` writes the slide to the hash but never reads it. #79 fixes
  this on the way past, by keying the route to the slide id instead.
