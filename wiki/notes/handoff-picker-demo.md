---
tags:
  - domain/ui
  - status/open
  - origin/user-call
---

# Handoff: Build The Picker Demo

**2026-09-03.** Written by the session that landed the picker's layout and interaction changes on `feature/demo`, for the session that builds the demo itself. Read this, then [[plan-picker-demo]] (the spec), then the prototype at `docs/prototypes/picker-demo-prototype.html`. Start on `feature/demo`; it is pushed and clean.

## The goal in one paragraph

A self-running demo of the picker, behind the `?` button in the header (`#demo-button`, currently a no-op). A ghost cursor moves on bezier arcs, hovers and drags the real controls, and short captions say what to watch, while a bottom "Skip demo" bar shows progress. Five steps, listed with their captions in the spec. The demo drives the app's real controls with synthetic pointer events, so the highlights, tooltips and tones the user will see are the ones the demo shows. It ends on "Have fun!" and restores the colour it found.

## What is already on the branch, and how it works

Everything the demo leans on shipped in `e4f4b0e` and the fixes after it. The technical map:

- **Hold tracking.** `ColorPicker` listens to `pointerdown` on `window` in the capture phase and reads the nearest `data-hold` ancestor of the target through `holdKeyOf` (`src/hooks/useImpact.ts`); `pointerup` and `pointercancel` clear it. Keys in use: `sl:<group>-<letter>` (slider track, arrow and stepper), `hex:<channels>` (a stem or joint, e.g. `hex:rg` is the green joint), `hue` (badge), `bl` and `sat` (the hexagon's bars: track, arrow and value pill). Anything untagged is `other`.
- **Impact diff.** `useImpact(values, hold)` returns the set of readout keys whose value differs from a snapshot taken at the press. Pure derivation from state, no effect; the readouts are `rgb-r … hsl-l` as integers. The lint forbids `setState` inside effects and ref writes during render, which is why it is shaped this way.
- **Who lights.** The one rule: a control never lights while it is the one being manipulated. Sliders light when their value moved and they are not held; the hexagon's stems and joints light by channel only when something *other than a stem or joint* is held; the hue badge's border lights when hue moves from elsewhere; the hexagon's bars light when their value moves from elsewhere; the hue line fills while a saturation slider is held. The play cycle is a hold too (`play`, re-snapshotted every `PLAY_SNAP_MS`): sliders, bars and badge light as they move, the chain stays quiet. Tooltips fade during a stem or joint drag and come back on release if the pointer is still on it (`clearAll` re-reads `elementFromPoint`; stems carry `data-stem`, joints `data-joint`).
- **Highlight tokens.** `src/utils/highlight.ts`: `HIGHLIGHT_IN` / `HIGHLIGHT_OUT` (150 ms in, 500 ms out, opacity crossfade of an always-mounted element), `CALLOUT_LINE` for SVG, `CALLOUT_BOX_SHADOW` for the slider overlay. Two colours in `src/index.css`: `--highlight-hex` (fixed, the colour field is the same in both themes) and `--highlight-line` (per theme, the sliders sit on the panel). `--highlight` without a suffix is an older, unrelated token.
- **Hexagon.** Halos are drawn in one layer after the joints so they sit above the drop shadows (`ColorHexagon.tsx`, "The impact layer"). Channel tooltips are SVG pills at fixed sides of each stem's midpoint (`TIP_SIDE`, `TIP_GAP`, `TIP_FILL`), shown for the hovered stem or every stem the hovered joint drives, faded during a drag by the `dotDragging` state. A "Hue" label rides above the badge (`HueHandle.tsx`).
- **Slider bank.** One flat block, `#slider-banks`: a multi-select toggle group (`groups`, default RGB + HSB) and the blend toggle (`blend`, default off = flat). Reset-all returns both to `DEFAULT_GROUPS` / `DEFAULT_BLEND`. Blend off draws Brightness and Lightness in greyscale.
- **Tests.** `tests/open-sections.ts` opens Recent, Saved and Hex, which start closed; any spec that reaches into them calls it first. The full suite was green at the last push.

## DOM anchors the demo can rely on

| Target | Anchor |
|---|---|
| Joints | `#rgb-dot-red`, `#rgb-dot-green`, `#rgb-dot-blue` (the last in chain order is the tip) |
| Stems | the transparent hit `<line>` before each visible stem, tagged `data-hold="hex:<ch>"` |
| Hue badge | `#hue-handle` |
| SB box | `#sb-wrapper` (the box itself is `SBBox`, a canvas-like div inside it) |
| Hue slider arrow | `#slider-hsb-h-arrow`; track `#slider-hsb-h-track` |
| Blend toggle | `#blend-toggle` |
| Demo button | `#demo-button` |
| Bars | `#bl-bar`, `#sat-bar` and their arrows `#bl-bar-arrow`, `#sat-bar-arrow` |

Note the chain's `order` can change with `vectorMode`; use the ids, not positions.

## Driving the controls: recipes that are known to work

These were used to verify the highlights in this session, from the browser console, and produce exactly what a real pointer does.

```js
// Hover a joint or stem: shows its tooltip(s). Stems and joints listen to pointerenter directly.
el.dispatchEvent(new PointerEvent('pointerenter', { clientX, clientY, pointerType: 'mouse' }));

// Drag: press on the element, move on window, release on window.
const ev = (type, x, y) => new PointerEvent(type, {
  bubbles: true, cancelable: true, clientX: x, clientY: y,
  pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1,
});
el.dispatchEvent(ev('pointerdown', x0, y0));
window.dispatchEvent(ev('pointermove', x1, y1));   // per animation frame
window.dispatchEvent(ev('pointerup', x1, y1));
```

The hold key is read from the `pointerdown` target, so press on the tagged element (the joint's `<g>`, the stem hit line, the slider arrow). Slider tracks map absolute position; the hue slider is `wrap` and tracks movement, and asks for pointer lock on a drag from the arrow - a synthetic drag will simply not get the lock, which is fine. The SB box and the toggle buttons take a plain `click` for the blend toggle and a pointer drag for the box.

## What to build

Follow the order in the spec's implementation plan: `src/demo/` lazy-loaded like the deck (`src/presentation` is the pattern for `React.lazy` in `App.tsx`); `drive.ts` (bezier move, hold and drag helpers, a `wait` that resolves early on skip); `DemoOverlay` (cursor, caption bubble, bottom bar); `steps.ts`; wire `#demo-button`; a Playwright spec.

Port from the prototype, not from memory - open `docs/prototypes/picker-demo-prototype.html` and read from `function runDemo()` (about line 540): `moveTo` (quadratic bezier that bows alternately), `tween`, `say` / `hush` / `pickSide` / `placeBubble` (caption placement by available room), `bring` (scroll into view for mobile), `setStep` (progress ticks), the `.demo-bar` markup, the `<symbol id="cursor-mouse">` and `cursor-touch` SVGs with the `--hx` / `--hy` hotspot variables and the `.press` scale, and `TOUCH = matchMedia('(pointer: coarse)')`. The prototype's captions are the spec's.

Restore on exit: snapshot `hsb` when the demo starts and call `animateToHsb` with it at the end or on skip. Any real `pointerdown` or `keydown` while the demo runs should skip it - the window pointerdown listener already exists in `ColorPicker`, so the demo can subscribe to the same signal.

## Decisions the user still has to make

Ask before building the parts they affect:

1. Offer the demo on first run, or only from `?`. First run needs a `color-taylor-demo-seen` key whose owner listens for `color-taylor:reset-all`, and it would be the tenth key in the root `CLAUDE.md` table.
2. Whether the first cut scrolls targets into view on narrow viewports, or is desktop-only.
3. Whether the five captions ship as written.

## Working conventions here

- Bun, not npm. `bun run typecheck`, `bun run lint`, `bun run test:unit`, `bun run test` (Playwright; it reuses a dev server already on :5173, and another chat may own that server - just open the URL).
- The lint is strict about React: no `setState` in effects, no ref writes in render. Derive, or snapshot at the event.
- "Commit" means commit and push. Work stays on `feature/demo`; the PR goes to `dev`, not `main`. Commit messages end with the `Co-Authored-By` line the harness gives you.
- Wiki: a decision gets a `notes/decision-*.md`; notable work goes to today's daily; new notes get linked from a MOC (`wiki/mocs/architecture.md` links the plan).
- The deck (`#/presentation`) and the Figma plugin render the same `ColorHexagon`; a change there shows up in three places. `bun run build:figma` is the canary for the plugin.

## Definition of done

The `?` button runs the five steps on desktop with the real highlights showing, Skip and the end both restore the colour, a real pointer press skips, `prefers-reduced-motion` is respected (no arcs, instant moves), the Playwright spec passes alongside the rest of the suite, and the spec note is updated from `status/draft` to `status/adopted` with anything that changed.
