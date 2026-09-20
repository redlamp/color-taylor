import { describe, test, expect } from 'bun:test';
import { clampChroma, converter, inGamut } from 'culori';
import {
  cuspForHue, maxChromaForLH, maxSaturationForHue, gamutIntersection, type Cusp,
} from './oklchGamut';
import {
  oklchToRgb, rgbToOklch, srgbToLinear, linearToOklab, oklabToOklch,
} from './colorConversions';

/*
 * Two independent checks, because one would not be enough.
 *
 * The maths here is a port of Ottosson's fitted polynomial plus Halley
 * refinement, and a fit that is subtly wrong still returns plausible numbers.
 * So the boundary is computed a second time by a method with nothing in common
 * with the first - walking the sRGB cube's six fully-saturated edges and
 * converting each point to Oklch - and the two are made to agree. Where a third
 * opinion is available culori supplies it, as it does in colorConversions.test.
 *
 * Tolerances below are measured, not guessed, and each says what it measured.
 */

const toRgb = converter('rgb');
const inRgbGamut = inGamut('rgb');

/** The corner this file exists for, at the wiki note's stated precision. */
const BLUE_L = 0.45201;
const BLUE_H = 264.052;

/*
 * EDGE TRACING, the independent oracle.
 *
 * The fully-saturated locus of the sRGB cube is its six edges: every colour
 * with one channel at 0 and another at 255. Walk them, convert each point to
 * Oklch, and the gamut's outer shell has been computed without a polynomial, a
 * derivative or a fitted constant anywhere in sight. The cube's corners are
 * exact by construction, which is the part that matters - the analytic method's
 * one weak spot is a corner.
 *
 * `t` runs over the *encoded* channel, so the samples are spaced the way 8-bit
 * values are and the dark end is not starved.
 */
interface TracedPoint { l: number; c: number; h: number }

const EDGES: ((t: number) => [number, number, number])[] = [
  (t) => [1, t, 0], (t) => [t, 1, 0], (t) => [0, 1, t],
  (t) => [0, t, 1], (t) => [t, 0, 1], (t) => [1, 0, t],
];

function traceGamutShell(steps: number): TracedPoint[] {
  const points: TracedPoint[] = [];
  for (const edge of EDGES) {
    for (let i = 0; i <= steps; i++) {
      const [r, g, b] = edge(i / steps);
      const lab = linearToOklab(srgbToLinear(r * 255), srgbToLinear(g * 255), srgbToLinear(b * 255));
      points.push(oklabToOklch(lab.l, lab.a, lab.b));
    }
  }
  return points;
}

/** 4000 steps an edge, 24006 points: fine enough that the spacing in hue near
 *  the corners is under a thousandth of a degree, cheap enough to run always. */
const TRACED = traceGamutShell(4000);

describe('cuspForHue against a traced gamut shell', () => {
  /*
   * The tolerance, measured: over the 24006 traced points the analytic cusp is
   * never more than 5.3e-5 of chroma below a real colour at the same hue, and
   * the hue-bucket maxima agree to 2.3e-5 in chroma and 3.4e-5 in lightness.
   * One 8-bit step is roughly 0.003 of Oklab lightness, so 1e-4 is a thirtieth
   * of the smallest thing anyone can see, and still nearly twice the measured
   * worst case.
   */
  const TRACE_TOL = 1e-4;

  test('never reports a cusp less chromatic than a colour that exists', () => {
    // The direction that matters. Under-reporting is what renders blue green.
    let worst = 0;
    const offenders: string[] = [];
    for (const p of TRACED) {
      const shortfall = p.c - cuspForHue(p.h).c;
      worst = Math.max(worst, shortfall);
      if (shortfall > TRACE_TOL) offenders.push(`h=${p.h} traced c=${p.c} short by ${shortfall}`);
    }
    expect(offenders.slice(0, 5)).toEqual([]);
    expect(worst).toBeLessThan(TRACE_TOL);
  });

  test('lands on the traced maximum, in both lightness and chroma', () => {
    // Bucket the traced points by hue and take each bucket's most chromatic
    // one; that point is on or beside the cusp, so asking cuspForHue for its
    // own hue is a like-for-like comparison with no interpolation in it.
    const BUCKETS = 1440;
    const peak: (TracedPoint | null)[] = new Array(BUCKETS).fill(null);
    for (const p of TRACED) {
      const k = Math.floor((p.h / 360) * BUCKETS) % BUCKETS;
      const held = peak[k];
      if (!held || p.c > held.c) peak[k] = p;
    }

    let worstC = 0;
    let worstL = 0;
    let compared = 0;
    for (const p of peak) {
      if (!p) continue;
      compared++;
      const cusp = cuspForHue(p.h);
      worstC = Math.max(worstC, Math.abs(cusp.c - p.c));
      worstL = Math.max(worstL, Math.abs(cusp.l - p.l));
    }
    expect(compared).toBeGreaterThan(1400);
    expect(worstC).toBeLessThan(TRACE_TOL);
    expect(worstL).toBeLessThan(TRACE_TOL);
  });

  test('maxChromaForLH holds every traced colour at its own lightness', () => {
    // A traced point is a real colour, so the maximum chroma at its lightness
    // and hue cannot be below it. This is the same claim as the first test one
    // level up, and it is the claim the picker relies on.
    let worst = 0;
    for (const p of TRACED) worst = Math.max(worst, p.c - maxChromaForLH(p.l, p.h));
    expect(worst).toBeLessThan(TRACE_TOL);
  });
});

describe('the blue corner', () => {
  /*
   * THE REGRESSION. This single test is why the file exists.
   *
   * At pure blue's own lightness and hue the in-gamut chromas are two disjoint
   * runs, [0 .. 0.2658] and [0.3131 .. 0.3133], separated by a gap 0.0006 deep
   * in linear terms - measured in
   * wiki/notes/srgb-gamut-is-not-star-shaped-in-oklab.md.
   *
   * What the wrong answers look like, so a future failure is recognisable:
   *
   *   0.2655  a chroma search that stops at the first exit, or Ottosson's
   *           sector dispatch unassisted - it hands this hue to the red branch,
   *           which follows the smooth surface straight past the corner.
   *           Renders 0,49,229.
   *   0.2877  the cusp such a search finds, quoted in the wiki note.
   *           Renders 0,55,255 - that green 55 is plainly visible.
   *   0.3132  the far side of the gap. The corner itself. Renders 0,0,255.
   */
  test('maxChromaForLH reaches the far side of the gap, not the near one', () => {
    const c = maxChromaForLH(BLUE_L, BLUE_H);
    expect(c).toBeCloseTo(0.3132, 4);
    expect(c).toBeGreaterThan(0.313);
    expect(c).toBeLessThan(0.3134);
  });

  test('the colour it names is pure blue, with no green in it', () => {
    expect(oklchToRgb(BLUE_L, maxChromaForLH(BLUE_L, BLUE_H), BLUE_H).rgb).toEqual({ r: 0, g: 0, b: 255 });
  });

  test('the gap is really there, so the far side was not reached by accident', () => {
    // Walking outward: in, out, then in again. If this ever stops being true
    // the whole premise of the file has changed and the rest is worth rereading.
    expect(oklchToRgb(BLUE_L, 0.2000, BLUE_H).inGamut).toBe(true);
    expect(oklchToRgb(BLUE_L, 0.2900, BLUE_H).inGamut).toBe(false);
    expect(oklchToRgb(BLUE_L, 0.3132, BLUE_H).inGamut).toBe(true);
  });

  test('the cusp is the corner itself, to five decimals', () => {
    const cusp = cuspForHue(BLUE_H);
    const corner = rgbToOklch(0, 0, 255);
    expect(cusp.l).toBeCloseTo(corner.l, 5);
    expect(cusp.c).toBeCloseTo(corner.c, 5);
  });

  test('and the corner survives being asked at its own exact hue', () => {
    const corner = rgbToOklch(0, 0, 255);
    expect(maxChromaForLH(corner.l, corner.h)).toBeCloseTo(corner.c, 6);
  });

  test('the corner does not over-report just above its own lightness', () => {
    /*
     * The same defect from the other side, and the half a coarse grid misses.
     * For l just above the corner (0.454..0.488) and hue just above it
     * (264.06..264.2) the gamut is still bounded by red = 0, not by a channel
     * reaching 1, so the star-shaped model's cap equation walks outside by up
     * to 5.4e-4 of a linear channel. Stepped finely enough to sit inside that
     * region rather than straddle it.
     */
    const unreachable: string[] = [];
    for (let l = 0.44; l <= 0.5001; l += 0.002) {
      for (let h = 263.8; h <= 264.4001; h += 0.005) {
        if (!oklchToRgb(l, maxChromaForLH(l, h), h).inGamut) {
          unreachable.push(`l=${l.toFixed(3)} h=${h.toFixed(3)}`);
        }
      }
    }
    expect(unreachable.slice(0, 5)).toEqual([]);
  });

  /*
   * The departure from Ottosson, pinned to its actual extent. His sector test
   * puts the red/green boundary at h = 264.05202, but the corner's needle
   * reaches down to h = 264.0519, so between those two the unassisted dispatch
   * is on the wrong side. 264.052 - what anyone writing blue by hand rounds to
   * - is inside that 1.7e-4 degree band. Away from it the two agree, and this
   * test is here so that "away from it" stays a measured claim.
   */
  test('the unassisted sector dispatch agrees everywhere but blue', () => {
    const disagreed: string[] = [];
    for (let i = 0; i < 36000; i++) {
      const h = i / 100;
      const rad = (h * Math.PI) / 180;
      const sat = maxSaturationForHue(Math.cos(rad), Math.sin(rad));
      const cusp = cuspForHue(h);
      // Saturation is C/L, so compare it that way rather than through the cusp.
      if (Math.abs(sat - cusp.c / cusp.l) > 1e-4) disagreed.push(h.toFixed(2));
    }
    // A contiguous band just under the corner's hue, and nothing else.
    expect(disagreed.every((h) => Number(h) >= 264.05 && Number(h) <= 264.06)).toBe(true);
    expect(disagreed.length).toBeLessThan(5);
  });
});

describe('soundness over a grid of lightness and hue', () => {
  /*
   * Two claims at every point: the chroma we return is reachable, and a little
   * more is not. The first is guaranteed by construction - maxChromaForLH only
   * returns a candidate oklchToRgb confirmed - so a failure there means the
   * guarantee has been broken rather than that the maths drifted. The second is
   * the real measurement, and it is the one that would catch under-reporting.
   *
   * Lightness starts at 0.05 rather than 0. oklchToRgb allows 1e-6 of linear
   * slack at each end, and below l = 0.035 every linear channel in the gamut is
   * itself smaller than a few times that, so "0.002 more chroma leaves the
   * gamut" stops being a question the flag can answer - it says yes to almost
   * anything down there. That is a property of the flag's epsilon, not of this
   * file; the reachability half is checked all the way down separately.
   */
  const OVERSHOOT = 0.002;

  test('the chroma returned is reachable and a bit more is not', () => {
    const unreachable: string[] = [];
    const notTight: string[] = [];
    let cells = 0;
    for (let li = 2; li <= 38; li++) {
      const l = li / 40;
      for (let i = 0; i < 1440; i++) {
        const h = i / 4;
        cells++;
        const c = maxChromaForLH(l, h);
        if (!oklchToRgb(l, c, h).inGamut) unreachable.push(`l=${l} h=${h} c=${c}`);
        if (oklchToRgb(l, c + OVERSHOOT, h).inGamut) notTight.push(`l=${l} h=${h} c=${c}`);
      }
    }
    expect(cells).toBe(37 * 1440);
    expect(unreachable.slice(0, 5)).toEqual([]);
    expect(notTight.slice(0, 5)).toEqual([]);
  });

  test('reachability holds down into the near-black end too', () => {
    const unreachable: string[] = [];
    for (let li = 1; li < 500; li++) {
      const l = li / 500;
      for (let i = 0; i < 720; i++) {
        const h = i / 2;
        if (!oklchToRgb(l, maxChromaForLH(l, h), h).inGamut) unreachable.push(`l=${l} h=${h}`);
      }
    }
    expect(unreachable.slice(0, 5)).toEqual([]);
  });

  test('chroma rises to the cusp and falls away from it', () => {
    // The shape the picker draws. Not a tautology: it fails if a branch is
    // picked inconsistently between neighbouring lightnesses.
    for (const h of [0, 30, 60, 110, 150, 200, 240, 264.052, 300, 330]) {
      const cusp = cuspForHue(h);
      expect(maxChromaForLH(cusp.l, h)).toBeCloseTo(cusp.c, 4);
      expect(maxChromaForLH(cusp.l / 2, h)).toBeLessThan(cusp.c);
      expect(maxChromaForLH((cusp.l + 1) / 2, h)).toBeLessThan(cusp.c);
    }
  });
});

describe('the degenerate ends', () => {
  /*
   * Black and white are single points on the neutral axis: no hue leaf reaches
   * them with any chroma at all. Returning exactly 0 rather than something
   * vanishing matters to a caller dividing by it, so it is a documented value,
   * not an artefact of the arithmetic bottoming out.
   */
  test('l = 0 and l = 1 hold no chroma at any hue', () => {
    for (let h = 0; h < 360; h += 15) {
      expect(maxChromaForLH(0, h)).toBe(0);
      expect(maxChromaForLH(1, h)).toBe(0);
    }
  });

  test('anything outside 0..1, and NaN, returns 0 rather than a guess', () => {
    expect(maxChromaForLH(-0.5, 120)).toBe(0);
    expect(maxChromaForLH(1.5, 120)).toBe(0);
    expect(maxChromaForLH(NaN, 120)).toBe(0);
  });

  test('but every real lightness in between holds some', () => {
    for (let h = 0; h < 360; h += 7) {
      expect(maxChromaForLH(1e-4, h)).toBeGreaterThan(0);
      expect(maxChromaForLH(1 - 1e-4, h)).toBeGreaterThan(0);
      expect(cuspForHue(h).c).toBeGreaterThan(0.01);
    }
  });

  test('hue is periodic, and negative hues wrap like they do in Oklch', () => {
    for (const h of [0, 37.5, 264.052]) {
      expect(cuspForHue(h).c).toBeCloseTo(cuspForHue(h + 360).c, 12);
      expect(maxChromaForLH(0.6, h)).toBeCloseTo(maxChromaForLH(0.6, h - 360), 12);
    }
  });
});

describe('cross-checked against culori', () => {
  /*
   * culori ships gamut mapping, so it can be asked the same question - but it
   * answers it by bisecting chroma, which is precisely the method the wiki note
   * says does not work here. That makes it a useful oracle in one direction and
   * a worked example of the bug in the other.
   */
  test('culori clampChroma walks into the gap; this does not', () => {
    const clamped = clampChroma({ mode: 'oklch', l: BLUE_L, c: 0.4, h: BLUE_H }, 'oklch');
    // Measured: culori stops at 0.2656 and renders 0,49,229. It is not wrong
    // about the colour being unreachable at 0.2658 - it is wrong that there is
    // nothing beyond it.
    expect(clamped.c).toBeLessThan(0.27);
    expect(maxChromaForLH(BLUE_L, BLUE_H)).toBeGreaterThan(0.31);
  });

  test('culori agrees where our boundary is, to a fraction of an 8-bit step', () => {
    /*
     * culori's inGamut is stricter than oklchToRgb's: ours forgives 1e-6 on a
     * *linear* channel, which near black is worth a good deal more once the
     * gamma curve has stretched it. So rather than assert culori calls every
     * point in gamut, measure how far out it thinks we are. The worst case over
     * this grid is 1.1e-5 of an encoded channel - under a hundredth of one
     * 8-bit step, and a disagreement about epsilon rather than about geometry.
     */
    let worstOutside = 0;
    let stillInside = 0;
    for (let li = 2; li <= 38; li++) {
      const l = li / 40;
      for (let i = 0; i < 360; i++) {
        const h = i;
        const c = maxChromaForLH(l, h);
        if (!inRgbGamut({ mode: 'oklch', l, c, h })) {
          const rgb = toRgb({ mode: 'oklch', l, c, h });
          worstOutside = Math.max(
            worstOutside,
            -rgb.r, -rgb.g, -rgb.b, rgb.r - 1, rgb.g - 1, rgb.b - 1,
          );
        }
        // The other direction is a real disagreement if it ever fires: culori
        // saying a fatter chroma is fine would mean we under-report.
        if (inRgbGamut({ mode: 'oklch', l, c: c + 0.002, h })) stillInside++;
      }
    }
    expect(worstOutside).toBeLessThan(2e-5);
    expect(stillInside).toBe(0);
  });
});

describe('gamutIntersection on its own', () => {
  /*
   * The general form, which maxChromaForLH only ever calls with a horizontal
   * segment. Gamut mapping wants the sloped case, so it is exported and checked
   * here rather than left as an untested branch waiting for its first caller.
   */
  test('a horizontal segment gives back maxChromaForLH', () => {
    // Away from the blue band the two are the same computation, so this pins
    // maxChromaForLH's candidate check to a no-op everywhere else.
    for (const h of [20, 95, 180, 310]) {
      const rad = (h * Math.PI) / 180;
      const cusp: Cusp = cuspForHue(h);
      for (const l of [0.2, 0.5, 0.8]) {
        const t = gamutIntersection(Math.cos(rad), Math.sin(rad), l, 1, l, cusp);
        expect(t).toBeCloseTo(maxChromaForLH(l, h), 9);
      }
    }
  });

  test('a sloped segment stops on the boundary, not before or after it', () => {
    // Mid-grey as the anchor and a wildly out-of-gamut target: the returned
    // fraction should land on the surface, so a hair less is inside and a hair
    // more is not. Blue is left out on purpose - the sloped case is the star-
    // shaped model's, and the header says where that model stops being true.
    for (const h of [45, 130, 210, 330]) {
      const rad = (h * Math.PI) / 180;
      const a = Math.cos(rad);
      const b = Math.sin(rad);
      const cusp = cuspForHue(h);
      const l0 = 0.5;
      const l1 = cusp.l;
      const c1 = 0.4;
      const t = gamutIntersection(a, b, l1, c1, l0, cusp);
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
      const at = (f: number) => oklchToRgb(l0 * (1 - f) + f * l1, f * c1, h).inGamut;
      expect(at(t * 0.999)).toBe(true);
      expect(at(t * 1.01)).toBe(false);
    }
  });
});
