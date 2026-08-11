---
tags:
  - domain/audio
  - domain/figma-plugin
  - status/adopted
  - origin/user-call
---

# Decision: Audio Is A Module, Not A Feature

**2026-08-03.** Interface sounds live in `src/hooks/useUiSounds.ts`, loadable and disableable independently of the picker. The plugin aliases the hook away entirely.

## Why this is a decision and not an optimization

During the bundle work I proposed cutting the UI sounds because they cost bytes. The user pushed back, and the correction is the useful part:

> *"I disagree with the audio. That should be outside of the core functionality, a module that can be loaded on top and enabled/disabled, regardless of the size gain."*

The point is architectural, not budgetary. Audio being cheap to remove because it is *properly separated* is a different property from audio being removed because it was expensive. The first survives someone wanting sound back.

## Shape

- `useUiSounds` holds the four interface sounds, extracted verbatim out of `ColorHexagon`, with a `muted` runtime switch.
- The plugin aliases it to `figma/ui/lite/ui-sounds.ts` - same exports, no oscillators.
- `toneControllerLazy` (the color-driven hold tone, a separate thing) aliases to `figma/ui/silent-tone.ts`.

A Figma side panel chiming when you save a swatch would be out of place regardless of size, so the plugin takes the silent path - but by configuration, not by amputation.

Related: [[decision-lite-module-aliases]]
