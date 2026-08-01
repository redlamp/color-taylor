# Color Taylor - Figma plugin

The app's colour hexagon, running inside Figma. Select layers, pick a colour,
their fill updates live.

## The point of the setup

There is **no second copy of the picker**. `figma/ui/main.tsx` imports the real
`src/components/ColorHexagon.tsx`, so anything you change in the app - geometry,
the brightness/lightness bar, the limit hexagon, styling, the Bright/Light tabs -
appears in the plugin on the next build. Nothing here needs porting by hand, and
the two cannot drift.

```
figma/
  manifest.json          points Figma at code.js + ui.html
  code.js                plugin sandbox (plain JS, no build)
  vite.figma.config.ts   builds the UI from the app's components
  inline.mjs             vite plugin: folds the build into one ui.html
  ui/
    index.html           build entry
    main.tsx             state + the bridge to code.js. The only new code.
    figma.css            imports the app's theme, adds panel-only chrome
    empty.css            font stub, see below
  ui.html                GENERATED - do not edit
```

## Working on it

```sh
bun run build:figma     # one-off build - required once after cloning
bun run watch:figma     # rebuild ui.html on every save
```

`ui.html` is generated and gitignored (a ~470 KB bundle that would rewrite
itself on every app change), so a fresh clone has to build once before Figma can
load the plugin.

Then in the **Figma desktop app** (importing a local plugin needs filesystem
access, so this does not work in the browser):

1. `Ctrl+/` → **Import plugin from manifest…** → pick `figma/manifest.json`
2. Run it with `Ctrl+/` → **Color Taylor**

Import once. Figma re-reads `code.js` and `ui.html` on each run, so after a
rebuild just re-run the plugin - or leave `watch:figma` going and use
Plugins → Development → **Hot reload plugin**. Only a change to `manifest.json`
needs a re-import.

## What main.tsx owns

Deliberately thin, so that app changes flow through untouched:

- **Colour state** in the shape `ColorHexagon` expects as a controlled
  component, mirroring ColorPicker's "HSB is canonical, RGB has an override ref"
  pattern (see the root CLAUDE.md). Get this wrong and low-saturation values
  drift as you drag.
- **`onAnimateToHsb`**, a small rAF tween with a quadratic ease and
  shortest-path hue. Not optional decoration: `animateBLToValue` and
  `handleColorLabelClick` both early-return without it, so the 100/50/0 bar
  markers and the R/Y/G/C/B/M vertex letters are dead controls if it is missing.
- **The bridge.** Every colour change posts `apply` to the sandbox; the sandbox
  paints the first solid fill of each selected node. There is no Fill button -
  picking a colour is the action.
- **Theme sync.** Figma stamps `figma-dark` on `<html>`; the app's tokens key
  off `dark`. A MutationObserver mirrors one onto the other so flipping Figma's
  theme mid-session works.

## Deliberate details

- **Undo.** Figma groups all of a plugin's edits into one undo step. The UI
  posts `commit` on pointer-up and at the end of a tween, so each gesture
  becomes its own entry rather than the whole session collapsing into one.
- **No echo repaint.** Selecting a layer seeds the picker from its fill, which
  changes the colour, which would fire the live-apply and repaint the layer with
  what it already had. `seededHexRef` swallows exactly that one write.
- **Fonts are dropped.** `src/index.css` pulls in five `@fontsource` faces;
  inlining ~700 KB of woff2 to gain Barlow in a side panel is a bad trade, so
  the config aliases `@fontsource/*` to `ui/empty.css` and the theme's stack
  falls through to the system UI and mono faces.
- **Tailwind needs pointing at `src`.** Vite's root for this build is
  `figma/ui`, so automatic source detection would scan only that folder and emit
  none of the app's utilities. `figma.css` has an explicit `@source "../../src"`.
  If styling ever looks unstyled-but-laid-out, check that first.
- **IIFE, not ESM.** The plugin iframe has a null origin where
  `type="module"` is unreliable, hence `format: 'iife'` and no code splitting.
- **Audio is off.** `muted` is passed, which gates every `toneController` call,
  so the synth chunk never loads.

## Not wired up

- Saved/recent palettes persist through `localStorage`, which may be unavailable
  in the plugin iframe. The component already try/catches it, so it degrades to
  empty rather than throwing - but it will not survive a reload.
- Stroke painting. Fills only, by design.
- Colour variables and styles binding.
- Publishing. Loaded locally via Import from manifest; the Community listing
  would need an icon, cover art and a review pass.
