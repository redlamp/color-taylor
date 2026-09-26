import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import {
  rgbToHsb, hsbToRgb, rgbToHsl, hslToRgb, srgbToLinear, linearToSrgb, rgbToHex, hexToRgb,
  hexDigits, normalizedChannel,
  linearToOklab, oklabToLinear, oklabToOklch, oklchToOklab, rgbToOklch, oklchToRgb,
} from './colorConversions';

/*
 * culori is the oracle, not the implementation: every conversion here is
 * checked against an independent library rather than against itself. The
 * project's functions return whole numbers - hue in degrees, everything else
 * in percent or 0..255 - so the comparison rounds culori's floats the same way
 * and allows one unit of slack for the two roundings landing either side.
 */
const toHsv = converter('hsv');
const toHsl = converter('hsl');
const toRgb = converter('rgb');

const LANDMARKS: [string, number, number, number][] = [
  ['red', 255, 0, 0], ['yellow', 255, 255, 0], ['green', 0, 255, 0],
  ['cyan', 0, 255, 255], ['blue', 0, 0, 255], ['magenta', 255, 0, 255],
  ['white', 255, 255, 255], ['black', 0, 0, 0], ['grey', 128, 128, 128],
  ['#2B6FD6', 0x2b, 0x6f, 0xd6], ['#0DECAF', 0x0d, 0xec, 0xaf], ['dim', 12, 9, 7],
];

/** Angular distance on the hue circle, so 359 and 1 count as two apart. */
function hueClose(a: number, b: number) {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return d <= 1;
}

describe('rgbToHsb against culori', () => {
  test.each(LANDMARKS)('%s', (_n: string, r: number, g: number, b: number) => {
    const ours = rgbToHsb(r, g, b);
    const ref = toHsv({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
    expect(Math.abs(ours.s - Math.round(ref.s * 100))).toBeLessThanOrEqual(1);
    expect(Math.abs(ours.b - Math.round(ref.v * 100))).toBeLessThanOrEqual(1);
    // Hue is powerless on the neutral axis; culori reports it as undefined.
    if (ref.h !== undefined && ref.s > 0.001) expect(hueClose(ours.h, ref.h)).toBe(true);
  });
});

describe('hsbToRgb against culori', () => {
  test.each([[0, 100, 100], [60, 100, 100], [200, 80, 90], [216, 69, 100], [300, 5, 20], [0, 0, 50]])(
    'h=%d s=%d b=%d', (h: number, s: number, b: number) => {
      const ours = hsbToRgb(h, s, b);
      const ref = toRgb({ mode: 'hsv', h, s: s / 100, v: b / 100 });
      expect(Math.abs(ours.r - Math.round(ref.r * 255))).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.g - Math.round(ref.g * 255))).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.b - Math.round(ref.b * 255))).toBeLessThanOrEqual(1);
    },
  );
});

describe('HSL against culori', () => {
  test.each(LANDMARKS)('rgbToHsl %s', (_n: string, r: number, g: number, b: number) => {
    const ours = rgbToHsl(r, g, b);
    const ref = toHsl({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
    expect(Math.abs(ours.s - Math.round(ref.s * 100))).toBeLessThanOrEqual(1);
    expect(Math.abs(ours.l - Math.round(ref.l * 100))).toBeLessThanOrEqual(1);
    if (ref.h !== undefined && ref.s > 0.001) expect(hueClose(ours.h, ref.h)).toBe(true);
  });
  test.each([[0, 100, 50], [120, 50, 25], [240, 100, 90], [33, 20, 80]])(
    'hslToRgb h=%d s=%d l=%d', (h: number, s: number, l: number) => {
      const ours = hslToRgb(h, s, l);
      const ref = toRgb({ mode: 'hsl', h, s: s / 100, l: l / 100 });
      expect(Math.abs(ours.r - Math.round(ref.r * 255))).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.g - Math.round(ref.g * 255))).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.b - Math.round(ref.b * 255))).toBeLessThanOrEqual(1);
    },
  );
});

describe('sRGB transfer', () => {
  test('is the IEC 61966-2-1 curve on 8-bit values, both ways', () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(255)).toBeCloseTo(1, 10);
    expect(srgbToLinear(128)).toBeCloseTo(0.215861, 5);
    expect(linearToSrgb(0.215861)).toBe(128);
    for (let v = 0; v <= 255; v++) expect(linearToSrgb(srgbToLinear(v))).toBe(v);
  });
  test('half the encoded value is not half the light', () => {
    // The fact the deck's "why #808080 is not half of white" beat rests on.
    expect(srgbToLinear(128)).toBeLessThan(0.25);
  });
});

describe('hex', () => {
  test('round-trips every landmark exactly', () => {
    for (const [, r, g, b] of LANDMARKS) {
      expect(hexToRgb(rgbToHex(r, g, b))).toEqual({ r, g, b });
    }
  });
  test('accepts short and unprefixed forms, rejects junk', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('2b6fd6')).toEqual({ r: 0x2b, g: 0x6f, b: 0xd6 });
    expect(hexToRgb('#12345')).toBeNull();
    expect(hexToRgb('nope')).toBeNull();
  });
});

describe('the equations panel helpers', () => {
  test('splits a channel into digits whose sum is the channel back', () => {
    expect(hexDigits(0)).toEqual({ high: 0, low: 0, hex: '00' });
    expect(hexDigits(10)).toEqual({ high: 0, low: 10, hex: '0a' });
    expect(hexDigits(79)).toEqual({ high: 4, low: 15, hex: '4f' });
    expect(hexDigits(255)).toEqual({ high: 15, low: 15, hex: 'ff' });
    for (let v = 0; v <= 255; v++) {
      const { high, low } = hexDigits(v);
      expect(high * 16 + low).toBe(v);
    }
  });
  // The panel prints the digits and the answer from two sources, so the two
  // have to agree with rgbToHex or a line would contradict the line under it.
  test('digit pairs concatenate to the string rgbToHex gives', () => {
    for (const [, r, g, b] of LANDMARKS) {
      const joined = '#' + hexDigits(r).hex + hexDigits(g).hex + hexDigits(b).hex;
      expect(joined).toBe(rgbToHex(r, g, b));
    }
  });
  test('normalizes to three fixed decimals', () => {
    expect(normalizedChannel(0)).toBe('0.000');
    expect(normalizedChannel(10)).toBe('0.039');
    expect(normalizedChannel(79)).toBe('0.310');
    expect(normalizedChannel(255)).toBe('1.000');
    // The reason for the third decimal: two would print both of these as 0.31.
    expect(normalizedChannel(79)).not.toBe(normalizedChannel(80));
  });
});

describe('why rgbOverride exists', () => {
  /*
   * Stored HSB is whole numbers, so most 8-bit colours do not survive a trip
   * through it. This is the measured fact behind the "HSB is canonical, RGB has
   * an override ref" pattern in CLAUDE.md and decision-hsb-canonical-rgb-override:
   * if this ever passes with a small fraction, the pattern has lost its reason.
   */
  test('a majority of 8-bit colours change on an HSB round trip', () => {
    let n = 0, changed = 0;
    for (let r = 0; r < 256; r += 5) for (let g = 0; g < 256; g += 5) for (let b = 0; b < 256; b += 5) {
      n++;
      const h = rgbToHsb(r, g, b);
      const back = hsbToRgb(h.h, h.s, h.b);
      if (back.r !== r || back.g !== g || back.b !== b) changed++;
    }
    expect(changed / n).toBeGreaterThan(0.8);
  });
  test('the trip is exact at the eight cube corners', () => {
    for (const [, r, g, b] of LANDMARKS.slice(0, 8)) {
      const h = rgbToHsb(r, g, b);
      expect(hsbToRgb(h.h, h.s, h.b)).toEqual({ r, g, b });
    }
  });
});

/*
 * Oklab / Oklch.
 *
 * Same rule as above: culori is the oracle. These functions return floats
 * rather than whole numbers, so there is no rounding to allow slack for and the
 * tolerance has to be argued instead of assumed.
 *
 * TOLERANCE, measured rather than guessed. Over the stride-15 sweep below, the
 * largest disagreement with culori is 6.5e-9 in l, 1.1e-8 in a, 3.7e-8 in b and
 * 3.6e-8 in c - both libraries use Ottosson's published constants, so all that
 * differs is the order the floats are added in. 1e-6 leaves better than an
 * order of magnitude of headroom and is still far below anything observable:
 * one 8-bit step is about 0.003 of Oklab l.
 *
 * Hue is an angle and gets its own bound. Near the neutral axis a vanishing a/b
 * disagreement swings it a long way; the measured worst case is 1.3e-4 degrees
 * once chroma is above 0.001, and below that the hue is powerless anyway. 1e-3
 * degrees displaces a/b by under 1e-5 even at the gamut's widest chroma.
 */
const toOklab = converter('oklab');
const toOklch = converter('oklch');
const OKLAB_TOL = 1e-6;
const OKHUE_TOL = 1e-3;

/** 0, 15, 30 ... 255: 5832 triples, both cube ends included, no randomness. */
const OKLCH_STRIDE = 15;

/** Angular distance in degrees, unrounded - hueClose above allows a whole unit. */
function hueGap(a: number, b: number) {
  return Math.abs((((a - b) % 360) + 540) % 360 - 180);
}

describe('rgbToOklch against culori', () => {
  test.each(LANDMARKS)('%s', (_n: string, r: number, g: number, b: number) => {
    const ours = rgbToOklch(r, g, b);
    const ref = toOklch({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
    expect(Math.abs(ours.l - ref.l)).toBeLessThan(OKLAB_TOL);
    expect(Math.abs(ours.c - (ref.c ?? 0))).toBeLessThan(OKLAB_TOL);
    // Neutrals: culori leaves h undefined, we return 0. Neither is a measurement.
    if (ref.h !== undefined && ref.c > 0.001) {
      expect(hueGap(ours.h, ref.h)).toBeLessThan(OKHUE_TOL);
    } else {
      expect(ours.c).toBeLessThan(0.001);
    }
  });
});

describe('oklchToRgb against culori', () => {
  test.each(LANDMARKS)('%s survives the trip out and back', (_n: string, r: number, g: number, b: number) => {
    const lch = rgbToOklch(r, g, b);
    const { rgb, inGamut } = oklchToRgb(lch.l, lch.c, lch.h);
    expect(rgb).toEqual({ r, g, b });
    expect(inGamut).toBe(true);
  });
  test.each(LANDMARKS)('%s lands where culori puts it', (_n: string, r: number, g: number, b: number) => {
    const ours = rgbToOklch(r, g, b);
    const ref = toRgb({ mode: 'oklch', l: ours.l, c: ours.c, h: ours.h });
    const { rgb } = oklchToRgb(ours.l, ours.c, ours.h);
    expect(Math.abs(rgb.r - Math.round(ref.r * 255))).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb.g - Math.round(ref.g * 255))).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb.b - Math.round(ref.b * 255))).toBeLessThanOrEqual(1);
  });
});

describe('the Oklab pair on its own', () => {
  test('linearToOklab matches culori on the landmarks', () => {
    for (const [, r, g, b] of LANDMARKS) {
      const ours = linearToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
      const ref = toOklab({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
      expect(Math.abs(ours.l - ref.l)).toBeLessThan(OKLAB_TOL);
      expect(Math.abs(ours.a - ref.a)).toBeLessThan(OKLAB_TOL);
      expect(Math.abs(ours.b - ref.b)).toBeLessThan(OKLAB_TOL);
    }
  });
  test('oklabToLinear inverts it, in linear units', () => {
    for (const [, r, g, b] of LANDMARKS) {
      const lin = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)] as const;
      const lab = linearToOklab(lin[0], lin[1], lin[2]);
      const back = oklabToLinear(lab.l, lab.a, lab.b);
      expect(Math.abs(back.r - lin[0])).toBeLessThan(OKLAB_TOL);
      expect(Math.abs(back.g - lin[1])).toBeLessThan(OKLAB_TOL);
      expect(Math.abs(back.b - lin[2])).toBeLessThan(OKLAB_TOL);
    }
  });
  test('the polar pair is reversible, and a negative hue wraps', () => {
    for (const [l, c, h] of [[0.5, 0.1, 30], [0.2, 0.25, 200], [0.9, 0.05, 359.5]]) {
      const lab = oklchToOklab(l, c, h);
      const lch = oklabToOklch(lab.l, lab.a, lab.b);
      expect(lch.l).toBeCloseTo(l, 12);
      expect(lch.c).toBeCloseTo(c, 12);
      expect(lch.h).toBeCloseTo(h, 10);
    }
    const neg = oklchToOklab(0.5, 0.1, -90);
    expect(oklabToOklch(neg.l, neg.a, neg.b).h).toBeCloseTo(270, 10);
  });
  test('hue is powerless on the neutral axis, and we say 0 there', () => {
    // A documented stand-in, not a measurement: nothing may read red into it.
    expect(oklabToOklch(0.5, 0, 0)).toEqual({ l: 0.5, c: 0, h: 0 });
    const white = rgbToOklch(255, 255, 255);
    expect(Math.abs(white.l - 1)).toBeLessThan(OKLAB_TOL);
    expect(white.c).toBeLessThan(1e-6);
    expect(white.h).toBe(0);
  });
});

describe('the Oklch sweep over the cube', () => {
  /*
   * Every sRGB colour is in gamut by construction - it came out of the cube -
   * so a single false here is a bug in the flag, not a near miss. The 8-bit
   * value has to come back exactly too: the float trip out and back is far
   * finer than a 1/255 step, so an off-by-one would mean the maths is wrong,
   * not that the rounding was unlucky. Failures are collected rather than
   * asserted one at a time so the first few show up in the message.
   */
  test('rgbToOklch then oklchToRgb is exact, and never leaves the gamut', () => {
    let n = 0;
    const changed: string[] = [];
    const outOfGamut: string[] = [];
    for (let r = 0; r <= 255; r += OKLCH_STRIDE) {
      for (let g = 0; g <= 255; g += OKLCH_STRIDE) {
        for (let b = 0; b <= 255; b += OKLCH_STRIDE) {
          n++;
          const lch = rgbToOklch(r, g, b);
          const { rgb, inGamut } = oklchToRgb(lch.l, lch.c, lch.h);
          if (rgb.r !== r || rgb.g !== g || rgb.b !== b) {
            changed.push(`${r},${g},${b} -> ${rgb.r},${rgb.g},${rgb.b}`);
          }
          if (!inGamut) outOfGamut.push(`${r},${g},${b}`);
        }
      }
    }
    expect(n).toBe(18 * 18 * 18);
    expect(changed.slice(0, 5)).toEqual([]);
    expect(outOfGamut.slice(0, 5)).toEqual([]);
  });

  test('the forward conversion tracks culori across the same triples', () => {
    let worstLab = 0;
    let worstHue = 0;
    for (let r = 0; r <= 255; r += OKLCH_STRIDE) {
      for (let g = 0; g <= 255; g += OKLCH_STRIDE) {
        for (let b = 0; b <= 255; b += OKLCH_STRIDE) {
          const ours = rgbToOklch(r, g, b);
          const ref = toOklch({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
          worstLab = Math.max(worstLab, Math.abs(ours.l - ref.l), Math.abs(ours.c - (ref.c ?? 0)));
          if (ref.h !== undefined && ref.c > 0.001) worstHue = Math.max(worstHue, hueGap(ours.h, ref.h));
        }
      }
    }
    expect(worstLab).toBeLessThan(OKLAB_TOL);
    expect(worstHue).toBeLessThan(OKHUE_TOL);
  });
});

describe('inGamut, and why it is not a clamp', () => {
  /*
   * The regression from wiki/notes/srgb-gamut-is-not-star-shaped-in-oklab.md.
   * At pure blue's own lightness and hue the in-gamut chromas are two disjoint
   * runs: everything up to about 0.266, then nothing until the blue corner
   * itself at about 0.313, a run 0.0002 wide. Walking outward you go in, out
   * and in again, so a caller that assumes one interval - a binary search for
   * the cusp, most obviously - stops at 0.288 and renders 0,55,255 for "pure
   * blue". That visible green 55 is why this function reports instead of
   * clamping, and why no gamut search belongs in this file yet.
   */
  const BLUE_L = 0.45201;
  const BLUE_H = 264.052;

  test('the gap at blue: 0.2000 in, 0.2900 out, 0.3132 in again', () => {
    expect(oklchToRgb(BLUE_L, 0.2, BLUE_H).inGamut).toBe(true);
    expect(oklchToRgb(BLUE_L, 0.29, BLUE_H).inGamut).toBe(false);
    expect(oklchToRgb(BLUE_L, 0.3132, BLUE_H).inGamut).toBe(true);
  });

  test('the clamped rgb stays usable across the gap, which is what hides it', () => {
    // 0.2900 is outside by 7e-4 of linear red, which the clamp turns into a
    // plain 0. The colour that comes back is the right one to draw; only the
    // flag knows it is a stand-in rather than the colour that was asked for.
    expect(oklchToRgb(BLUE_L, 0.29, BLUE_H).rgb).toEqual({ r: 0, g: 33, b: 242 });
    expect(oklchToRgb(BLUE_L, 0.3132, BLUE_H).rgb).toEqual({ r: 0, g: 0, b: 255 });
  });

  test('a chroma no sRGB colour can reach is reported, not quietly clipped', () => {
    const wild = oklchToRgb(0.6, 0.5, 30);
    expect(wild.inGamut).toBe(false);
    expect(wild.rgb.r).toBeLessThanOrEqual(255);
    expect(wild.rgb.g).toBeGreaterThanOrEqual(0);
  });

  test('the epsilon is slack for float dust, not a licence to leave the cube', () => {
    // 1e-6 of a linear channel is a three-hundredth of the smallest 8-bit step
    // (3.0e-4, at the dark end) and far less further up, so it forgives a
    // corner computing to -2e-17 without forgiving a real excursion.
    const corner = rgbToOklch(0, 0, 255);
    expect(oklchToRgb(corner.l, corner.c, corner.h).inGamut).toBe(true);
    expect(oklchToRgb(corner.l, corner.c + 0.001, corner.h).inGamut).toBe(false);
  });
});
