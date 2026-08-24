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
import { hsbToRgb, rgbToHsb, rgbToHsl, hslToRgb, type HSB, type RGB } from './colorConversions';

/** The hue and HSL saturation a gesture started from. */
export interface HslOrigin {
  h: number;
  s: number;
}

/**
 * Capture at the start of a gesture, from state that is not yet degenerate.
 *
 * Hue comes from HSB rather than from the colour, because HSB holds it through
 * black where the colour cannot.
 */
export function hslOriginFrom(hsbHue: number, rgb: RGB): HslOrigin {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { h: hsbHue, s: hsl.s };
}

/** Convenience for callers holding HSB rather than an exact RGB. */
export function hslOriginFromHsb(hsb: HSB): HslOrigin {
  return hslOriginFrom(hsb.h, hsbToRgb(hsb.h, hsb.s, hsb.b));
}

export interface HslWrite {
  /** Exact, for the caller's rgbOverride - do not re-derive this from `hsb`. */
  rgb: RGB;
  /** For state. `h` is carried through rather than converted. */
  hsb: HSB;
}

/**
 * @param currentRgb the colour as it stands - pass `rgbOverride ?? hsbToRgb(state)`
 * @param origin     what the gesture began with, for the degenerate cases
 */
export function writeHslChannel(
  currentRgb: RGB,
  channel: 'h' | 's' | 'l',
  value: number,
  origin: HslOrigin,
): HslWrite {
  const current = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

  // At the ends of L there is no saturation left to read either, so that comes
  // from the origin too. A mid-range S=0 is taken at face value: there the user
  // asked for grey, and resurrecting a saturation would fight them.
  const atEnd = current.l <= 0 || current.l >= 100;
  const baseH = (atEnd || current.s <= 0) ? origin.h : current.h;
  const baseS = atEnd ? origin.s : current.s;

  const next = { h: baseH, s: baseS, l: current.l, [channel]: value };
  const rgb = hslToRgb(next.h, next.s, next.l);
  const asHsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

  return { rgb, hsb: { h: next.h, s: asHsb.s, b: asHsb.b } };
}
