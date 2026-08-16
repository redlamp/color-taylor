# Listing assets

Everything the Figma publish modal asks for, except the screenshots - those
need the plugin running in real Figma.

| File | What |
|---|---|
| `make-assets.mjs` | Generates the thumbnail. `node figma/brand/make-assets.mjs` (node, not bun - see script header) |
| `icon-128.png` | Plugin icon, 128x128 - **exported from Figma, not generated** |
| `logo-512.png` | The same logo at 4x, for anywhere that needs it larger |
| `cover-1920x1080.png` | Community thumbnail, 1920x1080 (16:9) - generated |
| `listing.md` | Name, tagline, description, tags, screenshot shot-list |

The icon is the designed logo: the "Color Taylor - Logo" frame (node `59:179`)
in the Color Taylor Figma file is the source of truth, and the PNGs here are
exports of it - re-export from Figma rather than editing them by hand:
https://www.figma.com/design/4exm8SJNJP4xO0bqAbyBwO/Color-Taylor?node-id=59-179

The thumbnail is still generated from the same HSV-hexagon math the app draws.
It is committed so the listing can be refreshed without a browser, but
regenerate rather than editing by hand.

This replaced `figma/icon.svg`, which was a placeholder emoji referenced
nowhere.

Manifest note: Figma has no icon field. The icon is uploaded in the publish
modal, and locally imported dev plugins always show Figma's own `</>` badge
whatever you do.
