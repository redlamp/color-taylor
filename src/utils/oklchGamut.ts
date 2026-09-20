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
 * than one interval. At l = 0.45201, h = 264.052 - pure blue rounded the way
 * anyone writes it by hand - they are [0 .. 0.2656051] and
 * [0.3131966 .. 0.3132133]. The gap is 7.0e-4 deep in linear terms, far below
 * 8-bit quantisation and invisible in itself, but a search that stops at the
 * first exit returns C = 0.2656051 and renders "pure blue" as 0,49,229 instead
 * of 0,0,255. The green 49 is not invisible. (Measured by bisecting on
 * `oklchToRgb`'s flag; the far run exists only once the flag's 1e-6 of linear
 * slack is allowed - see THE EPSILON below.) See
 * wiki/notes/srgb-gamut-is-not-star-shaped-in-oklab.md for the geometry.
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
 * WHERE WE GO BEYOND HIM, AND WHY. That three-step model describes the gamut
 * as star-shaped about the neutral axis: one cusp per hue, a cone below it, a
 * bowed cap above. So `cuspForHue` and `maxChromaForLH` build a candidate from
 * *each* of the three sector fits and return the largest one that `oklchToRgb`
 * confirms is reachable, rather than trusting the sector the hue falls in. That
 * is not the binary search the note warns against: the candidates are analytic,
 * there are three of them, and each is checked once.
 *
 * This is usually described as a blue-corner workaround. It is not - it earns
 * its place right round the wheel. A faithful single-sector port is off by
 * 2.890e-3 of chroma at l = 0.94, h = 101.2, a yellow-green 163 degrees from
 * blue, where taking the best of three is exact to 4.2e-16. (Measured against
 * an exact cubic root-finder: each linear channel expanded as a cubic in
 * chroma, roots isolated by the derivative's critical points and bisected to
 * double precision. Worst case over l 0.005..0.995 by h 0.1 degrees.) The
 * sector fits are least-squares fits with no continuity imposed across the
 * dispatch boundaries, so the branch the hue is assigned to is simply not
 * always the branch that bounds it.
 *
 * WHAT THE DISPATCH IS NOT GUILTY OF. Ottosson's sector test is accurate to
 * sub-microdegree at the blue corner, and the file used to say otherwise.
 * Measured on the true gamut (no slack at all): the corner's needle - the thin
 * spike of gamut that at the corner's own lightness sits beyond a gap - begins
 * at h = 264.0520201280, and the dispatch flips from the red to the blue sector
 * at h = 264.0520205709. That is a band of 4.43e-7 degrees. Nobody rounds into
 * it by hand.
 *
 * THE EPSILON. What makes the needle reachable at h = 264.052 at all is
 * `oklchToRgb`'s GAMUT_EPSILON: 1e-6 of slack on a *linear* channel, which
 * dilates the gamut slightly and pulls the needle's onset down to
 * h = 264.0517837 at the corner's lightness - a band of 2.37e-4 degrees. That
 * figure is a measurement of this project's own tolerance, not of Ottosson's
 * algorithm, and the two must not be quoted interchangeably. Every number in
 * this file says which of the two it is under.
 *
 * THE FOURTH CANDIDATE. Above the corner's lightness (l 0.45..0.49,
 * h 264.05..264.21) the analytic candidate that is nearly right gets rejected
 * by a hair: at l = 0.4715, h = 264.207 the green sector's cusp yields
 * c = 0.3000038 with linear red at -2.2160e-6, missing the 1e-6 slack by
 * 1.2e-6, so the check throws it away. The next candidate down is 0.2930434 -
 * 6.6e-3 of chroma short, worth 5 byte levels, rendering 0,43,251 where
 * 0,38,255 was available and `oklchToRgb` calls it in gamut. Across that wedge
 * 7616 of 30250 cells rendered a colour that was not the most chromatic one on
 * offer.
 *
 * So `maxChromaForLH` has a fourth candidate. When the surviving analytic
 * answer is demonstrably not on the boundary - a probe a twentieth of an 8-bit
 * step beyond it is still in gamut - it bisects on `oklchToRgb`'s flag between
 * that answer and the rejected candidate above it. This does not contradict
 * the no-search rule, and not because the gamut is contiguous here (in this
 * wedge it often is not). It is because of the bracket: the low end is already
 * confirmed in gamut and the high end already confirmed out, so the bisection
 * can only move the answer *up*, and only to a chroma the flag accepts. It
 * cannot reach past the rejected candidate, so it can never jump a gap - the
 * three analytic candidates remain the only thing that reaches the far side of
 * one, which is what recovers the needle. Search here is a floor-raiser with a
 * proof, not a boundary-finder on trust.
 *
 * OVER-REPORTING IS NOT IMPOSSIBLE, and this file used to claim it was. The
 * check bounds the answer's distance from the gamut *surface* by 1e-6 of a
 * linear channel; it says nothing about its distance along the chroma ray, and
 * where the boundary is nearly tangent to the ray those differ wildly. So the
 * answer can name a colour well past the true boundary and still pass:
 *
 *   maxChromaForLH(0.215, 264.05) = 0.1489832, true maximum 0.1262594
 *                                   -> 0,0,92 against 0,11,82, 11 byte levels
 *   maxChromaForLH(0.07,  264.0 ) = 0.0485303, true maximum 0.0405933
 *                                   -> 0,0,12 against 0,0,9,   3 byte levels
 *
 * It is rare: over 7,164,000 cells (l 0.005..0.995 by h 0.01 degrees) 293
 * render a different colour than the exact boundary would, and 11 levels is the
 * worst of them. Both answers above are the largest chroma the *flag* accepts,
 * to within 6e-5, so they are exactly what the check promises - the promise is
 * just weaker than the old comment claimed. The effect is concentrated at low
 * lightness, where every linear channel in the gamut is itself only a few times
 * 1e-6, and it is inherent to an absolute linear epsilon rather than to
 * anything here. The tighter check available is a byte-level one - require the
 * answer to survive `linearToSrgb` and come back - which would cost a rounding
 * per candidate and is deliberately not done, because it would change what
 * every caller gets in order to fix what only the darkest ones see.
 *
 * ONE ANSWER, THREE QUESTIONS - UNRESOLVED. A slider bound, a plotted gamut
 * outline and a gamut-mapping clamp target all call this function and do not
 * want the same number. The needle recovery that makes "pure blue" render
 * 0,0,255 is right for a clamp target and arguably wrong as a slider bound: it
 * puts a ~0.048 discontinuity in the returned chroma across a hue band a
 * fraction of a degree wide, where the gamut's own smooth surface has none, so
 * a slider's travel jumps as the hue crosses it. Nothing here resolves that.
 * If a caller needs the smooth surface rather than the outer boundary it needs
 * a second entry point, not a change to this one.
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
 *
 * Do not measure the second step by how far the cusp sits from the gamut
 * surface. `cuspFromSector` sets l = cbrt(1/highest), which puts the brightest
 * linear channel at exactly 1 whatever S it was handed, so that distance is
 * ~4e-15 at one step and ~4e-15 at two - forced to zero by construction, and
 * blind to the thing being decided. An earlier version of this comment cited
 * exactly that quantity.
 *
 * Cusp *chroma* does distinguish them. Against the exactly-solved root of the
 * sector's boundary equation, worst case over 36,000 hues, one step is off by
 * 3.9e-3 of chroma and two by 5.1e-5 - and with the candidate check in play a
 * one-step candidate can miss the gamut outright and be rejected, at which
 * point the answer collapses by 0.30 of chroma at h = 266.48. The extra step
 * costs a handful of multiplies.
 */
const HALLEY_STEPS = 2;

/**
 * How far past the analytic answer `maxChromaForLH` probes before deciding that
 * answer is not on the boundary. One 8-bit step is worth roughly 0.002 of
 * chroma at mid lightness, so this is about a twentieth of one - small enough
 * that no visible shortfall slips under it, large enough that the epsilon's own
 * dilation of the boundary (a few times 1e-7 of chroma where the surface is
 * well conditioned) never trips it.
 */
const TIGHTNESS_PROBE = 1e-4;

/** Bisection steps for that rescue. The bracket is under 0.05 of chroma wide,
 *  so 40 halvings take it below 1e-13 - far past where the answer is used. */
const BISECTION_STEPS = 40;

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
 * Ottosson's sector dispatch. `a` and `b` point into the Oklab chroma plane;
 * only their direction is read, so (cos h, sin h) and any positive multiple of
 * it give the same answer. The zero vector names no hue and returns NaN rather
 * than a number - unnormalised it used to fall through the dispatch to the blue
 * sector's k0 and hand back 1.35733652, which looks like a saturation.
 *
 * Exported because it is the quantity OkHSL is built on, and because the
 * dispatch is worth being able to see on its own; the tests use it to hold that
 * dispatch to account. `cuspForHue` does not use it - it takes the best of all
 * three sectors instead, for the reasons in this file's header.
 */
export function maxSaturationForHue(a: number, b: number): number {
  const len = Math.hypot(a, b);
  if (!(len > 0)) return NaN;
  const ua = a / len;
  const ub = b / len;
  return saturationFromSector(sectorForHue(ua, ub), ua, ub);
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
 * Each sector fit gives a candidate and the most chromatic one that passes the
 * gamut check wins. The final `??` is a different thing: if *no* candidate
 * passes, the hue's own sector is returned **unchecked**, so on that path the
 * result is whatever the star-shaped model said and may name a colour outside
 * the gamut. No hue in 360,000 sampled at 0.001 degrees takes it, which is why
 * it stays a bare fallback rather than growing machinery - but it is a fallback,
 * not a guarantee, and this comment no longer says otherwise.
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
 * 0.2656 the smooth surface through that point would give.
 *
 * Unless the `??` fallback fires - see `cuspForHue`, and it is not known to
 * fire - the returned chroma names a colour `oklchToRgb` calls in gamut. Note
 * what that is and is not worth: it bounds the answer's distance from the gamut
 * *surface*, not its distance along the chroma ray, so it does not rule out
 * over-reporting. See OVER-REPORTING in this file's header for the measured
 * cases, and ONE ANSWER, THREE QUESTIONS before treating this as a slider
 * bound.
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
  let rejected = 0;
  for (const sector of SECTORS) {
    const cusp = cuspFromSector(sector, a, b);
    if (!cusp) continue;
    const c = gamutIntersection(a, b, l, 1, l, cusp);
    if (!Number.isFinite(c) || c <= 0) continue;
    if (sector === sectorForHue(a, b)) fallback = c;
    if (c <= best) continue;
    if (!oklchToRgb(l, c, h).inGamut) {
      if (c > rejected) rejected = c;
      continue;
    }
    best = c;
  }

  // The fourth candidate. `best` is supposed to be on the boundary; if a probe
  // a twentieth of an 8-bit step past it is still in gamut then it is not, and
  // an analytic candidate that would have been better was thrown out by the
  // check. Bisect between the two. Both ends of the bracket have already been
  // through `oklchToRgb`, so this only ever raises the answer and only ever to
  // a chroma the flag accepts; it cannot reach past `rejected`, so it cannot
  // jump a gap. Header, THE FOURTH CANDIDATE, for why that is not the search
  // the wiki note rules out.
  if (rejected > best + TIGHTNESS_PROBE && oklchToRgb(l, best + TIGHTNESS_PROBE, h).inGamut) {
    let lo = best;
    let hi = rejected;
    for (let step = 0; step < BISECTION_STEPS; step++) {
      const mid = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      if (oklchToRgb(l, mid, h).inGamut) lo = mid; else hi = mid;
    }
    if (lo > best) best = lo;
  }

  return best > 0 ? best : fallback;
}
