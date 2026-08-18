# Listing assets

Everything the Figma publish modal asks for, except the screenshots - those
need the plugin running in real Figma.

| File | What |
|---|---|
| `icon-128.png` | Plugin icon, 128x128 - export of the logo frame |
| `logo-512.png` | The same logo at 4x, for anywhere that needs it larger |
| `cover-1920x1080.png` | Community thumbnail, 1920x1080 (16:9) - export of the thumbnail frame |
| `listing.md` | Name, tagline, description, tags, screenshot shot-list |

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
