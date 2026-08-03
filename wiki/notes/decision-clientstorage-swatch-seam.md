---
tags:
  - domain/figma-plugin
  - domain/storage
  - status/adopted
  - origin/bug
---

# Decision: A Storage Seam For Swatches

**2026-08-03.** Recent and Saved swatches read and write through `src/utils/swatchStore.ts`, which the plugin build aliases to a `figma.clientStorage`-backed implementation.

## The bug this fixed

The plugin UI runs in a **null-origin iframe**, where `localStorage` raises `SecurityError` on access - not on write, on *access*. Every call site was already wrapped in `try/catch` because the failure was suspected, and that guard hid it completely: reads returned nothing, writes vanished, and no error ever surfaced.

Net effect: **saved swatches had never once survived closing the panel in Figma.** The feature looked present and did nothing. `figma/README.md` recorded it as "may be unavailable ... will not survive a reload", which was closer to the truth than anyone acted on.

## The seam

- `src/utils/swatchStore.ts` — localStorage, for the app. Exports `readSwatch`, `writeSwatch`, and a `SWATCHES_READY` event name.
- `figma/ui/lite/swatch-store.ts` — same exports over `clientStorage`, reached by `postMessage` because `clientStorage` only exists on the sandbox side.
- `figma/code.js` — holds the blob under one key, sends it on `ready`, persists on `saveSwatches`.

## Two details that matter

**Synchronous cache.** `clientStorage` is async; React state initializers are not. The plugin store answers reads from an in-memory cache, hydrates when the `swatches` message arrives, then fires `SWATCHES_READY` so the component re-reads.

**Writes before hydration are cached but not sent.** This is the part that is easy to get wrong. Without the guard, the default state built on an empty cache overwrites the real data on its way in - swatches would vanish on *every* launch, which is worse than not persisting at all. `code.js` also no-ops `saveSwatches` while `swatches === null`, so the guard exists on both sides.

## One key, not many

The blob is written on every swatch change, so one `setAsync` is cheaper than several.

## Verified

Two simulated sessions with `localStorage` made to throw exactly as Figma does:

```
session 1 start   saved 9,  recent 0
session 1 edit    saved 10, recent 1
clientStorage     saved=10  recent=1
session 2 reopen  saved 10, recent 1   <- restored
```

Still to confirm in real Figma: see [[plan-figma-plugin-release]].
