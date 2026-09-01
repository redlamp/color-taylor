import { describe, test, expect } from 'bun:test';
import { writeHslChannel } from './hslWrite';
import { hslToRgb, rgbToHsl, rgbToHsb, hexToRgb } from './colorConversions';

/*
 * Every test here is a bug that shipped once. The header of hslWrite.ts tells
 * the story; these hold the fixes.
 */

describe('writeHslChannel', () => {
  test('the channels a gesture is not touching are held exactly at the origin', () => {
    const origin = { h: 210, s: 73, l: 41 };
    const w = writeHslChannel('l', 60, origin);
    expect(w.hsl).toEqual({ h: 210, s: 73, l: 60 });
    // Not re-derived from the rounded colour: what was asked for is what is returned.
    expect(w.hsl.h).toBe(210);
    expect(w.hsl.s).toBe(73);
  });

  test('the returned rgb is exactly the conversion of the requested HSL', () => {
    const origin = { h: 33, s: 80, l: 55 };
    const w = writeHslChannel('s', 42, origin);
    expect(w.rgb).toEqual(hslToRgb(33, 42, 55));
  });

  test('hue survives a trip through black', () => {
    // Anything on the neutral axis converts back as hue 0; the origin's hue is
    // carried into state instead, so lightness to 0 and back is reversible.
    const origin = { h: 287, s: 60, l: 50 };
    const atBlack = writeHslChannel('l', 0, origin);
    expect(atBlack.rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(atBlack.hsb.h).toBe(287);
    const back = writeHslChannel('l', 50, { ...origin, l: 0 });
    expect(back.hsb.h).toBe(287);
    expect(back.rgb).toEqual(hslToRgb(287, 60, 50));
  });

  test('hue survives a trip through white', () => {
    const origin = { h: 120, s: 100, l: 50 };
    const atWhite = writeHslChannel('l', 100, origin);
    expect(atWhite.rgb).toEqual({ r: 255, g: 255, b: 255 });
    expect(atWhite.hsb.h).toBe(120);
  });

  test('the stepper does not stick at #2B6FD6', () => {
    // Two adjacent saturations used to collapse into one HSB bucket because the
    // next edit was derived from rounded HSB. Deriving from the exact rgb keeps
    // consecutive steps distinct.
    const c = hexToRgb('#2B6FD6')!;
    const start = rgbToHsl(c.r, c.g, c.b);
    const origin = { h: start.h, s: start.s, l: start.l };
    const a = writeHslChannel('s', start.s + 1, origin);
    const b = writeHslChannel('s', start.s + 2, origin);
    const c2 = writeHslChannel('s', start.s + 3, origin);
    expect(a.rgb).not.toEqual(b.rgb);
    expect(b.rgb).not.toEqual(c2.rgb);
  });

  test('hsb.s and hsb.b come from the exact rgb, hsb.h from the origin', () => {
    const origin = { h: 200, s: 50, l: 30 };
    const w = writeHslChannel('l', 35, origin);
    const viaRgb = rgbToHsb(w.rgb.r, w.rgb.g, w.rgb.b);
    expect(w.hsb.s).toBe(viaRgb.s);
    expect(w.hsb.b).toBe(viaRgb.b);
    expect(w.hsb.h).toBe(200);
  });

  test('a run of edits does not drift', () => {
    // Freeze the origin, walk L across its whole range one step at a time, and
    // the two untouched channels must be identical at every step - drift of
    // exactly zero, not merely small.
    const origin = { h: 150, s: 64, l: 20 };
    for (let l = 0; l <= 100; l++) {
      const w = writeHslChannel('l', l, origin);
      expect(w.hsl.h).toBe(150);
      expect(w.hsl.s).toBe(64);
    }
  });
});
