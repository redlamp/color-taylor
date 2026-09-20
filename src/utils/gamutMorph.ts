/**
 * The hexagon, told the truth: where each of its colours really sits.
 *
 * The picker's wheel is a regular hexagon, and a regular hexagon makes two
 * silent claims - that the six cube corners are evenly spaced round the
 * centre, and that they are all equally far from it. Neither is true in any
 * space that measures colour rather than arithmetic. This file says where each
 * colour goes instead, in coordinates the hexagon can be overlaid on.
 *
 * TWO ANCHORS, AND WHY THAT IS THE RIGHT NUMBER. A similarity transform - a
 * rotation, a uniform scale and a translation - is pinned exactly by two
 * points, so anchoring two and leaving the rest free is the most that can be
 * done without distorting the answer. The two are white at the origin and pure
 * red at (1, 0). White is free: every grey has the same chromaticity as the
 * white point, and a grey's Oklab a and b are zero, so the centre maps to the
 * centre in both targets without being made to. Red is the choice, and it buys
 * the thing a morph needs most - a shared reference direction and a shared
 * scale, so what you watch is the *spacing* collapsing rather than the whole
 * field rotating and resizing at once.
 *
 * Everything here is returned in those units: multiply by the hexagon's
 * circumradius and the two figures lie on top of each other. y is up, the way
 * a chromaticity diagram draws it and the opposite of a screen.
 *
 * THE TWO TARGETS ARE NOT THE SAME KIND OF DISAGREEMENT.
 *
 * - **CIE xy** is the chromaticity the diagram in panel 2 already draws. Its
 *   structure is *three-fold*: the six landmarks fall into three corners of a
 *   triangle and three points stranded along its edges, so the gaps between
 *   them repeat every 120 degrees, exactly. See `cornerGaps`.
 * - **Oklab a/b** is the perceptual plane, and Oklch's C and H are literally
 *   polar coordinates on it. It has no three-fold structure at all, because
 *   the cube root between linear RGB and Oklab is not affine and the triangle
 *   does not survive it. Its six gaps are six different numbers.
 *
 * Every figure this file computes is asserted in gamutMorph.test.ts, with
 * culori as an independent second opinion on both transforms.
 */
import { hsbToRgb, rgbToOklch, type RGB } from './colorConversions';
import { rgbToXyY, D65_WHITE } from './cie';

/** Which space decides where a colour goes. */
export type MorphTarget = 'xy' | 'oklab';

/** A point in the morph plane: white at the origin, red at (1, 0), y up. */
export interface MorphPoint {
  x: number;
  y: number;
}

/** Pure red: the second anchor, and the only one that had to be chosen. */
const RED: RGB = { r: 255, g: 0, b: 0 };

/** Red's place in a target's own units, before anything is normalised away. */
interface Anchor {
  /** Radians anticlockwise from that space's own x axis. */
  angle: number;
  /** Distance from white, in that space's own units. */
  reach: number;
}

const ANCHOR: Record<MorphTarget, Anchor> = {
  xy: (() => {
    const p = rgbToXyY(RED.r, RED.g, RED.b);
    if (!p) throw new Error('red has no chromaticity');
    const dx = p.x - D65_WHITE.x, dy = p.y - D65_WHITE.y;
    return { angle: Math.atan2(dy, dx), reach: Math.hypot(dx, dy) };
  })(),
  oklab: (() => {
    const o = rgbToOklch(RED.r, RED.g, RED.b);
    return { angle: (o.h * Math.PI) / 180, reach: o.c };
  })(),
};

/**
 * What one hexagon radius is worth in the target's own units: red's distance
 * from white there. 0.327 of a chromaticity unit, or 0.258 of Oklab chroma.
 *
 * The page quotes it so the normalised numbers can be converted back. Nothing
 * in the morph needs it - that is the point of normalising.
 */
export function anchorReach(target: MorphTarget): number {
  return ANCHOR[target].reach;
}

/**
 * Where an 8-bit sRGB colour sits in the morph plane.
 *
 * Black is the one colour with no answer under `xy`: central projection sends
 * every ray out of the origin to one point and black *is* the origin, so it
 * has no chromaticity. It returns the centre, which is where every grey goes
 * and therefore the limit of every ray leading into it - the least wrong
 * answer, and the only one that keeps a field of samples continuous.
 */
export function morphPoint(r: number, g: number, b: number, target: MorphTarget): MorphPoint {
  const anchor = ANCHOR[target];
  let angle: number, reach: number;
  if (target === 'oklab') {
    const o = rgbToOklch(r, g, b);
    angle = (o.h * Math.PI) / 180;
    reach = o.c;
  } else {
    const p = rgbToXyY(r, g, b);
    if (!p) return { x: 0, y: 0 };
    const dx = p.x - D65_WHITE.x, dy = p.y - D65_WHITE.y;
    angle = Math.atan2(dy, dx);
    reach = Math.hypot(dx, dy);
  }
  const a = angle - anchor.angle;
  const d = reach / anchor.reach;
  return { x: d * Math.cos(a), y: d * Math.sin(a) };
}

/**
 * The six corners of the sRGB cube, in the order the hexagon puts them round
 * the wheel, and at the hue the hexagon puts each one at.
 *
 * These are the landmarks the morph tracks. They are the corners at full
 * strength rather than at the current brightness on purpose: the picker's
 * field paints its rim at brightness 100 whatever the bar says - past the
 * cross-section it is previewing what raising brightness would reach - so
 * these are the colours that sit on the hexagon's corners at every setting.
 */
export const CORNERS: ReadonlyArray<{ name: string; hsbHue: number; rgb: RGB }> = [
  { name: 'Red', hsbHue: 0, rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Yellow', hsbHue: 60, rgb: { r: 255, g: 255, b: 0 } },
  { name: 'Green', hsbHue: 120, rgb: { r: 0, g: 255, b: 0 } },
  { name: 'Cyan', hsbHue: 180, rgb: { r: 0, g: 255, b: 255 } },
  { name: 'Blue', hsbHue: 240, rgb: { r: 0, g: 0, b: 255 } },
  { name: 'Magenta', hsbHue: 300, rgb: { r: 255, g: 0, b: 255 } },
];

export interface CornerReading {
  name: string;
  /** The hue the hexagon puts it at: 0, 60, 120, 180, 240, 300. */
  hsbHue: number;
  point: MorphPoint;
  /** Degrees anticlockwise from red, 0 to 360. Red is 0 by construction. */
  angle: number;
  /** Distance from white, as a multiple of red's. Red is 1 by construction. */
  reach: number;
  /** Degrees from here anticlockwise to the next corner. 60 in the hexagon. */
  gap: number;
}

/** Angle and reach for each corner, measured rather than quoted. */
export function cornerReadings(target: MorphTarget): CornerReading[] {
  const pts = CORNERS.map((c) => morphPoint(c.rgb.r, c.rgb.g, c.rgb.b, target));
  const angles = pts.map((p) => {
    const a = (Math.atan2(p.y, p.x) * 180) / Math.PI;
    return a < 0 ? a + 360 : a;
  });
  return CORNERS.map((c, i) => {
    let gap = angles[(i + 1) % 6] - angles[i];
    if (gap <= 0) gap += 360;
    return {
      name: c.name,
      hsbHue: c.hsbHue,
      point: pts[i],
      angle: angles[i],
      reach: Math.hypot(pts[i].x, pts[i].y),
      gap,
    };
  });
}

/** Just the gaps, red to yellow onwards. The hexagon claims six 60s. */
export function cornerGaps(target: MorphTarget): number[] {
  return cornerReadings(target).map((c) => c.gap);
}

/**
 * The area of a regular hexagon of circumradius 1 - what the picker draws, and
 * the yardstick `rimShape` reports its area against. A fact about hexagons,
 * not a repeat of the picker's geometry.
 */
export const UNIT_HEX_AREA = (3 * Math.sqrt(3)) / 2;

export interface RimShape {
  /** The fully saturated rim, traced anticlockwise from red. */
  points: MorphPoint[];
  /** Enclosed area, as a multiple of the unit hexagon's. */
  area: number;
  /**
   * The shape's own middle, in the same units. The hexagon pins white at the
   * origin by construction; this is where the middle of the real shape went
   * once nothing was holding it there.
   */
  centroid: MorphPoint;
}

/**
 * The hexagon's rim - saturation 100, brightness 100, all the way round -
 * where the target puts it, with the two numbers that say what happened to it.
 *
 * `samples` is a multiple of 6 so the six corners land on samples exactly;
 * under `xy` the rim is the sRGB triangle's perimeter (a theorem - see cie.ts)
 * so hitting the corners is the difference between the triangle's area and a
 * chord's approximation of it.
 */
export function rimShape(target: MorphTarget, samples = 1440): RimShape {
  const points: MorphPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const h = (i / samples) * 360;
    const c = hsbToRgb(h, 100, 100);
    points.push(morphPoint(c.r, c.g, c.b, target));
  }
  // Shoelace, and the polygon centroid that falls out of the same sum.
  let a2 = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length];
    const cross = p.x * q.y - q.x * p.y;
    a2 += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  const area = a2 / 2;
  return {
    points,
    area: area / UNIT_HEX_AREA,
    centroid: area === 0 ? { x: 0, y: 0 } : { x: cx / (6 * area), y: cy / (6 * area) },
  };
}
