import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import {
  rgbToHsb, hsbToRgb, rgbToHsl, hslToRgb, srgbToLinear, linearToSrgb, rgbToHex, hexToRgb,
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
