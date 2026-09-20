import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import {
  GAMUTS, gamutById, xyArea, locusAreaShare, LOCUS_AREA,
  rgbToXyzMatrix, gamutLuminance, gamutRgbToXyY, gamutRgbToXyzD65, gamutMaths,
  TRCS, decodeTrc, encodeTrc, brightestInGamut, cssColorIn, type GamutId,
} from './gamuts';
import {
  SRGB_TRIANGLE, P3_TRIANGLE, D65_WHITE, SPECTRAL_LOCUS, insidePolygon,
  distanceToPolygon, rgbToXyY, brightestRgbAt, SRGB_TO_XYZ_D65, XYZ_TO_SRGB_D65, type Xy,
} from './cie';
import { linearToOklab } from './colorConversions';

/*
 * The table in gamuts.ts is typed from standards documents, so the one thing
 * worth testing is whether the typing is right. culori is the second opinion:
 * its a98, p3, rec2020 and prophoto converters carry their own RGB-to-XYZ
 * matrices, written from the same standards by someone else, and a primary is
 * simply the chromaticity of that space's pure red, green or blue.
 *
 * A gamut drawn a few thousandths wrong would look completely plausible on the
 * diagram - the outlines are close together and nobody has the real ones
 * memorised - which is exactly why it has to be checked by machine.
 */

const toXyz65 = converter('xyz65');
const toXyz50 = converter('xyz50');

const chromaticity = (c: { x: number; y: number; z: number }): Xy => {
  const s = c.x + c.y + c.z;
  return { x: c.x / s, y: c.y / s };
};

/** The chromaticity culori gives for one unit channel of a space. */
function culoriPrimary(id: GamutId, ch: 'r' | 'g' | 'b' | 'w'): Xy {
  const mode = ({ srgb: 'rgb', p3: 'p3', a98: 'a98', rec2020: 'rec2020', prophoto: 'prophoto' } as const)[id];
  const rgb = { r: 0, g: 0, b: 0 };
  if (ch === 'w') { rgb.r = 1; rgb.g = 1; rgb.b = 1; } else rgb[ch] = 1;
  // ProPhoto is defined on D50 and culori keeps it there; converting it to
  // xyz65 would chromatically adapt it and move the primaries, which is
  // precisely what a gamut definition does not do.
  const c = id === 'prophoto'
    ? toXyz50({ mode, ...rgb })
    : toXyz65({ mode, ...rgb });
  return chromaticity(c as { x: number; y: number; z: number });
}

describe('every gamut is the one the standard defines', () => {
  for (const g of GAMUTS) {
    test(`${g.name}: culori derives the same three primaries and white`, () => {
      const got = [culoriPrimary(g.id, 'r'), culoriPrimary(g.id, 'g'), culoriPrimary(g.id, 'b')];
      for (let i = 0; i < 3; i++) {
        expect(got[i].x).toBeCloseTo(g.primaries[i].x, 4);
        expect(got[i].y).toBeCloseTo(g.primaries[i].y, 4);
      }
      const w = culoriPrimary(g.id, 'w');
      expect(w.x).toBeCloseTo(g.white.x, 4);
      expect(w.y).toBeCloseTo(g.white.y, 4);
    });
  }

  test('there is exactly one sRGB: the table points at cie.ts', () => {
    // The same array object, not a copy of the same numbers.
    expect(gamutById('srgb').primaries as readonly Xy[]).toBe(SRGB_TRIANGLE);
    expect(gamutById('srgb').white).toBe(D65_WHITE);
  });

  test('and exactly one Display P3', () => {
    const p3 = gamutById('p3').primaries;
    for (let i = 0; i < 3; i++) {
      expect(p3[i].x).toBe(P3_TRIANGLE[i].x);
      expect(p3[i].y).toBe(P3_TRIANGLE[i].y);
    }
  });
});

describe('where the primaries sit against the spectral locus', () => {
  /*
   * The two cases the page has to handle rather than "fix". Both are asserted
   * here so that a later attempt to clamp either one fails loudly.
   */
  test('Rec. 2020 is monochromatic, so its primaries sit on the curve', () => {
    const g = gamutById('rec2020');
    expect(g.imaginary).toBe(false);
    for (const p of g.primaries) {
      // On the curve within what a 5 nm chord can cut off a corner. Measured
      // to the chords, not to the samples: 532 nm falls between two rows.
      expect(distanceToPolygon(p, SPECTRAL_LOCUS)).toBeLessThan(0.001);
    }
  });

  test('ProPhoto is deliberately imaginary, and the flag says so', () => {
    const g = gamutById('prophoto');
    expect(g.imaginary).toBe(true);
    // Red is real; green and blue are not, and blue is far outside.
    expect(insidePolygon(g.primaries[1], SPECTRAL_LOCUS)).toBe(false);
    expect(insidePolygon(g.primaries[2], SPECTRAL_LOCUS)).toBe(false);
    expect(distanceToPolygon(g.primaries[2], SPECTRAL_LOCUS)).toBeGreaterThan(0.02);
  });

  test('the three that fit really do fit', () => {
    for (const id of ['srgb', 'p3', 'a98'] as const) {
      const g = gamutById(id);
      expect(g.imaginary).toBe(false);
      for (const p of g.primaries) {
        expect(insidePolygon(p, SPECTRAL_LOCUS) || distanceToPolygon(p, SPECTRAL_LOCUS) < 0.005).toBe(true);
      }
    }
  });
});

describe('the area figures', () => {
  test('shoelace agrees with the closed form on a known triangle', () => {
    expect(xyArea([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }])).toBeCloseTo(0.5, 12);
    // winding does not matter
    expect(xyArea([{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }])).toBeCloseTo(0.5, 12);
  });

  test('the locus encloses a third of a chromaticity unit', () => {
    expect(LOCUS_AREA).toBeCloseTo(0.33332, 4);
  });

  test('the shares are the ones this diagram supports', () => {
    /*
     * Pinned, because these are the numbers the page prints. The widely quoted
     * "Rec. 2020 covers 75.8%" is the same ratio taken in CIE 1976 u'v', not
     * here; in 1931 xy it is 63.6%, and the page says which diagram it means.
     */
    expect(locusAreaShare(gamutById('srgb'))).toBeCloseTo(0.3362, 3);
    expect(locusAreaShare(gamutById('p3'))).toBeCloseTo(0.4560, 3);
    expect(locusAreaShare(gamutById('a98'))).toBeCloseTo(0.4535, 3);
    expect(locusAreaShare(gamutById('rec2020'))).toBeCloseTo(0.6356, 3);
    expect(locusAreaShare(gamutById('prophoto'))).toBeCloseTo(0.8310, 3);
  });

  test('the gamuts nest the way their definitions say', () => {
    const srgb = gamutById('srgb'), a98 = gamutById('a98'), p3 = gamutById('p3');
    // Adobe RGB and sRGB share red and blue; only green moved out.
    expect(a98.primaries[0].x).toBeCloseTo(srgb.primaries[0].x, 3);
    expect(a98.primaries[2].x).toBeCloseTo(srgb.primaries[2].x, 3);
    expect(locusAreaShare(a98)).toBeGreaterThan(locusAreaShare(srgb));
    expect(locusAreaShare(gamutById('rec2020'))).toBeGreaterThan(locusAreaShare(p3));
  });
});

/*
 * The machinery, on trial against culori a second time.
 *
 * The definitions above are three chromaticities. What follows is everything
 * derived from them - the matrix, the transfer function, the luminance row -
 * and derived code is exactly the kind that can be subtly wrong while looking
 * plausible on a diagram. culori carries its own matrices and its own decode
 * for each of these spaces, written from the same standards by someone else,
 * so every number below has an independent second opinion.
 */

const toOklab = converter('oklab');

const CULORI_MODE: Record<GamutId, 'rgb' | 'p3' | 'a98' | 'rec2020' | 'prophoto'> = {
  srgb: 'rgb', p3: 'p3', a98: 'a98', rec2020: 'rec2020', prophoto: 'prophoto',
};

/** A spread of encoded triples, including the corners and some mid-tones. */
const SAMPLES: ReadonlyArray<[number, number, number]> = [
  [255, 0, 0], [0, 255, 0], [0, 0, 255],
  [255, 255, 0], [0, 255, 255], [255, 0, 255],
  [255, 255, 255], [128, 128, 128], [10, 10, 10],
  [137, 42, 200], [52, 137, 235], [3, 250, 90], [200, 180, 7],
];

describe('the derived matrix is the one culori carries', () => {
  for (const g of GAMUTS) {
    test(`${g.name}: every column is that primary's XYZ`, () => {
      const m = rgbToXyzMatrix(g);
      const mode = CULORI_MODE[g.id];
      const d50 = g.whiteName === 'D50';
      for (const [i, ch] of (['r', 'g', 'b'] as const).entries()) {
        const rgb = { r: 0, g: 0, b: 0 };
        rgb[ch] = 1;
        const c = (d50 ? toXyz50({ mode, ...rgb }) : toXyz65({ mode, ...rgb })) as { x: number; y: number; z: number };
        expect(m[0][i]).toBeCloseTo(c.x, 5);
        expect(m[1][i]).toBeCloseTo(c.y, 5);
        expect(m[2][i]).toBeCloseTo(c.z, 5);
      }
    });

    test(`${g.name}: white comes out at Y = 1, which is what fixes the scaling`, () => {
      const m = rgbToXyzMatrix(g);
      expect(m[1][0] + m[1][1] + m[1][2]).toBeCloseTo(1, 10);
      const X = m[0][0] + m[0][1] + m[0][2];
      const Z = m[2][0] + m[2][1] + m[2][2];
      expect(X / (X + 1 + Z)).toBeCloseTo(g.white.x, 9);
      expect(1 / (X + 1 + Z)).toBeCloseTo(g.white.y, 9);
    });
  }

  test('sRGB rediscovers the matrix cie.ts already had', () => {
    const m = rgbToXyzMatrix(gamutById('srgb'));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      expect(m[i][j]).toBeCloseTo(SRGB_TO_XYZ_D65[i][j], 9);
    }
  });

  test('the luminance row is the lopsidedness the solid draws', () => {
    /*
     * Pinned, because the page prints them: every space has its own three,
     * and the green-to-blue ratio is the height of its solid's roof over one
     * corner against the other. The surprise is ProPhoto, whose blue primary
     * sits at y = 0.000105 and therefore carries essentially no luminance at
     * all - a solid that lies flat on the floor over a whole corner.
     */
    const expected: Record<GamutId, [number, number, number]> = {
      srgb: [0.2126, 0.7152, 0.0722],
      p3: [0.2290, 0.6917, 0.0793],
      a98: [0.2973, 0.6274, 0.0753],
      rec2020: [0.2627, 0.6780, 0.0593],
      prophoto: [0.2881, 0.7118, 0.0001],
    };
    for (const g of GAMUTS) {
      const l = gamutLuminance(g.id);
      const [r, gr, b] = expected[g.id];
      expect(l.r).toBeCloseTo(r, 4);
      expect(l.g).toBeCloseTo(gr, 4);
      expect(l.b).toBeCloseTo(b, 4);
      // Every space is lopsided, and always the same way round.
      expect(l.r + l.g + l.b).toBeCloseTo(1, 10);
      expect(l.g).toBeGreaterThan(l.r);
      expect(l.r).toBeGreaterThan(l.b);
    }
    // Rec. 2020's blue is darker than sRGB's; ProPhoto's is another world.
    expect(gamutLuminance('rec2020').b).toBeLessThan(gamutLuminance('srgb').b);
    expect(gamutLuminance('prophoto').g / gamutLuminance('prophoto').b).toBeGreaterThan(1000);
  });
});

describe('each transfer function is its own standard', () => {
  test('every one runs 0 to 1 and is continuous across its join', () => {
    for (const id of Object.keys(TRCS) as GamutId[]) {
      const t = TRCS[id];
      expect(decodeTrc(t, 0)).toBeCloseTo(0, 12);
      expect(decodeTrc(t, 1)).toBeCloseTo(1, 12);
      if (t.cut > 0) {
        const below = decodeTrc(t, t.cut - 1e-9), above = decodeTrc(t, t.cut + 1e-9);
        expect(Math.abs(above - below)).toBeLessThan(1e-4);
      }
      // monotone
      let prev = -1;
      for (let v = 0; v <= 1.0001; v += 0.01) {
        const y = decodeTrc(t, v);
        expect(y).toBeGreaterThan(prev);
        prev = y;
      }
    }
  });

  test('sRGB and Display P3 share one, which is why P3 drops into CSS', () => {
    expect(TRCS.p3).toEqual(TRCS.srgb);
  });

  test('Adobe RGB is a pure power of 563/256, not of 2.2', () => {
    expect(TRCS.a98.cut).toBe(0);
    expect(TRCS.a98.gamma).toBeCloseTo(2.19921875, 12);
    expect(decodeTrc(TRCS.a98, 0.5)).toBeCloseTo(Math.pow(0.5, 563 / 256), 12);
  });
});

describe('a triple lands where culori says it lands, in every space', () => {
  test.each(GAMUTS.map((g) => g.id))('%s: chromaticity agrees', (id) => {
    const g = gamutById(id);
    const d50 = g.whiteName === 'D50';
    for (const [r, gr, b] of SAMPLES) {
      const mine = gamutRgbToXyY(id, r, gr, b);
      const arg = { mode: CULORI_MODE[id], r: r / 255, g: gr / 255, b: b / 255 };
      const c = (d50 ? toXyz50(arg) : toXyz65(arg)) as { x: number; y: number; z: number };
      const s = c.x + c.y + c.z;
      expect(mine).not.toBeNull();
      expect(mine!.x).toBeCloseTo(c.x / s, 5);
      expect(mine!.y).toBeCloseTo(c.y / s, 5);
      expect(mine!.Y).toBeCloseTo(c.y, 5);
    }
  });

  test('sRGB goes exactly where the page already put it', () => {
    for (const [r, g, b] of SAMPLES) {
      const a = gamutRgbToXyY('srgb', r, g, b);
      const c = rgbToXyY(r, g, b);
      expect(a!.x).toBeCloseTo(c!.x, 9);
      expect(a!.y).toBeCloseTo(c!.y, 9);
      expect(a!.Y).toBeCloseTo(c!.Y, 9);
    }
  });

  test('black has no chromaticity in any space', () => {
    for (const g of GAMUTS) expect(gamutRgbToXyY(g.id, 0, 0, 0)).toBeNull();
  });

  test('the same triple really does land somewhere else in each space', () => {
    // The page's whole claim: the hexagon cannot tell you which space it is.
    const seen = GAMUTS.map((g) => gamutRgbToXyY(g.id, 220, 40, 30)!);
    for (let i = 1; i < seen.length; i++) {
      expect(Math.hypot(seen[i].x - seen[0].x, seen[i].y - seen[0].y)).toBeGreaterThan(0.005);
    }
  });
});

describe('the D65 adaptation is only applied where it is needed', () => {
  test('a D65 space is not adapted at all', () => {
    for (const id of ['srgb', 'p3', 'a98', 'rec2020'] as const) {
      const m = gamutMaths(id);
      expect(m.toXyzD65).toEqual(m.toXyz);
    }
  });

  test('ProPhoto is, and culori agrees where it lands in Oklab', () => {
    const m = gamutMaths('prophoto');
    expect(m.toXyzD65).not.toEqual(m.toXyz);
    for (const [r, g, b] of SAMPLES) {
      const [X, Y, Z] = gamutRgbToXyzD65('prophoto', r, g, b);
      // XYZ D65 to Oklab, by the route cie.ts and colorConversions already
      // have between them: the matrices are linear and cbrt takes negatives,
      // so going via linear sRGB is exact even outside the sRGB gamut.
      const lin = [0, 1, 2].map((i) =>
        XYZ_TO_SRGB_D65[i][0] * X + XYZ_TO_SRGB_D65[i][1] * Y + XYZ_TO_SRGB_D65[i][2] * Z);
      const mine = linearToOklab(lin[0], lin[1], lin[2]);
      const theirs = toOklab({ mode: 'prophoto', r: r / 255, g: g / 255, b: b / 255 }) as { l: number; a: number; b: number };
      expect(mine.l).toBeCloseTo(theirs.l, 3);
      expect(mine.a).toBeCloseTo(theirs.a, 3);
      expect(mine.b).toBeCloseTo(theirs.b, 3);
    }
  });

  test('white adapts to white', () => {
    const [X, Y, Z] = gamutRgbToXyzD65('prophoto', 255, 255, 255);
    const s = X + Y + Z;
    expect(X / s).toBeCloseTo(D65_WHITE.x, 3);
    expect(Y / s).toBeCloseTo(D65_WHITE.y, 3);
  });
});

describe('a colour can be spelled so a wide-gamut screen shows it', () => {
  test('sRGB stays a hex string; the rest become color()', () => {
    expect(cssColorIn('srgb', 255, 0, 17)).toBe('#ff0011');
    expect(cssColorIn('p3', 255, 0, 0)).toBe('color(display-p3 1.00000 0.00000 0.00000)');
    expect(cssColorIn('a98', 0, 128, 255)).toBe('color(a98-rgb 0.00000 0.50196 1.00000)');
    expect(cssColorIn('rec2020', 0, 0, 0)).toBe('color(rec2020 0.00000 0.00000 0.00000)');
    expect(cssColorIn('prophoto', 255, 255, 255)).toBe('color(prophoto-rgb 1.00000 1.00000 1.00000)');
  });

  test('the keywords are the ones CSS Color 4 defines', () => {
    // A wrong keyword is an invalid colour, which renders as nothing at all.
    for (const id of ['p3', 'a98', 'rec2020', 'prophoto'] as const) {
      const css = cssColorIn(id, 1, 2, 3);
      expect(['display-p3', 'a98-rgb', 'rec2020', 'prophoto-rgb'])
        .toContain(css.slice('color('.length).split(' ')[0]);
    }
  });
});

describe('the brightest colour a space can hold at a chromaticity', () => {
  test('encode undoes decode, everywhere, in every space', () => {
    for (const id of Object.keys(TRCS) as GamutId[]) {
      for (let v = 0; v <= 1.0001; v += 0.005) {
        expect(decodeTrc(TRCS[id], encodeTrc(TRCS[id], v))).toBeCloseTo(v, 9);
        expect(encodeTrc(TRCS[id], decodeTrc(TRCS[id], v))).toBeCloseTo(v, 9);
      }
    }
  });

  test('for sRGB it is what cie.ts has always painted', () => {
    for (let x = 0.05; x < 0.72; x += 0.031) {
      for (let y = 0.05; y < 0.82; y += 0.037) {
        const mine = brightestInGamut('srgb', x, y);
        const theirs = brightestRgbAt(x, y);
        expect(mine === null).toBe(theirs === null);
        if (mine && theirs) {
          // Both round to 8 bits at the end, so they can differ by a step.
          expect(Math.abs(mine.r - theirs.r)).toBeLessThanOrEqual(1);
          expect(Math.abs(mine.g - theirs.g)).toBeLessThanOrEqual(1);
          expect(Math.abs(mine.b - theirs.b)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('a wider space holds chromaticities a narrower one refuses', () => {
    // Just outside sRGB's green corner, well inside P3's.
    let wider = 0;
    for (let x = 0.05; x < 0.72; x += 0.011) {
      for (let y = 0.05; y < 0.82; y += 0.011) {
        if (brightestInGamut('srgb', x, y) === null && brightestInGamut('p3', x, y) !== null) wider++;
      }
    }
    expect(wider).toBeGreaterThan(100);
  });

  test('a primary comes back as that primary at full strength', () => {
    for (const g of GAMUTS) {
      for (const [i, ch] of (['r', 'g', 'b'] as const).entries()) {
        const p = g.primaries[i];
        const got = brightestInGamut(g.id, p.x, p.y);
        expect(got).not.toBeNull();
        expect(got![ch]).toBe(255);
        for (const other of ['r', 'g', 'b'] as const) {
          if (other !== ch) expect(got![other]).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
