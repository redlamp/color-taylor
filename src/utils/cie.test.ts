import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import { CIE_1931_2DEG } from './cieCmf1931';
import {
  SRGB_R, SRGB_G, SRGB_B, SRGB_TRIANGLE, D65_WHITE, P3_TRIANGLE, SPECTRAL_LOCUS,
  SRGB_TO_XYZ_D65, XYZ_TO_SRGB_D65, PRIMARY_LUMINANCE,
  rgbToXyY, brightestRgbAt, insideLocus, insidePolygon,
  distanceToPolygon, circleFractionOutsideGamut, linearRgbToXyz,
  type Xy,
} from './cie';
import { hsbToRgb } from './colorConversions';

/*
 * Two things are on trial here and they are different kinds of thing.
 *
 * The **data** is measured: the CIE 1931 colour-matching functions, fetched
 * from CVRL. Nothing in this repo can derive them, so the tests can only check
 * that what arrived is what the standard publishes and that it behaves the way
 * the physics says it must - the locus convex, monotone in wavelength, closing
 * to a point at the red end, and containing every colour a screen can show. A
 * primary outside the horseshoe would mean the table or the transform was
 * wrong, and it is the cheapest check that would catch either.
 *
 * The **maths** is derivable, so culori is made to derive it independently:
 * its own xyz65 and p3 converters share no code with anything here.
 *
 * The numbers in the page's copy are all asserted below. A wrong number in a
 * teaching diagram is worse than no diagram.
 */

const toXyz = converter('xyz65');
const xyOf = (mode: 'rgb' | 'p3', r: number, g: number, b: number): Xy => {
  const c = toXyz({ mode, r, g, b });
  const s = c.x + c.y + c.z;
  return { x: c.x / s, y: c.y / s };
};

describe('the CMF table is the published one', () => {
  test('95 rows, 360 to 830 nm, every 5 nm', () => {
    expect(CIE_1931_2DEG.length).toBe(95);
    expect(CIE_1931_2DEG[0][0]).toBe(360);
    expect(CIE_1931_2DEG[94][0]).toBe(830);
    for (let i = 1; i < CIE_1931_2DEG.length; i++) {
      expect(CIE_1931_2DEG[i][0] - CIE_1931_2DEG[i - 1][0]).toBe(5);
    }
  });

  test('y-bar is the luminosity function: exactly 1 at 555 nm, its peak', () => {
    const at = (nm: number) => CIE_1931_2DEG.find((r) => r[0] === nm)!;
    expect(at(555)[2]).toBe(1);
    for (const row of CIE_1931_2DEG) expect(row[2]).toBeLessThanOrEqual(1);
  });

  test('spot values match the published table', () => {
    const at = (nm: number) => CIE_1931_2DEG.find((r) => r[0] === nm)!;
    expect(at(600)[1]).toBeCloseTo(1.0622, 4);
    expect(at(600)[2]).toBeCloseTo(0.6310, 4);
    expect(at(555)[1]).toBeCloseTo(0.51205, 5);
    expect(at(380)[3]).toBeCloseTo(0.00645, 5);
  });

  test('every row is non-negative and no row is all zero', () => {
    for (const [nm, x, y, z] of CIE_1931_2DEG) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(z).toBeGreaterThanOrEqual(0);
      expect(x + y + z).toBeGreaterThan(0);
      expect(nm).toBeGreaterThan(0);
    }
  });
});

describe('the spectral locus behaves the way monochromatic light must', () => {
  test('it is drawn from 380 to 700 nm, one sample every 5 nm', () => {
    expect(SPECTRAL_LOCUS.length).toBe(65);
    expect(SPECTRAL_LOCUS[0].nm).toBe(380);
    expect(SPECTRAL_LOCUS[64].nm).toBe(700);
  });

  test('past 700 nm the chromaticity stops moving, which is why it stops there', () => {
    const tail = CIE_1931_2DEG.filter(([nm]) => nm >= 700).map(([, X, Y, Z]) => {
      const s = X + Y + Z;
      return { x: X / s, y: Y / s };
    });
    const first = tail[0];
    expect(first.x).toBeCloseTo(0.734690, 6);
    expect(first.y).toBeCloseTo(0.265310, 6);
    let worst = 0;
    for (const p of tail) worst = Math.max(worst, Math.hypot(p.x - first.x, p.y - first.y));
    expect(worst).toBeLessThan(2e-7);
  });

  test('it never reverses direction as wavelength rises', () => {
    for (let i = 1; i < SPECTRAL_LOCUS.length - 1; i++) {
      const a = SPECTRAL_LOCUS[i - 1], b = SPECTRAL_LOCUS[i], c = SPECTRAL_LOCUS[i + 1];
      const d1 = Math.hypot(b.x - a.x, b.y - a.y), d2 = Math.hypot(c.x - b.x, c.y - b.y);
      const dot = ((b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y)) / (d1 * d2);
      expect(dot).toBeGreaterThan(0);
    }
  });

  test('it is convex to within a ten-thousandth', () => {
    // Every sample sits on the hull of the rest, bar a hair in the dim violet
    // end where a 5 nm table has little to work with. Measured: 7.7e-5 at 395.
    const pts = SPECTRAL_LOCUS.map((p) => [p.x, p.y] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (P: [number, number][]) => {
      const out: [number, number][] = [];
      for (const p of P) {
        while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const hull = [...half(pts), ...half([...pts].reverse())].map(([x, y]) => ({ x, y }));
    let worst = 0;
    for (const p of SPECTRAL_LOCUS) worst = Math.max(worst, distanceToPolygon(p, hull));
    expect(worst).toBeLessThan(1e-4);
  });

  test('the whole sRGB gamut lies inside it - the check that catches bad data', () => {
    for (const p of [...SRGB_TRIANGLE, D65_WHITE]) {
      expect(insideLocus(p)).toBe(true);
      expect(distanceToPolygon(p, SPECTRAL_LOCUS)).toBeGreaterThan(0.02);
    }
  });

  test("P3's red primary is monochromatic, so it lands on the locus itself", () => {
    // Not a defect and not a data error. DCI-P3 chose a red at essentially one
    // wavelength: it is 0.00026 from the 615 nm sample. The drawn horseshoe is
    // 5 nm chords, which is an *inscribed* polygon, so a point on the true
    // curve reads a ten-thousandth outside it. Worth knowing before believing
    // a stray "outside the locus" anywhere on the page.
    const red = P3_TRIANGLE[0];
    let best = Infinity, bestNm = 0;
    for (const s of SPECTRAL_LOCUS) {
      const d = Math.hypot(s.x - red.x, s.y - red.y);
      if (d < best) { best = d; bestNm = s.nm; }
    }
    expect(bestNm).toBe(615);
    expect(best).toBeLessThan(3e-4);
    expect(distanceToPolygon(red, SPECTRAL_LOCUS)).toBeLessThan(2e-4);
    // Its other two are comfortably inside.
    expect(insideLocus(P3_TRIANGLE[1])).toBe(true);
    expect(insideLocus(P3_TRIANGLE[2])).toBe(true);
  });
});

describe('the primaries are where the standard puts them', () => {
  test('measured out of the matrix, not typed in', () => {
    expect(SRGB_R.x).toBeCloseTo(0.6400, 4); expect(SRGB_R.y).toBeCloseTo(0.3300, 4);
    expect(SRGB_G.x).toBeCloseTo(0.3000, 4); expect(SRGB_G.y).toBeCloseTo(0.6000, 4);
    expect(SRGB_B.x).toBeCloseTo(0.1500, 4); expect(SRGB_B.y).toBeCloseTo(0.0600, 4);
    expect(D65_WHITE.x).toBeCloseTo(0.3127, 4); expect(D65_WHITE.y).toBeCloseTo(0.3290, 4);
  });

  test('culori agrees, by a route with nothing in common', () => {
    for (const [mine, args] of [[SRGB_R, [1, 0, 0]], [SRGB_G, [0, 1, 0]], [SRGB_B, [0, 0, 1]], [D65_WHITE, [1, 1, 1]]] as const) {
      const theirs = xyOf('rgb', args[0], args[1], args[2]);
      expect(mine.x).toBeCloseTo(theirs.x, 6);
      expect(mine.y).toBeCloseTo(theirs.y, 6);
    }
  });

  test("P3's stated primaries are the ones culori converts to", () => {
    const [R, G, B] = P3_TRIANGLE;
    for (const [mine, args] of [[R, [1, 0, 0]], [G, [0, 1, 0]], [B, [0, 0, 1]]] as const) {
      const theirs = xyOf('p3', args[0], args[1], args[2]);
      expect(mine.x).toBeCloseTo(theirs.x, 3);
      expect(mine.y).toBeCloseTo(theirs.y, 3);
    }
  });

  test('P3 contains sRGB, and shares its blue primary', () => {
    for (const p of SRGB_TRIANGLE) expect(insidePolygon(p, P3_TRIANGLE)).toBe(true);
    expect(P3_TRIANGLE[2].x).toBeCloseTo(SRGB_B.x, 4);
    expect(P3_TRIANGLE[2].y).toBeCloseTo(SRGB_B.y, 4);
  });

  test('the matrix inverse is an inverse', () => {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const v = [0, 1, 2].reduce((a, k) => a + SRGB_TO_XYZ_D65[i][k] * XYZ_TO_SRGB_D65[k][j], 0);
      expect(v).toBeCloseTo(i === j ? 1 : 0, 12);
    }
  });
});

describe('why blue is dark', () => {
  test('green reaches ten times the luminance blue does', () => {
    expect(PRIMARY_LUMINANCE.g).toBeCloseTo(0.7152, 4);
    expect(PRIMARY_LUMINANCE.b).toBeCloseTo(0.0722, 4);
    expect(PRIMARY_LUMINANCE.r).toBeCloseTo(0.2126, 4);
    expect(PRIMARY_LUMINANCE.g / PRIMARY_LUMINANCE.b).toBeCloseTo(9.91, 2);
  });

  test('the three add to white', () => {
    const sum = PRIMARY_LUMINANCE.r + PRIMARY_LUMINANCE.g + PRIMARY_LUMINANCE.b;
    expect(sum).toBeCloseTo(1, 12);
    expect(linearRgbToXyz(1, 1, 1)[1]).toBeCloseTo(1, 12);
  });
});

describe('what central projection throws away, and what it keeps', () => {
  test('brightness vanishes: a colour and its tenth land on one point', () => {
    const at = (b: number) => {
      const c = hsbToRgb(240, 100, b);
      return rgbToXyY(c.r, c.g, c.b)!;
    };
    const full = at(100), tenth = at(10);
    expect(full.x).toBeCloseTo(0.1500, 4);
    expect(full.y).toBeCloseTo(0.0600, 4);
    expect(tenth.x).toBeCloseTo(full.x, 12);
    expect(tenth.y).toBeCloseTo(full.y, 12);
    // What did change is the luminance that was divided out.
    expect(tenth.Y).toBeLessThan(full.Y / 5);
  });

  test('black alone has no chromaticity', () => {
    expect(rgbToXyY(0, 0, 0)).toBeNull();
    expect(rgbToXyY(1, 1, 1)).not.toBeNull();
  });

  test('the fully saturated rim IS the triangle perimeter, to floating-point zero', () => {
    // Not a fit. min(R,G,B)=0 makes a colour a mix of exactly two primaries,
    // and a mix of two primaries is on the line between them.
    let worst = 0;
    for (let h = 0; h < 360; h += 0.5) {
      const c = hsbToRgb(h, 100, 100);
      const p = rgbToXyY(c.r, c.g, c.b)!;
      worst = Math.max(worst, distanceToPolygon(p, SRGB_TRIANGLE));
    }
    expect(worst).toBeLessThan(1e-12);
  });

  test('reach from white varies 3.7 times over the six corners', () => {
    const reach = (h: number) => {
      const c = hsbToRgb(h, 100, 100);
      const p = rgbToXyY(c.r, c.g, c.b)!;
      return Math.hypot(p.x - D65_WHITE.x, p.y - D65_WHITE.y);
    };
    const measured = { red: reach(0), yellow: reach(60), green: reach(120), cyan: reach(180), blue: reach(240), magenta: reach(300) };
    expect(measured.red).toBeCloseTo(0.327, 3);
    expect(measured.yellow).toBeCloseTo(0.206, 3);
    expect(measured.green).toBeCloseTo(0.271, 3);
    expect(measured.cyan).toBeCloseTo(0.088, 3);
    expect(measured.blue).toBeCloseTo(0.314, 3);
    expect(measured.magenta).toBeCloseTo(0.175, 3);
    const v = Object.values(measured);
    expect(Math.max(...v) / Math.min(...v)).toBeCloseTo(3.72, 2);
  });

  test('HSB hue is not the angle: green is 27 degrees short, magenta 27 degrees over', () => {
    const angle = (h: number) => {
      const c = hsbToRgb(h, 100, 100);
      const p = rgbToXyY(c.r, c.g, c.b)!;
      const a = Math.atan2(p.y - D65_WHITE.y, p.x - D65_WHITE.x) * 180 / Math.PI;
      return a < 0 ? a + 360 : a;
    };
    expect(angle(0)).toBeCloseTo(0.2, 1);
    expect(angle(60)).toBeCloseTo(58.8, 1);
    expect(angle(120)).toBeCloseTo(92.7, 1);
    expect(angle(180)).toBeCloseTo(180.2, 1);
    expect(angle(240)).toBeCloseTo(238.8, 1);
    expect(angle(300)).toBeCloseTo(272.7, 1);
  });

  test('the secondaries are not midpoints of the edges they sit on', () => {
    const along = (p: Xy, a: Xy, b: Xy) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      return ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    };
    const at = (r: number, g: number, b: number) => rgbToXyY(r, g, b)!;
    expect(along(at(255, 255, 0), SRGB_R, SRGB_G)).toBeCloseTo(0.649, 3);
    expect(along(at(0, 255, 255), SRGB_G, SRGB_B)).toBeCloseTo(0.502, 3);
    expect(along(at(255, 0, 255), SRGB_B, SRGB_R)).toBeCloseTo(0.349, 3);
  });

  test('a circle about white is not the gamut: 57.3% of it is outside', () => {
    const closed = circleFractionOutsideGamut(0.20);
    expect(closed * 100).toBeCloseTo(57.3, 1);
    // sampled, as a check on the closed form
    const N = 360000;
    let out = 0;
    for (let i = 0; i < N; i++) {
      const t = 2 * Math.PI * i / N;
      const p = { x: D65_WHITE.x + 0.2 * Math.cos(t), y: D65_WHITE.y + 0.2 * Math.sin(t) };
      if (!insidePolygon(p, SRGB_TRIANGLE)) out++;
    }
    expect(out / N).toBeCloseTo(closed, 4);
  });

  test('constant saturation is not a shrunken triangle - the gamma difference, measured', () => {
    // HSB S=50 sits anywhere from 39% to 74% of the way out to the rim
    // depending on the hue, because the hexagon's S is computed on encoded
    // channels and chromaticity is linear. Through the app's own 8-bit
    // hsbToRgb, so these are the numbers the page's own dot would show.
    const frac = (h: number) => {
      const half = hsbToRgb(h, 50, 100), full = hsbToRgb(h, 100, 100);
      const p = rgbToXyY(half.r, half.g, half.b)!, rim = rgbToXyY(full.r, full.g, full.b)!;
      return Math.hypot(p.x - D65_WHITE.x, p.y - D65_WHITE.y) / Math.hypot(rim.x - D65_WHITE.x, rim.y - D65_WHITE.y);
    };
    expect(frac(0)).toBeCloseTo(0.435, 3);
    expect(frac(60)).toBeCloseTo(0.687, 3);
    expect(frac(120)).toBeCloseTo(0.588, 3);
    expect(frac(180)).toBeCloseTo(0.741, 3);
    expect(frac(240)).toBeCloseTo(0.590, 3);
    expect(frac(300)).toBeCloseTo(0.688, 3);
    let lo = 1, hi = 0;
    for (let h = 0; h < 360; h += 0.25) { const f = frac(h); lo = Math.min(lo, f); hi = Math.max(hi, f); }
    expect(lo).toBeCloseTo(0.385, 2);
    expect(hi).toBeCloseTo(0.743, 2);
  });
});

describe('the honest fill', () => {
  test('the brightest colour at a chromaticity has that chromaticity', () => {
    for (let x = 0.05; x < 0.75; x += 0.017) for (let y = 0.05; y < 0.85; y += 0.019) {
      const c = brightestRgbAt(x, y);
      if (!c) continue;
      const back = rgbToXyY(c.r, c.g, c.b)!;
      // 8-bit rounding on the way out is the whole error budget.
      expect(Math.hypot(back.x - x, back.y - y)).toBeLessThan(0.004);
    }
  });

  test('it has a colour exactly where sRGB does, and nowhere else', () => {
    let disagreements = 0, tested = 0;
    for (let x = 0.02; x < 0.78; x += 0.004) for (let y = 0.02; y < 0.88; y += 0.004) {
      const p = { x, y };
      const inside = insidePolygon(p, SRGB_TRIANGLE);
      const has = brightestRgbAt(x, y) !== null;
      tested++;
      // Points within a grid step of an edge can land either way.
      if (inside !== has && distanceToPolygon(p, SRGB_TRIANGLE) > 0.006) disagreements++;
    }
    expect(tested).toBeGreaterThan(30000);
    expect(disagreements).toBe(0);
  });

  test('each primary comes back as itself', () => {
    expect(brightestRgbAt(SRGB_R.x, SRGB_R.y)).toEqual({ r: 255, g: 0, b: 0 });
    expect(brightestRgbAt(SRGB_G.x, SRGB_G.y)).toEqual({ r: 0, g: 255, b: 0 });
    expect(brightestRgbAt(SRGB_B.x, SRGB_B.y)).toEqual({ r: 0, g: 0, b: 255 });
    expect(brightestRgbAt(D65_WHITE.x, D65_WHITE.y)).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('a monochromatic wavelength has no sRGB colour at all', () => {
    // Every one of them is outside the triangle; that is what the wash says.
    for (const p of SPECTRAL_LOCUS) expect(brightestRgbAt(p.x, p.y)).toBeNull();
  });
});
