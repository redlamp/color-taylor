/**
 * The one way this app says "this is what is changing right now".
 *
 * A white keyline hugging the edge of the thing, over a tight dark shadow so it
 * reads on a light field as well as a dark one. It arrives fast and leaves
 * slowly, as an opacity crossfade of a second element that is always in the
 * DOM - never a class toggled per frame, which is what made an earlier attempt
 * flash. Whatever the pointer holds keeps its highlights up until release; see
 * useImpact for who lights what.
 *
 * Shared by the hexagon's callout lines, the slider tracks and the hue badge,
 * so the three cannot drift apart the way three hand-written copies did.
 */
/**
 * The keylines' colours, from src/index.css. CSS variables rather than
 * constants so SVG strokes and box-shadows both follow the theme with no prop
 * threading.
 *
 * Two, because they sit on different grounds. The sliders are on the panel,
 * so `--highlight-line` is set per theme under `:root` and `.dark`. The
 * hexagon's stems, joints and callout lines are on the colour field, which
 * looks the same in both themes, so `--highlight-hex` is set once.
 */
export const SLIDER_HIGHLIGHT_COLOR = 'var(--highlight-line)';
export const HEX_HIGHLIGHT_COLOR = 'var(--highlight-hex)';

export const HIGHLIGHT_IN = 'transition-opacity duration-150 ease-out motion-reduce:transition-none';
export const HIGHLIGHT_OUT = 'transition-opacity duration-500 ease-out motion-reduce:transition-none';

/** SVG props for a lit line on the hexagon: round-capped, shadowed. */
export const CALLOUT_LINE = {
  stroke: HEX_HIGHLIGHT_COLOR,
  strokeLinecap: 'round' as const,
  style: { filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' },
};

/** The slider's keyline as a CSS box-shadow, for the track overlay. */
export const CALLOUT_BOX_SHADOW = `inset 0 0 0 1px ${SLIDER_HIGHLIGHT_COLOR}, 0 0 0 1px ${SLIDER_HIGHLIGHT_COLOR}, 0 1px 3px 1px rgba(0,0,0,0.4)`;
