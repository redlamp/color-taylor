/**
 * Inert stand-in for src/hooks/useColorEffects.
 *
 * The colour-reactive glow and rim light are an app treatment, not part of the
 * picker, and a Figma panel does not want them: the panel is chrome inside
 * someone else's chrome, so a surround that shifts hue as you drag fights the
 * host UI rather than complementing it. Figma's own panels hold still.
 *
 * Four separate things keep the effects out of the panel, and this alias is the
 * weakest of them - worth knowing before anyone decides it is redundant:
 *
 *   1. main.tsx renders ColorHexagon, not ColorPicker, and only ColorPicker
 *      calls the hook. So it is never reached. This is the real reason.
 *   2. The hexagon is rendered `bare`, so its shell omits `panel-frame` - which
 *      is what the glow attaches to.
 *   3. Sections are rendered `sectionVariant="flush"`, so they omit
 *      `panel-inset` - which is what the rim light attaches to.
 *   4. This alias, so the hook's rAF loop and per-frame conic gradient cannot
 *      reach the bundle even if something in ColorHexagon started importing it.
 *
 * The CSS rules do still ship, because figma.css imports src/index.css - but
 * every custom property they read defaults to `transparent`, and figma.css ends
 * with an explicit `display: none` on both pseudo-elements. The app is
 * unaffected and keeps its own `color-taylor-effects` switch.
 */
interface Hsb {
  h: number;
  s: number;
  b: number;
}

interface Options {
  enabled: boolean;
  hsb: Hsb;
  isDark: boolean;
}

export default function useColorEffects(_options: Options): void {
  /* nothing to do */
}
