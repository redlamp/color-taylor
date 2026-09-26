/**
 * OkHSL: Ottosson's picker parameterisation of Oklab.
 *
 * Hue is Oklch hue. Lightness is Oklch L pushed through a toe so it lines up
 * with CIELAB's L*, which is what makes the darks read evenly. Saturation is a
 * share of the gamut at that hue and lightness, but not a straight share of
 * the cusp: it runs through a smooth "mid" chroma fitted so the same S looks
 * about as colourful at every hue, and only its top fifth climbs to the true
 * edge. So s 0..1 always names a real color, and the same s at two hues is
 * closer to the same amount of colour than the same Relative S would be.
 *
 * A port of the okhsl half of ok_color.h. The fitted constants are copied
 * from culori's copy of the same code and every conversion here is tested
 * against culori, so a mistranscribed digit fails a test rather than shipping.
 * The cusp comes from `cuspForHue`, which checks its answer against the
 * gamut, and the gamut intersection from `gamutIntersection`, both already
 * ported in oklchGamut.
 *
 * Units: h in degrees, s and l in 0..1, as culori has them.
 */
import { linearToOklab, oklabToOklch, oklchToRgb, srgbToLinear, type Oklab, type OklchToRgbResult } from './colorConversions';
import { cuspForHue, gamutIntersection } from './oklchGamut';

export interface OkHSL {
  h: number;
  s: number;
  l: number;
}

const K1 = 0.206;
const K2 = 0.03;
const K3 = (1 + K1) / (1 + K2);

/** Oklch L to OkHSL lightness. */
export function toe(x: number): number {
  return 0.5 * (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));
}

/** OkHSL lightness to Oklch L. */
export function toeInv(x: number): number {
  return (x * x + K1 * x) / (K3 * (x + K2));
}

/**
 * The three chromas that shape the saturation curve at one L and hue: C_0 at
 * the bottom, the fitted C_mid, and C_max at the gamut edge. `a_` and `b_`
 * are the unit hue vector.
 */
function chromas(L: number, a_: number, b_: number, h: number): { c0: number; cMid: number; cMax: number } {
  const cusp = cuspForHue(h);
  const cMax = gamutIntersection(a_, b_, L, 1, L, cusp);
  const sMax = cusp.c / cusp.l;
  const tMax = cusp.c / (1 - cusp.l);

  const sMid = 0.11516993 + 1 / (
    +7.4477897 + 4.1590124 * b_
    + a_ * (-2.19557347 + 1.75198401 * b_
      + a_ * (-2.13704948 - 10.02301043 * b_
        + a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_))));
  const tMid = 0.11239642 + 1 / (
    +1.6132032 - 0.68124379 * b_
    + a_ * (+0.40370612 + 0.90148123 * b_
      + a_ * (-0.27087943 + 0.6122399 * b_
        + a_ * (+0.00299215 - 0.45399568 * b_ - 0.14661872 * a_))));

  const k = cMax / Math.min(L * sMax, (1 - L) * tMax);
  let ca = L * sMid;
  let cb = (1 - L) * tMid;
  const cMid = 0.9 * k * Math.sqrt(Math.sqrt(1 / (1 / (ca * ca * ca * ca) + 1 / (cb * cb * cb * cb))));
  ca = L * 0.4;
  cb = (1 - L) * 0.8;
  const c0 = Math.sqrt(1 / (1 / (ca * ca) + 1 / (cb * cb)));
  return { c0, cMid, cMax };
}

export function okhslToOklab(h: number, s: number, l: number): Oklab {
  const L = toeInv(l);
  if (!(s > 0) || l >= 1 || l <= 0) return { l: L, a: 0, b: 0 };
  const rad = (h * Math.PI) / 180;
  const a_ = Math.cos(rad);
  const b_ = Math.sin(rad);
  const { c0, cMid, cMax } = chromas(L, a_, b_, h);
  let t: number; let k0: number; let k1: number; let k2: number;
  if (s < 0.8) {
    t = 1.25 * s;
    k0 = 0;
    k1 = 0.8 * c0;
    k2 = 1 - k1 / cMid;
  } else {
    t = 5 * (s - 0.8);
    k0 = cMid;
    k1 = (0.2 * cMid * cMid * 1.25 * 1.25) / c0;
    k2 = 1 - k1 / (cMax - cMid);
  }
  const C = k0 + (t * k1) / (1 - k2 * t);
  return { l: L, a: C * a_, b: C * b_ };
}

export function oklabToOkhsl(L: number, a: number, b: number): OkHSL {
  const l = toe(L);
  const c = Math.sqrt(a * a + b * b);
  // White and black carry a float hair of chroma from the matrices - white is
  // c 1e-8 at L 0.99999999 - and the curve is undefined there (C_max is 0).
  // Below a millionth of chroma, or within a millionth of either end, the
  // color is grey and its saturation is 0.
  if (!(c > 1e-6) || L <= 1e-6 || L >= 1 - 1e-6) return { h: 0, s: 0, l };
  const a_ = a / c;
  const b_ = b / c;
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  const { c0, cMid, cMax } = chromas(L, a_, b_, h);
  let s: number;
  if (c < cMid) {
    const k1 = 0.8 * c0;
    const k2 = 1 - k1 / cMid;
    const t = c / (k1 + k2 * c);
    s = t * 0.8;
  } else {
    const k0 = cMid;
    const k1 = (0.2 * cMid * cMid * 1.25 * 1.25) / c0;
    const k2 = 1 - k1 / (cMax - cMid);
    const t = (c - k0) / (k1 + k2 * (c - k0));
    s = 0.8 + 0.2 * t;
  }
  return { h, s: Math.max(0, Math.min(1, s)), l };
}

/** sRGB bytes to OkHSL. Always valid: every sRGB color has an OkHSL address. */
export function rgbToOkhsl(r: number, g: number, b: number): OkHSL {
  const lab = linearToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  return oklabToOkhsl(lab.l, lab.a, lab.b);
}

/** OkHSL to sRGB, with the in-gamut flag `oklchToRgb` reports. s in 0..1 lands inside by design. */
export function okhslToRgb(h: number, s: number, l: number): OklchToRgbResult {
  const lab = okhslToOklab(h, s, l);
  const lch = oklabToOklch(lab.l, lab.a, lab.b);
  return oklchToRgb(lch.l, lch.c, lch.h);
}
