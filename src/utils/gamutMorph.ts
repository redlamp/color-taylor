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
import {
  hsbToRgb, rgbToOklch, oklabToOklch, linearToOklab, type Oklch, type RGB,
} from './colorConversions';
import { rgbToXyY, D65_WHITE, XYZ_TO_SRGB_D65, type XyY } from './cie';
import { gamutById, gamutRgbToXyY, gamutRgbToXyzD65, type GamutId } from './gamuts';

/**
 * The white the morph plane is centred on: that space's own, not D65.
 *
 * The anchoring says white sits at the origin, and "white" means the white of
 * the space being measured in. Four of the five here are D65 and the phrase
 * never has to be tested; ProPhoto is D50, and centring its plane on D65
 * instead would push every grey a tenth of a radius off centre - which would
 * read as a finding about ProPhoto rather than as the wrong white point.
 *
 * For sRGB this is `D65_WHITE` itself, the same object, so nothing on the page
 * that predates gamuts moves by a float.
 */
const whiteOf = (gamut: GamutId) => gamutById(gamut).white;

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

/**
 * WHICH SPACE THE HEXAGON'S NUMBERS BELONG TO.
 *
 * Every function here takes a `gamut`, defaulting to sRGB, and it decides
 * what an 8-bit triple *means* before anything is measured about where it
 * goes. That is the page's sharpest claim: the picker's hexagon is the same
 * picture in every RGB space, because HSB is defined on the cube's own
 * coordinates and knows nothing about primaries - so the hexagon cannot tell
 * you which space you are in, and the shape its colours really occupy can.
 * Same starting figure, different destination.
 *
 * sRGB is special-cased rather than routed through the general machinery, so
 * that every reading this page had before gamuts existed is bit for bit the
 * number it was.
 */
function xyOf(gamut: GamutId, r: number, g: number, b: number): XyY | null {
  return gamut === 'srgb' ? rgbToXyY(r, g, b) : gamutRgbToXyY(gamut, r, g, b);
}

/**
 * Oklch of a triple read as a colour in `gamut`.
 *
 * Oklab is defined on XYZ under D65, so a non-sRGB space goes through its own
 * matrix and, where its white is not D65, through a Bradford adaptation -
 * both in gamuts.ts. The last leg is linear sRGB, which is allowed to go
 * negative here: the matrices are linear and `linearToOklab`'s cube roots
 * take negatives, so the composition is exact for colours no sRGB screen can
 * show. That is most of what a wide gamut is for.
 */
function oklchOf(gamut: GamutId, r: number, g: number, b: number): Oklch {
  if (gamut === 'srgb') return rgbToOklch(r, g, b);
  const xyz = gamutRgbToXyzD65(gamut, r, g, b);
  const lin = [0, 1, 2].map((i) =>
    XYZ_TO_SRGB_D65[i][0] * xyz[0] + XYZ_TO_SRGB_D65[i][1] * xyz[1] + XYZ_TO_SRGB_D65[i][2] * xyz[2]);
  const lab = linearToOklab(lin[0], lin[1], lin[2]);
  return oklabToOklch(lab.l, lab.a, lab.b);
}

const anchorCache = new Map<string, Anchor>();

function anchorFor(target: MorphTarget, gamut: GamutId): Anchor {
  const key = `${target}:${gamut}`;
  const hit = anchorCache.get(key);
  if (hit) return hit;
  let a: Anchor;
  if (target === 'oklab') {
    const o = oklchOf(gamut, RED.r, RED.g, RED.b);
    a = { angle: (o.h * Math.PI) / 180, reach: o.c };
  } else {
    const p = xyOf(gamut, RED.r, RED.g, RED.b);
    if (!p) throw new Error('red has no chromaticity');
    const w = whiteOf(gamut);
    const dx = p.x - w.x, dy = p.y - w.y;
    a = { angle: Math.atan2(dy, dx), reach: Math.hypot(dx, dy) };
  }
  anchorCache.set(key, a);
  return a;
}

/**
 * What one hexagon radius is worth in the target's own units: red's distance
 * from white there. 0.327 of a chromaticity unit in sRGB, or 0.258 of Oklab
 * chroma - and a different pair of numbers in every other space, which is
 * what a wider gamut *means*.
 *
 * The page quotes it so the normalised numbers can be converted back. Nothing
 * in the morph needs it - that is the point of normalising.
 */
export function anchorReach(target: MorphTarget, gamut: GamutId = 'srgb'): number {
  return anchorFor(target, gamut).reach;
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
export function morphPoint(r: number, g: number, b: number, target: MorphTarget, gamut: GamutId = 'srgb'): MorphPoint {
  const anchor = anchorFor(target, gamut);
  let angle: number, reach: number;
  if (target === 'oklab') {
    const o = oklchOf(gamut, r, g, b);
    angle = (o.h * Math.PI) / 180;
    reach = o.c;
  } else {
    const p = xyOf(gamut, r, g, b);
    if (!p) return { x: 0, y: 0 };
    const w = whiteOf(gamut);
    const dx = p.x - w.x, dy = p.y - w.y;
    angle = Math.atan2(dy, dx);
    reach = Math.hypot(dx, dy);
  }
  const a = angle - anchor.angle;
  const d = reach / anchor.reach;
  return { x: d * Math.cos(a), y: d * Math.sin(a) };
}

/**
 * A bare chromaticity in the morph plane - no colour needed to get there.
 *
 * `morphPoint` starts from an 8-bit sRGB triple because that is what the field
 * is made of. The CIE 1931 diagram is made of things that are not sRGB at all:
 * the spectral locus is monochromatic light, and Rec. 2020 and ProPhoto have
 * primaries no screen can reach. To draw those in the same plane the morph
 * ends in, the map has to take a chromaticity directly.
 *
 * ONLY `xy` HAS THIS, AND THE REASON IS THE POINT OF THE PANEL. A chromaticity
 * is what is left after the scale of a colour is divided out, so it names a
 * whole ray at once. Oklab's a and b do not: scale a colour by k and its LMS
 * scale by k, so the cube roots scale by k^(1/3) and a and b shrink with it.
 * One chromaticity is a line in the a/b plane rather than a point, and picking
 * a luminance to collapse it would be a choice dressed up as a measurement.
 * So the CIE outline is drawn over the xy morph and not over the Oklab one,
 * and the page says why instead of quietly drawing something.
 */
export function xyToMorphPoint(x: number, y: number, gamut: GamutId = 'srgb'): MorphPoint {
  const anchor = anchorFor('xy', gamut);
  const w = whiteOf(gamut);
  const dx = x - w.x, dy = y - w.y;
  const a = Math.atan2(dy, dx) - anchor.angle;
  const d = Math.hypot(dx, dy) / anchor.reach;
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
export function cornerReadings(target: MorphTarget, gamut: GamutId = 'srgb'): CornerReading[] {
  const pts = CORNERS.map((c) => morphPoint(c.rgb.r, c.rgb.g, c.rgb.b, target, gamut));
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
export function cornerGaps(target: MorphTarget, gamut: GamutId = 'srgb'): number[] {
  return cornerReadings(target, gamut).map((c) => c.gap);
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
export function rimShape(target: MorphTarget, samples = 1440, gamut: GamutId = 'srgb'): RimShape {
  const points: MorphPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const h = (i / samples) * 360;
    const c = hsbToRgb(h, 100, 100);
    points.push(morphPoint(c.r, c.g, c.b, target, gamut));
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
