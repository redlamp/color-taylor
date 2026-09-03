import { describe, test, expect } from 'bun:test';
import { hsbFromField, type FieldInput } from './pointer';
import { CENTER_X, CENTER_Y, RADIUS, PI, hexEdgeDist } from './hexConstants';

/*
 * The mapping every drag depends on, as numbers. Each case is a position on
 * the field and the HSB it must select; several are bugs that shipped once
 * (the r-squared handle, HSL running through L=50 and back).
 */
const at = (angleDeg: number, frac: number, mix = 1) => {
  const a = (angleDeg * PI) / 180;
  const edge = mix === 1 ? hexEdgeDist(a, RADIUS) : RADIUS;
  return [CENTER_X + frac * edge * Math.cos(a), CENTER_Y - frac * edge * Math.sin(a)] as const;
};
const base: FieldInput = { brightness: 100, lightness: 50, hue: 200, blMode: 'brightness' };

describe('hsbFromField, brightness mode', () => {
  test('the east vertex at full brightness is pure red', () => {
    const [x, y] = at(0, 0.999);
    expect(hsbFromField(x, y, base)).toEqual({ h: 0, s: 100, b: 100 });
  });

  test('the centre keeps the hue the gesture started from', () => {
    // The angle is noise there and the colour is grey either way.
    expect(hsbFromField(CENTER_X, CENTER_Y, base)).toEqual({ h: 200, s: 0, b: 100 });
  });

  test('inside the cross-section, saturation is measured against its own edge', () => {
    // b=40: the cross-section edge is at 0.4 of the hexagon edge. Halfway to
    // it is s=50 at the same brightness - the handle under the cursor, not at
    // r-squared.
    const [x, y] = at(0, 0.2);
    expect(hsbFromField(x, y, { ...base, brightness: 40 })).toEqual({ h: 0, s: 50, b: 40 });
  });

  test('outside the cross-section, full saturation at the brightness that reach requires', () => {
    const [x, y] = at(120, 0.75);
    expect(hsbFromField(x, y, { ...base, brightness: 40 })).toEqual({ h: 120, s: 100, b: 75 });
  });

  test('a first click outside the shape is rejected; a drag there is clamped', () => {
    const [x, y] = at(30, 1.2);
    expect(hsbFromField(x, y, base)).toBeNull();
    expect(hsbFromField(x, y, { ...base, clampOnly: true })).toEqual({ h: 30, s: 100, b: 100 });
  });

  test('the origin, not the live value, sets the bound - a rubber band, not a ratchet', () => {
    // Started at b=40, now nominally at b=90 mid-drag: the cross-section the
    // drag measures against is still the one it began with.
    const [x, y] = at(0, 0.2);
    const origin = { b: 40, l: 50, h: 0, sHsl: 0 };
    expect(hsbFromField(x, y, { ...base, brightness: 90, origin })).toEqual({ h: 0, s: 50, b: 40 });
  });

  test('on the circle the bound opens to the full edge and radius is saturation', () => {
    const [x, y] = at(0, 0.5, 0);
    expect(hsbFromField(x, y, { ...base, brightness: 40, shapeMix: 0 })).toEqual({ h: 0, s: 50, b: 40 });
  });
});

describe('hsbFromField, lightness mode', () => {
  const hsl: FieldInput = { ...base, blMode: 'lightness', lightness: 50 };

  test('at L=50 the rim is the pure hue', () => {
    const [x, y] = at(240, 0.999);
    expect(hsbFromField(x, y, hsl)).toEqual({ h: 240, s: 100, b: 100 });
  });

  test('from the dark half, expanding lightens toward 50', () => {
    // L=25: bound is 0.5. At 0.75 of the edge, r=0.75 -> L = 50*0.75 = 37.5.
    const [x, y] = at(0, 0.75);
    const out = hsbFromField(x, y, { ...hsl, lightness: 25 })!;
    expect(out.h).toBe(0);
    expect(out.s).toBe(100);
    // hsl(0, 100, 37.5) -> rgb(191, 0, 0) -> b = 75
    expect(out.b).toBe(75);
  });

  test('from the light half, expanding darkens toward 50', () => {
    const [x, y] = at(0, 0.75);
    const out = hsbFromField(x, y, { ...hsl, lightness: 75 })!;
    // hsl(0, 100, 62.5) -> rgb(255, 64, 64) -> s = 75
    expect(out).toEqual({ h: 0, s: 75, b: 100 });
  });

  test('a drag past the rim pins L at 50 instead of running through it', () => {
    // Unclamped, r=1.4 from L=25 would give L=70 and the handle would turn back
    // on itself as the cross-section shrank again.
    const [x, y] = at(0, 1.4);
    const out = hsbFromField(x, y, { ...hsl, lightness: 25, clampOnly: true })!;
    expect(out).toEqual({ h: 0, s: 100, b: 100 });
  });

  test('the centre keeps the hue and the lightness', () => {
    const out = hsbFromField(CENTER_X, CENTER_Y, { ...hsl, lightness: 30 })!;
    expect(out.h).toBe(200);
    // hsl(200, 0, 30) is grey 77 -> s 0, b 30
    expect(out.s).toBe(0);
    expect(out.b).toBe(30);
  });
});
