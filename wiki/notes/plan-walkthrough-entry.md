---
tags:
  - domain/presentation
  - domain/ui
  - status/draft
  - origin/user-call
---

# Plan: Shipping The Walkthrough In The App

**2026-09-13.** The narrated walkthrough (`src/demo/PresentationMode.tsx`, `ScriptRunner.tsx`, `CameraPip.tsx`, on `prez/cut-03`, draft PR #104) mounts in dev builds only. The spec from the presentation side is `redlamp-videos/HANDOFF-cut-02-presentation.md`, "Shipping the walkthrough in the app". This note is the app side's plan against it, drafted for Taylor to answer before anything is briefed. Not built.

Ownership: `src/components` and `App.tsx` are the app session's; `src/demo`, `public/scripts` naming and the cue files are the presentation session's.

## What exists

`ColorPicker.tsx` already lazy-loads all four demo modules. `presentName()` reads `?present=<cut>` and returns null outside `import.meta.env.DEV`; `PresentationMode` has the same guard inside. `PresentationMode` fetches `<cut>.json`, `-lines.json`, `-plan.json` on mount and owns the `<audio>` (`present-audio`), which is the clock; `CameraPip` fetches `<cut>-pip.json` on mount and the video on first play. So "fetch nothing until the user starts" is already how the modules behave once mounted; the work is in when they mount.

`AboutPanel.tsx` has two buttons, Watch Demo and Get Started, in a two-column grid, and `ColorPicker` starts the demo from the card's centre so the panel flies out of it.

## Proposal

1. **The entry is app state, not a URL.** The About panel's presentation button sets a `presentOpen` state in `ColorPicker`, which mounts `PresentationMode` and `CameraPip` the way `demoOpen` mounts `DemoRunner`. No route, so nothing collides with `#/presentation` (the color-history deck) and `App.tsx` is untouched. The cut name comes from one constant the presentation side owns (proposed `src/demo/currentCut.ts`, exporting `'cut-03'`), since only the current cut ships.
2. **`?present=<cut>` also works in production, but mounts paused.** A link cannot satisfy the play() gesture rule, so it opens the app with presentation mode up and the transport showing, and the transport's play button is the gesture. `presentName()` drops its DEV guard; `PresentationMode` drops its own (their file). `?script=`, the notes endpoint and the clip editor stay DEV-only.
3. **The gate is on the About panel.** `matchMedia('(min-width: 900px)')`, subscribed so it re-checks on resize; below it the presentation button is not rendered. The built-in demo has no gate. A presentation already running is not stopped by a resize.
4. **The gesture.** The About button's click handler creates the voice `Audio` and the webcam `<video>` and calls `play()` on both synchronously, before any `await` or lazy import resolves, then hands the pre-activated elements to `PresentationMode` and `CameraPip` as props. That is a `src/demo` API change and needs the presentation side to accept elements from the host instead of creating its own.
5. **The `?` button opens the About panel.** Taylor, 2026-09-13: the header's `?` (`#demo-button`) opens the About panel rather than starting the demo, so the panel is the one door to Demo, Presentation and Get started. The "About the app" entry in Settings stays as it is.
6. **Three buttons.** Demo (the built-in tour, about 40 s, silent), Presentation (about 4 min, voice and webcam, desktop only), Get started. Labels are Taylor's to write. On a phone only two render, in the existing stacked grid.
7. **Bumpers.** `?bumpers=youtube` is read by the presentation side; the About button never sets it. Name agreed as given.

## Taylor's answers (2026-09-13)

1. **Labels and order: Demo, Presentation, Get started.** Under Demo and Presentation a small caption with the running time, "40 seconds" and "four minutes", to be dialed in as the cut settles.
2. **`?present=<cut>` works in production**, paused with the transport up. Not something he expects to send around, but it stays.
3. **The transport is a tool worth showing.** Under the URL parameter the full transport shows (timeline, scrub, time, keys); the About panel's Presentation button gets the reduced one. The dev-only tools (notes, clip editor) stay dev-only either way. This needs the presentation side to separate "full transport" from "dev tools" in `PresentationMode`'s `mode`.
4. **It ends on the About panel**, so the visitor can choose the presentation again, the demo, Get started, or click outside to dismiss.

## Agreed with the presentation side (2026-09-13)

Their `src/demo` API, landed on `prez/cut-03` at `64b2c40` (details in `docs/demo-script.md` under Presentation mode). The constant is `CURRENT_CUT` in `src/demo/currentCut.ts`; an adopted element's `src` is left alone if it already points at the cut's file, so a host that called `play()` in its click handler keeps playing. The same commit adds `server.watch.ignored: ['**/public/scripts/**']` to `vite.config.js`, because replacing cut files crashed the dev server. Because `src/demo` exists only on `prez/cut-03`, the About panel work has to branch from that branch (or from `dev` after #104 merges), not from `dev` as it is.

1. `PresentationMode` takes `voice?: HTMLAudioElement` and `CameraPip` takes `webcam?: HTMLVideoElement`. When given, the component adopts the host's element, playing or not, instead of creating its own; clock, drift nudge and seek are unchanged. This is what lets the About button call `play()` synchronously in its click handler.
2. `src/demo/currentCut.ts` exports the shipping cut id (`'cut-03'`), and is the one place it is named.
3. `PresentationMode` takes `mode: 'dev' | 'production'`. Production is a reduced transport: play/pause, scrub, time; no notes, no clear, no collapse key. They drop the `import.meta.env.DEV` guard inside `PresentationMode` at the same time; the guard in `ColorPicker.presentName()` is ours to drop.
4. `?present=<cut>` ships in production, mounted paused.
5. **`transport?: 'full' | 'reduced'`** on `PresentationMode`, independent of `mode` (agreed 2026-09-13 evening, building on `prez/cut-03`). `mode` gates only the dev tools (notes, clear, N/C keys, clip editor, every `/__` fetch); `transport` gates the timeline, scrub, time readout and the Space/arrow keys. Defaults: dev → full, production → reduced. The URL entry mounts `mode="production" transport="full"`; the About button mounts `mode="production" transport="reduced"`.
6. **The end state is the runner's.** The cut's last cue already opens the About panel and underlines Taylor Wright, so the host's button only has to leave the panel where the runner left it. `?script=`, the notes endpoint and the clip editor stay dev-only.

Stable ids in `SwatchLibrary.tsx` for the runner, on `prez/cut-03` at `2875bce`: `#recent-clear`, `#recent-grid`, `#saved-grid` (and the existing `#swatches-group-trigger`, `#recent-colors-trigger`). [[plan-narrow-widths]] stages 5 and 6 touch that file; cherry-pick `2875bce` onto their branch first so the two do not conflict.
