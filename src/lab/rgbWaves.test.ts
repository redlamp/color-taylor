import { describe, expect, test } from 'bun:test';
import { hsbToRgb, hslToRgb, rgbToHsb, rgbToHsl } from '../utils/colorConversions';
import { channelWeight, exactHue, rails, rgbAtHue } from './rgbWaves';

/** Deterministic colours, spread over the cube. */
function* colours(n: number) {
  let x = 12345;
  const next = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x % 256; };
  for (let i = 0; i < n; i++) yield { r: next(), g: next(), b: next() };
}

describe('channelWeight', () => {
  test('red holds the top from 300 round to 60 and the bottom from 120 to 240', () => {
    expect(channelWeight(0, 0)).toBe(1);
    expect(channelWeight(60, 0)).toBe(1);
    expect(channelWeight(300, 0)).toBe(1);
    expect(channelWeight(359.9, 0)).toBe(1);
    expect(channelWeight(120, 0)).toBe(0);
    expect(channelWeight(180, 0)).toBe(0);
    expect(channelWeight(240, 0)).toBe(0);
    expect(channelWeight(90, 0)).toBeCloseTo(0.5);
    expect(channelWeight(270, 0)).toBeCloseTo(0.5);
  });

  test('green and blue are red shifted by 120 and 240', () => {
    for (let h = 0; h < 360; h += 7) {
      expect(channelWeight(h, 120)).toBeCloseTo(channelWeight(h - 120, 0));
      expect(channelWeight(h, 240)).toBeCloseTo(channelWeight(h - 240, 0));
    }
  });
});

describe('rgbAtHue', () => {
  test('is hsbToRgb with max = b and min = b(1 - s), at every hue', () => {
    for (let s = 0; s <= 100; s += 25) {
      for (let b = 0; b <= 100; b += 25) {
        const max = (b / 100) * 255;
        const min = max * (1 - s / 100);
        for (let h = 0; h < 360; h += 5) {
          const want = hsbToRgb(h, s, b);
          const got = rgbAtHue(h, max, min);
          // hsbToRgb rounds each channel; the wave does not
          expect(Math.abs(got.r - want.r)).toBeLessThanOrEqual(0.5 + 1e-9);
          expect(Math.abs(got.g - want.g)).toBeLessThanOrEqual(0.5 + 1e-9);
          expect(Math.abs(got.b - want.b)).toBeLessThanOrEqual(0.5 + 1e-9);
        }
      }
    }
  });

  test('is hslToRgb with max = l + c/2 and min = l - c/2, at every hue', () => {
    for (let s = 0; s <= 100; s += 25) {
      for (let l = 0; l <= 100; l += 25) {
        const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
        const max = (l / 100 + c / 2) * 255;
        const min = (l / 100 - c / 2) * 255;
        for (let h = 0; h < 360; h += 5) {
          const want = hslToRgb(h, s, l);
          const got = rgbAtHue(h, max, min);
          expect(Math.abs(got.r - want.r)).toBeLessThanOrEqual(0.5 + 1e-9);
          expect(Math.abs(got.g - want.g)).toBeLessThanOrEqual(0.5 + 1e-9);
          expect(Math.abs(got.b - want.b)).toBeLessThanOrEqual(0.5 + 1e-9);
        }
      }
    }
  });

  test('passes exactly through the colour at its own hue', () => {
    for (const c of colours(500)) {
      const h = exactHue(c);
      const { max, min } = rails(c);
      if (h === null) {
        expect(max).toBe(min);
        continue;
      }
      const on = rgbAtHue(h, max, min);
      expect(on.r).toBeCloseTo(c.r, 9);
      expect(on.g).toBeCloseTo(c.g, 9);
      expect(on.b).toBeCloseTo(c.b, 9);
    }
  });
});

describe('exactHue', () => {
  test('agrees with rgbToHsb before rounding', () => {
    for (const c of colours(500)) {
      const h = exactHue(c);
      if (h === null) continue;
      const want = rgbToHsb(c.r, c.g, c.b).h;
      // rgbToHsb rounds to the nearest degree, and 360 rounds to 0
      const diff = Math.min(Math.abs(Math.round(h) % 360 - want), 360 - Math.abs(Math.round(h) % 360 - want));
      expect(diff).toBeLessThanOrEqual(0);
    }
  });

  test('a grey has no hue', () => {
    expect(exactHue({ r: 0, g: 0, b: 0 })).toBeNull();
    expect(exactHue({ r: 128, g: 128, b: 128 })).toBeNull();
    expect(exactHue({ r: 255, g: 255, b: 255 })).toBeNull();
  });
});

describe('rails', () => {
  test('reads the four values the sliders show', () => {
    for (const c of colours(500)) {
      const r = rails(c);
      const hsb = rgbToHsb(c.r, c.g, c.b);
      const hsl = rgbToHsl(c.r, c.g, c.b);
      expect(Math.round(r.hsbB * 100)).toBe(hsb.b);
      expect(Math.round(r.hsbS * 100)).toBe(hsb.s);
      expect(Math.round(r.hslL * 100)).toBe(hsl.l);
      expect(Math.round(r.hslS * 100)).toBe(hsl.s);
    }
  });
});
