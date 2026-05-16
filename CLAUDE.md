# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — production build (writes `dist/`)
- `npm run lint` — ESLint flat config (`eslint.config.js`)
- `npm run preview` — serve last build
- `npm run deploy` — GitHub Pages build + publish via `gh-pages`. The script uses POSIX env-var syntax (`GITHUB_PAGES=1 vite build`), which **does not work in plain PowerShell**. Run it from Git Bash / WSL, or invoke manually: `$env:GITHUB_PAGES=1; npx vite build; npx gh-pages -d dist`.

The `GITHUB_PAGES` env var is what flips `vite.config.js`'s `base` between `./` (default, works for local file:// preview) and `/color-taylor/` (gh-pages subpath). Don't hardcode either.

No test runner is configured.

## Stack

JavaScript (not TypeScript) + React 19 + Vite 8 + Tailwind v4 (`@tailwindcss/vite`) + shadcn (style `base-nova`, neutral base, CSS variables). Path alias `@/*` → `src/*` is wired in both `vite.config.js` and `jsconfig.json` — keep them in sync if you change it. shadcn aliases live in `components.json`.

ESLint `no-unused-vars` ignores identifiers starting with `^[A-Z_]` — i.e. unused React components / constants don't fail lint.

## App architecture

Single-page app with two top-level views routed by URL hash via `src/hooks/useHashRoute.js`:

- `#/` (default) → `<ColorPicker />` — the main interactive color tool
- `#/presentation` / `#/presentation/N` → lazy-loaded `<PresentationShell />` — narrated slideshow about color history that ends by returning to the picker

`src/App.jsx` mounts a fixed background `<div>` underneath everything so the page color can tween between the picker's `--background` and the presentation's `#2E424D`. The presentation forces dark theme on entry and calls `restore()` on the last slide to fade back to the user's theme — that handoff is the only reason `ThemeProvider` exposes `setDark`/`restore` (see `src/hooks/useTheme.jsx`).

### Color picker (the bulk of the app)

`src/components/ColorPicker.jsx` is the source of truth. Two non-obvious patterns to preserve:

1. **HSB is canonical, RGB has an override ref.** Color state is `{h,s,b}` in `useState`, but `hsbToRgb(rgbToHsb(rgb))` is lossy at low saturation/brightness — a user typing `R=137` and then dragging would lose the value. When an RGB slider or hex input fires, we stash the exact RGB in `rgbOverride.current` (a `useRef`) and derive HSB from it; the displayed `rgb` reads from `rgbOverride.current || hsbToRgb(hsb)`. Any HSB-driven interaction (hue wheel, SB box, named-color tween) must set `rgbOverride.current = null` first or stale RGB leaks through.
2. **Tweens use manual rAF, not a library.** `animateToHsb` and the play-button color cycle each spin their own `requestAnimationFrame` loop with a quadratic ease and shortest-path hue math (`dh > 180 ? -= 360`). The cycle's `colorAnimActiveRef.current = 'stop'` sentinel lets sync handlers cancel the loop without a state round-trip — every user interaction handler must check + flip it.

Undo/redo lives in `undoStack`/`redoStack` refs in `ColorPicker.jsx` (debounced 500ms push on HSB change, capped at 50). It tweens to the popped value rather than snapping, and uses an `isUndoRedoing` ref to suppress re-pushes during the tween.

`localStorage` keys: `color-taylor-hsb` (current color), `color-taylor-recent` (recent-color palette in `ColorHexagon`), `color-taylor-theme` (dark/light).

### Color math

`src/utils/colorConversions.js` is the math hub: sRGB gamma (`srgbToLinear` / `linearToSrgb`), `hsbToRgb`/`rgbToHsb`, `rgbToHsl`/`hslToRgb`, plus relative-luminance / contrast helpers. `src/utils/sliderGradients.js` builds the CSS gradients painted under each slider (channel-mode and mixed-mode variants for RGB; per-axis gradients for HSB and HSL that respect a `colorSpace` arg for linear-vs-sRGB ramps). `src/utils/namedColors.js` is the CSS named-color table used by `NamedColorMatch`. `src/utils/palettes.js` is shared 1-bit/4-bit/8-bit palette data used by both the picker and the historical-OS presentation slides.

### Hexagon picker

`src/components/ColorHexagon.jsx` + `src/components/hex/*` render a custom hex-shaped color wheel with a vertical brightness/lightness bar. Geometry constants and `colorAtPoint` (hex pixel → HSB) live in `hex/hexConstants.js` — touch them carefully, the SVG handle positions depend on these exact numbers.

### Presentation

`src/presentation/slides.js` is a declarative slide array: each slide names a component from `slideComponents.jsx` (`MonitorPanel`, `PixelGrid`, `ColorPalette`, `NarrativeSlide`) **or** uses the special `'PresentationColorPicker'` value that `PresentationStage.jsx` maps to a constrained version of the picker (props like `visiblePanels`, `lockedChannels`, `initialHsb`). Color state persists across slides inside `PresentationStage`. Slide index ↔ URL hash sync happens in `PresentationShell.jsx`; arrow keys / space advance, Escape exits to `#/`.

## Conventions

- Components are `.jsx`. No TypeScript anywhere.
- Tailwind v4 — no `tailwind.config.js`; theme tokens live in `src/index.css` as CSS variables under `:root` and `.dark`. Prefer the existing `bg-muted` / `text-foreground` / etc. semantic tokens over raw colors.
- shadcn primitives are in `src/components/ui/` — don't reimplement, extend.
- Recent commits favor Tailwind theme tokens over `!important` overrides and shared utilities over duplicated math; match that direction.
