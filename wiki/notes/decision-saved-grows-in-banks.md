---
tags:
  - domain/ui
  - domain/storage
  - status/adopted
  - origin/user-call
---

# Decision: Saved Grows A Row At A Time

**2026-08-04.** Saved is no longer a fixed 12 slots. It holds one bank of 12, opens another when the last free slot fills, and stops at 36. Closes the need behind issue [#64](https://github.com/redlamp/color-taylor/issues/64).

## Why the bank is 12 and not 6

The grid is `grid-cols-6 md:grid-cols-12`. A bank has to divide evenly into both or one breakpoint ends up with a half-empty row - which is the thing a fixed grid was avoiding in the first place. 12 is the smallest number that does: two rows narrow, one row wide.

36 is the ceiling: 3 rows wide, 6 narrow. Past that the honest answer is Figma styles or variables, not more slots - see [[research/figma-plugin-review-guidelines]] for why leaning on Figma's own mechanism matters there.

## Derived, not stored

`fitSaved()` computes the size from what the array holds, rather than keeping a bank count in state:

```
size = smallest bank multiple that holds every color AND leaves SAVED_MIN_FREE slots open
```

`SAVED_MIN_FREE` is 1: there is always somewhere to drop the next color, and never more than one empty row waiting around.

Growing and shrinking are then the same rule read in two directions, so they cannot disagree. Delete enough and the trailing bank goes away on its own; no separate shrink path to keep in sync.

It also has to respect **position, not just count**. Slots are sparse - drag-to-reorder lets you leave gaps deliberately - so the fit is bounded below by the last filled index, not by how many colors there are. Dragging a color out to slot 30 keeps 36 slots even if only four are filled.

## The boundary behaves, and why that is not luck

Grow and shrink share a threshold, so there is exactly one transition per bank and it is symmetric: the save that fills the last free slot opens the next bank, and deleting that same color is what closes it again. Nothing oscillates, because size is a pure function of content and content only changes when the user acts.

## Why 1 free and not 3

The first cut kept 4 free (grow at 3 remaining), which had two problems. It showed a mostly-empty second row long before you needed it, and the seeded state - 9 of 12 - sat *exactly* on the threshold, so `defaultSaved()` had to be exempted from the fit or the plugin would open on two rows with 15 empty.

Dropping to 1 free removes both. The seed is comfortably clear of the boundary, so `defaultSaved()` goes through `fitSaved()` like every other path and there is no special case left to remember.

## What this did not disturb

Sort, drag-to-reorder, the FLIP tweens, the confirm-to-clear actions and persistence all operate on one flat `SavedSlot[]` and were untouched. That is the reason this shape won over paged sets or named palettes: both of those change the data into a collection of collections, and every one of those interactions would have needed rewriting - plus a new affordance for moving a color between sets.

Prior art, if organization ever becomes the actual need rather than capacity:

- **Procreate** - named palettes, fixed 30 swatches, stacked in a scrolling list, one active at a time
- **Illustrator** - swatch groups as folders inside one panel, drag between them
- **Photoshop** - no grouping at all, one flat panel with recents on top
- **Figma** - no ad-hoc swatch grid in the picker; Document colors are auto-collected and Libraries are published *named* styles foldered by `/`

Banks are a strict subset of all of these, so they are the seam to hang names on later.

Related: [[decision-alpha-in-swatch-identity]], [[decision-content-fit-height]]
