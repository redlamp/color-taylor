---
tags:
  - domain/a11y
  - domain/ui
  - status/verified
  - origin/bug
---

# Decision: Slider Ids Are Scoped By Color Model

**2026-08-03.** `ColorSlider` takes a required `group` prop (`rgb` | `hsb` | `hsl` | `alpha`). Ids are `slider-${group}-${label}`.

## The bug

The id was derived from the visible label alone: `slider-${label.toLowerCase()}`. Labels are single letters, and they are not unique across color models.

| Duplicate id | Owners | Live where |
|---|---|---|
| `slider-b` | RGB **B**lue / HSB **B**rightness | the **app**, always - plus the plugin and the presentation view |
| `slider-h` | HSB Hue / HSL Hue | app in "Both" mode; plugin with HSB+HSL on |
| `slider-s` | HSB Sat / HSL Sat | same |

Found via a Playwright strict-mode violation, which is the only reason it surfaced at all - duplicate ids are invalid HTML but nothing in the toolchain complains.

`slider-b` is the notable one: it was permanent in the app, not a plugin regression, and it predates the Figma work entirely.

## The accessibility half

The same root cause produced `aria-label="B channel"` on two different sliders. A screen reader announced Blue and Brightness identically. Fixed with a `CHANNEL_NAMES` lookup keyed on `group-label`, so the track, the stepper buttons and the numeric input all say "Blue" or "Brightness".

HSB and HSL still both say "Saturation channel" - correct, but ambiguous when both are visible and they hold *different* values. Each model's block therefore carries `role="group"` with an `aria-label` of `RGB` / `HSB` / `HSL` / `Alpha`, so assistive tech announces the model on entry and the individual sliders stay terse.

## Why `group` is required rather than optional

An optional prop would have left `PresentationStage` still colliding on `slider-b`. Required means typecheck enumerates every call site - all 25 - and any future one has to answer the question.

## Verified

Built panel, all four groups on: 75 unique ids, **0 duplicated**, 10 distinct sliders with distinct accessible names.
