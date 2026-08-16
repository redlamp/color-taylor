---
tags:
  - domain/figma-plugin
  - status/adopted
  - origin/user-call
---

# Decision: The Logo Is Designed in Figma, and the Icon Is an Export of It

**2026-08-16.** Color Taylor has a designed logo: the "Color Taylor - Logo"
frame, node `59:179` in the Color Taylor Figma file. It is the hex field with
three of the picker's vector handles walking across it, on a dark tile.
https://www.figma.com/design/4exm8SJNJP4xO0bqAbyBwO/Color-Taylor?node-id=59-179

`figma/brand/icon-128.png` (the Community listing icon) and
`figma/brand/logo-512.png` (a 4x master) are **exports of that frame**, pulled
via the Figma MCP connector. Re-export from Figma to change them; never edit
the PNGs, and never regenerate them from script.

## What this supersedes

[[decision-figma-listing-assets]] ruled that listing assets are generated from
the app's hexagon math so they cannot drift from the product. That decision
**still holds for the thumbnail** but is superseded for the icon: the user
designed an actual mark and chose it (user call, 2026-08-16). The icon block
was removed from `make-assets.mjs` the same day so a re-run cannot clobber the
logo with the old generated hex.

The drift argument is partly preserved rather than abandoned: the logo's hex
field is built from the app-accurate vector construction (angular gradient +
radial white, drawn 2026-08-16 from `hexConstants` orientation), so the field
still matches the product. What is now hand-owned is the composition - tile,
handles, framing.

## Rejected

- Keeping the generated icon alongside the logo "until sure" - two icons is
  how the wrong one gets uploaded.
- Making the logo frame a component before instancing it into the listing
  artboard - converting the node changes its id and would break this note's
  pointer; a plain copy in the artboard is enough.

## Still open

- The web app ships the default Vite favicon; the logo is the obvious
  replacement. Not done.
- `cover-1920x1080.png` still features the plain generated hexagon, not the
  mark. Worth revisiting when the listing is otherwise ready.
