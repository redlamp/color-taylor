---
tags:
  - domain/figma-plugin
  - status/adopted
  - origin/platform-limit
---

# Decision: The Iframe Owns The Clock

**2026-08-02, revised 2026-08-03.** When a color changes outside the plugin, the sandbox says *something happened* and the UI iframe drives the asking, once per animation frame.

## Why not just listen

Figma's change events are batched by design - *"will not call the callback synchronously and will instead batch the updates and send them to the callback periodically."* Acting only on the event means the picker visibly trails a drag in Figma's own right rail.

## Why the sandbox can't fix it alone

The plugin sandbox is a JavaScript VM, not a browser. No DOM, no `setTimeout`, no `setInterval`, no `requestAnimationFrame` - there are no frames to hang a loop on. The UI iframe is a real browser context and has all of them.

## The split

| Side | Knows | Can do |
|---|---|---|
| sandbox | an edit started; how to read a paint | answer a question synchronously |
| iframe | nothing about the document | `requestAnimationFrame` |

So the change event does one extra thing: post `wake`. The UI then sends `poll` once per frame until the edit goes quiet (`HOT_MS = 2000`), and each poll is answered straight off the scene graph - cheap, since `selectionPaint()` stops at the first solid paint.

The user asked whether this meant 30fps forever while something is selected. It does not: polling only runs during a hot window after a real edit.

## Echo suppression

Our own paints come back through the same channel, so every drag frame would bounce back and fight the picker. `lastWritten` holds a `hex|opacity` key; when the incoming change matches it, the *color* half is suppressed but the selection count still gets through, or the "Selected: N" caption goes stale.

## 2026-08-03 revision: nodechange, not documentchange

The original used `figma.on('documentchange')`, which under `documentAccess: "dynamic-page"` requires `figma.loadAllPagesAsync()` first. Figma's own typings warn against exactly that:

> *"Because this may introduce a loading delay, consider using more granular alternatives, such as the `"stylechange"` event, or using `PageNode.on` with the `"nodechange"` event."*

On a large file that load is a visible stall the first time the plugin runs, and it is the kind of thing the review guidelines list under Performance. We only ever read the current page's selection, so the full-document load bought nothing.

Now: `figma.currentPage.on('nodechange', ...)`, with no `loadAllPagesAsync` at all. The cost is that the listener belongs to a *page*, not the file, so it has to be moved on `currentpagechange` - `watchCurrentPage()` in `code.js` detaches the old one and attaches to the new.

Related: [[research/figma-plugin-review-guidelines]], [[research/figma-plugin-platform-constraints]]
