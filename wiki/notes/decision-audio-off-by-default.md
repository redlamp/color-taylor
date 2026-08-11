---
tags:
  - domain/audio
  - status/adopted
  - origin/user-call
---

# Decision: Audio Is Off Until Asked For

**2026-08-11.** Every audible thing in the app — the color synth, the music note, the volume control, the UI sounds and the whole Audio settings section — sits behind one setting that defaults to off.

## Why

The user's reason, stated plainly: *"I worry audio in the first release may be too much of a distraction."* A color picker that makes noise the first time you drag a slider is a surprise, and a surprise is a bad first impression even when the feature is good.

Two things were settled when the flag was scoped:

- **Settings toggle only** — no first-run prompt, no URL parameter. One place, discoverable, off.
- **All audio, not just the synth.** UI sounds were briefly going to stay on. They are audio; a user turning audio off means all of it.

Turning it on starts unmuted and enables the synth, so the toggle produces sound rather than arming a second control the user then has to find.

## What it actually gates

`audioEnabled` in `useSettings` gates the UI — the music note and volume control above the top right, and the Audio accordion in Settings. The load gate is separate and lives in `utils/toneControllerLazy.ts`: `start` and `pulse` return early when disabled, and `setConfig`/`setMuted` stash their arguments instead of calling `load()`.

That last part fixed a pre-existing bug. `setConfig` and `setMuted` both called `load()`, so `synthConfig`, `audioContext` and `colorSynth` were fetched on **every page load** whether or not the synth was on. Verified after the change by instrumenting the constructor: zero `AudioContext`s and zero `colorSynth` fetches with audio off.

~3 KB of `synthConfig`/`audioContext` remain in the eager graph. They are inert on import and not worth another seam.

## Relationship to the plugin

This is the app's release decision. The plugin's version of the same problem was solved differently and earlier — see [[decision-audio-as-optional-module]], where the synth is aliased away at build time because a side panel has no business making noise at all. Two mechanisms, because one is a user choice and the other is a build target.

Related: [[decision-audio-as-optional-module]]
