# Listing assets

Everything the Figma publish modal asks for, except the screenshots - those
need the plugin running in real Figma.

| File | What |
|---|---|
| `icon-128.png` | Plugin icon, 128x128 - export of the logo frame |
| `logo-512.png` | The same logo at 4x, for anywhere that needs it larger |
| `favicon-src-16.png` | Hexagon only, legs removed - node `94:600`. Source for the 16px favicon |
| `favicon-src-32.png` | Hexagon only, legs removed - node `94:576`. Source for the 32px favicon |
| `cover-1920x1080.png` | Community thumbnail, 1920x1080 (16:9) - export of the thumbnail frame |
| `listing.md` | Name, tagline, description, tags, screenshot shot-list |

The two `favicon-src-*` files exist because the logo's three handles and their
connecting lines dissolve below about 32px. `scripts/make-favicons.mjs` turns
these three PNGs into everything in `public/` - run it after re-exporting any
of them.

`cover-1920x1080.png` has a second consumer: `scripts/make-og-image.mjs` crops
and compresses it into `public/og-image.jpg`, the link-preview card the web app
shows when its URL is pasted into WhatsApp, Discord, Slack, X or Bluesky. Same
artwork on the Community listing and in a chat window, on purpose - see
[[decision-link-preview-card]]. Re-run it too after re-exporting the thumbnail.

Both images are exports of designed frames in the Color Taylor Figma file -
the file is the source of truth, so re-export rather than editing the PNGs:

- Logo: "Color Taylor - Logo", node `59:179`
  https://www.figma.com/design/4exm8SJNJP4xO0bqAbyBwO/Color-Taylor?node-id=59-179
- Thumbnail: "thumbnail / 1920x1080 / 16:9", node `49:3`
  https://www.figma.com/design/4exm8SJNJP4xO0bqAbyBwO/Color-Taylor?node-id=49-3

`make-assets.mjs`, which used to generate both from the app's hexagon math, is
deleted (git history has it) so a re-run can't overwrite the designed exports.
The same per-pixel hex-field renderer also lives on as the image fills placed
in the Figma file ("Hex / pixel-exact" frames).

This replaced `figma/icon.svg`, which was a placeholder emoji referenced
nowhere.

Manifest note: Figma has no icon field. The icon is uploaded in the publish
modal, and locally imported dev plugins always show Figma's own `</>` badge
whatever you do.
