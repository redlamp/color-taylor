# Listing assets

Everything the Figma publish modal asks for, except the screenshots - those
need the plugin running in real Figma.

| File | What |
|---|---|
| `make-assets.mjs` | Generates the two images below. `bun run figma/brand/make-assets.mjs` |
| `icon-128.png` | Plugin icon, 128x128 |
| `cover-1920x960.png` | Community cover art |
| `listing.md` | Name, tagline, description, tags, screenshot shot-list |

The images are generated from the same HSV-hexagon math the app draws, so the
icon cannot drift from the product. They are committed so the listing can be
refreshed without a browser, but regenerate rather than editing by hand.

This replaced `figma/icon.svg`, which was a placeholder emoji referenced
nowhere.

Manifest note: Figma has no icon field. The icon is uploaded in the publish
modal, and locally imported dev plugins always show Figma's own `</>` badge
whatever you do.
