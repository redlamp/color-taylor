---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: "Also Available In" Is a List, Not a Figma Ad

**2026-08-18.** The app now carries a footer below the Equations panel
pointing at the Figma plugin. Built as `IntegrationsFooter.tsx`, driven by an
`INTEGRATIONS` array.

## Why a list rather than a Figma pitch

The user's ask named the Figma plugin but said *"we may add more versions in
the future"*. A hardcoded Figma block would have to be torn up to add a
second entry; an array means adding one is a data change plus a glyph, and the
layout, responsive behaviour and the pending-review handling come for free.

## The status field, and why the link is not live yet

Each entry carries `status: 'live' | 'in-review'`. The Figma listing is
private until Figma's review passes, so a link shipped today is a 404 for
every visitor. While an entry is not `live` the component renders **no anchor
at all** - a greyed-out link still invites the click that lands on the 404 -
and shows an "In review" chip instead.

**Flipping the Figma entry to `'live'` when the listing goes public is the
whole change.** One word.

## Details worth keeping

- **Not in the Figma plugin.** The plugin builds from `figma/ui/main.tsx`,
  which mounts `ColorHexagon` directly and never renders `ColorPicker`, so the
  footer cannot leak into the panel. Telling someone already inside Figma
  about the Figma plugin would be a bug; if this ever moves into a shared
  component, gate it.
- **The glyph is inline SVG.** lucide-react dropped its brand icons, and
  Figma's mark is five shapes.
- Rows are keyed by platform, not by product: the heading says what the list
  is, so a row saying "Color Taylor for Figma" would be three words of
  nothing.

Related: [[decision-single-source-picker]], [[plan-figma-plugin-release]]
