---
tags:
  - domain/figma-plugin
  - domain/ui
  - status/adopted
  - origin/bug
---

# Decision: The Plugin Selects App Markup By Data Attribute, Not By Class

**2026-08-11.** Where `figma/ui/figma.css` needs to re-lay-out something the app renders, it selects a `data-*` attribute placed there for that purpose. It does not select Tailwind utility classes.

## What went wrong

The Recent and Saved swatch grids are laid out differently in the panel than in the app — six columns until 512px, then twelve, at 22px tall instead of 32px. That was expressed as:

```css
#recent-colors .grid,
#saved-colors .grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
```

Correct on the day it was written, because the only `.grid` inside a section was the swatch grid.

Then [[decision-panel-collapse-animates-by-grid-rows]]'s animator arrived: `CollapsibleSection` got a wrapper with `className="grid transition-[grid-template-rows] …"` between the section root and its content. It carries the bare class `grid`, so the rule matched it too and handed the *animator* six columns. Its single child — the content region — was pinned to the first 48px track, and the swatch grid inside then divided those 48px six ways.

Result: swatches **2.9375px** wide, everything jammed against the left edge, and no error anywhere. The app was unaffected, the build succeeded, and both surfaces render the same component — so nothing could catch it except looking at the panel.

## Why an attribute

`grid`, `flex`, `w-full` are not names. They are shorthand for a CSS declaration, they appear on dozens of unrelated elements, and any of them can be added to a new wrapper by someone who has never read `figma.css`. Selecting one couples the plugin's layout to an implementation detail of the app's markup that nobody thinks of as an interface.

`data-swatch-grid` says what the element *is*. It survives re-wrapping, it is greppable from both sides, and the comment on it in `ColorHexagon.tsx` points at the file that depends on it.

This is the same shape as [[decision-lite-module-aliases]]: where the plugin needs the app to be different, name the seam. There it is a module alias; here it is an attribute.

## The general rule

[[decision-single-source-picker]] means every change to `ColorHexagon` ships to both surfaces. That cuts both ways — the app cannot drift from the plugin, but a purely structural change in the app can silently break the panel's CSS. So:

- Plugin CSS reaching into shared markup selects `#id` or `[data-*]`, never a utility class.
- Adding a wrapper inside a shared component means checking `figma.css` for anything that selects into it.
- The panel's layout overrides are unlayered, which is what lets them win over Tailwind — and also what makes an accidental match load-bearing rather than harmless.

## Also fixed at the same time, for a different reason

The header actions did not fit the 300px minimum panel: Sort's 104px floor plus 56px for each confirming action is 224px with the gaps, and the header's min-content came to 286px inside a 276px section. Those floors exist so the row does not shuffle when labels change, so they were re-measured against the panel's 11px type rather than dropped — 86px holds "Sort: Bright", 48px holds "Sure?". Guessing them (76 and 40) failed both times.

Related: [[decision-single-source-picker]], [[decision-lite-module-aliases]]
