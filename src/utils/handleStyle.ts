/**
 * The shared look of a picked-value handle: a colour core inside a white ring,
 * with a hairline on each side of the ring.
 *
 * Both hairlines earn their place. The outer one is what keeps a white handle
 * visible on a white field - without it the ring dissolves into the background,
 * which is the one case the old marker failed outright. The inner one stops a
 * pale core bleeding into the ring from the other side.
 *
 * Kept here rather than in either component because it is drawn twice: as SVG
 * inside the hexagon, and as a div on the slider tracks. Same numbers, two
 * renderers.
 */
export const HANDLE = {
  /** Radius of the colour core, before the ring. */
  core: 7,
  /** Thickness of the white ring. */
  ring: 3,
  outer: 'rgba(0,0,0,0.28)',
  inner: 'rgba(0,0,0,0.12)',
  shadow: '0 1px 2.5px rgba(0,0,0,0.45)',
} as const;

/** Full diameter including the ring, for laying out an HTML handle. */
export const HANDLE_SIZE = (HANDLE.core + HANDLE.ring) * 2;

/** box-shadow stack for the div form: outer hairline, inner hairline, drop. */
export const HANDLE_SHADOW =
  `0 0 0 1px ${HANDLE.outer}, inset 0 0 0 1px ${HANDLE.inner}, ${HANDLE.shadow}`;
