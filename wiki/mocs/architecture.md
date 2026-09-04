# Architecture

How Color Taylor is put together. For build commands and code conventions see the root `CLAUDE.md`.

## Three surfaces, one picker

| Surface | Entry | Notes |
|---|---|---|
| App | `src/components/ColorPicker.tsx` | the full picker — hexagon, sliders, equations, conversions, saved/recent |
| Presentation | `src/presentation/PresentationStage.tsx` | hash-routed slide deck; retro Mac CLUT palettes |
| Figma plugin | `figma/ui/main.tsx` | see [[figma-plugin]] |

All three render the same `src/components/ColorHexagon.tsx`. The plugin does it without a port — [[decision-single-source-picker]].

## Color state

**HSB is canonical.** RGB carries an override ref rather than being derived every frame, because round-tripping through HSB loses information at low saturation and the value drifts as you drag. Any new surface has to mirror this or it will exhibit the drift.

HSL is derived and written back within its own model — HSL's saturation is not HSB's saturation for the same color, so a slider block reads and writes entirely inside one model.

## Rendering

- The hexagon's interior field is a fragment shader (`src/components/hex/hexShader.ts`), moved there for performance on 2026-08-02.
- Handles are a single styled source, `src/utils/handleStyle.ts` — core, ring, hover growth and drop shadow all come from one place so the hexagon and the sliders can't diverge.
- Constant-width strokes scale with `pxUnits(n) = n * uiScale` so a 2px line stays 2px at any panel size, rather than thinning to sub-pixel.
- **Impact highlights.** While the pointer holds a control, everything else that moved lights until release. `useImpact` diffs the readouts against a snapshot taken at the press, keyed by `data-hold` tags; the keyline tokens are in `src/utils/highlight.ts` and its two colours in `index.css`. The ground for the self-running demo — [[plan-picker-demo]], built and behind the `?` button; its caption panel is [[decision-demo-caption-in-the-header]] and where its gestures end is [[decision-demo-lands-on-one-colour]].

## Shared modules worth knowing

| Module | Role |
|---|---|
| `src/utils/colorConversions.ts` | the color math |
| `src/utils/sliderGradients.ts` | track gradients, blend and channel variants |
| `src/utils/handleStyle.ts` | one handle treatment for every surface |
| `src/utils/swatchStore.ts` | the storage seam — [[decision-clientstorage-swatch-seam]] |
| `src/hooks/useDrag.ts` | shared pointer drag, since 2026-03-28 |
| `src/hooks/useUiSounds.ts` | interface sounds — [[decision-audio-as-optional-module]] |
| `src/utils/toneControllerLazy.ts` | the color-driven hold tone, lazily loaded |

## Conventions that are load-bearing

- **Determinism of identity.** A swatch is `{hex, alpha}` and compares as one value — [[decision-alpha-in-swatch-identity]].
- **Slider ids are namespaced by color model.** Labels are single letters and collide across models — [[decision-scoped-slider-ids]].
- **The plugin build is a canary.** `bun run build:figma` belongs in the gate set: it's what catches an app change the Preact runtime can't support — [[decision-preact-for-the-panel]].
- **Every column owns an absorber.** The picker's two columns stretch to a shared row height, so each needs something that soaks up the difference — `#hex-stage` left, `#sb-wrapper` right. A change to either column's content moves that difference, and nothing errors when it goes wrong — [[decision-both-columns-absorb-slack]].

## Gates

```
bun run lint && bun run typecheck && bun run build && bun run build:figma
```

Never pipe these through `tail` in an `&&` chain — the pipe masks the exit code.
