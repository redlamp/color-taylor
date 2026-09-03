---
tags:
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Plan: The Picker Demo

**2026-09-03.** A self-running demo of the picker: a ghost cursor works the controls while short captions say what to watch. Prototyped in an artifact, chosen over an intro popup and over in-context callouts (pattern C of three), because it needs no reading before the first drag and it works the same on a phone. The layout and interaction changes it depends on landed first, on `feature/demo`, and are recorded below so the demo can be built against them. This note is the spec. **Built on 2026-09-03**; the "As built" section at the foot records where it differs.

The picker's argument is [[hexagon-is-the-cube-down-its-diagonal]]. The demo does not explain it - it gets the user dragging, and lets the highlights make the point.

## What shipped first (the ground the demo stands on)

- **Recent, Saved and Hex start closed.** The hexagon and the sliders are the whole first screen. `collapsedSections` on `ColorHexagon`, `defaultOpen={false}` on the hex card.
- **A `?` button in the header**, between the theme toggle and settings (`#demo-button`). It does nothing yet; the demo hangs off it.
- **One flat slider bank** under the SB box, no sub-cards. The plugin's controls: a multi-select `[RGB][HSB][HSL]` toggle group (default RGB + HSB) and the blend droplet (default on, applies to every block). A rule between blocks, drawn by the block below.
- **Impact highlights.** While the pointer holds a control, everything else that moved lights and stays lit until release. The one rule above all: a control never lights while it is the one being manipulated - not a slider (track, arrow or number field), not a bar, not the badge, not a stem or joint. Then: the app's white keyline over a tight dark shadow, 150 ms in, 500 ms out, an opacity crossfade of an element that is always mounted (`src/utils/highlight.ts`). The diff is `useImpact` in `src/hooks/useImpact.ts`, against a snapshot taken at the press, keyed by `data-hold` tags. Who lights what:
  - a slider, when its own value moved and it is not the held one;
  - the hexagon by channel, stem and joint as one unit, for every channel that moved - except while a stem or joint is itself held (`hex:*` keys), where the chain moving is feedback enough;
  - the hue badge, its own border turning white, when hue moves from somewhere else;
  - the hue line's white fill while a saturation slider is held;
  - never the swatch, the SB box or the hex value;
  - during the play cycle, the sliders, bars and badge light as their values move (a rolling snapshot every 600 ms) and the chain does not.
  - Two colours, in `src/index.css`: `--highlight-hex` for the hexagon, set once because the colour field is the same in both themes; `--highlight-line` for the sliders, per theme because the tracks sit on the panel.
- **Channel tooltips on the hexagon.** Hover or drag a stem and a pill names its channel (RED, GREEN, BLUE) at a fixed side of the stem's midpoint - red below, green north-east, blue north-west, never flipped, allowed outside the hexagon. A joint has no tooltip of its own; it shows the tooltip of every stem it drives. They fade out for the length of a drag so the halos are what the eye follows. Fills are Tailwind's 600 step of each hue.
- **A "Hue" label** above the hue badge, following it round the circle, in the Saturation and Brightness labels' type.
- **Handles.** Joints keep the channel-coloured ring with the field colour under them as the core. The tip is a size up, in its channel's colour like the others: it is the selection, the joints are the explanation, and the highlight colour is what a drag shows.

## The demo itself

Behind `#demo-button`. First run could also offer it, gated by a tenth `localStorage` key (say `color-taylor-demo-seen`) - which needs its owner to listen for `color-taylor:reset-all` or it survives a reset. Undecided whether to auto-offer at all.

**Cursor.** An SVG symbol the user can edit: a mouse pointer on fine pointers, a touch disc on coarse ones (`matchMedia('(pointer: coarse)')`). Hotspot is a variable pair per symbol (prototype: 4,3 for the mouse, 18,18 for the touch disc). It moves between targets on a quadratic bezier that bows alternately left and right, so it reads as a hand and not a tween.

**Captions.** A bubble beside the target, placed right, left, below or above by available room. On mobile the target is scrolled into view first.

**Bottom bar.** A "Skip demo" bar styled as an app panel, fixed to the bottom, with one progress tick per step. The last step swaps it for "Start exploring".

**Sequence.** Each hold uses the impact highlights above, so the demo shows exactly what the user will see when they drag.

1. Cursor enters on an arc. Hovers red stem, red joint, green stem, green joint, blue stem, blue joint - the tooltips do the naming. A short drag of the tip. Caption: *Play with the handles to see how they map to the color hex.*
2. Moves to the SB box and drags. Caption: *Work with the tools that feel most familiar to you.*
3. Drags the hue slider. Caption: *Keep an eye open for how your changes impact other parts of the tool.*
4. Goes to the blend button and toggles it a few times. Caption: *Toggle blend to see the source or mixed colors in the sliders.*
5. *Have fun!* Bar reads "Start exploring".

The demo starts by setting the groups to RGB + HSB and blend on, and restores the colour it found when it ends or is skipped.

**Anchors it needs** (all present): `#rgb-dot-red|green|blue`, the stem hit lines, `#slider-hsb-h-arrow`, `#blend-toggle`, `#sb-wrapper`, `#demo-button`.

## Open

- Whether to offer the demo on first run, or only from `?`.
- The caption copy above is the prototype's; worth a read-through before it ships.
- Reduced motion: the cursor's arcs and the highlight fades should respect `prefers-reduced-motion`; the highlights already do.

## Implementation plan (next)

Handed to the next session in [[handoff-picker-demo]], which carries the technical map, the DOM anchors and the pointer-event recipes.

Lazy-loaded like the deck, so the picker bundle does not carry it: `src/demo/` with a `DemoOverlay` (cursor, caption bubble, bottom bar) mounted by `ColorPicker` while the demo runs, a `steps.ts` script, and a `drive.ts` that moves the cursor and works the controls.

**Drive the real controls, not the state.** The steps dispatch synthetic `PointerEvent`s at the anchors - `pointerenter` on a stem for its tooltip, `pointerdown` on a joint then `pointermove` on `window`, `pointerup` to release - the way the browser checks in this session already did. Everything the user would see then happens through the app's own handlers: the hold key, the impact highlights, the tooltip fade, the tone. Setting state directly would have to re-implement each of those and drift.

**Order of work.**

1. `drive.ts`: bezier move between screen points, hold and drag helpers, a `wait` that resolves early when the demo is skipped.
2. `DemoOverlay`: cursor symbol (`DemoCursor.tsx`, editable SVG with per-symbol hotspot), caption bubble with side picking, bar with ticks and Skip.
3. `steps.ts`: the five steps above, as data the overlay walks.
4. Wire `#demo-button`; snapshot HSB at start, tween back at the end; any real pointerdown or keydown skips.
5. First-run offer, if wanted: the `color-taylor-demo-seen` key with its reset-all listener.
6. A Playwright spec that runs the demo at speed and asserts the bar's ticks advance and the colour is restored.

**Decide before starting.**

- Auto-offer on first run, or `?` only.
- Whether the demo may run on a narrow viewport (the prototype scrolls targets into view) or is desktop-only for the first cut.
- Caption copy.

## As built

Shipped on `feature/demo` on 2026-09-03. `src/demo/` - `drive.ts`, `steps.ts`, `DemoCursor.tsx`,
`DemoRunner.tsx` - lazy-loaded by `ColorPicker` behind `#demo-button`; `tests/demo.spec.ts`.
Where it differs from the plan above:

- **The caption is a panel in the header, not a bubble at the target**, and it carries the
  progress, the stepper, the narration switch and Skip. [[decision-demo-caption-in-the-header]].
- **Back and Next.** The step index is React state and the effect that plays a step is the player:
  changing the index interrupts the running step at its next await and starts the new one. A step
  reads the colour as it finds it, so stepping back re-runs against the current colour rather than
  rewinding to an earlier one.
- **Narration.** Each step declares an audio file under `public/demo/`, gated by `NARRATION_READY`
  in `steps.ts` until the recordings exist. A step waits for both its choreography and its line, so
  the voice sets the pace where there is one.
- **Pacing** is one `DWELL` block in `steps.ts`, and slower than the prototype's: watching something
  happen takes longer than doing it.
- **The cursor** is the platform's own arrow at roughly three times life size - macOS black with a
  white outline, Windows white with a black one - pivoting on its point with a spring on the
  smoothed velocity, so it leans into a move and swings past centre once when it stops.
- **First run** is not offered; the demo is `?` only, so there is no tenth `localStorage` key.
- **Narrow viewports are in**, not deferred: `bring` scrolls targets into view and the caption panel
  drops below the header and pins to the top of the screen.
- **Caption copy**, step one: "how each one maps to a color channel" rather than "how they map to
  the color hex", which read as the hex code rather than the hexagon.
- **`?demospeed=N`** divides every duration, for the spec. Same shape as `?fps`.
- Two corrections to [[handoff-picker-demo]]'s technical map, both checked in a browser first: a
  dispatched `pointerenter` never reaches React, so hover goes through `pointerover` with
  `bubbles: true`; and a synthetic press on the hue arrow would probably *have* been granted
  pointer lock, since Chrome gates it on sticky activation - `ColorSlider.beginRelative` now skips
  the request for an untrusted press.

