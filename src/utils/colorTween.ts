import type { HSB } from './colorConversions';

/**
 * Shared HSB tween maths.
 *
 * Both the app (ColorPicker's animateToHsb) and the Figma plugin animate
 * color the same way. Keeping the timing, easing and rounding here means the
 * two cannot drift - the plugin shipped with a 260 ms tween against the app's
 * 1000 ms before this existed, and it was noticeable.
 */

/** Duration of a color tween, in ms. */
export const HSB_TWEEN_MS = 1000;

export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/** Shortest way round the hue circle, in degrees. */
export function shortestHueDelta(from: number, to: number): number {
  let d = to - from;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * One frame of a tween, at `progress` in 0..1.
 *
 * Rounded to whole units on purpose: the hue and brightness handles render
 * these values into fixed-width pills, and fractional degrees overflow them.
 */
export function hsbAtProgress(from: HSB, target: HSB, progress: number): HSB {
  const t = easeInOutQuad(progress);
  const dh = shortestHueDelta(from.h, target.h);
  return {
    h: Math.round(((((from.h + dh * t) % 360) + 360) % 360)),
    s: Math.round(from.s + (target.s - from.s) * t),
    b: Math.round(from.b + (target.b - from.b) * t),
  };
}
