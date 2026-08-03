---
tags:
  - domain/figma-plugin
  - status/adopted
---

# Decision: Height Has Exactly One Source

**2026-08-01.** The panel's height is always its content's. There is no manual height, and no stored height.

## The rule

A `ResizeObserver` in `main.tsx` reports `.figma-root`'s `offsetHeight` to the sandbox, which is the only thing that calls `figma.ui.resize` with a new height. Width is dragged; height follows content.

This makes dead space below the content **structurally impossible** rather than a class of bug to keep fixing. Collapse every section and the panel shrinks to match.

## Two things it forbids

**Nothing in the layout may be `height: 100%`.** The measurement becomes circular - the content sizes to the window that is sizing to the content.

**A stored height must not be restored.** `code.js` restores the last *width* on launch and deliberately not the height: a restored height would land after the UI's first measurement and overwrite it. `DEFAULT_H` exists only so the window opens already fitted instead of visibly jumping on first measure.

If the fitted height exceeds the screen, Figma clamps it and `.figma-scroll` takes over.

## Related: the scrollbar and the resize edge

The overlay scrollbar and the west/east resize lanes compete for the same pixels. Two rounds of user feedback settled it: the scrollbar sits at `right: 4px, width: 4px` so the resize cursor has clear room outboard of it. A native scrollbar was tried first and conflicted with the layout measurement above.

There is no published recipe for content-fit sizing in a Figma plugin - the official docs and `create-figma-plugin` both only cover drag-resize between fixed bounds.
