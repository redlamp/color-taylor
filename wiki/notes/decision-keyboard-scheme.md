---
tags:
  - domain/ui
  - domain/a11y
  - status/adopted
  - origin/user-call
---

# Decision: Letters Turn The Wheel, Arrows Move The Bars

**2026-09-01.** The hexagon becomes a first-class keyboard control and the
picker gets a card-based navigation model. Taylor's call, from a gaming
background: WASD on the hexagon, Tab between cards. Filed as #84; #72's `?`
overlay is where the map is shown.

## The rule

> **Arrows move the bars. Letters turn the wheel.**

Arrows adjust along the slider they point along, on every card. The RGB card's
sliders are horizontal, so ←→ adjust them and ↑↓ move between them. The hexagon
has a vertical brightness bar to its right and a horizontal saturation bar
below it, so there ↑↓ adjust one and ←→ the other. Same rule, two orientations
— not a special case, which is what makes it teachable in one line.

## The map

| Hexagon focused | | |
|---|---|---|
| `Q` / `E` | hue ↺ / ↻, wrapping | 1°, Shift 10° |
| `R` / `F` | hue by one sector, corner to corner | 60° |
| `W` / `S`, `↑` / `↓` | brightness or lightness, following `blMode` | 1, Shift 10 |
| `A` / `D`, `←` / `→` | saturation | 1, Shift 10 |

| Anywhere | |
|---|---|
| `Tab` / `Shift+Tab` | next / previous card: Hexagon → Recent → Saved → RGB → HSB/HSL |
| `↑` / `↓` | next / previous slider in the card |
| `←` / `→` | adjust it |
| `Esc` | leave the card |
| `?` | the map (#72) |

Recent and Saved are grids: arrows walk swatches, Enter selects, Delete removes.
`Ctrl/Cmd+Z` / `+Y` stay global.

## What was decided against

- **Polar arrows on the hexagon** (←→ hue, ↑↓ saturation) — the first
  proposal. Rejected in favour of arrows duplicating WASD, because the bars are
  physically there and the arrows should point along the thing they move.
  Hue loses its arrow; it keeps its slider on the HSB card, so nothing becomes
  unreachable.
- **Focusable RGB handles.** WASD covers H/S/B and the RGB card covers the
  channels; joints with focus would be a fourth route to the same values.
- **Letter shortcuts that jump to a colour** (`R` → red). Undiscoverable, and
  they would fight the hex input the moment it had focus.
- **Disabling other hotkeys while the hexagon has focus.** There are none to
  disable: the only globals are `Ctrl/Cmd+Z/Y`, modifier-gated. What scopes the
  letters is *where the listener goes*, not what it suppresses.

## The one thing that makes it safe

Every one of `E A D F` is a hex digit. Global letters would fire while someone
typed `#ADDFEE`. So the letters live on the hexagon element's **own**
`onKeyDown`, never on `window` — focus scopes them by construction, and the hex
input cannot be hit because it does not have focus while the hexagon does. The
game-canvas rule, implemented by the DOM. Two guards inside: ignore any modifier
except Shift, and `preventDefault` only on handled keys.

## Markup

`role="slider"` is one-dimensional and wrong for the field. The pattern that
works with assistive tech is React Aria's ColorArea: a focusable `role="group"`
with `aria-roledescription="color field"`, two visually-hidden range inputs
carrying `aria-valuenow`/`aria-valuetext`, and one `onKeyDown` on the group.
One focus stop for the user, two sliders for the screen reader. Cards declare
`aria-orientation="vertical"` and sliders stay `horizontal` — that is the APG
carve-out that makes ↑↓-navigate / ←→-adjust legitimate.

## Plumbing

Same as every pointer handler or it leaks: flip `colorAnimActiveRef` to
`'stop'`, clear `rgbOverride`, write HSL through `writeHslChannel` with the
gesture origin ([[decision-hsl-gesture-origin]]), and pulse the same highlight
the pointer gets so a key press shows what it moved.

## Related

- [[decision-hsl-gesture-origin]] — why a held `A` at an L extreme needs the origin
- [[decision-scoped-slider-ids]] — the accessible names the tests read
- [[hexagon-is-the-cube-down-its-diagonal]] — why 60° is a meaningful unit here
- [[decisions]]
