import { oklabToLinear, oklchToRgb } from './colorConversions';

/**
 * Where the sRGB gamut ends, in Oklch.
 *
 * `oklchToRgb` answers "is this colour reachable?" one point at a time. This
 * file answers the harder question a picker actually asks - "how far out can I
 * go from here?" - and it does it analytically, because searching for the
 * answer gives the wrong one.
 *
 * WHY NOT A BINARY SEARCH. The sRGB gamut is convex in *linear* RGB, but Oklab
 * takes a cube root of LMS, which is not affine, so convexity does not survive
 * the trip. The cube's corners stay sharp while its faces bow inward, and the
 * in-gamut chromas at a fixed lightness and hue can be two disjoint runs rather
 * than one interval. At pure blue's own lightness and hue they are
 * [0 .. 0.2658] and [0.3131 .. 0.3133]: the gap is 0.0006 deep in linear terms,
 * far below 8-bit quantisation and invisible, but a search that stops at the
 * first exit returns C = 0.288 instead of 0.313 and renders "pure blue" as
 * 0,55,255. The green 55 is not invisible. See
 * wiki/notes/srgb-gamut-is-not-star-shaped-in-oklab.md for the measurement.
 *
 * WHAT WE DO INSTEAD. Bjorn Ottosson's analytic approach from his OkHSL/OkHSV
 * work, ported here. It never walks outward looking for an exit; it solves for
 * the boundary:
 *
 *   1. `maxSaturationForHue` - the largest S = C/L the hue can hold. A
 *      polynomial fitted per hue sector gives a first guess, then Halley's
 *      method refines it on the exact boundary equation.
 *   2. `cuspForHue` - scale that ray until its brightest linear channel hits 1.
 *   3. `gamutIntersection` - below the cusp the boundary is the straight ray
 *      from black through the cusp, and that is exact, not an approximation:
 *      scaling linear RGB by s scales Oklab by cbrt(s), so a cube face where a
 *      channel is zero maps to a ray through the origin. Above the cusp the
 *      boundary bows out from the chord to white, so take the chord and Halley
 *      again.
 *
 * Every numeric constant below is Ottosson's published one, used verbatim. The
 * five k-values per sector are a least-squares fit - fitted constants feeding a
 * refinement step, not derived quantities and not magic numbers; rounding or
 * re-deriving them would cost Halley its starting point. The three-element w
 * rows are exact: they are the rows of the Oklab -> linear sRGB matrix that
 * `oklabToLinear` applies all at once, spelled out here because the boundary
 * equations need one channel at a time.
 *
 * THE ONE PLACE WE GO BEYOND HIM, AND WHY. That three-step model describes the
 * gamut as star-shaped about the neutral axis: one cusp per hue, a cone below
 * it, a bowed cap above. Everywhere but one neighbourhood that is exactly
 * right, to about 2e-12. The exception is the blue corner, and it bites twice,
 * both times because the real gamut is not star-shaped there:
 *
 *   - Just *below* the corner's hue the sector test hands the problem to the
 *     red branch, which follows the smooth red = 0 surface and reports C =
 *     0.2655 at the corner's own lightness. Measured, the corner's needle
 *     actually reaches down to h = 264.0519, so for the 1.7e-4 degrees between
 *     there and the sector boundary at 264.05202 the smooth answer is 0.048 too
 *     small - and h = 264.052, the value anyone writing blue by hand rounds to,
 *     lands inside that band.
 *   - Just *above* the corner's lightness (l 0.454..0.488, h 264.06..264.2) the
 *     cap is bounded by red = 0 rather than by a channel reaching 1, which the
 *     cap's equation does not model, so it over-reports by up to 5.4e-4 of a
 *     linear channel.
 *
 * So `cuspForHue` and `maxChromaForLH` build a candidate from *each* of the
 * three sector fits and return the largest one that `oklchToRgb` confirms is
 * actually reachable. This is not the binary search the note warns against: the
 * candidates are analytic and there are three of them, and each is checked
 * once. The check also makes over-reporting impossible by construction - an
 * answer only survives if it names a colour that exists - so the failure mode
 * left is under-reporting, which is measured in the tests rather than assumed.
 */

/** The most chromatic colour the sRGB gamut holds at one hue. */
export interface Cusp {
  l: number;
  c: number;
}

/** Row of the Oklab -> linear sRGB matrix for each channel, in LMS-cube order. */
const W_R = [+4.0767416621, -3.3077115913, +0.2309699292] as const;
const W_G = [-1.2684380046, +2.6097574011, -0.3413193965] as const;
const W_B = [-0.0041960863, -0.7034186147, +1.7076147010] as const;

/**
 * Ottosson publishes one Halley step and notes it leaves an error under 1e-6
 * "except for some blue hues where dS/dh is close to infinite" - which is
 * exactly the hue this file exists for, so take the second step he offers.
 * Halley converges cubically: the extra step costs a handful of multiplies and
 * brings the cusp to within 2.5e-12 of the gamut surface, measured.
 */
const HALLEY_STEPS = 2;

/** One hue sector: the fitted S = k0 + k1*a + k2*b + k3*a*a + k4*a*b, and the
 *  channel whose zero crossing bounds saturation there. */
interface Sector {
  fit: readonly [number, number, number, number, number];
  w: readonly [number, number, number];
}

const SECTOR_R: Sector = {
  fit: [+1.19086277, +1.76576728, +0.59662641, +0.75515197, +0.56771245],
  w: W_R,
};
const SECTOR_G: Sector = {
  fit: [+0.73956515, -0.45954404, +0.08285427, +0.12541070, +0.14503204],
  w: W_G,
};
const SECTOR_B: Sector = {
  fit: [+1.35733652, -0.00915799, -1.15130210, -0.50559606, +0.00692167],
  w: W_B,
};

const SECTORS: readonly Sector[] = [SECTOR_R, SECTOR_G, SECTOR_B];

/** Ottosson's two half-plane tests, which claim the hue circle between them. */
function sectorForHue(a: number, b: number): Sector {
  if (-1.88170328 * a - 0.80936493 * b > 1) return SECTOR_R;
  if (1.81444104 * a - 1.19445276 * b > 1) return SECTOR_G;
  return SECTOR_B;
}

/**
 * The saturation S = C/L at which one sector's channel crosses zero: the
 * polynomial supplies the guess, Halley solves `channel(S) = 0` on the real
 * cubic. Split out from `maxSaturationForHue` so a caller can ask a sector
 * that the hue does not belong to - which is how the blue corner is recovered.
 */
function saturationFromSector(sector: Sector, a: number, b: number): number {
  const { fit, w } = sector;
  let sat = fit[0] + fit[1] * a + fit[2] * b + fit[3] * a * a + fit[4] * a * b;

  // Along the ray L = 1, C = S the three LMS cube roots are linear in S with
  // these slopes: the a and b columns of the Oklab -> LMS' matrix.
  const kL = +0.3963377774 * a + 0.2158037573 * b;
  const kM = -0.1055613458 * a - 0.0638541728 * b;
  const kS = -0.0894841775 * a - 1.2914855480 * b;

  for (let step = 0; step < HALLEY_STEPS; step++) {
    const lp = 1 + sat * kL;
    const mp = 1 + sat * kM;
    const sp = 1 + sat * kS;

    // f is the channel's value at this S, f1 and f2 its first and second
    // derivatives in S. All three are written out rather than differenced.
    const f = w[0] * lp * lp * lp + w[1] * mp * mp * mp + w[2] * sp * sp * sp;
    const f1 = 3 * (w[0] * kL * lp * lp + w[1] * kM * mp * mp + w[2] * kS * sp * sp);
    const f2 = 6 * (w[0] * kL * kL * lp + w[1] * kM * kM * mp + w[2] * kS * kS * sp);

    const denom = f1 * f1 - 0.5 * f * f2;
    if (denom === 0) break;
    sat -= (f * f1) / denom;
  }

  return sat;
}

/**
 * The largest saturation S = C/L the sRGB gamut holds at this hue, by
 * Ottosson's sector dispatch. `a` and `b` are a unit vector in the Oklab
 * chroma plane (a^2 + b^2 = 1) - cos and sin of the hue.
 *
 * Exported because it is the quantity OkHSL is built on, and because the
 * dispatch is worth being able to see on its own. `cuspForHue` does not use it:
 * within 2e-4 degrees of blue's hue the dispatch picks the branch on the wrong
 * side of the corner, which is the whole subject of this file's header.
 */
export function maxSaturationForHue(a: number, b: number): number {
  return saturationFromSector(sectorForHue(a, b), a, b);
}

/** Ottosson's `find_cusp` for one sector's saturation, or null if it degenerates. */
function cuspFromSector(sector: Sector, a: number, b: number): Cusp | null {
  const sat = saturationFromSector(sector, a, b);
  if (!Number.isFinite(sat) || sat <= 0) return null;
  // Walk that ray out to L = 1, see how far past 1 the brightest linear channel
  // has gone, and scale back. Linear RGB goes as L^3, so the factor is a cbrt.
  const peak = oklabToLinear(1, sat * a, sat * b);
  const highest = Math.max(peak.r, peak.g, peak.b);
  if (!(highest > 0)) return null;
  const l = Math.cbrt(1 / highest);
  if (!Number.isFinite(l)) return null;
  return { l, c: l * sat };
}

/**
 * This hue's cusp: the most chromatic colour the sRGB gamut holds at this hue.
 *
 * Each sector fit gives a candidate and the most chromatic *reachable* one
 * wins, so the answer is never a colour that does not exist. If every candidate
 * degenerates - which no hue in 360,000 sampled does - the hue's own sector is
 * returned unchecked rather than nothing.
 */
export function cuspForHue(h: number): Cusp {
  const rad = (h * Math.PI) / 180;
  const a = Math.cos(rad);
  const b = Math.sin(rad);

  let best: Cusp | null = null;
  for (const sector of SECTORS) {
    const candidate = cuspFromSector(sector, a, b);
    if (!candidate) continue;
    if (best && candidate.c <= best.c) continue;
    if (!oklchToRgb(candidate.l, candidate.c, h).inGamut) continue;
    best = candidate;
  }
  return best ?? cuspFromSector(sectorForHue(a, b), a, b) ?? { l: 0, c: 0 };
}

/**
 * How far along the segment from (l0, 0) to (l1, c1) the gamut boundary lies,
 * as a fraction t of the way. Ottosson's `find_gamut_intersection`, kept
 * general because gamut *mapping* - pulling an unreachable colour back toward a
 * chosen anchor lightness - wants the sloped case that `maxChromaForLH` does
 * not.
 *
 * `a` and `b` are the unit hue vector; `cusp` must be for that same hue. The
 * result is the star-shaped model's answer and is not checked against the
 * gamut - `maxChromaForLH` is the one that checks.
 */
export function gamutIntersection(
  a: number,
  b: number,
  l1: number,
  c1: number,
  l0: number,
  cusp: Cusp,
): number {
  if ((l1 - l0) * cusp.c - (cusp.l - l0) * c1 <= 0) {
    // Below the cusp: the boundary is the ray from black through the cusp, so
    // this line/line intersection is the whole answer. Nothing to refine - the
    // ray is the exact surface, not a chord across it.
    return (cusp.c * l0) / (c1 * cusp.l + cusp.c * (l0 - l1));
  }

  // Above the cusp: start on the chord from the cusp to white, which runs
  // inside the real boundary, then step out to where a channel first reaches 1.
  let t = (cusp.c * (l0 - 1)) / (c1 * (cusp.l - 1) + cusp.c * (l0 - l1));

  const dL = l1 - l0;
  const dC = c1;

  const kL = +0.3963377774 * a + 0.2158037573 * b;
  const kM = -0.1055613458 * a - 0.0638541728 * b;
  const kS = -0.0894841775 * a - 1.2914855480 * b;

  const lDt = dL + dC * kL;
  const mDt = dL + dC * kM;
  const sDt = dL + dC * kS;

  for (let step = 0; step < HALLEY_STEPS; step++) {
    const l = l0 * (1 - t) + t * l1;
    const c = t * c1;

    const lp = l + c * kL;
    const mp = l + c * kM;
    const sp = l + c * kS;

    const lc = lp * lp * lp;
    const mc = mp * mp * mp;
    const sc = sp * sp * sp;

    const ldt = 3 * lDt * lp * lp;
    const mdt = 3 * mDt * mp * mp;
    const sdt = 3 * sDt * sp * sp;

    const ldt2 = 6 * lDt * lDt * lp;
    const mdt2 = 6 * mDt * mDt * mp;
    const sdt2 = 6 * sDt * sDt * sp;

    // One candidate step per channel, for that channel hitting exactly 1; the
    // nearest wins. A negative u means the channel is heading away from 1
    // rather than toward it, so its root is behind us and is discarded rather
    // than allowed to win the minimum.
    let nearest = Infinity;
    for (const w of [W_R, W_G, W_B]) {
      const f = w[0] * lc + w[1] * mc + w[2] * sc - 1;
      const f1 = w[0] * ldt + w[1] * mdt + w[2] * sdt;
      const f2 = w[0] * ldt2 + w[1] * mdt2 + w[2] * sdt2;
      const u = f1 / (f1 * f1 - 0.5 * f * f2);
      if (u >= 0) nearest = Math.min(nearest, -f * u);
    }
    if (!Number.isFinite(nearest)) break;
    t += nearest;
  }

  return t;
}

/**
 * The largest in-gamut chroma at this lightness and hue. l 0..1, h in degrees.
 *
 * Black and white hold no chroma at all, so l = 0 and l = 1 return exactly 0,
 * as does any l outside [0, 1] and any NaN - there is no colour out there to
 * bound. Everywhere else the result is the *outer* boundary, which at blue's
 * own lightness and hue means 0.3132, on the far side of the gap, and not the
 * 0.2655 the smooth surface through that point would give.
 *
 * The returned chroma always names a colour `oklchToRgb` calls in gamut. That
 * is a guarantee of the candidate check, not of the arithmetic.
 */
export function maxChromaForLH(l: number, h: number): number {
  if (!(l > 0) || l >= 1) return 0;
  const rad = (h * Math.PI) / 180;
  const a = Math.cos(rad);
  const b = Math.sin(rad);

  // l0 = l1 = l makes the segment horizontal and c1 = 1 makes it unit length,
  // so the intersection comes back as the chroma itself, not a fraction of
  // something.
  let best = 0;
  let fallback = 0;
  for (const sector of SECTORS) {
    const cusp = cuspFromSector(sector, a, b);
    if (!cusp) continue;
    const c = gamutIntersection(a, b, l, 1, l, cusp);
    if (!Number.isFinite(c) || c <= 0) continue;
    if (sector === sectorForHue(a, b)) fallback = c;
    if (c <= best) continue;
    if (!oklchToRgb(l, c, h).inGamut) continue;
    best = c;
  }
  return best > 0 ? best : fallback;
}
