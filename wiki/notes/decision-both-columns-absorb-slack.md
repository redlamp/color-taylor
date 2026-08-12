---
tags:
  - domain/ui
  - status/adopted
  - origin/bug
---

# Decision: Both Columns Stretch, Each With A Permanent Absorber

**2026-08-12.** Being open is the only condition for a panel to stretch to the row height. Each column owns something that soaks up the slack: `#sb-wrapper` on the right, `#hex-stage` on the left. The `absorbs` prop, the `data-section-grow` attribute and the CSS rule that read it are all deleted.

## What it replaces

`index.css` used to carry a second rule beside the collapsed-panel one:

```css
.panel-frame:not(:has([data-section-grow])) { align-self: start; }
```

Stretching is only worth it if something inside will use the space, so a panel with no open absorbing section sat at its natural height instead of becoming a mostly-empty card. `CollapsibleSection` reported `data-section-grow` when given `absorbs`, and exactly one caller ever passed it: the Color Editor section. The whole mechanism existed because that absorber could be closed. Make it permanent — [[decision-color-editor-is-the-panel]] — and the case it guarded against cannot arise.

## Why the old arrangement was sharper than it looked

The rule's own comment said the hexagon needed no absorber because it is the taller column and therefore *sets* the height the other matches. That was true, and load-bearing, and it broke on a 10px edit.

Removing one caption from the hexagon's header — see [[decision-brightness-axis-not-luminance]] — took the column from 773px to 756px. The sliders column was now the taller one, and a start-aligned hexagon cannot be matched *downward*: it just sat short with the row open beneath it. 17px at a 1500px window, and because the hexagon's height follows its width while the slider rows do not, **128px at 900px**.

The first fix was to let the hexagon stretch, which levelled the bottoms and moved the emptiness inside the card. That is the "mostly-empty card" the deleted rule was written to prevent — the same 128px, now below Saved.

The real fix is that the space has to go somewhere useful. Level bottoms are geometry: if one column is shorter, something in it must absorb. So both columns got an absorber and the conditional went away.

## `grow`, not `flex-1`, on the stage

`flex-1` sets `flex-basis: 0`, and `#hex-stage` has no in-flow children — its only child is absolutely positioned, so its height comes entirely from `aspect-ratio`, which a definite basis overrides. It collapsed to nothing and the wheel overflowed it. `grow` keeps `flex-basis: auto`, so the aspect-derived height stays the floor and growth is on top.

The wheel does not grow with the stage. Its wrapper is already `absolute top-1/2 -translate-y-1/2`, so it keeps its width-derived size and centres in whatever height the stage ends up with. That is the point: the slack reads as margin around a centred graphic rather than as a gap between two cards. A `mt-auto` on Recent was the obvious alternative and was rejected for exactly this — same alignment, but a visible 128px hole at 900px.

## The one trap in the chain

The `flex-1` that passes the card's height down to the stage must be conditional on the panel being open. The hexagon's collapse is hand-rolled — its own `hexOpen`, animating `grid-template-rows` between `1fr` and `0fr`, see [[decision-panel-collapse-animates-by-grid-rows]] — and an unconditional `flex-1` on that wrapper holds the row open, so the panel never shuts. `CollapsibleSection` solves the same problem with `fill && open`; this mirrors it.

## Measured

| | before | after |
|---|---|---|
| Gap under Saved, ≥1200px | 18px | 0 (13px = the card's own `p-3`) |
| Gap under Saved, 900px | 128px | 0 |
| Columns level | 1500px only | every width, 1900px → 768px |

Flush at 1900 / 1500 / 1100 / 1050 / 1000 / 950 / 900 / 860 / 820 / 780 / 768px. Below the 768px breakpoint they stack and the question dissolves; checked at 700 and 500px that Saved is still flush and nothing overflows horizontally.

## Verified

Collapse still works in every direction: hexagon 773 → 58 → 773; Color Editor panel → 54px; Equations 186 → 32px, which is the third `.panel-frame` and the one most likely to have been broken by removing a global rule. Plugin heights byte-identical to baseline. `bun run lint`, `typecheck`, `build`, `build:figma` and 13 Playwright specs green.

The Playwright coverage is deliberately a width sweep, and it asserts the SB box actually grows when its neighbours close. That is the invariant the deleted mechanism used to guarantee: both columns stretching unconditionally is only safe while each really has somewhere to put the space. Checked that the sweep fails without the fix — 29.6px at 1900px — because a test that cannot fail is worth nothing here.
