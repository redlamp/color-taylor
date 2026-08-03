---
tags:
  - domain/figma-plugin
  - status/adopted
  - origin/user-call
---

# Decision: One Picker, No Port

**2026-08-01.** The Figma plugin renders the app's real `ColorHexagon`. There is no second copy.

## Why

The user's requirement, stated before any code: *"when I make changes to the app they need to be immediately applicable to the figma plugin."*

A hand-ported picker would have been faster to stand up and would have started drifting the same week. Geometry, the brightness bar, the limit hexagon, the vertex letters, the Bright/Light tabs - all of it would need porting twice, forever.

## How it works

`figma/ui/main.tsx` imports `src/components/ColorHexagon.tsx` directly. Where the panel needs something different from the app, the difference is expressed as a **Vite alias in the plugin build only** - a like-for-like module with the same exports. `src/` never learns that Figma exists, and the app is entirely unaffected. See [[decision-lite-module-aliases]].

`main.tsx` is deliberately thin. It owns exactly three things:

1. **Color state** in the shape `ColorHexagon` expects as a controlled component, mirroring ColorPicker's "HSB is canonical, RGB has an override ref" pattern. Getting this wrong makes low-saturation values drift as you drag.
2. **`onAnimateToHsb`** - a small rAF tween with quadratic ease and shortest-path hue. Not decoration: `animateBLToValue` and `handleColorLabelClick` both early-return without it, so the bar markers and vertex letters are dead controls if it is missing.
3. **The bridge** to `code.js`.

## The consequence to keep in mind

Any change to `ColorHexagon` ships to both surfaces. A prop added for the app appears in the plugin whether or not it makes sense there. In practice this has been a feature - it forces the component to stay general - but it means a plugin-only need should become an alias or a prop, never a fork.

Related: [[decision-lite-module-aliases]], [[decision-preact-for-the-panel]], [[decision-audio-as-optional-module]]
