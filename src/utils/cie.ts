/**
 * CIE 1931 chromaticity: the sRGB cube seen in *central* projection from black.
 *
 * The picker's hexagon is the RGB cube in parallel projection along the
 * black-to-white diagonal - see wiki/notes/hexagon-is-the-cube-down-its-
 * diagonal.md. The chromaticity diagram is the same cube projected from a
 * point instead of from infinity, and the point is the origin of linear RGB,
 * which is black. Dividing XYZ by X+Y+Z *is* that projection: it maps every
 * ray out of the origin onto the plane X+Y+Z=1, and a ray out of the origin is
 * a colour and all its dimmer copies.
 *
 * Two consequences, and each is separately visible on the page:
 *
 * 1. **Scale is thrown away.** A colour and the same colour at a tenth the
 *    brightness lie on one ray, so they land on one point. Brightness has
 *    nowhere to go - which is why the hexagon, being parallel, needs a
 *    brightness bar and this does not.
 * 2. **It is linear.** The hexagon's geometry is computed on gamma-encoded
 *    channels; chromaticity is computed after the transfer function is undone.
 *    So the two disagree about everything except the fully saturated rim.
 *
 * What survives both: a colour with min(R,G,B)=0 is a mix of exactly two
 * primaries, and a mix of two primaries lies on the line between them. So the
 * S=100 rim is the triangle's perimeter *exactly*, not approximately. That is
 * a theorem, and cie.test.ts holds it to floating-point zero.
 */
import { srgbToLinear, linearToSrgb, type RGB } from './colorConversions';
import { CIE_1931_2DEG } from './cieCmf1931';

export interface Xy {
  x: number;
  y: number;
}

/** A chromaticity plus the relative luminance that was divided out to get it. */
export interface XyY extends Xy {
  /** Relative luminance, 0 at black and 1 at white. Linear, not perceptual. */
  Y: number;
}

/**
 * Linear sRGB to CIE XYZ, D65. The matrix implied by the sRGB primaries and
 * white point (IEC 61966-2-1), at the precision Lindbloom and the CSS Color 4
 * sample code publish.
 *
 * Its second row is the luminance row, and the three numbers in it are the
 * page's blunt fact: green carries 0.7152 of white's luminance and blue
 * carries 0.0722, so the sRGB solid towers over the green corner and slumps
 * over the blue one by nearly ten to one.
 */
export const SRGB_TO_XYZ_D65 = [
  [0.4123907992659595, 0.35758433938387796, 0.1804807884018343],
  [0.21263900587151036, 0.7151686787677559, 0.07219231536073371],
  [0.01933081871559185, 0.11919477979462599, 0.9505321522496606],
] as const;

/** The luminance each primary reaches at full strength: the matrix's Y row. */
export const PRIMARY_LUMINANCE = {
  r: SRGB_TO_XYZ_D65[1][0],
  g: SRGB_TO_XYZ_D65[1][1],
  b: SRGB_TO_XYZ_D65[1][2],
} as const;

/** Inverted here rather than pasted, so there is one matrix to get wrong. */
function invert3(m: readonly (readonly number[])[]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [C / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}
export const XYZ_TO_SRGB_D65 = invert3(SRGB_TO_XYZ_D65);

function apply(m: readonly (readonly number[])[], v: readonly [number, number, number]) {
  return [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]) as [number, number, number];
}

/** Linear sRGB (0-1 each) to XYZ. */
export function linearRgbToXyz(r: number, g: number, b: number): [number, number, number] {
  return apply(SRGB_TO_XYZ_D65, [r, g, b]);
}

/**
 * The chromaticity of an XYZ triple: the central projection itself.
 * Black has no chromaticity - every ray meets at the origin - so it is `null`
 * rather than a number, and callers decide what to draw for it.
 */
export function xyzToXyY(X: number, Y: number, Z: number): XyY | null {
  const s = X + Y + Z;
  if (s <= 0) return null;
  return { x: X / s, y: Y / s, Y };
}

/** An 8-bit, gamma-encoded sRGB colour's chromaticity. Null for black alone. */
export function rgbToXyY(r: number, g: number, b: number): XyY | null {
  const [X, Y, Z] = linearRgbToXyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  return xyzToXyY(X, Y, Z);
}

/**
 * The sRGB primaries and white, measured out of the matrix rather than typed
 * in. They come out at the chromaticities the standard names - R (0.6400,
 * 0.3300), G (0.3000, 0.6000), B (0.1500, 0.0600), D65 (0.3127, 0.3290) - and
 * cie.test.ts is what says so, against culori as a second opinion.
 */
function primary(r: number, g: number, b: number): Xy {
  const p = xyzToXyY(...linearRgbToXyz(r, g, b));
  if (!p) throw new Error('a primary with no chromaticity');
  return { x: p.x, y: p.y };
}
export const SRGB_R = primary(1, 0, 0);
export const SRGB_G = primary(0, 1, 0);
export const SRGB_B = primary(0, 0, 1);
export const SRGB_TRIANGLE: readonly Xy[] = [SRGB_R, SRGB_G, SRGB_B];
export const D65_WHITE: Xy = primary(1, 1, 1);

/**
 * Display P3's primaries, as the standard defines them - a gamut *is* its
 * three chromaticities plus a white point, so these are a definition and not a
 * measurement. Red and green move out; blue is the same primary as sRGB's.
 * SMPTE RP 431-2 (DCI-P3) primaries on D65, which is what CSS `display-p3` and
 * every wide-gamut screen mean by the name.
 *
 * Drawn as one more outline, never as a mode - see
 * wiki/notes/plan-perceptual-color-in-color-taylor.md.
 */
export const P3_TRIANGLE: readonly Xy[] = [
  { x: 0.680, y: 0.320 },
  { x: 0.265, y: 0.690 },
  { x: 0.150, y: 0.060 },
];

/**
 * The spectral locus: the chromaticity of each monochromatic wavelength.
 *
 * 380-700 nm, which is where the drawn horseshoe stops for a reason rather
 * than for taste: past 700 nm the three CMFs fall away in step, so the ratio
 * between them - and therefore the chromaticity - stops changing. Every row
 * from 700 to 830 nm lands within 1.5e-7 of the 700 nm point, so drawing them
 * would stack 26 samples on one another.
 */
export const SPECTRAL_LOCUS: ReadonlyArray<{ nm: number } & Xy> = CIE_1931_2DEG
  .filter(([nm]) => nm >= 380 && nm <= 700)
  .map(([nm, X, Y, Z]) => {
    const s = X + Y + Z;
    return { nm, x: X / s, y: Y / s };
  });

/**
 * Whether a point is inside a polygon, by ray casting.
 *
 * Not the cheaper same-sign-of-the-cross-product test, which needs a strictly
 * convex outline. The locus *looks* convex and is convex to 7.7e-5, but a
 * 5 nm table in the dim violet end has a few samples a hair inside the hull,
 * and the sign test reads those as a concavity and declares everything
 * outside. Found by this file's own guard: it put the sRGB primaries outside
 * the horseshoe.
 */
export function insidePolygon(p: Xy, poly: readonly Xy[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Inside the horseshoe, the purple line closing it. Everything visible is. */
export function insideLocus(p: Xy): boolean {
  return insidePolygon(p, SPECTRAL_LOCUS);
}

/**
 * The brightest sRGB colour of a given chromaticity, or null when there is
 * none - which is to say, when the chromaticity is outside the triangle.
 *
 * This is what makes an honest fill possible. Every point inside the triangle
 * has a whole ray of sRGB colours above it, and the one worth painting is the
 * top of that ray: scale the linear triple until its largest channel is 1.
 * A point outside has a ray that never enters the cube without a negative
 * channel, so there is no colour to paint and the page must say so by painting
 * something that is plainly not a colour of that chromaticity.
 */
export function brightestRgbAt(x: number, y: number): RGB | null {
  if (y <= 0) return null;
  // The ray through (x, y) at unit luminance. Any Y gives the same direction.
  const [R, G, B] = apply(XYZ_TO_SRGB_D65, [x / y, 1, (1 - x - y) / y]);
  // A hair of tolerance: the primaries themselves sit exactly on zero and
  // arrive a float either side of it.
  const EPS = -1e-9;
  if (R < EPS || G < EPS || B < EPS) return null;
  const m = Math.max(R, G, B);
  if (m <= 0) return null;
  return {
    r: linearToSrgb(R / m),
    g: linearToSrgb(G / m),
    b: linearToSrgb(B / m),
  };
}

/** Distance from a point to a segment, for measuring the rim against the edges. */
export function distanceToSegment(p: Xy, a: Xy, b: Xy): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Distance from a point to the nearest of a polygon's edges. */
export function distanceToPolygon(p: Xy, poly: readonly Xy[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    best = Math.min(best, distanceToSegment(p, poly[i], poly[(i + 1) % poly.length]));
  }
  return best;
}

/**
 * How much of a circle of radius `r` about white lies outside the triangle.
 *
 * The colour wheel every picker draws implies that a fixed distance from the
 * centre means a fixed colourfulness. In chromaticity it does not, and this
 * measures by how much: white's distance from each of the three edges decides
 * the arc the circle pokes out over, `2*acos(d/r)` per edge, and at the radii
 * worth asking about the three arcs do not overlap. Closed form rather than
 * sampled, so the number on the page has no resolution to argue with.
 */
export function circleFractionOutsideGamut(r: number, poly: readonly Xy[] = SRGB_TRIANGLE, centre: Xy = D65_WHITE): number {
  let arc = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const d = Math.abs((b.x - a.x) * (a.y - centre.y) - (a.x - centre.x) * (b.y - a.y)) / Math.hypot(b.x - a.x, b.y - a.y);
    if (d < r) arc += 2 * Math.acos(d / r);
  }
  return Math.min(1, arc / (2 * Math.PI));
}
