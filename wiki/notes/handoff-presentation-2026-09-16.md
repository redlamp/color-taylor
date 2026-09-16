---
tags:
  - domain/presentation
  - status/open
  - origin/user-call
---

# Handoff: Presentation (cut 05) Back To The App Session

**2026-09-16.** `prez/cut-05` (53 commits ahead of `dev`, at `4b839ee`) is ready to come home. This note is for the app session that owns `src/components` and the About panel, and that will run the merge into `dev` and then `dev` into `main`.

## What the branch carries

- **Cut 05 itself.** `public/scripts/cut-05*.json` (cues, lines, pip manifest, plan, sections, words) and, admitted by exact-path negation in `.gitignore`, the two media files the shipped walkthrough plays: `public/scripts/cut-05.m4a` and `public/scripts/pip/cut-05/full.mp4`. Every other cut's media stays ignored.
- **The shipped timeline's new layout** (`src/demo/PresentationMode.tsx`, `src/demo/presentation-bar.css`). Clock and buttons stack in one column at the left, the track runs to the right edge; the clock reads the app's own monospace (Share Tech Mono) in whole seconds, tabular figures. A red X (destructive variant) leaves the walkthrough, and so does Escape; `onLeave` pauses and drops the `src` on the voice and camera elements, unmounts the pair, and closes the built-in demo if the cut had handed off to it. The playhead is hue 30 (the cut's own orange); the current section label takes the same colour. Section labels sit at 45 degrees and, since `layoutSectionLabels` grew a collision pass, overlapping pairs are pushed apart symmetrically and the row is clamped to the track. The bar takes its colours from `--bar-*` tokens keyed off the app's `.dark` class, not the OS preference. It slides in and out (300ms, mounted below the viewport, reversed on every exit) rather than cutting, and leaves on its own a second and a half after the voice track's `ended` - cancelled if the viewer plays or scrubs. `prefers-reduced-motion: reduce` drops the slide and the wait; the dev transport is unaffected throughout.
- **The camera panel's sync fix and its new home.** While the panel is hidden (before the runner's drag-in cue), drift is corrected by a seek instead of a playbackRate nudge, closing the ~0.3s lead in one frame instead of ~15s. Home moved above the transport bar, inside a viewport-width bound capped at 1920 and centred past that width, so a wide display no longer walks the panel out into empty space.
- **Frames and capture tooling.** Zoom-level regions, arrow keys jump between keyframes, `&flash=1` and `&capture=1` for screen-grab alignment, the document's overflow hidden while framed, R's reset gated to the full-page (F) view so a stray reload-chord no longer rewrites the frames file, and both key handlers now ignore Ctrl/Meta/Alt chords so browser shortcuts pass through.
- **The runner.** The hand's speed cap is a page-px constant again (a frame zoom no longer stretches every reach); scroll cues are skipped under a frame layer; `line` cues can be thin, dashed and drawn above other callouts; `hex-handle:r|g|b` and the hexagon's bar handles are addressable targets; letter clicks and a `wander` gesture (splined through several offsets) were added for cut 05's choreography.
- **`src/demo/sections.ts`** now carries cut 05's twelve sections (Demo intro merged into Demo).
- One touch outside `src/demo`: `src/components/ColorPicker.tsx` gained `leavePresentation` and the wiring for `onLeave`, and `src/components/hex/HexCanvas.tsx` re-measures its field canvas when the frame scale changes.

## Done since this note was first written

- **The input shield** (`36ff882`, then `7f982b9`, `bde8d0b`, `7b11235`, `7baeaaf`). Real pointer, wheel and key events are swallowed while the shipped presentation is mounted; the runner's own untrusted events pass. A click on the app opens "End the presentation?" with **End** and **Keep watching**, wearing the About panel's card and 2xl buttons, on its own layer at z-85 above the ghost cursor and the bar. The bar's leave button is the X and the word End. Space, Escape and the arrows stay live. Playback never pauses for the question.
- **Older cuts' cue JSON** is out of `public/scripts` (`ee3432a`); `tests/about-panel.spec.ts` follows `CURRENT_CUT`.
- **The words file** is fetched from the base path (`50eb915`); it was the one cut file fetched from the site root and 404ed under `/color-taylor/`.
- **Checked on `/dev/`**, headless and muted: the bar is up about 0.65 s after the click and the voice is playing by about 0.9 s, unthrottled and on a 9 Mbps profile alike; the camera panel holds within a frame of the voice; no failed requests.

## Still open

- **Captions on the shipped bar.** The checkbox came off the reduced transport when the timeline was rebuilt (`f4c888d`); the state and caption layers are untouched. Deferred by Taylor.
- **The 800px gate**, PR #135 on `dev`. It merges cleanly on top of this branch (trial merge, 2026-09-16).
- **`?present=` on a production build** mounts the full transport in production mode with no shield and no End button, and no width gate. A shared link lands a visitor in it with no way out but a reload. Decide whether production ignores the parameter or treats it like the About entry.
- **The main deploy removes `/dev/`.** `peaceiris/actions-gh-pages` runs without `keep_files`, so publishing `main` replaces the whole `gh-pages` branch and the staging folder goes with it until the next `deploy:dev`.

## Ownership going forward

`src/demo/` returns to the app session once this merges. The video project keeps producing cut files and hands them over the same way it always has: files landing under `public/scripts/`, nothing else - no other surface of the app is theirs to touch.

## Merge order

1. `prez/cut-05` -> `dev` (PR, tests green).
2. `#135` -> `dev`.
3. Taylor reviews on `/dev/` (`bun run deploy:dev`).
4. `dev` -> `main`, which CI deploys.
