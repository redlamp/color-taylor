import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import {
  morphPoint, xyToMorphPoint, cornerReadings, cornerGaps, rimShape, anchorReach,
  CORNERS, UNIT_HEX_AREA, type MorphTarget,
} from './gamutMorph';
import { GAMUTS, gamutById, gamutRgbToXyY } from './gamuts';
import { SRGB_TRIANGLE, D65_WHITE, rgbToXyY } from './cie';
import { hsbToRgb } from './colorConversions';

/*
 * The morph moves colours and recolours nothing, so everything on trial here
 * is a *position*. Two kinds of check, and they are different in kind:
 *
 * - **Against culori.** The transform into each target is rebuilt from
 *   culori's own `oklch` and `xyz65` converters, which share no code with
 *   anything in this repo, and the anchoring is redone on top of it. If our
 *   route into Oklab or into chromaticity were wrong, this is what would say
 *   so.
 * - **Against geometry.** Some of what the page claims is a theorem rather
 *   than a measurement, and a theorem should be asserted at the precision a
 *   theorem has. A colour and its complement sum to white in linear RGB, so
 *   white lies on the segment between them, so they are *exactly* antipodal
 *   about white in chromaticity - and exactly is 1e-12, not 0.5 degrees. The
 *   three-fold repeat in the gaps follows from that and is held just as hard.
 *
 * Every number the CIE lab page prints in its morph panel is asserted below.
 */

const toOklch = converter('oklch');
const toXyz = converter('xyz65');
const TARGETS: MorphTarget[] = ['xy', 'oklab'];

/** culori's answer for the same question, anchored the same way. */
function reference(r: number, g: number, b: number, target: MorphTarget) {
  const polar = (dx: number, dy: number) => ({ angle: Math.atan2(dy, dx), reach: Math.hypot(dx, dy) });
  const at = (rr: number, gg: number, bb: number) => {
    if (target === 'oklab') {
      const o = toOklch({ mode: 'rgb', r: rr / 255, g: gg / 255, b: bb / 255 });
      return polar((o.c ?? 0) * Math.cos(((o.h ?? 0) * Math.PI) / 180), (o.c ?? 0) * Math.sin(((o.h ?? 0) * Math.PI) / 180));
    }
    const c = toXyz({ mode: 'rgb', r: rr / 255, g: gg / 255, b: bb / 255 });
    const s = c.x + c.y + c.z;
    if (s <= 0) return { angle: 0, reach: 0 };
    return polar(c.x / s - D65_WHITE.x, c.y / s - D65_WHITE.y);
  };
  const red = at(255, 0, 0);
  const here = at(r, g, b);
  const a = here.angle - red.angle, d = here.reach / red.reach;
  return { x: d * Math.cos(a), y: d * Math.sin(a) };
}

describe('morphPoint against culori', () => {
  /*
   * 4096 triples on a stride-17 grid, both ends of the cube included, no
   * randomness. The tolerance is measured rather than guessed: the worst
   * disagreement over this grid is 3.0e-7 in xy and 1.5e-7 in Oklab, in units
   * where 1 is the whole hexagon radius - a hundredth of a pixel on a 540-unit
   * figure. Both routes use the same published constants, so all that differs
   * is the order the floats are added in.
   */
  test.each(TARGETS)('%s, over a stride-17 sweep of the cube', (target) => {
    let worst = 0;
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 17) {
        for (let b = 0; b <= 255; b += 17) {
          const ours = morphPoint(r, g, b, target);
          const ref = reference(r, g, b, target);
          // Black has no chromaticity; culori's route and ours both give up,
          // and neither answer is a measurement. See morphPoint.
          if (r === 0 && g === 0 && b === 0) continue;
          worst = Math.max(worst, Math.hypot(ours.x - ref.x, ours.y - ref.y));
        }
      }
    }
    expect(worst).toBeLessThan(1e-6);
  });
});

describe('the two anchors', () => {
  test.each(TARGETS)('%s: white sits at the origin, and every grey with it', (target) => {
    for (const v of [0, 1, 37, 128, 200, 254, 255]) {
      const p = morphPoint(v, v, v, target);
      expect(Math.hypot(p.x, p.y)).toBeLessThan(1e-12);
    }
  });

  test.each(TARGETS)('%s: red sits at (1, 0) exactly', (target) => {
    const p = morphPoint(255, 0, 0, target);
    expect(Math.abs(p.x - 1)).toBeLessThan(1e-12);
    expect(Math.abs(p.y)).toBeLessThan(1e-12);
  });

  test('what one hexagon radius is worth in each target', () => {
    // Red's distance from white, in the target's own units, before anything
    // is normalised. The page quotes both so the figures can be converted back.
    expect(anchorReach('xy')).toBeCloseTo(0.32730, 5);
    expect(anchorReach('oklab')).toBeCloseTo(0.25768, 5);
  });
});

describe('CIE xy: the six landmarks', () => {
  const read = cornerReadings('xy');
  const by = (n: string) => read.find((c) => c.name === n)!;

  test('the angles the page prints', () => {
    // Anticlockwise from red. The hexagon claims 0, 60, 120, 180, 240, 300.
    expect(by('Red').angle).toBeCloseTo(0, 6);
    expect(by('Yellow').angle).toBeCloseTo(58.658, 3);
    expect(by('Green').angle).toBeCloseTo(92.508, 3);
    expect(by('Cyan').angle).toBeCloseTo(180.000, 3);
    expect(by('Blue').angle).toBeCloseTo(238.658, 3);
    expect(by('Magenta').angle).toBeCloseTo(272.508, 3);
  });

  test('the gaps repeat every 120 degrees, exactly', () => {
    const g = cornerGaps('xy');
    expect(g[0]).toBeCloseTo(58.658, 3);
    expect(g[1]).toBeCloseTo(33.850, 3);
    expect(g[2]).toBeCloseTo(87.492, 3);
    for (let i = 0; i < 3; i++) expect(Math.abs(g[i] - g[i + 3])).toBeLessThan(1e-9);
    expect(g.reduce((s, v) => s + v, 0)).toBeCloseTo(360, 9);
  });

  test('each corner is exactly opposite its complement, which is why', () => {
    /*
     * R + C = W in linear RGB, and the map to XYZ is linear, so white is a
     * convex combination of the two - which puts it on the segment joining
     * them, so the two are 180 degrees apart about it. That is a theorem, and
     * it is what makes the gaps three-fold rather than six-fold: the gap from
     * red to yellow *is* the gap from cyan to blue, being the same angle at
     * the same vertex read the other way round.
     */
    for (const [a, b] of [['Red', 'Cyan'], ['Yellow', 'Blue'], ['Green', 'Magenta']] as const) {
      expect(Math.abs(Math.abs(by(a).angle - by(b).angle) - 180)).toBeLessThan(1e-9);
    }
  });

  test('reach from white varies 3.717 times over the six', () => {
    expect(by('Red').reach).toBeCloseTo(1.0000, 4);
    expect(by('Blue').reach).toBeCloseTo(0.9605, 4);
    expect(by('Green').reach).toBeCloseTo(0.8289, 4);
    expect(by('Yellow').reach).toBeCloseTo(0.6294, 4);
    expect(by('Magenta').reach).toBeCloseTo(0.5348, 4);
    expect(by('Cyan').reach).toBeCloseTo(0.2690, 4);
    const rs = read.map((c) => c.reach);
    expect(Math.max(...rs) / Math.min(...rs)).toBeCloseTo(3.717, 3);
  });
});

describe('Oklab a/b: the six landmarks', () => {
  const read = cornerReadings('oklab');
  const by = (n: string) => read.find((c) => c.name === n)!;

  test('the angles the page prints', () => {
    expect(by('Red').angle).toBeCloseTo(0, 6);
    expect(by('Yellow').angle).toBeCloseTo(80.535, 3);
    expect(by('Green').angle).toBeCloseTo(113.261, 3);
    expect(by('Cyan').angle).toBeCloseTo(165.535, 3);
    expect(by('Blue').angle).toBeCloseTo(234.818, 3);
    expect(by('Magenta').angle).toBeCloseTo(299.130, 3);
  });

  test('all six gaps differ: there is no three-fold structure here', () => {
    /*
     * The xy repeat comes from white lying on the segment between a colour and
     * its complement, and that survives only a linear map. Oklab takes a cube
     * root of LMS, so it does not survive: cyan is 165.5 degrees from red
     * rather than 180, and the six gaps are six different numbers between 32.7
     * and 80.5.
     */
    const g = cornerGaps('oklab');
    expect(g[0]).toBeCloseTo(80.535, 3);
    expect(g[1]).toBeCloseTo(32.726, 3);
    expect(g[2]).toBeCloseTo(52.274, 3);
    expect(g[3]).toBeCloseTo(69.283, 3);
    expect(g[4]).toBeCloseTo(64.311, 3);
    expect(g[5]).toBeCloseTo(60.870, 3);
    for (let i = 0; i < 3; i++) expect(Math.abs(g[i] - g[i + 3])).toBeGreaterThan(8);
    expect(Math.abs(by('Red').angle - by('Cyan').angle)).toBeLessThan(170);
  });

  test('reach varies 2.087 times, and three of the six reach past red', () => {
    expect(by('Magenta').reach).toBeCloseTo(1.2515, 4);
    expect(by('Blue').reach).toBeCloseTo(1.2155, 4);
    expect(by('Green').reach).toBeCloseTo(1.1441, 4);
    expect(by('Red').reach).toBeCloseTo(1.0000, 4);
    expect(by('Yellow').reach).toBeCloseTo(0.8189, 4);
    expect(by('Cyan').reach).toBeCloseTo(0.5998, 4);
    const rs = read.map((c) => c.reach);
    expect(Math.max(...rs) / Math.min(...rs)).toBeCloseTo(2.087, 3);
  });

  test('the reaches are the corners own chroma, scaled by reds', () => {
    // The same six numbers the plan note quotes as max chroma: 0.258, 0.211,
    // 0.295, 0.155, 0.313, 0.322, measured here rather than copied.
    const expected = [0.2577, 0.2110, 0.2948, 0.1546, 0.3132, 0.3225];
    read.forEach((c, i) => expect(c.reach * anchorReach('oklab')).toBeCloseTo(expected[i], 4));
  });
});

describe('the rim, and where its middle went', () => {
  test('under xy the rim is the sRGB triangle, so its area is the triangles', () => {
    /*
     * A colour with min(R, G, B) = 0 is a mix of two primaries and lies on the
     * line between them, so the saturation-100 rim *is* the triangle's
     * perimeter - see cie.ts. The shoelace over 1440 samples should therefore
     * land on the triangle's own area, computed here straight from the three
     * primaries.
     */
    const [R, G, B] = SRGB_TRIANGLE;
    const raw = Math.abs(R.x * (G.y - B.y) + G.x * (B.y - R.y) + B.x * (R.y - G.y)) / 2;
    const expected = raw / (anchorReach('xy') ** 2) / UNIT_HEX_AREA;
    expect(rimShape('xy').area).toBeCloseTo(expected, 6);
    expect(rimShape('xy').area).toBeCloseTo(0.4026, 4);
  });

  test('under Oklab the rim keeps almost exactly the hexagons area', () => {
    // 97.5%: the morph is very nearly area-preserving overall, which is what
    // makes it read as a distortion rather than a resize.
    expect(rimShape('oklab').area).toBeCloseTo(0.9749, 4);
  });

  test('white is not the middle of either shape', () => {
    const xy = rimShape('xy').centroid;
    const ok = rimShape('oklab').centroid;
    expect(Math.hypot(xy.x, xy.y)).toBeCloseTo(0.1547, 4);
    expect(Math.hypot(ok.x, ok.y)).toBeCloseTo(0.2159, 4);
    // The two slide in quite different directions: xy's middle goes straight
    // at red, Oklab's goes down towards magenta.
    expect((Math.atan2(xy.y, xy.x) * 180) / Math.PI).toBeCloseTo(0.97, 1);
    expect(((Math.atan2(ok.y, ok.x) * 180) / Math.PI + 360) % 360).toBeCloseTo(295.9, 1);
  });

  test('the sample count does not decide the answer', () => {
    for (const target of TARGETS) {
      const coarse = rimShape(target, 360), fine = rimShape(target, 2880);
      expect(coarse.area).toBeCloseTo(fine.area, 4);
      expect(Math.hypot(coarse.centroid.x - fine.centroid.x, coarse.centroid.y - fine.centroid.y)).toBeLessThan(1e-4);
    }
  });
});

describe('the landmarks are the colours the hexagons corners wear', () => {
  test('each corner is hsbToRgb at its own hue, fully saturated and bright', () => {
    for (const c of CORNERS) {
      expect(hsbToRgb(c.hsbHue, 100, 100)).toEqual(c.rgb);
    }
  });

  test.each(TARGETS)('%s: a corner reading is the morph point of that colour', (target) => {
    for (const c of cornerReadings(target)) {
      const rgb = CORNERS.find((k) => k.name === c.name)!.rgb;
      const p = morphPoint(rgb.r, rgb.g, rgb.b, target);
      expect(c.point.x).toBeCloseTo(p.x, 12);
      expect(c.point.y).toBeCloseTo(p.y, 12);
    }
  });
});

describe('a chromaticity can enter the morph plane without a colour', () => {
  /*
   * `xyToMorphPoint` exists so the spectral locus and the wide gamuts - none
   * of which are sRGB colours - can be drawn in the plane the xy morph ends
   * in. The only thing it has to get right is agreeing with `morphPoint`
   * wherever both are defined.
   */
  test('it agrees with morphPoint on every colour morphPoint can place', () => {
    for (let h = 0; h < 360; h += 7) {
      for (const [s, b] of [[100, 100], [60, 80], [25, 45]] as const) {
        const c = hsbToRgb(h, s, b);
        const viaColour = morphPoint(c.r, c.g, c.b, 'xy');
        const xyY = rgbToXyY(c.r, c.g, c.b)!;
        const viaChromaticity = xyToMorphPoint(xyY.x, xyY.y);
        expect(viaChromaticity.x).toBeCloseTo(viaColour.x, 12);
        expect(viaChromaticity.y).toBeCloseTo(viaColour.y, 12);
      }
    }
  });

  test('the two anchors land where the morph pins them', () => {
    const white = xyToMorphPoint(D65_WHITE.x, D65_WHITE.y);
    expect(white.x).toBeCloseTo(0, 12);
    expect(white.y).toBeCloseTo(0, 12);
    const red = xyToMorphPoint(SRGB_TRIANGLE[0].x, SRGB_TRIANGLE[0].y);
    expect(red.x).toBeCloseTo(1, 12);
    expect(red.y).toBeCloseTo(0, 12);
  });

  test('it places points outside sRGB, which is the whole reason it exists', () => {
    // Rec. 2020's red is monochromatic and no sRGB colour has its chromaticity.
    const p = xyToMorphPoint(0.708, 0.292);
    expect(Math.hypot(p.x, p.y)).toBeGreaterThan(1);
  });
});

describe('the space the hexagon’s numbers belong to is a parameter', () => {
  /*
   * The page's sharpest claim, as arithmetic: the hexagon is the same picture
   * in every RGB space, and where its colours land is not. If these came out
   * equal the whole fourth panel would be decoration.
   */
  test('leaving it out is sRGB, to the last bit', () => {
    for (const target of TARGETS) {
      for (const c of [CORNERS[0].rgb, CORNERS[3].rgb, { r: 137, g: 42, b: 200 }]) {
        const bare = morphPoint(c.r, c.g, c.b, target);
        const said = morphPoint(c.r, c.g, c.b, target, 'srgb');
        expect(bare.x).toBe(said.x);
        expect(bare.y).toBe(said.y);
      }
      expect(anchorReach(target)).toBe(anchorReach(target, 'srgb'));
      expect(cornerGaps(target)).toEqual(cornerGaps(target, 'srgb'));
    }
  });

  test('red and white stay pinned in every space, because that is the anchoring', () => {
    for (const g of GAMUTS) {
      for (const target of TARGETS) {
        const red = morphPoint(255, 0, 0, target, g.id);
        expect(red.x).toBeCloseTo(1, 9);
        expect(red.y).toBeCloseTo(0, 9);
        // White lands at the centre in every space, which is what makes it a
        // free anchor rather than a second chosen one. It is that space's own
        // white: ProPhoto's is D50, and the plane is centred there.
        const white = morphPoint(255, 255, 255, target, g.id);
        expect(Math.hypot(white.x, white.y)).toBeLessThan(0.02);
      }
    }
  });

  test('a corner that is not an anchor goes somewhere else in each space', () => {
    // Green: pinned by nothing, so it is free to disagree.
    const seen = GAMUTS.map((g) => morphPoint(0, 255, 0, 'xy', g.id));
    for (let i = 1; i < seen.length; i++) {
      expect(Math.hypot(seen[i].x - seen[0].x, seen[i].y - seen[0].y)).toBeGreaterThan(0.01);
    }
  });

  test('the xy morph really is that gamut’s chromaticity, anchored', () => {
    for (const g of GAMUTS) {
      const reach = anchorReach('xy', g.id);
      for (const c of [{ r: 0, g: 255, b: 0 }, { r: 90, g: 30, b: 200 }]) {
        const p = morphPoint(c.r, c.g, c.b, 'xy', g.id);
        const xy = gamutRgbToXyY(g.id, c.r, c.g, c.b)!;
        // distance from that space's own white, divided by red's: the
        // normalisation, undone. ProPhoto's white is D50, and the plane is
        // centred on it rather than on D65 - see whiteOf in gamutMorph.ts.
        const w = gamutById(g.id).white;
        expect(Math.hypot(p.x, p.y) * reach)
          .toBeCloseTo(Math.hypot(xy.x - w.x, xy.y - w.y), 9);
      }
    }
  });

  test('a wider gamut reaches further, which is what wider means', () => {
    // Green's reach from white, as a multiple of that space's own red.
    const srgb = Math.hypot(...Object.values(morphPoint(0, 255, 0, 'xy', 'srgb')));
    const rec = Math.hypot(...Object.values(morphPoint(0, 255, 0, 'xy', 'rec2020')));
    expect(rec).toBeGreaterThan(srgb);
  });

  test('the rim and the corners follow the space too', () => {
    for (const g of GAMUTS) {
      const rim = rimShape('xy', 360, g.id);
      const corners = cornerReadings('xy', g.id);
      expect(rim.area).toBeGreaterThan(0);
      expect(corners[0].angle).toBeCloseTo(0, 6);
      expect(corners[0].reach).toBeCloseTo(1, 9);
    }
    // sRGB's xy rim is the triangle; a wider space keeps a different share.
    expect(rimShape('xy', 360, 'rec2020').area).not.toBeCloseTo(rimShape('xy', 360, 'srgb').area, 3);
  });

  test('a chromaticity enters each space’s plane on that space’s terms', () => {
    for (const g of GAMUTS) {
      const red = gamutRgbToXyY(g.id, 255, 0, 0)!;
      const p = xyToMorphPoint(red.x, red.y, g.id);
      expect(p.x).toBeCloseTo(1, 9);
      expect(p.y).toBeCloseTo(0, 9);
    }
  });
});
