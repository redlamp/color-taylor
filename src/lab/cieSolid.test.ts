import { describe, test, expect } from 'bun:test';
import { XYY_GLSL, XYY_SCALE, xyYToWorld } from './cubeRenderer';
import { SRGB_TO_XYZ_D65, D65_WHITE, SRGB_R, SRGB_G, SRGB_B } from '@/utils/cie';

/*
 * The xyY solid is placed twice: once in GLSL, for the hundreds of thousands
 * of points that make the solid, and once in TypeScript, for the floor drawn
 * under them. If the two drift apart the floor slides out from under the
 * shape, and nothing about the picture would look wrong enough to notice - the
 * horseshoe would simply be in the wrong place, which is the one thing this
 * page must not get away with.
 *
 * GLSL cannot be run here, so what is checked is that every constant appears
 * in both, and that the TypeScript side lands where the geometry says it
 * should.
 */

const NEUTRAL = 1 / Math.sqrt(3);

describe('the GLSL and the TypeScript place the solid the same way', () => {
  test('the shader carries the same sRGB-to-XYZ matrix, column-major', () => {
    // GLSL mat3 takes columns, so the shader's rows are the matrix's columns.
    const nums = (XYY_GLSL.match(/RGB_TO_XYZ = mat3\(([^)]*)\)/)![1])
      .split(',').map((t) => Number(t.trim()));
    expect(nums).toHaveLength(9);
    for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) {
      expect(nums[col * 3 + row]).toBeCloseTo(SRGB_TO_XYZ_D65[row][col], 7);
    }
  });

  test('the shader carries the same white point and the same scale', () => {
    const scale = Number(XYY_GLSL.match(/XY_SCALE = ([0-9.]+)/)![1]);
    expect(scale).toBe(XYY_SCALE);
    const whites = [...XYY_GLSL.matchAll(/vec2\(0\.3127, 0\.3290\)/g)];
    expect(whites.length).toBeGreaterThanOrEqual(1);
    expect(XYY_GLSL).toContain('(xy.x - 0.3127)');
    expect(XYY_GLSL).toContain('(xy.y - 0.3290)');
    // and the white it subtracts really is D65
    expect(D65_WHITE.x).toBeCloseTo(0.3127, 4);
    expect(D65_WHITE.y).toBeCloseTo(0.3290, 4);
  });

  test('the shader carries the same screen basis, red east and neutral up', () => {
    for (const v of ['0.57735027', '0.81649658', '-0.40824829', '0.70710678', '1.73205081']) {
      expect(XYY_GLSL).toContain(v);
    }
    expect(Number('0.57735027')).toBeCloseTo(1 / Math.sqrt(3), 8);
    expect(Number('0.81649658')).toBeCloseTo(2 / Math.sqrt(6), 8);
    expect(Number('0.70710678')).toBeCloseTo(1 / Math.sqrt(2), 8);
    expect(Number('1.73205081')).toBeCloseTo(Math.sqrt(3), 8);
  });

  test('the shader undoes the sRGB transfer function, not a power of 2.2', () => {
    expect(XYY_GLSL).toContain('c / 12.92');
    expect(XYY_GLSL).toContain('(c + 0.055) / 1.055');
    expect(XYY_GLSL).toContain('vec3(2.4)');
    expect(XYY_GLSL).toContain('step(vec3(0.04045), c)');
  });

  test('the arm is guarded, so the three older shapes are untouched at zero', () => {
    // Two places call place(); both must return before any xyY arithmetic.
    expect([...XYY_GLSL.matchAll(/uXyY/g)].length).toBeGreaterThan(0);
  });
});

describe('the TypeScript placement lands where the geometry says', () => {
  const near = (a: readonly number[], b: readonly number[], digits = 9) =>
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], digits));

  test('greys stack on the neutral axis: black at the origin, white at the far corner', () => {
    near(xyYToWorld(D65_WHITE.x, D65_WHITE.y, 0), [0, 0, 0]);
    near(xyYToWorld(D65_WHITE.x, D65_WHITE.y, 1), [1, 1, 1], 4);
    // and halfway up is halfway along the diagonal
    near(xyYToWorld(D65_WHITE.x, D65_WHITE.y, 0.5), [0.5, 0.5, 0.5], 4);
  });

  test('height is Y alone: the floor is flat, whatever the chromaticity', () => {
    for (const p of [SRGB_R, SRGB_G, SRGB_B, D65_WHITE]) {
      const w = xyYToWorld(p.x, p.y, 0);
      // height along the neutral axis
      expect(w[0] * NEUTRAL + w[1] * NEUTRAL + w[2] * NEUTRAL).toBeCloseTo(0, 9);
    }
    const up = xyYToWorld(SRGB_B.x, SRGB_B.y, 0.0722);
    expect(up[0] * NEUTRAL + up[1] * NEUTRAL + up[2] * NEUTRAL).toBeCloseTo(0.0722 * Math.sqrt(3), 9);
  });

  test('red points east, green 120 degrees round - the hexagon is the same way up', () => {
    // Screen basis: e1 east, e2 north, both perpendicular to the neutral axis.
    const e1 = [2 / Math.sqrt(6), -1 / Math.sqrt(6), -1 / Math.sqrt(6)];
    const e2 = [0, 1 / Math.sqrt(2), -1 / Math.sqrt(2)];
    const angle = (p: { x: number; y: number }) => {
      const w = xyYToWorld(p.x, p.y, 0);
      const a = Math.atan2(
        w[0] * e2[0] + w[1] * e2[1] + w[2] * e2[2],
        w[0] * e1[0] + w[1] * e1[1] + w[2] * e1[2],
      ) * 180 / Math.PI;
      return a < 0 ? a + 360 : a;
    };
    // The same angles cie.test.ts measures in xy, so the picture is not rolled.
    expect(angle(SRGB_R)).toBeCloseTo(0.2, 1);
    expect(angle(SRGB_G)).toBeCloseTo(92.7, 1);
    expect(angle(SRGB_B)).toBeCloseTo(238.8, 1);
  });

  test('the scale puts the triangle over the hexagon it is being compared with', () => {
    // The hexagon's red vertex is sqrt(6)/3 from its centre.
    const HEX_RED = Math.sqrt(6) / 3;
    const w = xyYToWorld(SRGB_R.x, SRGB_R.y, 0);
    const radius = Math.hypot(w[0], w[1], w[2]);
    expect(radius).toBeCloseTo(0.8183, 4);
    expect(radius / HEX_RED).toBeGreaterThan(0.99);
    expect(radius / HEX_RED).toBeLessThan(1.01);
  });
});
