---
tags:
  - domain/figma-plugin
  - origin/platform-limit
  - status/verified
---

# Figma Plugin Platform Constraints

Things about the Figma plugin environment that cost time to discover. Each was hit during the 2026-08-01..03 build.

## The sandbox is a JS VM, not a browser

No DOM, no `fetch`, no `setTimeout`, no `setInterval`, no `requestAnimationFrame`. Anything needing a clock has to live in the UI iframe and talk back over `postMessage`. See [[decision-frame-clocked-follow]].

## The UI iframe has a null origin

- `localStorage` raises `SecurityError` on **access**, not just on write. Use `figma.clientStorage`, which lives on the sandbox side only. See [[decision-clientstorage-swatch-seam]].
- `type="module"` is unreliable, hence `format: 'iife'` and no code splitting in the plugin build.
- Relative `<script src>` does not resolve, so everything folds into one `ui.html` (`figma/inline.mjs`).
- A `position: fixed` element cannot escape its containing block the way it would in a normal page.
- Pointer lock may not be granted - the iframe may not carry `allow="pointer-lock"`. Treat it as a bonus and keep a working fallback.

## Figma injects colors only

`figma.showUI({ themeColors: true })` provides `--figma-color-bg`, `--figma-color-text`, `--figma-color-icon`, `--figma-color-border` and friends. That is **all** of it - no typography, spacing or sizing tokens, and no official UI kit. Matching their type scale means measuring it and restating it yourself (Inter, 11px base).

Note: `figma-plugin-ds` is Thomas Lowry's community library, not Figma's official design system. Useful for their icon paths (the blend droplet came from there); not authoritative.

Theme detection: Figma stamps `figma-dark` on `<html>`. The app's tokens key off `dark`, so a MutationObserver mirrors one onto the other. `useTheme()` without a provider returns `isDark: false`, which silently drew light-theme letters on a dark panel until this was found.

## Change events are batched

*"Will not call the callback synchronously and will instead batch the updates and send them to the callback periodically."* Do not expect an edit to arrive in the frame it happened.

## Window position and size

- `figma.ui.resize` takes both dimensions and there is no way to read them back - track them yourself.
- `figma.ui.getPosition()` returns `{ windowSpace, canvasSpace }`, not a bare `{x, y}`.
- `figma.ui.reposition` is **not documented as sharing a coordinate space with `getPosition`**. Measure the offset at runtime rather than assuming; see [[decision-content-fit-height]].
- `resize()` can shift the window on its own, so re-assert position after every call.

## Undo

Figma groups everything a plugin does into a single undo step. Call `figma.commitUndo()` at the end of each gesture or the whole session collapses into one entry.

## Tailwind v4, in this build

`@theme inline` bakes literal values into the generated utilities, so overriding the variable afterwards does nothing - the utility itself has to be restated, and unlayered CSS beats the utilities layer. Also, Vite's root for the plugin build is `figma/ui`, so Tailwind's source detection would scan only that folder; `figma.css` needs an explicit `@source "../../src"`. Symptom if missing: laid out but unstyled.
