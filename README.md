# Color Taylor 🎨🧵

A color picker designed to show the relationship between RGB (Red, Green, Blue) and HSB/HSL (Hue, Saturation, Brightness/Lightness). The primary goal is to illustrate the math and behavior that connect color modes, helping designers understand each mode and how it shapes their process.

**Live:** https://redlamp.github.io/color-taylor/

## What it does

- **Color picker** — custom hex-shaped color wheel with brightness/lightness bar, RGB / HSB / HSL sliders, hex input, named-color matcher, recent + saved swatches, undo/redo.
- **Color synth** — maps the current color to audio. Two modes: hue → pitch ("Hue voice") or RGB → three-voice chord ("RGB chord"). Configurable chord shape, tuning (just / equal), oscillator waveform, ADSR, detune spread.
- **History presentation** — a short narrated slideshow about color history (1-bit → 4-bit → 8-bit eras, named CSS colors, sRGB vs linear). Press the **Intro** button to launch.

## Tech stack

- TypeScript (with `strict: false` for now — see [#16](https://github.com/redlamp/color-taylor/issues/16))
- React 19
- Vite 8 (rolldown bundler)
- Tailwind v4 via `@tailwindcss/vite`
- shadcn (style `base-nova`, neutral base, CSS variables)
- base-ui primitives
- bun (package manager + script runner)

## Quick start

```sh
bun install
bun dev          # localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `bun install` | Install deps (uses `bun.lock`) |
| `bun dev` | Vite dev server with HMR |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Serve last build locally |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint flat config |
| `bun run deploy` | Build with GitHub Pages base path + publish to `gh-pages` branch (production root) |
| `bun run deploy:dev` | Build + publish current branch to the `dev/` subfolder of `gh-pages` for mobile preview at `redlamp.github.io/color-taylor/dev/` |

## Branch workflow

```
main ← dev ← feature/*
```

- Branch features off `dev`. Open PR → `dev`. Merge with `--no-ff`.
- Promote `dev → main` only when ready to ship. Tracked via PR for visibility.
- Deploy (`bun run deploy`) runs from `main` only. `gh-pages` is the published artifact branch — never edit it directly.
- Tasks tracked as [GitHub Issues](https://github.com/redlamp/color-taylor/issues). PRs link via `Closes #N`.

## Architecture notes

The app is a single-page SPA with two top-level views routed by URL hash:

- `#/` (default) → the color picker
- `#/presentation` / `#/presentation/N` → lazy-loaded slideshow

Deep architecture notes — color math conventions, the `HSB-canonical + RGB-override-ref` state pattern, the manual rAF tween loops, undo/redo strategy — live in [`CLAUDE.md`](./CLAUDE.md).

## License

Personal project. No license file — assume all rights reserved unless otherwise noted.
