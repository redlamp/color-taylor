# Color Taylor 🎨🧵

![The Color Taylor app icon and name beside the hexagon, a six-cornered color field with red, green and blue vectors drawn across it, and the words "Play with different color models, see how they move together! Get hands-on with how RGB, HSB, and HSL colors relate."](public/og-image.jpg)

Color Taylor is a color playground for seeing how RGB relates to HSB and HSL, and how every slider moves with the others. Drag the channel handles on the hexagon to see how individual R, G and B values map into the space. Pull saturation down and watch three RGB values converge.

**Web app:** https://redlamp.github.io/color-taylor/

**Figma plugin:** https://www.figma.com/community/plugin/1671457712575610716/color-taylor

## What it does

The picker is a hexagon with red, yellow, green, cyan, blue and magenta at the corners and white in the middle. Every color sits somewhere inside it. Around it are a saturation/brightness box, a hue strip, sliders for RGB, HSB, HSL and alpha, a hex field, a named-color matcher, and the equations used to convert between models. Recent and saved swatches persist in `localStorage`, and each drag is its own undo step.

There is also a color synth that maps the current color to sound: hue to pitch, or RGB to a three-voice chord, with configurable tuning, waveform and ADSR. It ships switched off. Turn it on in Settings; nothing audio-related loads until you do.

A slideshow about color history sits behind an unadvertised Intro button: open the app with `?intro` (for example `localhost:5173/?intro`) to show it, or go straight to `#/intro`.

## Demo and walkthrough

The About panel (the `?` button, and the welcome on a first visit) offers two things to watch before you touch anything:

- **Demo**, about 40 seconds. A silent tour of the sliders and the hexagon, driven by a ghost cursor. Any press ends it and hands the color back.
- **Presentation**, about 5.5 minutes. A narrated walkthrough of hue, saturation and brightness, with the author on camera in a corner panel. It drives the real app rather than a recording, so the picker is left on the color it ends on. It is offered whenever the layout has two columns (800 px and wider). While it runs the app is locked: the timeline lets you pause, scrub and **End**, and a click anywhere else asks whether to end it.

The walkthrough's code is `src/demo/`, its cue files and media are under `public/scripts/`, and `docs/demo-script.md` is the reference for both.

## Figma plugin

`figma/` is a Figma plugin that renders the app's real `ColorHexagon` rather than a copy of it, so the two surfaces cannot drift apart. Select a layer, pick a color, and the fill or stroke updates as you drag. It makes no network requests, which the manifest declares.

`bun run build:figma` writes `figma/ui.html`, a generated bundle that is gitignored. Run it once after cloning.

## Tech stack

- TypeScript, with `strict: false` for now (see [#16](https://github.com/redlamp/color-taylor/issues/16))
- React 19
- Vite 8, rolldown bundler
- Tailwind v4 through `@tailwindcss/vite`
- shadcn, style `base-nova`, neutral base, CSS variables
- base-ui primitives
- bun as package manager and script runner

## Quick start

```sh
bun install
bun dev          # localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `bun install` | Install deps from `bun.lock` |
| `bun dev` | Vite dev server with HMR |
| `bun run build` | Production build to `dist/` |
| `bun run preview` | Serve the last build locally |
| `bun run test` | Playwright e2e. Starts its own dev server, or reuses one already on :5173 |
| `bun run lint` | ESLint flat config |
| `bun run typecheck` | `tsc --noEmit`, plus the plugin's own tsconfig |
| `bun run build:figma` | Build the plugin UI bundle |
| `bun run preview:card` | Check the link-preview tags on a build and open a mock of the card |
| `bun run deploy` | Build and publish to `gh-pages` by hand, skipping the tests CI would run |
| `bun run deploy:dev` | Publish the current branch to `gh-pages/dev/` for preview at `redlamp.github.io/color-taylor/dev/`. A `main` deploy replaces the whole branch, so the preview is gone until the next `deploy:dev` |

On the dev server, `?present=<cut>` (for example `?present=cut-05`) opens the walkthrough as an authoring tool: the full timeline with line spans and cue ticks, notes, and the clip editor. A build ignores the parameter. Notes, framing keyframes and clip placements are written to the folder named by `PRESENTATION_NOTES_DIR` in `.env.development.local`; without it those routes answer 404.

## Branch workflow

```
main <- dev <- feature/*
```

Branch off `dev`, open a PR into `dev`, merge with `--no-ff`. Promote `dev` to `main` through a PR when it is ready to ship.

Pushing to `main` runs the tests and then publishes `dist/` to `gh-pages` automatically, so the deploy cannot outrun a failure. `gh-pages` is a build artifact. Never edit it directly.

Work is tracked as [GitHub Issues](https://github.com/redlamp/color-taylor/issues). PRs close them with `Closes #N`.

## Architecture notes

Two top-level views, routed by URL hash:

- `#/` is the color picker
- `#/intro` is the lazy-loaded color-history slideshow

The narrated walkthrough is not a route: it runs on top of the picker at `#/`.

The deeper notes live in [`CLAUDE.md`](./CLAUDE.md): the color math conventions, the HSB-canonical state with its RGB override ref, the hand-rolled rAF tweens, and how undo/redo works. Decisions and their reasoning are in [`wiki/`](./wiki), an Obsidian vault, starting at [`wiki/index.md`](./wiki/index.md).

## License

[MIT](./LICENSE). Do what you like with it, keep the copyright notice, and it comes with no warranty.

It was GPL-3.0 from the initial commit until 2026-08-20, which was the new-repo checkbox rather than a decision. Anything taken from a commit before then is still available under GPL-3.0.
