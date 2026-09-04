import { describe, test, expect } from 'bun:test';
import { buildChain } from './chain';
import { CENTER_X, CENTER_Y, RADIUS, PI, DIRS, hexEdgeDist, getOrder } from './hexConstants';
import { hsbToRgb, rgbToHsb } from '../../utils/colorConversions';

const dist = (p: { x: number; y: number }) => Math.hypot(p.x - CENTER_X, p.y - CENTER_Y);
const angle = (p: { x: number; y: number }) => Math.atan2(-(p.y - CENTER_Y), p.x - CENTER_X);
const RGB_ORDER = ['r', 'g', 'b'] as const;

describe('buildChain', () => {
  test('is origin plus one joint per channel, named in order', () => {
    const c = buildChain({ r: 10, g: 20, b: 30 }, [...RGB_ORDER], { hue: 0, saturation: 0 });
    expect(c.points).toHaveLength(4);
    expect(c.dotNames).toEqual(['origin', 'red', 'green', 'blue']);
    expect(c.points[0]).toEqual({ x: CENTER_X, y: CENTER_Y });
  });

  test('pure red ends on the east vertex', () => {
    const c = buildChain({ r: 255, g: 0, b: 0 }, [...RGB_ORDER], { hue: 0, saturation: 100 });
    const tip = c.points[3];
    expect(tip.x).toBeCloseTo(CENTER_X + RADIUS, 9);
    expect(tip.y).toBeCloseTo(CENTER_Y, 9);
  });

  test('yellow ends on the 60-degree vertex - two legs add to a third direction', () => {
    const c = buildChain({ r: 255, g: 255, b: 0 }, [...RGB_ORDER], { hue: 60, saturation: 100 });
    expect(dist(c.points[3])).toBeCloseTo(RADIUS, 9);
    expect(angle(c.points[3])).toBeCloseTo(PI / 3, 9);
  });

  test('equal channels cancel to the centre', () => {
    const c = buildChain({ r: 128, g: 128, b: 128 }, [...RGB_ORDER], { hue: 0, saturation: 0 });
    expect(dist(c.points[3])).toBeCloseTo(0, 9);
  });

  test('the first leg is always radial along its channel axis', () => {
    // Whatever getOrder puts first, the first joint lies on that channel's ray
    // from the centre. This is the property that keeps the first leg straight
    // in circle space - see rgb-stems-must-curve-in-circle-space.md.
    const rgb = { r: 40, g: 200, b: 90 };
    for (const mode of ['asc', 'desc', 'rgb'] as const) {
      const order = getOrder(mode, rgb);
      const c = buildChain(rgb, order, { hue: 0, saturation: 0 });
      const d = DIRS[order[0]];
      expect(angle(c.points[1])).toBeCloseTo(Math.atan2(-d.y, d.x), 9);
    }
  });

  test('the tip lands at chroma: (s/100)(b/100) of the edge on the hue ray', () => {
    for (const hsb of [{ h: 205, s: 88, b: 92 }, { h: 30, s: 40, b: 60 }, { h: 300, s: 100, b: 25 }]) {
      const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
      // Round-trip the rounding the component itself lives with.
      const back = rgbToHsb(rgb.r, rgb.g, rgb.b);
      const c = buildChain(rgb, [...RGB_ORDER], { hue: back.h, saturation: back.s });
      const tip = c.points[3];
      const want = (back.s / 100) * (back.b / 100) * hexEdgeDist((back.h * PI) / 180, RADIUS);
      // Within one user unit: the HSB the chain was built from is rounded.
      expect(Math.abs(dist(tip) - want)).toBeLessThan(1);
      // Within a degree, for the same reason: quantising to 8-bit RGB moves the
      // hue by a fraction of a degree, and the chain is built from that RGB.
      if (back.s > 0) {
        const got = ((angle(tip) * 180) / PI + 360) % 360;
        // Signed shortest-way delta in (-180, 180]; its magnitude is the distance.
        const diff = Math.abs(((got - back.h) % 360 + 540) % 360 - 180);
        expect(diff).toBeLessThan(1);
      }
    }
  });

  test('on the circle the tip is at saturation and ignores brightness', () => {
    // shapeMix 0 - the wheel's reading. The tip moves to (s/100)*R along the
    // hue ray whatever b is, and the joints before it stay where the chain put them.
    const dim = hsbToRgb(205, 88, 30);
    const bright = hsbToRgb(205, 88, 92);
    const a = buildChain(dim, [...RGB_ORDER], { hue: 205, saturation: 88, shapeMix: 0 });
    const b = buildChain(bright, [...RGB_ORDER], { hue: 205, saturation: 88, shapeMix: 0 });
    expect(dist(a.points[3])).toBeCloseTo(0.88 * RADIUS, 6);
    expect(dist(b.points[3])).toBeCloseTo(0.88 * RADIUS, 6);
    expect(a.points[2]).not.toEqual(b.points[2]);
  });

  test('shapeMix 1 leaves the chain exactly as built - no recomputation of the tip', () => {
    const rgb = { r: 28, g: 149, b: 235 };
    const plain = buildChain(rgb, [...RGB_ORDER], { hue: 0, saturation: 0 });
    const mixed = buildChain(rgb, [...RGB_ORDER], { hue: 999, saturation: -5, shapeMix: 1 });
    expect(mixed.points).toEqual(plain.points);
  });
});
