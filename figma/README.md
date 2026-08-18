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

`code.js` stays plain JS with no build, but it is typechecked in place:
`tsc -p figma` (part of `bun run typecheck`, so CI gates it) checks it against
`@figma/plugin-typings` via JSDoc, plus the bridge protocol both halves share
in `messages.ts`. Change a message shape on one side only and typecheck fails.

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

- **West-edge dragging needs a coordinate-space mapping, and it is measured,
  not guessed.** Resizing from the west means moving the window as it resizes,
  and `getPosition` reports `{ windowSpace, canvasSpace }` while `reposition`
  documents no space at all - three versions of "read here, write there" flung
  the panel off-screen.

  The answer is that the docs describe `reposition` and `showUI`'s `position`
  as the same setting, and **we choose what we pass to `showUI`**. So
  `calibrateWindowSpace()` reads `getPosition()` immediately after `showUI` and
  keeps the difference:

  ```
  bias = getPosition().windowSpace - the position we asked for
  ```

  Nothing moves, there is nothing to verify and nothing to put back. If the
  offset is missing or implausible the bias stays null and west anchoring never
  engages, leaving the west edge resizing like the east one.

  This replaced a nudge-and-verify probe, which was circular: it moved the
  window 8px and restored it using a position it had read itself, so when the
  spaces disagreed - the thing it existed to detect - "back" was somewhere
  else. On 2026-08-18 it opened the panel on top of Figma's left menus. It also
  chased a wrong theory, waiting for repositions to settle asynchronously when
  the docs state `reposition` is synchronous.

- **South-edge dragging is rAF-throttled, and has to be.** Height is the
  content's, so dragging the bottom solves backwards: each update nudges the
  width by the remaining height error. That loop reads `window.innerWidth` and
  `innerHeight`, which only change once a resize has round-tripped through the
  sandbox. Posting from every `pointermove` meant several events per frame all
  measured the same not-yet-applied error and asked for the same correction
  again, so the window overshot and hunted - visibly choppy, and only on this
  edge, because east and west compute their width straight from the pointer.
  One post per animation frame gives the resize time to land.
- **The lane owns a column.** `.figma-scroll` stops where the lane begins. When
  the handles floated over the content at `right: 0` they sat on the same pixels
  as the scrollbar, so neither could be grabbed reliably.

The panel opens at `INITIAL_X`/`INITIAL_Y` (280, 72) on a first run - clear of
the toolbar and the layers panel, in canvas space rather than over the chrome -
and remembers where it was afterwards. `windowPos` in `clientStorage` holds the
position *in reposition space*, converted through the calibrated bias on the
way in and out, so what is stored is the same kind of number `reposition` wants
back. Restoring happens after `clientStorage` resolves, so a remembered
position hops into place a moment after launch; the alternative is awaiting
storage before showing any UI, which trades the hop for a blank panel.

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

## Publishing

`manifest.json` carries the real plugin id (`1671457712575610716`, generated
2026-08-18 under `taylor@redlamp.org`), so the plugin is publishable rather
than dev-only. Changing the manifest means re-importing it in the desktop app
once - Figma only re-reads `code.js` and `ui.html` between runs. See
`wiki/notes/plan-figma-plugin-release.md` for what is left before submitting.
