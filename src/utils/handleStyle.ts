/**
 * The shared look of a picked-value handle: a color core inside a ring, with
 * a hairline just inside the ring's outer edge, over a drop shadow.
 *
 * There was a second hairline outside the ring as well. It came out because at
 * alpha 0.28 it was darker than the drop shadow, and being a hard 1px edge with
 * no falloff it read heavier still - the handles looked weightier than anything
 * around them. Separating a light handle from a light field is the drop
 * shadow's job now.
 *
 * Kept here rather than in either component because it is drawn twice: as SVG
 * inside the hexagon, and as a div on the slider tracks. Every number below is
 * declared once and read by both.
 */
export const HANDLE = {
  /** Radius of the color core, before the ring. */
  core: 7,
  /** Thickness of the ring. White on the sliders, channel color on the hexagon. */
  ring: 3,
  /** 1px hairline just inside the ring's outer edge. */
  inner: 'rgba(0,0,0,0.12)',
  /**
   * How much the ring thickens on hover. Matches the vector stems, which go to
   * 1.5x, so the two hover affordances read as the same gesture.
   *
   * It grows outward only: the core the ring encircles has to stay put, or the
   * color you are reading changes size as the pointer crosses it.
   */
  hoverScale: 1.5,

  /**
   * Drop shadow, in parts rather than as a CSS shorthand.
   *
   * The SVG form has to rebuild it: a CSS filter on an SVG element measures in
   * user space, so its lengths pass through pxUnits() or the shadow scales with
   * the viewBox while the slider handles' stays put.
   *
   * Alpha sits in Figma's range - their elevation tokens run 0.1 to 0.2
   * (--shadow-floating-window .15, --shadow-hud .2/.15). Above that the
   * handles read as heavier than anything in the surrounding chrome.
   */
  shadowY: 1,
  shadowBlur: 2.5,
  shadowColor: 'rgba(0,0,0,0.2)',
} as const;

/** Full diameter including the ring, for laying out an HTML handle. */
export const HANDLE_SIZE = (HANDLE.core + HANDLE.ring) * 2;

/** The drop shadow alone, as CSS. */
export const HANDLE_DROP_SHADOW =
  `0 ${HANDLE.shadowY}px ${HANDLE.shadowBlur}px ${HANDLE.shadowColor}`;

/** box-shadow stack for the div form: inner hairline, then the drop shadow. */
export const HANDLE_SHADOW =
  `inset 0 0 0 1px ${HANDLE.inner}, ${HANDLE_DROP_SHADOW}`;

/**
 * Radius the ring is centered on, for a given thickness.
 *
 * An SVG stroke straddles its path, so thickening the ring in place would eat
 * into the core. Holding the ring's inner edge fixed and solving for the center
 * makes it grow outward instead, leaving the visible color untouched.
 */
export const ringRadius = (thickness: number) =>
  HANDLE.core - HANDLE.ring / 2 + thickness / 2;
