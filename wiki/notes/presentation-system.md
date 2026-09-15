---
tags:
  - domain/presentation
  - status/adopted
---

# The Presentation System

**2026-09-15.** What the narrated walkthrough is made of, as it stands on `dev` after #104. Written from the presentation session's own summary; the vocabulary reference is `docs/demo-script.md` and this note does not repeat it. The recordings, the script and the cut pipeline live in the redlamp-videos repo (`HANDOFF-cut-02-presentation.md`, `tools/takes`, `tools/script-table`, `tools/prompter`), which has a wiki of its own. Ownership: `src/components`, `App.tsx` and the About panel are the app side's; `src/demo`, `public/scripts` and the cut pipeline are the presentation side's ([[plan-walkthrough-entry]]).

## Entry points

- **The About panel's Presentation button** - the shipped path. The host creates the voice and webcam elements in the click and calls `play()`, then mounts `PresentationMode` with `mode="production"` and `transport="reduced"`. The panel stays open; the cut closes it.
- **`?present=<cut>`** - mode dev on the Vite server, production in a build. Starts paused; the transport's play is the gesture.
- Other parameters: `?script=<cut>&go=<s>` is the recording clock (headless verification); `&clock=plan` plays the plan instead of the audio; `&frames=<ratio>` mounts the capture-only framing layer and hides the transport (T shows it); `&webcam=live` is the only way to get a live camera; `?intro` shows the header's Intro button (the colour-history deck, not this); `?bumpers=` is reserved and not built.

## Files, `src/demo/`

| File | Role |
|---|---|
| `PresentationMode.tsx` | the transport; sections from `public/scripts/<cut>-sections.json`; captions from `<cut>-words.json` behind a checkbox; notes and the clip editor in dev |
| `ScriptRunner.tsx`, `drive.ts`, `handover.ts` | the runner. Cues are data in `public/scripts/<cut>.json`; the opening state is stated in `handover` (panel and ghost parked before first paint, the adopted voice rewound to 0); the cursor's speed cap is 700 px/s divided by the frame scale |
| `WebcamPip.tsx` | the 400px square camera panel, home above the transport; clips from `<cut>-pip.json` and `pip/<cut>/full.mp4`, a silent video with black where the panel is off. The voice is the clock |
| `Frames.tsx`, `frameState.ts` | the capture-only framing layer, regions per ratio in `<cut>-frames.json` |
| `ClipEditor.tsx`, `captions.ts`, `sections.ts` | dev tooling and the two data readers |
| `currentCut.ts` | `CURRENT_CUT`, the one place the shipping cut is named |

## Dev middlewares, `vite.config.js`

`/__notes/<cut>` (GET/POST; refuses to empty a file without `clear: true`), `/__clip/<cut>/<id>` (GET the clip and its neighbours; POST writes the placement, joins on the plan, retimes from the extras only, copies, and re-cuts the pip in the background; `/status`), `/__frames/<cut>`. All of them write into `../redlamp-videos/videos/color-taylor-demo-test/cues` and copy into `public/scripts`. None of them exist in a build; the app-side spec for `?present=` probes `/__notes/<cut>` for JSON to know which server it is on.

## Decisions, as the presentation side states them

Each is a sentence or three in their wiki; recorded here so the app side does not relitigate them. The canonical notes are in `redlamp-videos/wiki/notes/`, named in brackets; their maps are `mocs/color-taylor-walkthrough` and `mocs/pipeline`.

- The demo is a subset of the presentation, overridden only at named moments (the demo's end restore, the exit walk). `decision-demo-is-a-subset-of-the-presentation`
- Cues are data, not code: keyed by line id with offsets, retimed to the audio.
- The plan clock lets choreography be reviewed before the audio exists. `decision-plan-the-pacing-before-recording`
- One cut ships (`CURRENT_CUT`); older cuts' assets stay out of the build. `decision-one-cut-per-recording-last-take-wins`
- Host-created media elements with the synchronous `play()` in the click; the runner adopts them and never rewrites the voice `src`.
- The About panel is the shipped entry and stays open through beat 1. `decision-about-panel-shipped-entry-point`
- Frames are capture-only, never in the shipped presentation. `decision-frames-are-capture-only`
- Every value change on screen is cursor-driven, and there is one cursor.
- The speed cap above. `decision-speed-cap-divides-by-frame-scale`
- Taylor verifies in the browser; agents run tsc, eslint and seek checks only. `decision-taylor-verifies-in-the-browser`
- Also theirs, about the pipeline rather than the app: `decision-snap-boundaries-per-pair`, `decision-clip-editor-apply-rejoins-on-the-plan`, `decision-resolve-round-trip-in-reserve`, and the repo split itself, `decision-split-ownership-between-repos`.

## Media hosting

Their plan is `plan-hosting-media-on-pages`; `plan-captions` and `plan-share-the-walkthrough` are stubs as of 2026-09-15. Pages deploys `main` through `ci.yml` to `gh-pages` with base `/color-taylor/`. The plan, pending Taylor's approval of the cut: un-ignore exactly `public/scripts/cut-04.m4a` and `public/scripts/pip/cut-04/full.mp4` (about 11 MB together), commit them, PR to `dev`. Pages serves byte ranges so seeking works, and its ten-minute cache is fine. Not LFS (Pages would serve pointers), not release assets. The spellings `walkthroughVoiceUrl` and `walkthroughCameraUrl` in `ColorPicker.tsx` must match those paths to the character. Older cuts' media never enters the repo.
