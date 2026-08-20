---
tags:
  - domain/app
  - domain/figma-plugin
  - status/active
---

# Decision: The Link Preview Reuses the Figma Thumbnail

**2026-08-20.** Pasting https://redlamp.github.io/color-taylor/ into WhatsApp, Messenger, Discord, Slack, X or Bluesky now produces a card carrying the Figma Community thumbnail and the same tagline printed on it. `public/og-image.jpg` is derived from `figma/brand/cover-1920x1080.png` by `scripts/make-og-image.mjs`; the tags live in `index.html`.

## Why the same artwork

The Community listing and a pasted link are the two ways someone meets this project without already knowing it. Drawing a second piece of art for the second one gives it two faces and a maintenance burden nobody would remember to discharge. The thumbnail is already the settled lockup ([[decision-logo-source]]), so the card is an export of it, not a redesign.

Copy follows the same rule. `og:description`, `<meta name="description">` and `manifest.webmanifest`'s `description` all carry the one sentence from `figma/brand/listing.md`: *"Understand color by moving it. Get hands-on with how RGB, HSB, and HSL colors relate."* `tests/link-preview.spec.ts` asserts the first two equal the third, so drifting them apart fails CI rather than shipping.

## The tags cannot use `%BASE_URL%`

This is the trap, and it is silent. Every other URL in `index.html` — favicons, the manifest — is written `%BASE_URL%foo`, because `vite.config.js` flips `base` between `./`, `/color-taylor/` and `/color-taylor/dev/`. That works for the browser, which resolves relative to the document it just loaded.

A scraper never loads the document. It fetches the HTML, reads `og:image`, and requests that value — and most of them (WhatsApp and Discord included) will not resolve a relative path against the page. A `%BASE_URL%og-image.jpg` therefore yields a card with the text and no picture, on precisely the platforms this was built for, with nothing failing anywhere you would look.

So `og:image` and `og:url` are fully qualified, filled from a new `%SITE_URL%` token by a `transformIndexHtml` plugin in `vite.config.js` that mirrors how Vite fills `%BASE_URL%`. It derives the origin from the same `base` expression, so the dev deploy advertises `/color-taylor/dev/` and production advertises `/color-taylor/`. The default `./` build falls back to the production URL — a `file://` preview is never scraped, and pointing at the live site beats emitting something broken.

## JPEG, and 1200x630

Both were measured, not assumed.

**Format.** The same frame is 884 KB as PNG and 79 KB as JPEG at quality 0.92. It is a continuous colour field, which is what JPEG is for. Size is not cosmetic: WhatsApp is the strictest consumer here and drops previews for large images without saying so. WebP came out smaller still (40 KB) and was rejected — not every scraper decodes it, and 79 KB is already far inside every limit.

**Aspect.** The thumbnail is 16:9; Open Graph's de facto size is 1200x630, or 1.905:1. The script centre-crops 36 source pixels off the top and bottom, which at that scale takes only empty backdrop — the title block sits between y=210 and y=740 and the hexagon bleeds off three edges. Shipping 16:9 instead would not avoid the crop, only move it to each platform, where it happens centred but unpredictably and outside our control. Discord is the one that would have shown the full 16:9; giving up that one is worth the guarantee everywhere else.

`og:image:width` and `og:image:height` are declared because scrapers lay the card out before the image finishes downloading; a stale value shows up as a reflow. The spec asserts they match.

## Why `twitter:*` is still written out

X and Bluesky both fall back to `og:*` when the `twitter:*` pair is absent, so the title/description/image duplication buys nothing on its own. `twitter:card` is the exception — it has no Open Graph equivalent, and without `summary_large_image` X renders the small square thumbnail instead of the wide one. Having declared the card type, the matching tags are written alongside it rather than left as an odd single-tag block.

## What is not covered

No per-route metadata. `#/presentation` is a hash route, invisible to a scraper, and the deployed build gates it off anyway. If the app ever grows real routes worth sharing individually, static tags in one `index.html` stop being enough and this needs revisiting.

Related: [[decision-logo-source]], [[decision-figma-listing-assets]], `figma/brand/listing.md`
