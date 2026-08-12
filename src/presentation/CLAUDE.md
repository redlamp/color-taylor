# Presentation

Loaded only when working under `src/presentation/`. Moved out of the root `CLAUDE.md` because presentation work is occasional and this was costing every session that never touched it.

`slides.ts` is a declarative slide array. Each slide either names a component from `slideComponents.tsx` (`MonitorPanel`, `PixelGrid`, `ColorPalette`, `NarrativeSlide`) **or** uses the special `'PresentationColorPicker'` value, which `PresentationStage.tsx` maps to a constrained version of the app's picker — props like `visiblePanels`, `lockedChannels`, `initialHsb`. That string is a sentinel, not a component name; grep for it before assuming a slide renders from `slideComponents.tsx`.

Color state persists across slides inside `PresentationStage`, not per slide.

Slide index ↔ URL hash sync happens in `PresentationShell.tsx`. Arrow keys and space advance; Escape exits to `#/`.

The theme handoff is the part that surprises people: the presentation forces dark theme on entry and calls `restore()` on the last slide to fade back to the user's own theme. That handoff is the **only** reason `ThemeProvider` exposes `setDark`/`restore` (`src/hooks/useTheme.tsx`), and `src/App.tsx`'s fixed background `<div>` is what the colour tweens between — the picker's `--background` and the presentation's `#2E424D`.

`palettes.ts` in `src/utils/` is shared with the picker; the historical-OS slides read the same 1-bit/4-bit/8-bit data. Changing it changes both surfaces.
