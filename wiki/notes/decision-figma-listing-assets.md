---
tags:
  - domain/figma-plugin
  - status/adopted
---

# Decision: Listing Assets Are Generated, Not Drawn

**2026-08-04.** The plugin icon and Community thumbnail are produced by `figma/brand/make-assets.mjs` from the same HSV-hexagon math the app renders, rather than being drawn once and exported.

## Why

The hexagon *is* the product. An icon drawn by hand is a second source of truth for what the hexagon looks like, and it starts drifting the first time the field's math changes. Generating it means the icon cannot disagree with the thing it depicts.

It also makes the assets cheap to redo. Different background, different crop, a new size Figma asks for later - change a number and re-run.

## Why per-pixel and not SVG

The field is a true HSV hexagon: hue from the angle, saturation from the distance as a fraction of the hexagon's own radius *at that angle*. SVG has no mesh gradient that reproduces it. Six triangles with two-stop gradients get close and band visibly along the seams at 1920px.

So the generator rasterises directly, in a browser canvas via Playwright - already a dependency for the e2e specs, and cheaper than adding an image library for one job.

## Sizes

| Asset | Size | Required? |
|---|---|---|
| Icon | 128 x 128 | Recommended |
| Thumbnail | 1920 x 1080 | **Required** |
| Carousel | up to 9 images or videos | Optional |

The thumbnail was first built at 1920x960 from memory. It is 16:9, not 2:1 - checked against the publish docs and corrected. Worth re-reading the docs rather than trusting a remembered aspect ratio.

## What is still hand-made

The four carousel screenshots, which need the plugin running in Figma, and any art the user places into the template file at
https://www.figma.com/design/5WHUkgGbmdWXqUylJqbmPp - frames at each required size, with a safe-area guide on the thumbnail.

Related: [[plan-figma-plugin-release]], [[research/figma-plugin-review-guidelines]]
