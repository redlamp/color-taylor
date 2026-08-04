---
tags:
  - domain/ui
  - domain/storage
  - status/adopted
---

# Decision: Alpha Is Part Of A Swatch

**2026-08-03.** A saved or recent swatch is `{ hex, alpha }`, stored and compared as one value. Alpha is not a parallel map keyed by hex.

## Why

The first pass stored alpha alongside the color. The user's response was *"do it properly"* - and they were right, because a side map makes `#ff0000` at 20% and `#ff0000` at 100% the same swatch. You cannot save both, restoring one is ambiguous, and dedupe silently collapses them.

Making alpha part of the identity makes all of that fall out: two swatches, both saveable, each restoring exactly what was saved.

## Rendering

Figma's split-chip convention - solid color on the left half, color-over-checkerboard on the right. A `background-clip`/`background-origin` mismatch caused the checkerboard to bleed past the chip (`background-origin` defaults to `padding-box`, `background-clip` to `border-box`); fixed by putting `border-box` inside the `background` shorthand per layer.

## Migration

Two older on-disk shapes exist (bare hex strings, and hex plus a separate alpha map). `parseRecent` / `parseSaved` / `legacyAlpha` in `ColorHexagon.tsx` read all three and normalize to `{hex, alpha}`.

## Tweening

Alpha rides the same clock as the color tween rather than snapping. It had its own path initially, which read as the swatch changing in two steps.

## Consequence

Slots fill faster now that transparency variants are distinct swatches, which was the argument in issue [#64](https://github.com/redlamp/color-taylor/issues/64) - resolved 2026-08-04 by [[decision-saved-grows-in-banks]].
