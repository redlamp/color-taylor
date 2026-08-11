---
tags:
  - domain/figma-plugin
  - domain/bundle
  - status/adopted
---

# Decision: Lite Aliases For The Panel

**2026-08-03.** Modules the panel doesn't need are swapped at build time for minimal stand-ins under `figma/ui/lite/`, rather than being tree-shaken (they can't be) or forked (see [[decision-single-source-picker]]).

## The problem

Several of the heaviest imports are pulled in through *runtime props*, so no bundler can drop them:

- the color-name table is only read when `showHtmlOnHex` is on
- the brightness bar only renders when `blBar` is on
- Base UI Tooltip was 66 KB of positioning engine, collision detection, safe-polygon hover paths and dismissal handling - to label six letters and a few icon buttons that already carry `aria-label`

## What is swapped

| Aliased away | Replaced with | Reason |
|---|---|---|
| `ui/tooltip`, `ui/tabs`, `ui/toggle-group`, `ui/button`, `ui/input` | `lite/*.tsx` | drops Base UI entirely, not mostly |
| `@/lib/utils` | `lite/cn.ts` | tailwind-merge is 26 KB of runtime class-conflict resolution |
| `utils/swatchStore` | `lite/swatch-store.ts` | see [[decision-clientstorage-swatch-seam]] |
| `utils/namedColors`, `hex/Brightness*` | stubs | dead behind runtime props |
| `hooks/useUiSounds` | `lite/ui-sounds.ts` | see [[decision-audio-as-optional-module]] |
| `utils/toneControllerLazy` | `ui/silent-tone.ts` | ~17 KB synth; with codeSplitting off its dynamic import inlines |
| `@fontsource/*` | `ui/empty.css` | ~700 KB of woff2 to gain Barlow in a side panel |

## The trap: alias order is load-bearing

Vite walks the alias array **in order**, and a bare `{find: '@'}` matches any `@/...` importee. Put it first and it rewrites every specific rule's target to a resolved path before those rules are ever consulted.

The first attempt at this saved **8 KB instead of 150 KB** for exactly that reason, and the failure is silent - the build succeeds, the plugin works, the bundle is just fat. The `{find: '@'}` entry must stay last in `figma/vite.figma.config.ts`, and there is a comment there saying so.

## Result

504 KB → 175 KB, with Preact accounting for roughly half. Currently 179 KB after later additions.
