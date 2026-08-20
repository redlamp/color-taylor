# Figma Plugin

The app's color hexagon running inside Figma. Started 2026-08-01 on `feat/figma-plugin`, merged into `dev` on 2026-08-11 so CI had something to say about it; work happens on branches off `dev` now.

**Status: published, with an update in review.** Approved 2026-08-18 and live on the Community — https://www.figma.com/community/plugin/1671457712575610716/color-taylor. An update covering the window-sizing fixes, the brand blue default, the minimum-width opening and the listing copy was submitted 2026-08-19 and is awaiting review.

The deliberate pass in [[test-plan-2026-08-04-figma-plugin]] is still outstanding, and every *automated* test remains headless Chromium against the built `ui.html` — the window sizing in particular can only ever be verified by hand, in Figma.

**Watch out:** the app is upstream of this ([[decision-single-source-picker]]), and an app-side change with no plugin intent can break the panel silently. It has happened — [[decision-plugin-css-hooks]]. Re-check the panel at its 300px minimum after any work on shared components.

## Start here

- [[plan-figma-plugin-release]] — what stands between here and a Community listing
- [[test-plan-2026-08-04-figma-plugin]] — the first real-Figma pass
- `figma/README.md` — how to build and load it *(stale in places, see the plan)*

## Decisions

- [[decision-single-source-picker]] — no second copy of the picker; the requirement everything else follows from
- [[decision-lite-module-aliases]] — how the panel differs from the app without forking it
- [[decision-preact-for-the-panel]] — React swapped for Preact in this build only
- [[decision-clientstorage-swatch-seam]] — swatch persistence, which was silently broken until 2026-08-03
- [[decision-frame-clocked-follow]] — how the picker tracks Figma's own color picker
- [[decision-content-fit-height]] — the panel is always exactly as tall as its content
- [[decision-plugin-css-hooks]] — how panel CSS is allowed to reach into shared markup
- [[decision-figma-listing-assets]] — generated thumbnail, and where the listing artwork lives
- [[decision-logo-source]] — the designed logo frame in Figma is the icon's source of truth

## Platform knowledge

- [[research/figma-plugin-platform-constraints]] — what the sandbox and the iframe can't do, and what Figma does and doesn't give you
- [[research/figma-plugin-review-guidelines]] — the published rules, and Color Taylor audited against them

## Shape

```
figma/
  manifest.json          points Figma at code.js + ui.html
  code.js                sandbox side - plain JS, no build step
  vite.figma.config.ts   builds the UI from the app's components
  inline.mjs             folds the build into one self-contained ui.html
  ui/
    main.tsx             color state + the bridge. The only genuinely new code.
    figma.css            the app's theme, plus panel-only chrome
    lite/                stand-ins for modules the panel doesn't need
  ui.html                GENERATED, gitignored
```

## Numbers

| | |
|---|---|
| Bundle | 185 KB (87 KB js, 98 KB css) — from 504 KB |
| Minimum panel width | 300px (`MIN_W` in `code.js`) — the width to check layout against |
| New code | `main.tsx` + `code.js` + the `lite/` stubs |
| Shared with the app | everything else |
