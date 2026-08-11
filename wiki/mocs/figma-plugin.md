# Figma Plugin

The app's color hexagon running inside Figma. Branch `feat/figma-plugin`, started 2026-08-01.

**Status:** works, gate-clean, and **not yet confirmed inside real Figma.** Every test so far has been headless Chromium against the built `ui.html`.

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
| Bundle | 179 KB (85 KB js, 94 KB css) — from 504 KB |
| New code | `main.tsx` + `code.js` + the `lite/` stubs |
| Shared with the app | everything else |
