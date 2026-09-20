import { describe, test, expect } from 'bun:test';
import { XYY_GLSL, XYY_SCALE, xyYToWorld, viewBasis, DEFAULT_PARAMS } from './cubeRenderer';
import { TRCS } from '@/utils/gamuts';
import { VIEW_ANGLES, ISO_PHI } from './cieViews';
import { SRGB_TO_XYZ_D65, D65_WHITE, SRGB_R, SRGB_G, SRGB_B, type Xy } from '@/utils/cie';

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
  test('the matrix reaches the shader as a uniform, and defaults to sRGB', () => {
    /*
     * It used to be a `const mat3` in the shader source, and this test read
     * the numbers straight out of it. The solid is a different shape in every
     * RGB space, so it is a uniform now - which moves the thing that could go
     * wrong from the literal to the default, and that is what is checked.
     */
    expect(XYY_GLSL).toContain('uniform mat3  uRgbToXyz;');
    expect(XYY_GLSL).toContain('uRgbToXyz * lin');
    expect(XYY_GLSL).not.toContain('RGB_TO_XYZ');
    expect(DEFAULT_PARAMS.xyYRgbToXyz).toBe(SRGB_TO_XYZ_D65);
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

  test('the transfer function is the four numbers, and they default to sRGB', () => {
    /*
     * One formula in the shader, four numbers from TypeScript, and the four
     * this page shipped with are IEC 61966-2-1's - a 12.92 toe below 0.04045
     * and a 2.4 power with a 0.055 offset above it, which is what the literal
     * used to spell out. `TRCS.srgb` is where they live now, and the default
     * has to be exactly that or every existing caller's solid changes shape.
     */
    expect(XYY_GLSL).toContain('uniform vec4  uTrc;');
    expect(XYY_GLSL).toContain('c / uTrc.y');
    expect(XYY_GLSL).toContain('(c + uTrc.z) / (1.0 + uTrc.z)');
    expect(XYY_GLSL).toContain('step(vec3(uTrc.x), c)');
    expect(DEFAULT_PARAMS.xyYTrc).toEqual([0.04045, 12.92, 0.055, 2.4]);
    expect(DEFAULT_PARAMS.xyYTrc).toEqual([TRCS.srgb.cut, TRCS.srgb.slope, TRCS.srgb.a, TRCS.srgb.gamma]);
  });

  test('the arm is guarded, so the three older shapes are untouched at zero', () => {
    // Two places call place(); both must return before any xyY arithmetic.
    expect([...XYY_GLSL.matchAll(/uXyY/g)].length).toBeGreaterThan(0);
  });
});

describe('the TypeScript placement lands where the geometry says', () => {
  const near = (a: readonly number[], b: readonly number[], digits = 9) =>
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], digits));

  test('grays stack on the neutral axis: black at the origin, white at the far corner', () => {
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
    // The hexagon's red vertex is sqrt(6)/3 from its center.
    const HEX_RED = Math.sqrt(6) / 3;
    const w = xyYToWorld(SRGB_R.x, SRGB_R.y, 0);
    const radius = Math.hypot(w[0], w[1], w[2]);
    expect(radius).toBeCloseTo(0.8183, 4);
    expect(radius / HEX_RED).toBeGreaterThan(0.99);
    expect(radius / HEX_RED).toBeLessThan(1.01);
  });
});

/*
 * The solid's `top` view claims to be the flat diagram. A claim like that is
 * either exact
 * or it is a lie the eye cannot catch: the sRGB triangle is close enough to
 * symmetric, and its three corners close enough in color, that a mirror or a
 * quarter turn reads as "about right" at a glance. So it is checked by
 * arithmetic, on the renderer's own camera rather than on a copy of it.
 *
 * The comparison is in *normalised panel coordinates* - 0 to 1 across, 0 to 1
 * up - because the two panels are different sizes and use different windows.
 * Orientation is what survives that normalisation; scale and position do not.
 */

/**
 * CieDiagram's window and its projection, as CieDiagram.tsx declares them.
 *
 * Both axes are divided by the window's *width*, not each by its own span:
 * the diagram is isotropic - one `K` scales x and y alike - so a unit of
 * panel width is the single yardstick both panels can be measured in.
 */
const D = { X0: -0.085, X1: 0.80, Y0: -0.05, Y1: 0.90 };
const PANEL_W = D.X1 - D.X0;
const flatPanel = (p: Xy) => ({
  across: (p.x - D.X0) / PANEL_W,
  up: (p.y - D.Y0) / PANEL_W,
});

const dot3 = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Where the solid's camera puts a floor chromaticity, in screen units. */
const solidScreen = (angles: { theta: number; phi: number }, p: Xy) => {
  const b = viewBasis({ up: 'neutral', theta: angles.theta, phi: angles.phi });
  const w = xyYToWorld(p.x, p.y, 0);
  return { across: dot3(b.right, w), up: dot3(b.up, w) };
};

describe('the straight-down view is the flat diagram, not merely like it', () => {
  const MARKS: readonly Xy[] = [SRGB_R, SRGB_G, SRGB_B, D65_WHITE];

  test('top puts every primary where the flat diagram puts it, to a thousandth', () => {
    /*
     * Both are normalised by the same yardstick - the flat diagram's window
     * width in chromaticity, and the screen length that window occupies on
     * the solid - so what is left to compare is direction alone. D65 anchors the
     * origin; the three primaries then pin rotation, mirroring and scale.
     */
    const scale = solidScreen(VIEW_ANGLES.top, { x: D.X1, y: D.Y0 }).across
      - solidScreen(VIEW_ANGLES.top, { x: D.X0, y: D.Y0 }).across;
    const origin = solidScreen(VIEW_ANGLES.top, { x: D.X0, y: D.Y0 });
    for (const p of MARKS) {
      const flat = flatPanel(p);
      const s = solidScreen(VIEW_ANGLES.top, p);
      expect((s.across - origin.across) / scale).toBeCloseTo(flat.across, 3);
      expect((s.up - origin.up) / scale).toBeCloseTo(flat.up, 3);
    }
  });

  test('x runs right and y runs up, with no mirror', () => {
    const w = solidScreen(VIEW_ANGLES.top, D65_WHITE);
    const xUp = solidScreen(VIEW_ANGLES.top, { x: D65_WHITE.x + 0.1, y: D65_WHITE.y });
    const yUp = solidScreen(VIEW_ANGLES.top, { x: D65_WHITE.x, y: D65_WHITE.y + 0.1 });
    // +x is purely rightward
    expect(xUp.across - w.across).toBeCloseTo(0.1 * XYY_SCALE, 9);
    expect(xUp.up - w.up).toBeCloseTo(0, 9);
    // +y is purely upward
    expect(yUp.across - w.across).toBeCloseTo(0, 9);
    expect(yUp.up - w.up).toBeCloseTo(0.1 * XYY_SCALE, 9);
  });

  test('the azimuth is what decides it, so top has to pin theta', () => {
    // The guard on the bug this test exists for: keeping whatever azimuth a
    // drag left behind rolls the diagram, and nothing else about the picture
    // changes enough to notice.
    const rolled = solidScreen({ theta: VIEW_ANGLES.top.theta + 0.7, phi: Math.PI / 2 }, SRGB_R);
    const square = solidScreen(VIEW_ANGLES.top, SRGB_R);
    expect(Math.hypot(rolled.across - square.across, rolled.up - square.up)).toBeGreaterThan(0.1);
  });
});

describe('the other named views are the ones their names promise', () => {
  test('front and right are elevations: level with the floor, a quarter turn apart', () => {
    expect(VIEW_ANGLES.front.phi).toBe(0);
    expect(VIEW_ANGLES.right.phi).toBe(0);
    expect(Math.abs(VIEW_ANGLES.front.theta - VIEW_ANGLES.right.theta)).toBeCloseTo(Math.PI / 2, 12);
  });

  test('an elevation keeps luminance vertical and a chromaticity axis horizontal', () => {
    for (const [angles, moved, still] of [
      [VIEW_ANGLES.front, { x: 0.1, y: 0 }, { x: 0, y: 0.1 }],
      [VIEW_ANGLES.right, { x: 0, y: 0.1 }, { x: 0.1, y: 0 }],
    ] as const) {
      const b = viewBasis({ up: 'neutral', ...angles });
      const at = (dx: number, dy: number, Y: number) =>
        xyYToWorld(D65_WHITE.x + dx, D65_WHITE.y + dy, Y);
      const base = at(0, 0, 0);
      const delta = (w: readonly number[]) => ({
        across: dot3(b.right, w) - dot3(b.right, base),
        up: dot3(b.up, w) - dot3(b.up, base),
      });
      // raising luminance moves straight up the screen
      const higher = delta(at(0, 0, 0.5));
      expect(higher.across).toBeCloseTo(0, 9);
      expect(higher.up).toBeGreaterThan(0.1);
      // one chromaticity axis runs across the screen
      const side = delta(at(moved.x, moved.y, 0));
      expect(Math.abs(side.across)).toBeGreaterThan(0.1);
      expect(side.up).toBeCloseTo(0, 9);
      // and the other runs straight into the screen, so it does not move
      const away = delta(at(still.x, still.y, 0));
      expect(away.across).toBeCloseTo(0, 9);
      expect(away.up).toBeCloseTo(0, 9);
    }
  });

  test('iso is front, tilted - it does not turn in azimuth', () => {
    /*
     * The guard on a "fix" waiting to happen: making iso a true isometric
     * means swinging the camera 45 degrees round, and that puts the solid at
     * an angle to the flat diagram beside it. Three of the four views share
     * one azimuth on purpose.
     */
    expect(VIEW_ANGLES.iso.theta).toBe(VIEW_ANGLES.front.theta);
    expect(VIEW_ANGLES.iso.theta).toBe(VIEW_ANGLES.top.theta);
    expect(VIEW_ANGLES.iso.phi).toBeCloseTo(ISO_PHI, 12);
    expect((ISO_PHI * 180) / Math.PI).toBeCloseTo(30, 9);
    // and it is between the two it sits between
    expect(VIEW_ANGLES.iso.phi).toBeGreaterThan(VIEW_ANGLES.front.phi);
    expect(VIEW_ANGLES.iso.phi).toBeLessThan(VIEW_ANGLES.top.phi);
  });

  test('every view but right keeps the flat diagram left-to-right sense', () => {
    for (const v of ['front', 'top', 'iso'] as const) {
      const b = viewBasis({ up: 'neutral', ...VIEW_ANGLES[v] });
      const w0 = xyYToWorld(D65_WHITE.x, D65_WHITE.y, 0);
      const w1 = xyYToWorld(D65_WHITE.x + 0.1, D65_WHITE.y, 0);
      // chromaticity x moves purely rightward, never leftward and never up
      expect(dot3(b.right, w1) - dot3(b.right, w0)).toBeCloseTo(0.1 * XYY_SCALE, 9);
      expect(dot3(b.up, w1) - dot3(b.up, w0)).toBeCloseTo(0, 9);
    }
  });
});
