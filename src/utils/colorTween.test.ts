import { describe, test, expect } from 'bun:test';
import { HSB_TWEEN_MS, easeInOutQuad, shortestHueDelta, hsbAtProgress } from './colorTween';

describe('easeInOutQuad', () => {
  test('pins both ends and the midpoint', () => {
    expect(easeInOutQuad(0)).toBe(0);
    expect(easeInOutQuad(0.5)).toBe(0.5);
    expect(easeInOutQuad(1)).toBe(1);
  });
  test('is monotone', () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = easeInOutQuad(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('shortestHueDelta', () => {
  test('goes the short way round the circle', () => {
    expect(shortestHueDelta(350, 10)).toBe(20);
    expect(shortestHueDelta(10, 350)).toBe(-20);
    expect(shortestHueDelta(0, 180)).toBe(180);
    expect(shortestHueDelta(90, 90)).toBe(0);
  });
});

describe('hsbAtProgress', () => {
  const from = { h: 350, s: 20, b: 80 };
  const to = { h: 10, s: 60, b: 40 };

  test('starts at from and ends at target', () => {
    expect(hsbAtProgress(from, to, 0)).toEqual(from);
    expect(hsbAtProgress(from, to, 1)).toEqual(to);
  });

  test('crosses 360 rather than sweeping the long way', () => {
    // 350 -> 10 through 0, so the midpoint is 0, not 180.
    expect(hsbAtProgress(from, to, 0.5).h).toBe(0);
  });

  test('returns whole numbers - the pills are fixed width', () => {
    for (let i = 0; i <= 10; i++) {
      const v = hsbAtProgress(from, to, i / 10);
      expect(Number.isInteger(v.h)).toBe(true);
      expect(Number.isInteger(v.s)).toBe(true);
      expect(Number.isInteger(v.b)).toBe(true);
      expect(v.h).toBeGreaterThanOrEqual(0);
      expect(v.h).toBeLessThan(360);
    }
  });

  test('saturation and brightness move monotonically between the ends', () => {
    let s = from.s, b = from.b;
    for (let i = 1; i <= 20; i++) {
      const v = hsbAtProgress(from, to, i / 20);
      expect(v.s).toBeGreaterThanOrEqual(s);
      expect(v.b).toBeLessThanOrEqual(b);
      s = v.s; b = v.b;
    }
  });

  test('the shared duration is the one both hosts animate with', () => {
    // The plugin once shipped at 260 ms against the app's 1000 ms. This is the
    // number they now share; change it here and both change together.
    expect(HSB_TWEEN_MS).toBe(1000);
  });
});
