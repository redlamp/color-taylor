---
tags:
  - domain/figma-plugin
  - status/open
---

# Plan: Getting The Figma Plugin Out

**2026-08-03.** What stands between the current state and a Figma Community listing.

The plugin works and has been gate-verified, but **every test so far has been synthetic Chromium against the built `ui.html`**. Nothing has been confirmed inside real Figma. That is the single largest gap and it gates everything else.

## Stage 1 — Confirm in real Figma

Work through [[test-plan-2026-08-04-figma-plugin]]. Until this passes, treat all plugin behavior as unverified regardless of what the harness reports.

The items most likely to behave differently in Figma than in Chromium:

- **`clientStorage` persistence** — tested against a `localStorage`-throwing stub, never against Figma
- **Pointer lock on the wrapping hue slider** — the plugin iframe may not carry `allow="pointer-lock"`; the code treats it as a bonus, but the fallback path is untested in situ
- **`figma.ui.reposition` probe** — the west-edge measurement runs on a real Figma window for the first time
- **`nodechange`** — swapped in today, never run in Figma at all
- **Theme sync** — `figma-dark` mirroring, flipping mid-session
- **Undo granularity** — one entry per gesture

## Stage 2 — Decide the scope of the listing

Two questions to answer before writing any listing copy.

**Is this "recreating core Figma functionality"?** The review guidelines list that as a rejection reason, and Figma ships a color picker. The defensible position is that this is a different *color model* - a hexagon showing the RGB/HSB/HSL relationship, with harmonies and a persistent swatch library - not a reimplementation of their picker. That distinction has to be visible in the listing's first sentence and first screenshot, not buried. Worth deciding deliberately rather than discovering at review.

**Which editors?** `editorType` is `["figma"]` today. Slides and Buzz would plausibly work and would widen the audience, but each needs testing before being claimed.

## Stage 3 — Pre-submission checklist

- [ ] **Plugin id.** `manifest.json` still says `color-taylor-local-dev`. Figma assigns the real id when the plugin is created in the desktop app; the placeholder must be replaced with it.
- [ ] **Icon** (128x128) and **cover art** (1920x960). `figma/icon.svg` exists but the listing assets do not.
- [ ] **Listing copy** — description, screenshots, and the positioning decided in Stage 2.
- [ ] **Support contact.** The guidelines require an established way for users to reach you.
- [ ] **Privacy.** Nothing leaves the plugin; swatches live in `clientStorage` on the user's machine. `networkAccess` is already `["none"]`. The listing should say so plainly. A privacy policy is required only if user data is processed - it isn't, but state that rather than leaving it blank.
- [ ] Review the Developer Terms, Creator Agreement, and Community Terms.

## Known gaps, deliberately not blocking

- **Silent failure on locked layers.** `applyPaint` swallows write errors per node, because it runs on every drag frame. If *every* selected node rejects the write the user gets no feedback at all. A single `figma.notify` on `commit` when nothing landed would fix it; not done.
- **Keyboard operability.** The slider track is `role="slider"` with no `tabIndex`. The numeric input beside it is fully keyboard-operable, so there is a path - but not on the track itself, and not at all when `stepper="none"` (presentation view only).
- **Color variables and styles binding.** Not implemented.

## Sources

[Plugin and widget review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines) - [Publishing](https://developers.figma.com/docs/plugins/publishing/) - [Manifest](https://developers.figma.com/docs/plugins/manifest/)
