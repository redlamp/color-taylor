---
tags:
  - domain/figma-plugin
  - status/superseded
---

# Decision: Listing Assets Are Generated, Not Drawn

**2026-08-04.** The plugin icon and Community thumbnail are produced by `figma/brand/make-assets.mjs` from the same HSV-hexagon math the app renders, rather than being drawn once and exported.

> **2026-08-16: superseded for the icon; 2026-08-18: fully superseded.** Both
> the icon and the thumbnail are now exports of designed frames - see
> [[decision-logo-source]]. `make-assets.mjs` is deleted (git history has it).

## Why

The hexagon *is* the product. An icon drawn by hand is a second source of truth for what the hexagon looks like, and it starts drifting the first time the field's math changes. Generating it means the icon cannot disagree with the thing it depicts.

It also makes the assets cheap to redo. Different background, different crop, a new size Figma asks for later - change a number and re-run.

## Why per-pixel and not SVG

The field is a true HSV hexagon: hue from the angle, saturation from the distance as a fraction of the hexagon's own radius *at that angle*. SVG has no mesh gradient that reproduces it. Six triangles with two-stop gradients get close and band visibly along the seams at 1920px.

So the generator rasterises directly, in a browser canvas via Playwright - already a dependency for the e2e specs, and cheaper than adding an image library for one job.

## Sizes

| Asset | Size | Required? |
|---|---|---|
| Icon | 128 x 128 | **Required** |
| Thumbnail | 1920 x 1080, 16:9 | Recommended, and effectively unskippable |
| Carousel | 1920 x 1080, up to 9 images or videos | Optional |
| Playground file | - | Optional |

Re-checked against the publish docs on 2026-08-11. Figma documents the sizes and the counts but **not** the accepted formats or any file size cap; PNG and JPG both upload, and MP4 covers the video slots.

The thumbnail was first built at 1920x960 from memory. It is 16:9, not 2:1 - corrected, though `figma/brand/README.md` went on naming the old file for another week. Worth re-reading the docs rather than trusting a remembered aspect ratio, and worth grepping for the old filename when one changes.

## Where the artwork lives

Page `47:2` ("Figma Plugin") of the Color Taylor design file:
https://www.figma.com/design/4exm8SJNJP4xO0bqAbyBwO/Color-Taylor?node-id=47-2

Built out on 2026-08-11 with an artboard per slot - `icon / 128x128`, `thumbnail / 1920x1080`, and four `carousel` frames named for the shot list in `figma/brand/listing.md` - each filled with `#2c2c2c`, the same surface `make-assets.mjs` draws on, so artwork designed there sits on the real background. A spec note above the frames records the requirements, that the icon and thumbnail are generated rather than drawn, and that the plugin id comes from the desktop app.

This supersedes the earlier template file at https://www.figma.com/design/5WHUkgGbmdWXqUylJqbmPp, which was a starting point rather than the working file.

Two gotchas from building it, both caught by screenshot: `resize()` on a text node pins both dimensions and silently resets `textAutoResize` to `NONE`, so the wrap has to be reasserted *after* the resize or the height reads back as whatever it was seeded with; and this file's canvas is `#1e1e1e`, so dark ink on it is invisible.

## What is still hand-made

The four carousel screenshots. They need the plugin running in real Figma, so they sit behind the plugin id.

## Which account

`taylor@redlamp.org`, not `twright@launchpad.build`. The account that creates the plugin in the desktop app receives the plugin id, owns the Community listing and appears as the publisher, so it is the one release decision that cannot be undone by editing a file later.

Related: [[plan-figma-plugin-release]], [[research/figma-plugin-review-guidelines]]
