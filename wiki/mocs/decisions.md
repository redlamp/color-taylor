# Decisions

Every `notes/decision-*.md`, newest first. Each note records what was decided, why, and what was rejected.

## Figma plugin

- [[decision-single-source-picker]] — the plugin renders the app's real `ColorHexagon`; no port, no second copy. **The constraint everything else bends around.**
- [[decision-lite-module-aliases]] — build-time module swaps under `figma/ui/lite/`, plus the alias-ordering trap that cost 140 KB
- [[decision-preact-for-the-panel]] — `preact/compat` in the plugin build only, and what that risks
- [[decision-clientstorage-swatch-seam]] — `localStorage` is unusable in a null-origin iframe; the seam that fixed persistence
- [[decision-frame-clocked-follow]] — the sandbox has no clock, so the iframe drives polling; revised to `nodechange`
- [[decision-content-fit-height]] — height has exactly one source, and the two things that forbids

## Shared app + plugin

- [[decision-scoped-slider-ids]] — slider ids namespaced by color model; fixed three duplicate-id collisions and two ambiguous accessible names
- [[decision-alpha-in-swatch-identity]] — a swatch is `{hex, alpha}`, not a color with a side map
- [[decision-audio-as-optional-module]] — audio is a loadable module, separated on principle rather than for bytes

## Recorded in git only

Decisions from before the wiki existed (2026-03 to 2026-05) are visible in the daily notes but were never written up. Worth backfilling if any of them come back into question:

- HSB is canonical, RGB carries an override ref (the pattern `main.tsx` has to mirror)
- GitHub Issues over `TODO.md` (2026-05-18)
- Saved slot ordering is a user arrangement rendered through a sort view, not a sorted store (2026-05-16)
- Presentation cells tween by identity, not slot index (2026-04-02)
