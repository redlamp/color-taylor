# Presentation

Loaded only when working under `src/presentation/`. Moved out of the root `CLAUDE.md` because presentation work is occasional and this was costing every session that never touched it.

`slides.ts` is a declarative slide array. `PresentationStage` dispatches on `slide.type` (`'static'` versus anything else), `props.mode` and `props.visiblePanels` — there is no component registry and no per-slide component to name. Every slide used to carry a `component:` string that nothing read, naming files that no longer exist; both the field and the files are gone.

What actually decides how a slide looks is `props`: `mode` selects an `AnimatedGrid` layout for the static history panels, and `visiblePanels` gates the cards on the interactive ones (`rgb-sliders`, `hsb-sliders`, `hsb-circle`, `equations`, `color-taylor-app`). `lockedChannels` and `initialHsb` constrain the picker; note `initialHsb` only applies when arriving from a static slide.

Several `visiblePanels` values and `SlideProps` fields are consumed by nothing at all — the deck accumulated them faster than the stage grew branches for them. Check the value is actually read before copying a slide that sets it.

Color state persists across slides inside `PresentationStage`, not per slide.

Slide index ↔ URL hash sync happens in `PresentationShell.tsx`. Arrow keys and space advance; Escape exits to `#/`.

The theme handoff is the part that surprises people: the presentation forces dark theme on entry and calls `restore()` on the last slide to fade back to the user's own theme. That handoff is the **only** reason `ThemeProvider` exposes `setDark`/`restore` (`src/hooks/useTheme.tsx`), and `src/App.tsx`'s fixed background `<div>` is what the colour tweens between — the picker's `--background` and the presentation's `#2E424D`.

`palettes.ts` in `src/utils/` is shared with the picker; the historical-OS slides read the same 1-bit/4-bit/8-bit data. Changing it changes both surfaces.
