---
tags:
  - domain/ui
  - domain/figma-plugin
  - status/adopted
  - origin/user-call
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

## How to test it before it is live

Three rungs, cheapest first. Nothing below the third is evidence a real platform
will render the card - the first two only prove the tags are what we meant.

**1. Offline, instant.** `bun run preview:card` builds and runs
`scripts/preview-link-card.mjs`, which reads the built `dist/index.html` and
checks the things that are properties of our own output: tags present, `og:url`
and `og:image` absolute, `twitter:card` set to `summary_large_image`, the image
actually in `dist/`, its declared width and height matching the JPEG's real SOF
dimensions, and the byte size inside the range where previews are reliable. It
exits non-zero on any of those, and the deploy job runs it against the artifact
it is about to publish. It also writes a mock card to the temp dir showing the
three framings - full aspect, cropped to 1.91:1, and WhatsApp's narrower box
with one line of description - which is how to answer "does the crop cut the
wordmark" without deploying anything.

**2. A tunnel, for the real scrapers, touching nothing.** `SITE_URL` overrides
the computed origin, so a build can be pointed at a temporary public hostname:

    SITE_URL=https://<tunnel-host>/ GITHUB_PAGES=1 bun run build

then serve `dist/` and expose it (`cloudflared tunnel --url http://localhost:4173`
over `bunx vite preview`). Paste the tunnel URL into a real chat and the real
scraper fetches it. Without the override the build advertises the production
URL and every scraper would report on whatever is already deployed there,
which is the trap this exists to avoid. Note the base path: a `GITHUB_PAGES=1`
build expects to be served from `/color-taylor/`, so either serve it there or
build with the default `./` base and let `SITE_URL` carry the origin alone.

**3. The dev channel.** `bun run deploy:dev` publishes to
`https://redlamp.github.io/color-taylor/dev/`, a real public GitHub Pages URL
that is not production. `SITE_URL` already resolves to that path for a
`GH_PAGES_DEV` build, so the card is self-consistent there. `gh-pages -e dev`
scopes its cleanup to the `dev/` subdirectory, so this cannot disturb the live
site - but it does publish, so it is not a private test.

**Caching bites at rungs 2 and 3.** Scrapers cache by exact URL, WhatsApp for
roughly a week. Append a throwaway query string (`?v=2`) to force a fresh fetch;
it is a different URL to them and the same page to us. Facebook's Sharing
Debugger will force a re-scrape of a canonical URL and is the quickest check
that the tags parse at all, since it covers Messenger and WhatsApp both.

## What is not covered

No per-route metadata. `#/presentation` is a hash route, invisible to a scraper, and the deployed build gates it off anyway. If the app ever grows real routes worth sharing individually, static tags in one `index.html` stop being enough and this needs revisiting.

Related: [[decision-logo-source]], [[decision-figma-listing-assets]], `figma/brand/listing.md`
