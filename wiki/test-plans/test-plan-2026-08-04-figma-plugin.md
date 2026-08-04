# Test Plan: Figma Plugin, First Real Pass

**Target session:** 2026-08-04 · **Branch:** `feat/figma-plugin` · **Plan:** [[plan-figma-plugin-release]]

Everything below has only ever been exercised in headless Chromium against the built `ui.html`. This is the first pass inside real Figma. Sections 1-4 are the ones where Chromium and Figma can genuinely disagree; 5-8 are confirmation of behavior that should already work.

## Setup

- Figma **desktop app** — importing a local plugin needs filesystem access, so the browser won't do.
- `bun run build:figma` once, then `Ctrl+/` → Import plugin from manifest… → `figma/manifest.json`.
- Leave `bun run watch:figma` running; use Plugins → Development → **Hot reload plugin** after a rebuild. Only `manifest.json` changes need a re-import.
- Open the console (Plugins → Development → Show/Hide console) for sections 1 and 3.

---

## 1. Persistence — the one that was actually broken

Swatches never survived a session before today. This is the highest-value section.

1. [ ] Save 3 swatches, one of them at partial alpha. Close the plugin. Reopen. All 3 are there, alpha intact.
2. [ ] Close the **file** entirely, reopen it, run the plugin. Swatches still there.
3. [ ] Pick colors to fill Recent, close and reopen. Recent survives.
4. [ ] Drag-reorder Saved, close and reopen. The order is the one you left.
5. [ ] Clear Saved (confirm the two-click arm), reopen. It stays cleared — an empty state must persist as emptiness, not resurrect the old data.
6. [ ] Console is free of `could not read saved swatches` / `could not save swatches` warnings.

## 2. Following Figma's own picker — `nodechange`

Swapped from `documentchange` on 2026-08-03 and never run in Figma. If this section fails, that change is the suspect.

1. [ ] Select a layer. Change its fill from Figma's right rail. Our picker follows, and follows *smoothly* rather than in one late jump.
2. [ ] Same for stroke, with the Stroke tab active.
3. [ ] **Switch pages**, select a layer on the new page, change its fill from the right rail. Still follows. (This is the specific risk: the listener is per-page and has to be re-attached.)
4. [ ] Switch back to the first page. Still follows.
5. [ ] Drag *our* picker. The layer repaints live and the picker does not fight itself or stutter.
6. [ ] Open a large file (many pages, heavy content). The plugin opens without a stall. This is what removing `loadAllPagesAsync` was for.

## 3. Window sizing and position

The reposition probe measures a real Figma window for the first time.

1. [ ] Drag the **east** edge. Width changes, panel stays put.
2. [ ] Drag the **west** edge. The east edge stays anchored and the panel does not walk, drift downward, or fly off-screen.
3. [ ] Drag the **south** edge and the **SW / SE** corners.
4. [ ] Console: if west anchoring is unavailable you'll see one `west-edge anchoring off` warning and the west edge should behave like the east. Either outcome is a pass; silence plus correct anchoring is the good one.
5. [ ] Collapse every section. The panel shrinks to fit with no dead space below the content.
6. [ ] Expand everything on a small screen so the fit exceeds the display. Figma clamps it and the panel scrolls.
7. [ ] Close and reopen. Width is remembered; height is a fresh fit to content (**not** the height you left).

## 4. Pointer lock on the hue slider

The wrapping hue drag asks for pointer lock. The plugin iframe may not carry `allow="pointer-lock"`, in which case it must degrade rather than break.

1. [ ] Enable HSB. Drag the H handle past the right end of the track — the value keeps going and wraps through 0.
2. [ ] Keep dragging well past the edge of the panel, and past the edge of the screen. It keeps counting.
3. [ ] Release. The cursor is back and behaves normally.
4. [ ] Same on HSL's H.

## 5. Painting

1. [ ] Nothing selected — the header reads `Selected: 0` and picking a color paints nothing and throws nothing.
2. [ ] One layer, multiple layers, and a mixed selection (frame + text + vector).
3. [ ] A layer with **no** fill gets one. A **gradient-only** layer gets a solid appended, gradient intact.
4. [ ] A **locked** layer, and a layer inside a **component instance**. Nothing crashes. *(Known: the failure is silent — see Known/Parked.)*
5. [ ] Stroke tab on a zero-weight stroke: weight becomes 1 so the paint is visible.
6. [ ] The **None** tab reads the selection but never writes.
7. [ ] Select a layer. Our picker adopts its color and does **not** immediately repaint it with what it already had.

## 6. Undo

1. [ ] One drag of the hexagon, then Ctrl+Z. It undoes that gesture, not the whole session.
2. [ ] Three separate gestures = three undo steps.
3. [ ] Click a vertex letter (R/Y/G/C/B/M) to tween, then undo. One step.

## 7. Theme and type

1. [ ] Open in light theme, then flip Figma to dark **while the plugin is open**. The panel follows; vertex letters stay legible in both.
2. [ ] Text size and weight sit next to Figma's own panels without looking off.
3. [ ] The dotted limit hexagon and the hue connector read as 2px at a narrow panel width and at a wide one.

## 8. Sliders and swatches

1. [ ] Toggle RGB / HSB / HSL / A on and off in every combination. Dividers land between groups, never above the first.
2. [ ] Blend toggle **on**: every track shows the color in context. **Off**: H is a full-saturation rainbow, S is white→hue, B is black→hue, L is black→hue→white, and alpha still shows the source color in both.
3. [ ] The blend toggle is operable with RGB off.
4. [ ] Saved sort cycles `User → Hue → Sat → Bright → Alpha → User`.
5. [ ] Recent Clear, Saved Reset and Saved Clear each need two clicks; the armed state reads "Sure?" and disarms itself after ~3s.
6. [ ] Swatch alpha chips: left half solid, right half over checkerboard, no bleed past the rounded corner.
7. [ ] Clicking a swatch restores both its color and its alpha, tweening together rather than the alpha snapping.
8. [ ] Scroll wheel over the panel scrolls the panel (it adjusts brightness in the app — the plugin must differ here).
9. [ ] The scrollbar is grabbable, and grabbing near it doesn't trigger the resize cursor.
10. [ ] Saved starts at 12 slots. Filling the last free one adds a row; keep going and it caps at 36 (6 rows narrow, 3 wide). Deleting back down drops the row again.
11. [ ] Cycle Sort through all five labels and arm both Defaults and Clear. No button changes width, and none of them shove the others sideways.
12. [ ] Drag a saved color onto the trash: it turns red and grows, and dropping deletes exactly that color (not two).
13. [ ] Drag a color out of the grid entirely - still deletes, as before.
14. [ ] Drag a Recent color onto a Saved slot: it copies in, and Recent keeps its own. Dropping on a filled slot replaces it; there are no insert-between markers for this drag.
15. [ ] Clicking anywhere in the Recent/Saved header band - including the padding above the title - opens and closes the section, and clicking Sort/Defaults/Clear does not.

---

## Known / Parked

Do not re-report these.

- **Locked-layer writes fail silently.** `applyPaint` swallows per-node errors because it runs every drag frame. If *all* selected nodes reject, there is no feedback. A `figma.notify` on `commit` when nothing landed is the fix; not done.
- **The slider track isn't keyboard-focusable.** `role="slider"` with no `tabIndex`. The numeric input beside it is fully operable, so a keyboard path exists.
- **`manifest.json` id is `color-taylor-local-dev`** — correct for local development, replaced at publish.
- **Color variables / styles binding** — not implemented.
- **Duplicate DOM ids** — fixed and verified 2026-08-03 ([[decision-scoped-slider-ids]]). Nothing to test by hand.
