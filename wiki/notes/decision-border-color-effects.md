---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: Anodised Is The Style, Keyline Is A Toggle

**2026-08-11.** The app's resting appearance is Anodised — a restrained physical treatment, real elevation and faint borders. On top of it, an optional effect derives a background glow and a border rim light from the selected color. It is on by default, and it never reaches the Figma plugin.

## How it was chosen

Five specimens were built and shown side by side: Hard Set (neo-brutal), Machined, Instrument, Set in Rules, Sympathetic. Hard Set was ruled out. Machined read as dated once looked at directly. What survived was Sympathetic's idea — *the surface echoing the selected color* — which the user flagged as a feature rather than a specimen, and it became the effect described here.

Set in Rules and Instrument were replaced mid-exploration by Anodised and Keyline, which is where the pairing comes from: Anodised is the base, Keyline is what Anodised does when the color moves.

## What the effect derives, and from what

Two inputs only: **hue angle** and **saturation distance**. Brightness is deliberately not an input — the chrome would flash as you dragged the brightness bar, which is the one gesture where the surround should hold still.

- **Hue** sets the color, blended from the accent toward the selection along the shortest path and scaled by saturation, so a desaturated color leaves the chrome near-neutral instead of grey-shifting it.
- **Saturation** sets the *spread*. At 0 the rim light washes the whole border, as though the light were behind the card. At 100 it narrows to an arc on one edge.
- **Hue also sets position.** Pure green sits at the upper left, magenta at the lower right.

Position was first done with a conic gradient angle, which is wrong: a conic angle is screen-space, so the highlight landed in visibly different places on a square card and a wide one. It is a point on the card's own perimeter now, expressed in percentages — verified across aspect ratios from 0.53 to 20.04.

## Implementation shape

`src/hooks/useColorEffects.ts` writes CSS custom properties to `documentElement` rather than rendering — no React re-render on a drag frame. Quantised (1.5° of hue, 0.015 of saturation) and then coalesced into a `requestAnimationFrame`.

The CSS is gated behind a `.color-fx` class: rim on `.panel-frame::after` as a masked ring, glow on `.panel-frame::before` at `z-index: -1`.

Scope decisions, all from the user:

- **Outer cards only** — hexagon, sliders, equations. Inner cards stay the default colour, because they are where the swatches live and a shifting surround competes with them.
- **Glow drops when a panel is closed.** The equations bar is closed by default and a moving gradient inside a 40px strip looked like a mistake.
- **On by default**, persisted at `color-taylor-effects`.

Settings calls it **Border Color Effects**, with no description — the name says enough.

## Why it stops at the app

Four independent reasons, which is deliberate over-determination for something that would be jarring if it leaked: the plugin renders `ColorHexagon` and not `ColorPicker`, it passes `bare`, it uses `sectionVariant="flush"`, and `useColorEffects` is aliased to an inert stub in `figma/vite.figma.config.ts`. `figma.css` also hides the pseudo-elements outright.

A panel whose surround shifted hue as you dragged would fight Figma's own chrome, and that should not be one missing class away from happening. The alias is the weakest of the four — see [[decision-lite-module-aliases]] for why alias order there is load-bearing.

## What came with it

Fixing the theme to carry this meant fixing the theme generally: a `prefers-color-scheme` block that overrode the user's explicit choice, a `--muted-foreground` that failed AA at 4.34:1, and dark mode having no surface hierarchy at all. Later the card borders were made fainter in both themes and quantified as perceptual lightness — both ΔL 0.050 against their surface, where light and dark had been 1.33× apart. That forced `--border` and `--input` apart, because the steppers were borrowing the card token and lost their input affordance when it got fainter.

Related: [[decision-panel-collapse-animates-by-grid-rows]], [[decision-lite-module-aliases]], [[decision-single-source-picker]]
