import type { RGB } from '../utils/colorConversions';

/**
 * The three RGB channels across the hue circle.
 *
 * Sweep a colour's hue round and its red, green and blue each trace the same
 * wave, 120 degrees apart: flat at the top for a third of the circle, a
 * straight fall over a sixth, flat at the bottom for a third, a straight rise
 * over the last sixth. The top of the wave is the colour's largest channel and
 * the bottom is its smallest, and those two numbers are the *only* thing the
 * shape depends on - not on which model the sliders are showing.
 *
 * That is why one graph serves both slider groups. hsbToRgb(h, s, b) holds
 * max = b and min = b(1 - s) fixed while h moves; hslToRgb(h, s, l) holds
 * max = l + c/2 and min = l - c/2 fixed. Both are rgbAtHue with a different
 * way of naming the same two rails - see wiki/notes/rgb-waves-are-max-and-min.
 */

/**
 * How far from min toward max a channel sits at hue `h`, for a channel whose
 * peak is centred on `offset` degrees: red 0, green 120, blue 240. 1 across
 * the 120 degrees around the peak, 0 across the 120 opposite, linear between.
 */
export function channelWeight(h: number, offset: number): number {
  const k = ((((h - offset) / 60) % 6) + 6) % 6;
  return Math.max(0, Math.min(1, Math.abs(k - 3) - 1));
}

export const CHANNEL_OFFSET = { r: 0, g: 120, b: 240 } as const;

/** The colour at hue `h` with these two rails. Unrounded. */
export function rgbAtHue(h: number, max: number, min: number): RGB {
  const span = max - min;
  return {
    r: min + span * channelWeight(h, CHANNEL_OFFSET.r),
    g: min + span * channelWeight(h, CHANNEL_OFFSET.g),
    b: min + span * channelWeight(h, CHANNEL_OFFSET.b),
  };
}

/**
 * The hue of a colour, unrounded, so a marker placed at it lands exactly on
 * the wave. `null` for a grey, which has no hue of its own.
 */
export function exactHue({ r, g, b }: RGB): number | null {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return null;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/**
 * The two rails and what each model reads off them, all on the 0-255 scale.
 *
 *   B (HSB)  = max
 *   S (HSB)  = (max - min) / max
 *   L (HSL)  = (max + min) / 2
 *   S (HSL)  = (max - min) / (1 - |2L - 1|)   - over the room left to the nearer end
 */
export function rails({ r, g, b }: RGB) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  const mid = (max + min) / 2;
  const l = mid / 255;
  const hslRoom = 1 - Math.abs(2 * l - 1);
  return {
    max, min, span, mid,
    hsbB: max / 255,
    hsbS: max === 0 ? 0 : span / max,
    hslL: l,
    hslS: hslRoom === 0 ? 0 : span / 255 / hslRoom,
  };
}
