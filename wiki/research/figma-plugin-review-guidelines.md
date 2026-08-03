---
tags:
  - domain/figma-plugin
  - origin/external-research
  - status/verified
---

# Figma Plugin Review Guidelines

**Read 2026-08-03.** Figma's published rules for getting a plugin into the Community directory, and how Color Taylor measures against them.

## What the guidelines actually say

**Quality and usability**
- Must be finished and work as described. *"Please do not use developer error messages to communicate with end-users."*
- *"We highly recommend matching your plugin or widget to Figma's UI."* Usability problems are grounds for rejection.
- Must not degrade Figma's performance. *"An example of this would be a long-running background process."*
- Accurate description, screenshots and previews.

**Trust and safety**
- No reading or modifying a file without *"explicit awareness and consent"*.
- Official plugin APIs only. No separate packages that manipulate Figma.
- External connections and data sharing must be disclosed; `networkAccess` domains appear on the Community page.

**Business**
- Must be useful to all Community users, not one internal team (otherwise publish to the org).
- **Cannot recreate core Figma functionality.**
- No ads. No general-purpose AI chat interface. No exposing an MCP server.

**Pre-publish checklist** (from the Publishing doc): handle nothing selected, wrong node types, multiple selection, component instances, missing fonts, temporary offline, multiplayer document changes, deleted node references, rotated layers, large documents, and minimize bundle size.

## Audit against Color Taylor, 2026-08-03

| Item | State |
|---|---|
| Matches Figma's UI | Yes - Figma color variables, Inter, 11px scale, their blend glyph, sidebar section rhythm |
| No developer error messages | Fixed 2026-08-03. Both error paths now write prose; the global handler no longer dumps `e.message` |
| Bundle size | 179 KB, from 504 KB |
| Nothing selected / wrong types / multiple | Handled. `"Selected: N"` caption; `if (!(prop in node)) continue`; loops the whole selection |
| Deleted node references | Safe by construction - `figma.currentPage.selection` is re-read every tick, never cached across ticks |
| Multiplayer changes | That is what the change listener is for |
| Missing fonts / rotated layers | Not applicable - no text content, no geometry |
| Offline | Fully offline; `networkAccess: ["none"]` |
| `documentAccess` | `dynamic-page`, required for new plugins |
| **Long-running background process** | **Was a violation.** See below |
| Component instances / locked layers | Writes are per-node try/catch. Correct, but silent - see [[plan-figma-plugin-release]] |
| Plugin id | Still `color-taylor-local-dev`. Blocks publish |
| Recreates core Figma functionality? | **Open risk.** Figma ships a color picker. See [[plan-figma-plugin-release]] Stage 2 |

## The violation found

`code.js` called `figma.loadAllPagesAsync()` on every launch, purely to register `documentchange`. Figma's typings say directly:

> *"If the plugin manifest contains `"documentAccess": "dynamic-page"`, you must first call `loadAllPagesAsync` to access this event. Because this may introduce a loading delay, consider using more granular alternatives, such as the `"stylechange"` event, or using `PageNode.on` with the `"nodechange"` event."*

And the docs on dynamic page loading: *"In very large and complex files, this will result in a significant delay the first time a user opens a file and runs that plugin."*

We only ever read the current page's selection, so the full-document load bought nothing at all. Swapped to `figma.currentPage.on('nodechange')` with no `loadAllPagesAsync`. See [[decision-frame-clocked-follow]].

Also cleaned up: the reposition probe logged its full result to the console on every session. Now only warns on failure.

## Sources

- [Plugin and widget review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines)
- [Publishing](https://developers.figma.com/docs/plugins/publishing/)
- [Manifest](https://developers.figma.com/docs/plugins/manifest/)
- [Accessing the document](https://developers.figma.com/docs/plugins/accessing-document/)
- [Version 1, Update 87](https://developers.figma.com/docs/plugins/updates/2024/02/21/version-1-update-87) - the dynamic-page rollout
