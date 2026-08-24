/**
 * Writing one HSL channel, for hosts whose colour state is HSB.
 *
 * Shared because there are two of them - the app's ColorPicker and the plugin's
 * figma/ui/main.tsx - and they had drifted into two copies of the same
 * conversion with the same two defects.
 *
 * ## Why a write needs more than a conversion
 *
 * HSL is not stored anywhere. It is derived from the current colour on every
 * read, edited, and converted back. Two things go wrong on that trip:
 *
 * **The neutral axis has no hue or saturation to derive.** Black, white and
 * grey all report `h = 0, s = 0`, so dragging lightness to either end and
 * returning left the colour grey rather than where it started. `origin` carries
 * what the gesture began with, and the hue is written through into the returned
 * HSB rather than taken from the conversion, so it survives in state too.
 *
 * **Stored HSB is rounded to whole numbers.** An RGB colour round-tripped
 * through it comes back changed 81.5% of the time, so two adjacent HSL
 * saturations can collapse into one HSB bucket - which is why the stepper
 * appeared stuck at #2B6FD6 and why a longer drag jumped two steps at once.
 * The exact RGB is returned alongside so the caller can stash it in its
 * `rgbOverride`, the same escape hatch the RGB and hex inputs already use.
 * Deriving the *next* edit from that exact RGB rather than from rounded HSB is
 * what keeps a run of edits from degrading.
 */
import { rgbToHsb, hslToRgb, type HSB, type HSL, type RGB } from './colorConversions';

/** The whole HSL colour a gesture started from. */
export interface HslOrigin {
  h: number;
  s: number;
  l: number;
}

export interface HslWrite {
  /** Exact, for the caller's rgbOverride - do not re-derive this from `hsb`. */
  rgb: RGB;
  /** For state. `h` is carried through rather than converted. */
  hsb: HSB;
  /** What was asked for. Show this while the gesture runs rather than
   *  re-deriving from `rgb`, which lands a point either side and jitters. */
  hsl: HSL;
}

/**
 * Everything the gesture is not touching is held at what it started as.
 *
 * The obvious implementation re-reads all three channels from the current
 * colour each time and replaces one. That looks harmless and is not: the colour
 * is 8-bit, so each write rounds, and re-deriving from the rounded result feeds
 * that error into the next frame. Across one drag of L the saturation field
 * wandered by up to 9 points and the hue by more - the stutter you see while
 * dragging.
 *
 * Holding the other two makes the drift exactly zero rather than merely small,
 * and it is also what "saturation only changes saturation" means. The colour
 * can still land up to a point away from the frozen values when the gesture
 * ends and the fields re-derive, but that is a single settle rather than
 * continuous noise.
 *
 * @param origin what the gesture began with - the HSL that was on screen, with
 *               hue taken from HSB if that colour was achromatic
 */
export function writeHslChannel(
  channel: 'h' | 's' | 'l',
  value: number,
  origin: HslOrigin,
): HslWrite {
  const next = { h: origin.h, s: origin.s, l: origin.l, [channel]: value };
  const rgb = hslToRgb(next.h, next.s, next.l);
  const asHsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

  // `h` from the origin rather than the conversion: anything on the neutral
  // axis converts back as hue 0, and losing it in state is what made a trip
  // through black or grey irreversible.
  return { rgb, hsb: { h: next.h, s: asHsb.s, b: asHsb.b }, hsl: next };
}
