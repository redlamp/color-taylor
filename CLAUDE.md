# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Where things live

- `wiki/` — Obsidian vault. Project state, decisions (`notes/decision-*.md`), daily logs, MOCs, test plans. See `wiki/CLAUDE.md` for conventions and `wiki/index.md` for the top-level map.
- `wiki/mocs/architecture.md` — how the three surfaces (app, presentation, Figma plugin) share one picker.
- `wiki/mocs/figma-plugin.md` — the plugin's status, decisions and platform constraints.
- `docs/` — formal specs and prototypes.
- Backlog is tracked as GitHub Issues, not in-repo.

If a request conflicts with a `decision-*.md` note, surface the conflict before coding.

## Commands

Package manager: **bun**. `bun.lock` is the source of truth; no `package-lock.json`. Scripts are in `package.json`; only the two with non-obvious behaviour are worth stating:

- `bun run deploy` — GitHub Pages build + publish via `gh-pages`. The script uses POSIX inline env var syntax (`GITHUB_PAGES=1 vite build`); bun's built-in shell handles this on Windows, so no PowerShell `$env:` workaround is needed when invoked via `bun run`.
- `bun run test` — Playwright e2e against a Vite dev server it starts itself, **reusing an existing one on :5173** if you already have `bun dev` running. Specs live in `tests/`.

The `GITHUB_PAGES` env var flips `vite.config.js`'s `base` between `./` (default, works for local file:// preview) and `/color-taylor/` (gh-pages subpath). Don't hardcode either.

## Stack

Versions are in `package.json`. What it doesn't tell you: the path alias `@/*` → `src/*` is declared **twice**, in `vite.config.js` and `tsconfig.json` — keep them in sync if you change it. shadcn aliases live in `components.json` (style `base-nova`).

`tsconfig.json` runs with `strict: true`, matching `figma/tsconfig.json`. The individual flags it implies are still listed explicitly so that turning `strict` off would not silently take six other checks with it. The one pattern worth knowing: `useRef(null)` with no generic infers `null` and then narrows to `never`, which costs you *all* checking on `.current` — always give refs a generic (`useRef<PointerDownState | null>(null)`).

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

`localStorage` keys, all nine of them:

| Key | Holds | Owner |
|---|---|---|
| `color-taylor-hsb` | current color | `ColorPicker` |
| `color-taylor-recent` | recent-color palette | `ColorHexagon` |
| `color-taylor-saved` | saved swatch slots, `{hex, alpha, addedAt}` | `ColorHexagon` |
| `color-taylor-alpha` | **legacy.** A `hex -> alpha` map, read once for migration and never written. Don't delete it because nothing writes it | `ColorHexagon` |
| `color-taylor-settings` | settings object, including `audioEnabled` and the synth | `useSettings` |
| `color-taylor-theme` | dark/light | `useTheme` |
| `color-taylor-muted` | mute toggle, `'1'`/`'0'` | `ColorPicker` |
| `color-taylor-effects` | color-reactive chrome, `'1'`/`'0'`, read as "not explicitly off" | `ColorPicker` |
| `color-taylor-plugin-banner` | banner dismissal | `PluginBanner` |

Reset-all doesn't clear these centrally. `SettingsPanel` broadcasts a `color-taylor:reset-all` window event and each owner clears its own keys, so **a new key needs its owner to listen for that event** or it will survive a reset.

### Color math

`src/utils/colorConversions.ts` is the math hub — put conversions and luminance/contrast helpers there rather than inline. Two couplings the files don't advertise: `sliderGradients.ts` takes a `ColorSpace = 'srgb' | 'linear'` argument that every caller must thread through, and `palettes.ts` is shared by both the picker and the presentation's historical-OS slides, so editing it changes two surfaces.

### Hexagon picker

`src/components/ColorHexagon.tsx` + `src/components/hex/*` render a custom hex-shaped color wheel with a vertical brightness/lightness bar. Geometry constants and `colorAtPoint` (hex pixel → HSB) live in `hex/hexConstants.ts` — touch them carefully, the SVG handle positions depend on these exact numbers.

### Presentation

See `src/presentation/CLAUDE.md`, which loads when you work in that directory.

## Conventions

- Components are `.tsx`; pure utilities `.ts`. Typing conventions under `## Stack`.
- Tailwind v4 — no `tailwind.config.js`; theme tokens live in `src/index.css` as CSS variables under `:root` and `.dark`. Prefer the existing `bg-muted` / `text-foreground` / etc. semantic tokens over raw colors.
- shadcn primitives are in `src/components/ui/` — don't reimplement, extend. Each wrapper currently types its props via `ComponentProps<typeof Primitive>` (sometimes intersected with `VariantProps<typeof xxxVariants>` for cva-driven components).
- `asChild` is no longer part of base-ui's API (it uses `render` now), but several callers still pass it. `TabsTrigger` and `TooltipTrigger` accept it as a pass-through `{ asChild?: boolean }` for TS-checked code; base-ui ignores it at runtime. If you touch one of those callsites, prefer migrating to `render`.
- Recent commits favor Tailwind theme tokens over `!important` overrides and shared utilities over duplicated math; match that direction.
