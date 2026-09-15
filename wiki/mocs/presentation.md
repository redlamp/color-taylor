# Presentation

The intro deck: the argument it makes, how it is delivered, and where it is going.
Code conventions for the section live in `src/presentation/CLAUDE.md`.

## Where it lives

Reachable in production at `/color-taylor/intro`, deliberately unadvertised -
the Intro button on the picker shows only under `?intro`, and the route is not gated at all.
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
  the one thing that drifted. Now deleted: `ColorHexagon` learned to be a circle,
  so the wheel and the hexagon are one component and the move between them is a
  morph rather than a cut. #81.

## Structure

- [[plan-intro-two-paths]] - a fork after the opening: the Macintosh history, or
  straight to the colour models. Plus a period frame for the history path.
  Issues #79 (fork) and #80 (frame).

## Delivery

- [[plan-narrated-intro]] - recording Taylor giving it, and playing that back
  alongside the deck. Issues #77 (playback) and #78 (recording).
  Recorded first and transcribed, not scripted first and read.

## The walkthrough

Not this deck: the narrated walkthrough that runs inside the picker. `src/demo` and the cut's cue files under `public/scripts/` are on `dev` since 2026-09-15 (#104); the script, the recordings and the cut pipeline live in the redlamp-videos repo. The presentation side keeps working on `prez/cut-03` and PRs to `dev`.

- [[presentation-system]] - what it is made of: entry points and URL parameters, the files under `src/demo`, the dev middlewares, the presentation side's decisions, and the media hosting plan. `docs/demo-script.md` is the vocabulary reference.
- [[plan-walkthrough-entry]] - how it ships: entry from the About panel, `?present=` paused, the 900px gate, the play() gesture, and what was built.

## Open

- #52 - polish, and flipping the button on. Narrowed since the route stopped
  being gated.
- Deep links do not resume: `#/intro/7` opens on slide 1, because
  `PresentationShell` writes the slide to the hash but never reads it. #79 fixes
  this on the way past, by keying the route to the slide id instead.
