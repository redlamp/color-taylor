import { describe, test, expect } from 'bun:test';
import {
  RADIUS, CENTER_X, CENTER_Y, PI, SQRT3_2, DIRS,
  hexEdgeDist, shapeEdgeDist, shapePoints, blLimitScale, shapeLimitScale, colorAtPoint, getOrder,
} from './hexConstants';

/*
 * The geometry in hexagon-is-the-cube-down-its-diagonal.md, pinned. These are
 * the constants every handle position depends on; a test that fails here means
 * the hexagon has silently stopped being the cube's silhouette.
 */

describe('hexEdgeDist', () => {
  test('is the circumradius at every vertex', () => {
    for (let k = 0; k < 6; k++) expect(hexEdgeDist(k * PI / 3, RADIUS)).toBeCloseTo(RADIUS, 9);
  });
  test('is the inradius at every edge midpoint', () => {
    for (let k = 0; k < 6; k++) expect(hexEdgeDist(PI / 6 + k * PI / 3, RADIUS)).toBeCloseTo(RADIUS * SQRT3_2, 9);
  });
  test('has sixfold symmetry and handles negative angles', () => {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * 2 * PI;
      expect(hexEdgeDist(a, RADIUS)).toBeCloseTo(hexEdgeDist(a + PI / 3, RADIUS), 9);
      expect(hexEdgeDist(a, RADIUS)).toBeCloseTo(hexEdgeDist(a - 2 * PI, RADIUS), 9);
    }
  });
  test('the ratio of longest to shortest radius is 2/sqrt(3)', () => {
    // The number intro-shape-morph.spec.ts measures off the rendered outline.
    expect(hexEdgeDist(0, RADIUS) / hexEdgeDist(PI / 6, RADIUS)).toBeCloseTo(2 / Math.sqrt(3), 9);
  });
});

describe('shapeEdgeDist', () => {
  test('is a circle at mix 0 and the hexagon at mix 1', () => {
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * 2 * PI;
      expect(shapeEdgeDist(a, RADIUS, 0)).toBeCloseTo(RADIUS, 9);
      expect(shapeEdgeDist(a, RADIUS, 1)).toBeCloseTo(hexEdgeDist(a, RADIUS), 9);
    }
  });
  test('interpolates linearly between them', () => {
    const a = PI / 6;
    const mid = shapeEdgeDist(a, RADIUS, 0.5);
    expect(mid).toBeCloseTo((RADIUS + hexEdgeDist(a, RADIUS)) / 2, 9);
  });
  test('shapePoints returns n vertices on that edge', () => {
    const pts = shapePoints(CENTER_X, CENTER_Y, RADIUS, 0, 12).split(' ');
    expect(pts).toHaveLength(12);
    for (const p of pts) {
      const [x, y] = p.split(',').map(Number);
      expect(Math.hypot(x - CENTER_X, y - CENTER_Y)).toBeCloseTo(RADIUS, 6);
    }
  });
});

describe('DIRS', () => {
  test('are unit vectors 120 degrees apart - three perpendicular axes seen down the diagonal', () => {
    for (const d of Object.values(DIRS)) expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 9);
    const ang = (d: { x: number; y: number }) => Math.atan2(-d.y, d.x);
    expect(ang(DIRS.r)).toBeCloseTo(0, 9);
    expect(ang(DIRS.g)).toBeCloseTo(2 * PI / 3, 9);
    expect(ang(DIRS.b)).toBeCloseTo(-2 * PI / 3, 9);
  });
  test('sum to zero, so equal channels land on the centre', () => {
    const s = Object.values(DIRS).reduce((a, d) => ({ x: a.x + d.x, y: a.y + d.y }), { x: 0, y: 0 });
    expect(s.x).toBeCloseTo(0, 9);
    expect(s.y).toBeCloseTo(0, 9);
  });
});

describe('the cross-section bound', () => {
  test('blLimitScale is b/100 under HSB and 1-|2L-1| under HSL', () => {
    expect(blLimitScale('brightness', 40, 0)).toBeCloseTo(0.4, 9);
    expect(blLimitScale('lightness', 0, 50)).toBeCloseTo(1, 9);
    expect(blLimitScale('lightness', 0, 25)).toBeCloseTo(0.5, 9);
    expect(blLimitScale('lightness', 0, 75)).toBeCloseTo(0.5, 9);
    expect(blLimitScale('lightness', 0, 100)).toBeCloseTo(0, 9);
  });
  test('shapeLimitScale opens the bound to the full edge as the shape becomes a circle', () => {
    expect(shapeLimitScale('brightness', 40, 0, 1)).toBeCloseTo(0.4, 9);
    expect(shapeLimitScale('brightness', 40, 0, 0)).toBeCloseTo(1, 9);
    expect(shapeLimitScale('brightness', 40, 0, 0.5)).toBeCloseTo(0.7, 9);
  });
});

describe('colorAtPoint', () => {
  test('the centre is white at full brightness and black at none', () => {
    expect(colorAtPoint(CENTER_X, CENTER_Y, 100)).toEqual({ r: 255, g: 255, b: 255 });
    expect(colorAtPoint(CENTER_X, CENTER_Y, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });
  test('the six vertices are the six pure colours at full brightness', () => {
    const want = [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255]];
    for (let k = 0; k < 6; k++) {
      const a = k * PI / 3;
      const c = colorAtPoint(CENTER_X + RADIUS * Math.cos(a) * 0.999, CENTER_Y - RADIUS * Math.sin(a) * 0.999, 100);
      expect([c.r, c.g, c.b]).toEqual(want[k]);
    }
  });
  test('radius is chroma: the cross-section edge at b=50 is the saturated colour at b=50', () => {
    // Just inside the limit hexagon at half brightness: s=100, b=50.
    const d = RADIUS * 0.5 * 0.999;
    const c = colorAtPoint(CENTER_X + d, CENTER_Y, 50);
    expect(c).toEqual({ r: 128, g: 0, b: 0 });
  });
  test('outside the cross-section previews what a drag there would select', () => {
    // Beyond the b=50 limit on the red ray: full saturation at the brightness that
    // reach requires, so the rim is pure red again.
    const c = colorAtPoint(CENTER_X + RADIUS * 0.999, CENTER_Y, 50);
    expect(c).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe('getOrder', () => {
  const rgb = { r: 10, g: 200, b: 90 };
  test('sorts ascending, descending, or leaves rgb', () => {
    expect(getOrder('asc', rgb)).toEqual(['r', 'b', 'g']);
    expect(getOrder('desc', rgb)).toEqual(['g', 'b', 'r']);
    expect(getOrder('rgb', rgb)).toEqual(['r', 'g', 'b']);
  });
});
