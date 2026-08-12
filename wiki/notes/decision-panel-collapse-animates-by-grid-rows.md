---
tags:
  - domain/ui
  - status/adopted
---

# Decision: Collapsing Panels Animate As Grid Rows

**2026-08-11.** `CollapsibleSection` keeps its children mounted and animates a two-row grid from `0fr` to `1fr`, rather than unmounting them or measuring a height in JS.

## Why not the obvious versions

`{open && children}` unmounted the content, so there was nothing to transition — a section snapped from 170px to 50px in one frame — and anything inside lost its state on the way. Measuring `scrollHeight` and animating `max-height` works but needs a measurement pass on every content change, and the content here changes size as swatch banks grow.

`grid-template-rows: 0fr → 1fr` gets an auto-height transition with no measurement at all.

## The four traps in it

Each of these was a real bug before it was a rule.

1. **Padding inside the animated row never reaches zero.** Padding counts toward a grid item's minimum contribution, so `0fr` resolved to 8px and every collapsed panel carried 8px of dead space under its title. The spacing has to live on a wrapper *inside* the row, where it collapses with everything else.
2. **`overflow: hidden` cannot be permanent.** It is what hides the content mid-animation, but the swatch grids paint a 2px outset selection ring and scale to 1.1x while armed, and those were being cropped. Clipping is now derived — `clipped = !open || settling` — so it applies only while collapsed or in motion. Derived rather than stored on purpose: setting it from an effect trips `react-hooks/set-state-in-effect`. A timer clears `settling`, not `transitionend`, because reduced motion removes the transition and the event would never fire.
3. **Nested state has to outlive the unmount.** Even with children mounted, a closed parent unmounts its subtree — so collapsing Sliders with RGB closed and reopening it brought RGB back at `defaultOpen`. A module-scope `Map` keyed by section id holds it. Module scope, not `localStorage`: this is for the length of a session, and persisting it is a different decision.
4. **The header must not move.** `min-h-8` is border-box, so `pt-3` left a 20px content box and the title drifted 6px on collapse. `box-content h-8` pins the content box at 32px.

## `inert`, not `hidden`

`hidden` is `display: none`, which kills the transition the mounted children exist for. `inert` leaves the box in the layout so it can animate, while taking the content out of the tab order and the accessibility tree.

## The two-prop split

`fill` passes height down; `absorbs` claims the slack. They started as one prop and had to be separated: the Sliders panel's own section needs `flex-1` to plumb height to its children, but if it also claimed to absorb, the panel stretched to the row height with the Color Editor closed — a mostly-empty card with the SB box pinned at its floor and 26px of slack below it.

## Consequence

The animator is a wrapper `div` carrying the class `grid`, which is what broke the plugin's swatch layout — see [[decision-plugin-css-hooks]].

Related: [[decision-plugin-css-hooks]], [[decision-border-color-effects]]
