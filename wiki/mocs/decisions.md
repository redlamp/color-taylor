# Decisions

Every `notes/decision-*.md`, newest first. Each note records what was decided, why, and what was rejected.

## Figma plugin

- [[decision-single-source-picker]] — the plugin renders the app's real `ColorHexagon`; no port, no second copy. **The constraint everything else bends around.**
- [[decision-lite-module-aliases]] — build-time module swaps under `figma/ui/lite/`, plus the alias-ordering trap that cost 140 KB
- [[decision-preact-for-the-panel]] — `preact/compat` in the plugin build only, and what that risks
- [[decision-clientstorage-swatch-seam]] — `localStorage` is unusable in a null-origin iframe; the seam that fixed persistence
- [[decision-frame-clocked-follow]] — the sandbox has no clock, so the iframe drives polling; revised to `nodechange`
- [[decision-content-fit-height]] — height has exactly one source, and the two things that forbids
- [[decision-figma-listing-assets]] — icon and thumbnail generated from the app's own hexagon math *(superseded by [[decision-logo-source]])*
- [[decision-logo-source]] — the designed Figma frames are the source of truth for the logo and thumbnail; the generator is gone

- [[decision-plugin-css-hooks]] — panel CSS selects `data-*`, never a Tailwind class; the 2.9px swatch bug that established it

## App only

- [[decision-settings-sheet]] — Settings is a modal right-edge sheet on base-ui `Dialog`; what the free-floating draggable panel had accumulated, and why the drag went
- [[decision-integrations-footer]] — "Also available in" as a data-driven list, and why the Figma link stays unrendered until the listing is public
- [[decision-border-color-effects]] — Anodised as the resting style, with a hue- and saturation-derived glow and rim light on top; four reasons it stops at the app
- [[decision-audio-off-by-default]] — every audible thing behind one setting, off until asked for
- [[decision-color-editor-is-the-panel]] — the SB box is the right column's subject, not a section in it; "Sliders" was one level too low
- [[decision-both-columns-absorb-slack]] — both columns stretch unconditionally because each owns a permanent absorber; how a 10px caption broke the old arrangement

## Shared app + plugin

- [[decision-panel-collapse-animates-by-grid-rows]] — `0fr` → `1fr` instead of unmounting or measuring, and the four traps in it
- [[decision-scoped-slider-ids]] — slider ids namespaced by color model; fixed three duplicate-id collisions and two ambiguous accessible names
- [[decision-saved-grows-in-banks]] — Saved grows a row of 12 at a time to a ceiling of 36; size derived from content, not stored
- [[decision-alpha-in-swatch-identity]] — a swatch is `{hex, alpha}`, not a color with a side map
- [[decision-audio-as-optional-module]] — audio is a loadable module, separated on principle rather than for bytes

## Recorded in git only

Decisions from before the wiki existed (2026-03 to 2026-05) are visible in the daily notes but were never written up. Worth backfilling if any of them come back into question:

- HSB is canonical, RGB carries an override ref (the pattern `main.tsx` has to mirror)
- GitHub Issues over `TODO.md` (2026-05-18)
- Saved slot ordering is a user arrangement rendered through a sort view, not a sorted store (2026-05-16)
- Presentation cells tween by identity, not slot index (2026-04-02)
