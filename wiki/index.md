# Color Taylor Wiki

Top-level Map of Content. See `CLAUDE.md` in this folder for conventions.

**Color Taylor** — a color picker built around a hexagon that shows the RGB/HSB/HSL relationship, with a presentation mode on the history of Mac color palettes, and a Figma plugin that runs the same picker inside Figma.

## MOCs

- [[architecture]] — how the three surfaces share one picker
- [[decisions]] — every decision note, and what hasn't been written up
- [[figma-plugin]] — the plugin: status, decisions, platform knowledge

## Active

- [[plan-figma-plugin-release]] — **done: the plugin is approved and live** (2026-08-18). Hands on three follow-ups: deploy the app, widen `editorType` to FigJam/Slides, capture the carousel screenshots.
- [[test-plan-2026-08-04-figma-plugin]] — the first deliberate real-Figma pass, 8 sections, still outstanding
- [[plan-teaching-rgb-to-hsb]] — how to teach the tool and the subject; proposed intro-deck script changes, not yet applied

## Concepts

- [[hexagon-is-the-cube-down-its-diagonal]] — the geometry the picker is built on, and the interactive proof in `docs/prototypes/rgb-cube/`

## Research

- [[research/hsl-degenerate-states]] — where each colour model gives out, what CSS Color 4 calls it, and the hexagon claim part-verified
- [[research/figma-plugin-review-guidelines]] — Figma's published rules, and where Color Taylor stood on 2026-08-03
- [[research/figma-plugin-platform-constraints]] — what the sandbox and the plugin iframe can't do

## Daily

`wiki/daily/YYYY-MM-DD.md`. Dailies before 2026-08-01 were reconstructed from git history on 2026-08-03 and are marked as such.

- [[2026-08-24]] — the colour model session: strict TS, radius is chroma, and the HSL edge cases
- [[2026-08-19]] — shipped; the coordinate-space and zoom bugs behind west-edge resize; what Figma owns
- [[2026-08-18]] — plugin approved, logo and favicons, settings sheet, the banner

- [[2026-08-13]] — intro deck fixes shipped; the RGB cube prototype
- [[2026-08-11]] — the design-system pass, audio behind a flag, CI gate, listing artboards, and a 2.9px swatch bug
- [[2026-08-04]] — Saved grows in banks of 12, header hit area
- [[2026-08-03]] — duplicate ids, guidelines audit, swatch persistence, this wiki
- [[2026-08-02]] — west-edge resize settles; following Figma's own picker
- [[2026-08-01]] — the plugin exists
- [[2026-05-22]] — Playwright, CI, TS strict
- [[2026-05-21]] — responsive layout
- [[2026-05-20]] — React-correctness sweep (#36)
- [[2026-05-18]] — GitHub Issues over TODO.md
- [[2026-05-17]] — color-to-synth tones
- [[2026-05-16]] — TypeScript migration, mobile, the Saved panel
- [[2026-04-03]] — presentation mode merged
- [[2026-04-02]] — 70 commits; the Mac CLUT palettes
- [[2026-03-30]] — renamed to Color Taylor
- [[2026-03-29]] — sRGB/Linear toggle
- [[2026-03-28]] — day one

## Elsewhere

- Backlog: [GitHub Issues](https://github.com/redlamp/color-taylor/issues)
- Build and code conventions: `CLAUDE.md` at the repo root
- Plugin build/load instructions: `figma/README.md`
