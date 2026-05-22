# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **bun**. `bun.lock` is the source of truth; no `package-lock.json`.

- `bun install` — install deps
- `bun dev` — Vite dev server
- `bun run build` — production build (writes `dist/`)
- `bun run lint` — ESLint flat config (`eslint.config.js`)
- `bun run typecheck` — `tsc --noEmit`
- `bun run preview` — serve last build
- `bun run deploy` — GitHub Pages build + publish via `gh-pages`. The script uses POSIX inline env var syntax (`GITHUB_PAGES=1 vite build`); bun's built-in shell handles this on Windows, so no PowerShell `$env:` workaround is needed when invoked via `bun run`.
- `bun run test` — Playwright e2e against a Vite dev server (auto-started; reuses an existing one on :5173). Use `bun run test:ui` for the inspector and `bun run test:headed` to watch the browser. Specs live in `tests/`.

The `GITHUB_PAGES` env var flips `vite.config.js`'s `base` between `./` (default, works for local file:// preview) and `/color-taylor/` (gh-pages subpath). Don't hardcode either.

## Stack

TypeScript + React 19 + Vite 8 + Tailwind v4 (`@tailwindcss/vite`) + shadcn (style `base-nova`, neutral base, CSS variables). Path alias `@/*` → `src/*` is wired in `vite.config.js` and `tsconfig.json` — keep them in sync if you change it. shadcn aliases live in `components.json`.

`tsconfig.json` runs with `strict: false` for now — implicit `any` is allowed for internal helpers, but component prop boundaries, ref types, and useState generics are typed explicitly. Tightening to full strict is the obvious next step (mostly typing inline event handlers in `ColorHexagon.tsx`).

ESLint flat config has two blocks: `*.{js,jsx}` (unused, but kept for vite.config.js) and `*.{ts,tsx}` with `typescript-eslint`. The unused-var rule ignores `^[A-Z_]` (unused React components / constants), plus `_`-prefixed args for TS.

## App architecture

Single-page app with two top-level views routed by URL hash via `src/hooks/useHashRoute.ts`:

- `#/` (default) → `<ColorPicker />` — the main interactive color tool
- `#/presentation` / `#/presentation/N` → lazy-loaded `<PresentationShell />` — narrated slideshow about color history that ends by returning to the picker

`src/App.tsx` mounts a fixed background `<div>` underneath everything so the page color can tween between the picker's `--background` and the presentation's `#2E424D`. The presentation forces dark theme on entry and calls `restore()` on the last slide to fade back to the user's theme — that handoff is the only reason `ThemeProvider` exposes `setDark`/`restore` (see `src/hooks/useTheme.tsx`).

### Color picker (the bulk of the app)

`src/components/ColorPicker.tsx` is the source of truth. Two non-obvious patterns to preserve:

1. **HSB is canonical, RGB has an override ref.** Color state is `HSB` in `useState`, but `hsbToRgb(rgbToHsb(rgb))` is lossy at low saturation/brightness — a user typing `R=137` and then dragging would lose the value. When an RGB slider or hex input fires, we stash the exact RGB in `rgbOverride.current` (`MutableRefObject<RGB | null>`) and derive HSB from it; the displayed `rgb` reads from `rgbOverride.current || hsbToRgb(hsb)`. Any HSB-driven interaction (hue wheel, SB box, named-color tween) must set `rgbOverride.current = null` first or stale RGB leaks through.
2. **Tweens use manual rAF, not a library.** `animateToHsb` and the play-button color cycle each spin their own `requestAnimationFrame` loop with a quadratic ease and shortest-path hue math (`dh > 180 ? -= 360`). The cycle's `colorAnimActiveRef` is typed `MutableRefObject<boolean | 'stop'>`; setting `.current = 'stop'` from sync handlers cancels the loop without a state round-trip. Every user interaction handler must check + flip it.

Undo/redo lives in `undoStack`/`redoStack` refs in `ColorPicker.tsx` (debounced 500ms push on HSB change, capped at 50). It tweens to the popped value rather than snapping, and uses an `isUndoRedoing` ref to suppress re-pushes during the tween.

`localStorage` keys: `color-taylor-hsb` (current color), `color-taylor-recent` (recent-color palette in `ColorHexagon`), `color-taylor-theme` (dark/light).

### Color math

`src/utils/colorConversions.ts` is the math hub: exports `RGB`/`HSB`/`HSL` interfaces, sRGB gamma (`srgbToLinear` / `linearToSrgb`), `hsbToRgb`/`rgbToHsb`, `rgbToHsl`/`hslToRgb`, plus relative-luminance / contrast helpers. `src/utils/sliderGradients.ts` builds the CSS gradients painted under each slider (channel-mode and mixed-mode variants for RGB; per-axis gradients for HSB and HSL that respect a `ColorSpace = 'srgb' | 'linear'` arg). `src/utils/namedColors.ts` is the CSS named-color table used by `NamedColorMatch`. `src/utils/palettes.ts` is shared 1-bit/4-bit/8-bit palette data used by both the picker and the historical-OS presentation slides.

### Hexagon picker

`src/components/ColorHexagon.tsx` + `src/components/hex/*` render a custom hex-shaped color wheel with a vertical brightness/lightness bar. Geometry constants and `colorAtPoint` (hex pixel → HSB) live in `hex/hexConstants.ts` — touch them carefully, the SVG handle positions depend on these exact numbers.

### Presentation

`src/presentation/slides.ts` is a declarative slide array: each slide names a component from `slideComponents.tsx` (`MonitorPanel`, `PixelGrid`, `ColorPalette`, `NarrativeSlide`) **or** uses the special `'PresentationColorPicker'` value that `PresentationStage.tsx` maps to a constrained version of the picker (props like `visiblePanels`, `lockedChannels`, `initialHsb`). Color state persists across slides inside `PresentationStage`. Slide index ↔ URL hash sync happens in `PresentationShell.tsx`; arrow keys / space advance, Escape exits to `#/`.

## Conventions

- Components are `.tsx`; pure utilities `.ts`. `tsconfig.json` uses `strict: false` — implicit `any` is allowed for internal helpers, but prop boundaries, ref types, and `useState` generics are explicit.
- Tailwind v4 — no `tailwind.config.js`; theme tokens live in `src/index.css` as CSS variables under `:root` and `.dark`. Prefer the existing `bg-muted` / `text-foreground` / etc. semantic tokens over raw colors.
- shadcn primitives are in `src/components/ui/` — don't reimplement, extend. Each wrapper currently types its props via `ComponentProps<typeof Primitive>` (sometimes intersected with `VariantProps<typeof xxxVariants>` for cva-driven components).
- `asChild` is no longer part of base-ui's API (it uses `render` now), but several callers still pass it. `TabsTrigger` and `TooltipTrigger` accept it as a pass-through `{ asChild?: boolean }` for TS-checked code; base-ui ignores it at runtime. If you touch one of those callsites, prefer migrating to `render`.
- Recent commits favor Tailwind theme tokens over `!important` overrides and shared utilities over duplicated math; match that direction.
