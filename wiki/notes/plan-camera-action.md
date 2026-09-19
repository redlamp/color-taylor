---
tags:
  - domain/presentation
  - status/deferred
  - origin/user-call
---

# Plan: A Camera Cue That Pushes Into The App

**2026-09-19.** An experiment from 2026-09-11 that never merged. It lives on the branch `feature/camera-action` (head `73e17fd`), kept on purpose so the work can be revived. Taylor chose to leave it unmerged when the other presentation branches were pruned. See [[presentation-system]] for the walkthrough it would plug into.

## What it does

A new script cue, `camera`, moves a virtual camera inside the app during a walkthrough. It pushes in on a target at a zoom, slides across to another subject, and pulls back to the full frame. It is hands-free, so a push-in can run while the ghost cursor is mid-drag.

- A wrapper `#app-camera` in `App.tsx` takes `transform: translate(tx, ty) scale(z)` with its origin at `0 0`. The browser re-renders the app's text and vectors at the new scale, so a 1080p capture stays sharp at 2x instead of being an upscaled crop.
- The ghost cursor, callouts and the presentation transport are portalled to `document.body`, outside the wrapper, so none of them scale.
- The whole camera state is one (zoom, focal point) pair, tweened on `requestAnimationFrame` and never read back from the DOM. `seek()` lands on any moment by applying the last camera cue before it with a zero-length move.
- Every frame is clamped so the viewport stays inside the scaled app.
- The runner's synthetic events keep hitting the right controls while zoomed, because it reads client rects, which are already in transformed space.
- Three repaint modes were built to measure against each other: `plain` (ships), and `?cam=wc` and `?cam=nudge`.

Files on the branch: `src/demo/camera.ts` (the module), `src/demo/ScriptRunner.tsx` (the cue), `src/App.tsx` (the wrapper), `public/scripts/camera-test.json` (a 25 s bench). The bench pushes to 1.8x on the hexagon, works a stem, slides to the RGB sliders at 2.2x, runs the R slider, and pulls back. Run it with `?script=camera-test&go=0`.

## How it differs from Frames

Frames (`src/demo/Frames.tsx`, merged) is a capture-only framing layer for recording the video at other aspect ratios, and never ships. The camera cue moves the app itself inside one frame, as part of the choreography.

## Why it is parked, and what reviving it takes

It was built on the first version of the script runner, before the cut-03 rewrite (tag `pre-cut-03-rewrite`), and was never used in a cut. It will not merge cleanly into today's `src/demo`. Reviving it means porting `camera.ts` onto the current runner and its seek model, re-adding the `#app-camera` wrapper in `App.tsx`, and checking it against the webcam panel, the About panel handoff and Frames. Its measurements were kept in an untracked `tmp/camera-test` folder in the `color-taylor-camera` worktree, not in git.
