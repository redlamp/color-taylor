import { describe, test, expect } from 'bun:test';
import { converter } from 'culori';
import { okhslToOklab, oklabToOkhsl, rgbToOkhsl, okhslToRgb, toe, toeInv } from './okhsl';
import { rgbToOklch } from './colorConversions';

/*
 * culori is the oracle, as in colorConversions.test: an independent copy of
 * the same Ottosson code. The one place the two ports differ by design is the
 * cusp - ours checks its candidates against the gamut, culori's takes the
 * star-shaped model's answer - and the tolerances below are measured with
 * that in mind, not guessed.
 */
const toOkhsl = converter('okhsl');
const toOklab = converter('oklab');

describe('toe', () => {
  test('is a bijection on 0..1', () => {
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      expect(toe(toeInv(x))).toBeCloseTo(x, 10);
      expect(toeInv(toe(x))).toBeCloseTo(x, 10);
    }
    expect(toe(0)).toBe(0);
    expect(toe(1)).toBeCloseTo(1, 10);
  });
});

describe('rgbToOkhsl matches culori', () => {
  test('on a grid of sRGB colors', () => {
    let worstS = 0; let worstL = 0; let worstH = 0;
    for (let r = 0; r <= 255; r += 51) for (let g = 0; g <= 255; g += 51) for (let b = 0; b <= 255; b += 51) {
      const ours = rgbToOkhsl(r, g, b);
      const ref = toOkhsl({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
      worstL = Math.max(worstL, Math.abs(ours.l - ref.l));
      if (ref.s !== undefined) worstS = Math.max(worstS, Math.abs(ours.s - ref.s));
      if (ref.h !== undefined && ours.s > 1e-3) {
        const dh = Math.abs(((ours.h - ref.h + 540) % 360) - 180);
        worstH = Math.max(worstH, dh);
      }
    }
    // 7.6e-9 measured: the two ports round the toe differently by that much.
    expect(worstL).toBeLessThan(1e-7);
    // 1.9e-3 measured, all of it at fully saturated colors: culori's unchecked
    // cusp lets its s run a hair past 1 there (1.00186 at 102,0,153) where
    // ours is clamped to the edge it verified.
    expect(worstS).toBeLessThan(2.5e-3);
    expect(worstH).toBeLessThan(1e-3);
  });
});

describe('okhslToOklab matches culori', () => {
  test('on a grid of h, s, l', () => {
    let worst = 0;
    for (let h = 0; h < 360; h += 15) for (const s of [0, 0.2, 0.5, 0.8, 0.9, 1]) for (const l of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const ours = okhslToOklab(h, s, l);
      const ref = toOklab({ mode: 'okhsl', h, s, l });
      worst = Math.max(worst, Math.abs(ours.l - ref.l), Math.abs(ours.a - ref.a), Math.abs(ours.b - ref.b));
    }
    expect(worst).toBeLessThan(1e-3);
  });
});

describe('okhsl round trips', () => {
  test('oklab -> okhsl -> oklab', () => {
    for (let h = 0; h < 360; h += 30) for (const s of [0.1, 0.5, 0.85, 1]) for (const l of [0.2, 0.5, 0.8]) {
      const lab = okhslToOklab(h, s, l);
      const back = oklabToOkhsl(lab.l, lab.a, lab.b);
      expect(back.s).toBeCloseTo(s, 6);
      expect(back.l).toBeCloseTo(l, 9);
      expect(Math.abs(((back.h - h + 540) % 360) - 180)).toBeLessThan(1e-6);
    }
  });

  test('s in 0..1 lands inside sRGB, and s = 1 sits on its edge', () => {
    for (let h = 0; h < 360; h += 10) for (const l of [0.2, 0.5, 0.8]) {
      for (const s of [0.25, 0.5, 0.75, 0.95]) expect(okhslToRgb(h, s, l).inGamut).toBe(true);
      // At the edge the chroma is this hue's maximum at that L, to a hair.
      const { rgb } = okhslToRgb(h, 1, l);
      const lch = rgbToOklch(rgb.r, rgb.g, rgb.b);
      expect(Math.max(rgb.r, rgb.g, rgb.b) === 255 || Math.min(rgb.r, rgb.g, rgb.b) === 0).toBe(true);
      expect(lch.c).toBeGreaterThan(0.02);
    }
  });
});
