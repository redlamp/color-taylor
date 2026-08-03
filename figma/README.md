# Color Taylor - Figma plugin

The app's color hexagon, running inside Figma. Select layers, pick a color,
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

`ui.html` is generated and gitignored (a ~180 KB bundle that would rewrite
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

- **Color state** in the shape `ColorHexagon` expects as a controlled
  component, mirroring ColorPicker's "HSB is canonical, RGB has an override ref"
  pattern (see the root CLAUDE.md). Get this wrong and low-saturation values
  drift as you drag.
- **`onAnimateToHsb`**, a small rAF tween with a quadratic ease and
  shortest-path hue. Not optional decoration: `animateBLToValue` and
  `handleColorLabelClick` both early-return without it, so the 100/50/0 bar
  markers and the R/Y/G/C/B/M vertex letters are dead controls if it is missing.
- **The bridge.** Every color change posts `apply` to the sandbox; the sandbox
  paints the first solid paint of each selected node. There is no Apply button -
  picking a color is the action. Fill/Stroke/None chooses which paint, and None
  reads the selection without ever writing.
- **Theme sync.** Figma stamps `figma-dark` on `<html>`; the app's tokens key
  off `dark`. A MutationObserver mirrors one onto the other so flipping Figma's
  theme mid-session works.

## Window sizing

Width is dragged from lanes down the east, west and south edges plus the SW/SE
corners; height is always the content's. Two constraints shaped that, both
learned the hard way:

- **West-edge dragging is proven, not assumed.** Resizing from the west needs
  `figma.ui.reposition` alongside `resize`, and those two are not documented as
  sharing a coordinate space with `getPosition` - three versions of "read here,
  write there" flung the panel off-screen. `canReposition()` now nudges the
  window a known 8px, reads back, keeps the difference as a bias and verifies
  the correction. If verification fails, west anchoring stays off for the
  session and the west edge simply resizes like the east one.
- **The lane owns a column.** `.figma-scroll` stops where the lane begins. When
  the handles floated over the content at `right: 0` they sat on the same pixels
  as the scrollbar, so neither could be grabbed reliably.

Height has exactly one source - the `ResizeObserver` in `main.tsx` reporting
`.figma-root`'s `offsetHeight`. That is what makes dead space below the content
structurally impossible rather than something to keep fixing. It also means
nothing in the layout may be `height: 100%`, or the measurement becomes
circular. If the fitted height exceeds the screen, Figma clamps it and
`.figma-scroll` scrolls.

There is no published recipe for this; the official docs and
`create-figma-plugin` both only cover drag-resize between fixed bounds.

## Deliberate details

- **Undo.** Figma groups all of a plugin's edits into one undo step. The UI
  posts `commit` on pointer-up and at the end of a tween, so each gesture
  becomes its own entry rather than the whole session collapsing into one.
- **No echo repaint.** Selecting a layer seeds the picker from its fill, which
  changes the color, which would fire the live-apply and repaint the layer with
  what it already had. `seededHexRef` swallows exactly that one write.
- **Fonts are dropped, then restated.** `src/index.css` pulls in five
  `@fontsource` faces; inlining ~700 KB of woff2 to gain Barlow in a side panel
  is a bad trade, so the config aliases `@fontsource/*` to `ui/empty.css`.
  `figma.css` then sets an Inter stack and Figma's 11px type scale, so the panel
  matches its neighbours rather than falling through to the system UI face.
- **Tailwind needs pointing at `src`.** Vite's root for this build is
  `figma/ui`, so automatic source detection would scan only that folder and emit
  none of the app's utilities. `figma.css` has an explicit `@source "../../src"`.
  If styling ever looks unstyled-but-laid-out, check that first.
- **IIFE, not ESM.** The plugin iframe has a null origin where
  `type="module"` is unreliable, hence `format: 'iife'` and no code splitting.
- **Audio is aliased out, not muted.** Interface sounds and the tone synth are
  modules layered on the picker, so the plugin build swaps both for silent
  stand-ins rather than gating them at runtime.
- **Swatches use `clientStorage`.** `localStorage` raises `SecurityError` in a
  null-origin iframe, so `utils/swatchStore` is aliased to a `clientStorage`
  implementation that talks to `code.js` over `postMessage`. Writes made before
  the stored blob arrives are cached but not sent, or an empty default state
  would overwrite real data on the way in.
- **`nodechange`, not `documentchange`.** The document-wide event would need
  `loadAllPagesAsync()` first, which stalls the first run in a large file.

## Not wired up

- Color variables and styles binding.
- Publishing. Loaded locally via Import from manifest; `manifest.json` still
  carries the `color-taylor-local-dev` placeholder id. See
  `wiki/notes/plan-figma-plugin-release.md` for what a Community listing needs.
