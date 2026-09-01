import { hslToRgb, rgbToHsb, type HSB } from '../../utils/colorConversions';
import { CENTER_X, CENTER_Y, RADIUS, PI, shapeEdgeDist, shapeLimitScale, type BLMode } from './hexConstants';

/**
 * Pointer position on the field -> the HSB it selects.
 *
 * Pure, so the mapping every drag depends on can be tested with numbers
 * instead of a browser, and so the keyboard path (#84) can share it with the
 * pointer path rather than reimplementing it. Radius is chroma: the handle
 * lands at (s/100)*(b/100)*edge, and saturation is measured against the
 * cross-section's own edge so the handle sits exactly under the cursor at
 * every brightness.
 */

/** What a gesture began with. Frozen at pointer-down; `null` between gestures. */
export interface FieldOrigin {
  b: number;
  l: number;
  h: number;
  /** Carried for hosts that track it; the mapping itself does not read it. */
  sHsl: number;
}

export interface FieldInput {
  brightness: number;
  lightness: number;
  hue: number;
  blMode: BLMode;
  /** 1 the hexagon, 0 the circle. */
  shapeMix?: number;
  /** The frozen gesture origin, or `null` to read the current values. */
  origin?: FieldOrigin | null;
  /**
   * For a first click, a point outside the shape is rejected and `null` is
   * returned. For a drag, it is clamped instead - releasing outside is how the
   * new value gets set.
   */
  clampOnly?: boolean;
}

export function hsbFromField(svgX: number, svgY: number, input: FieldInput): HSB | null {
  const { brightness, lightness, hue, blMode, shapeMix = 1, clampOnly = false } = input;
  const dx = svgX - CENTER_X;
  const dy = svgY - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = shapeEdgeDist(angle, RADIUS, shapeMix);

  if (!clampOnly && dist > edgeDist) return null;

  // Wrapped with a modulo rather than an `if (h < 0)`: on the east ray dy is
  // 0 and atan2(-0, dx) is -0, which the branch leaves alone and toEqual
  // then refuses to call 0.
  const h = (((angle * 180) / PI) + 360) % 360;

  /*
   * Radius is chroma, so the handle lands at (s/100)*(b/100)*edge.
   *
   * This used to read saturation off the *full* edge and then rubber-band
   * brightness off the same radius, which set both to the same number and put
   * the handle at r-squared instead of r. Starting at b=30 and dragging to
   * half the radius left the handle at a quarter of it - visibly not under
   * the cursor, and worse the darker the colour.
   *
   * Measuring saturation against the cross-section's own edge instead makes
   * (s/100)*(b/100)*edge collapse to exactly `dist` on both branches, so the
   * handle tracks the pointer at every brightness.
   */
  const origin = input.origin ?? { b: brightness, l: lightness, h: hue, sHsl: 0 };
  const limit = shapeLimitScale(blMode, origin.b, origin.l, shapeMix);
  const r = dist / edgeDist;
  const pointerHue = Math.round(h);

  /*
   * A rubber-band, not a ratchet: `origin` is frozen at drag start, so
   * stretching past the cross-section and coming back returns to the bounds
   * the drag began with. Whatever the pointer is over when it lifts is what
   * sticks, which is how releasing outside sets the new value.
   */
  if (blMode === 'brightness') {
    if (r <= limit) {
      const sIn = limit > 0 ? Math.round(Math.min((r / limit) * 100, 100)) : 0;
      // At the centre the angle is noise and the colour is grey either way,
      // so keep the hue the drag started from rather than snapping to 0.
      return { h: sIn === 0 ? origin.h : pointerHue, s: sIn, b: origin.b };
    }
    return { h: pointerHue, s: 100, b: Math.min(100, Math.round(r * 100)) };
  }

  /*
   * HSL takes the same two branches against its own bound, then converts,
   * because the drag writes HSB either way.
   *
   * Expanding moves L toward 50 rather than simply up: the cross-section is
   * widest in the middle, so from the dark half the way out is to lighten and
   * from the light half it is to darken. Solving 1 - |2L-1| = r on the branch
   * L is already on gives 50r or 100 - 50r.
   *
   * r is clamped to 1 first, and that clamp is the whole point. A drag can
   * run past the hexagon's own rim - `clampOnly` lets dist exceed edgeDist -
   * and unclamped, 50r carries L straight through 50 and out the far side,
   * where the cross-section starts shrinking again and the handle turns back
   * on itself. L pins at 50, the widest the cross-section ever gets. HSB
   * never showed this because its branch already clamps at b=100.
   */
  const rPinned = Math.min(1, r);
  const sL = r <= limit ? (limit > 0 ? Math.min((r / limit) * 100, 100) : 0) : 100;
  const lTarget = r <= limit
    ? origin.l
    : (origin.l <= 50 ? rPinned * 50 : 100 - rPinned * 50);
  const hueOut = sL === 0 ? origin.h : pointerHue;
  const asRgb = hslToRgb(hueOut, sL, lTarget);
  const asHsb = rgbToHsb(asRgb.r, asRgb.g, asRgb.b);
  return { h: hueOut, s: Math.round(asHsb.s), b: Math.round(asHsb.b) };
}
