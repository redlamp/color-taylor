/**
 * The RGB gamuts worth drawing on a chromaticity diagram, and the two numbers
 * that say how big each one is.
 *
 * A gamut *is* three chromaticities and a white point. Everything else about a
 * colour space - its transfer function, its bit depth, its matrix - is
 * machinery for getting in and out of it, and none of it changes the triangle.
 * So this file is a table of definitions, not of measurements, and each row
 * cites the document that defines it.
 *
 * WHERE THE NUMBERS COME FROM. Each set below is typed from the standard that
 * defines the space, and gamuts.test.ts then re-derives the same three
 * chromaticities from culori's own RGB-to-XYZ matrix for that space - a
 * separate implementation that shares no code with this repo. A typo here that
 * survives both is a typo that culori also makes.
 *
 * - **sRGB** is not listed. It is `SRGB_TRIANGLE` in cie.ts, derived from the
 *   matrix rather than typed, and the test checks this file's idea of sRGB
 *   against it so there is exactly one sRGB in the codebase.
 * - **Display P3**: SMPTE RP 431-2 primaries (DCI-P3) on a D65 white, which is
 *   what CSS `display-p3` and every wide-gamut screen mean by the name. The
 *   same three points as `P3_TRIANGLE` in cie.ts, and the test holds them
 *   equal.
 * - **Adobe RGB (1998)**: Adobe Systems, *Adobe RGB (1998) Colour Image
 *   Encoding*, version 2005-05, section 4.3.4.1. Red and blue are sRGB's; only
 *   green moves, out toward the locus.
 * - **Rec. 2020**: Recommendation ITU-R BT.2020-2 (10/2015), Table 1-1.
 * - **ProPhoto RGB** (ROMM RGB): ISO 22028-2, and Kodak's *Reference Output
 *   Medium Metric RGB Colour Space* white paper. Its white is D50, not D65.
 *
 * TWO THINGS THAT LOOK LIKE BUGS AND ARE NOT.
 *
 * 1. **Rec. 2020's primaries are monochromatic** - 630, 532 and 467 nm - so
 *    they sit *on* the spectral locus rather than inside it. The locus this
 *    repo draws is 65 straight chords at 5 nm, and a chord cuts the corner, so
 *    a point exactly on the curve can read a few ten-thousandths outside the
 *    polygon. cie.ts already documents the same effect for P3's red. It is the
 *    5 nm sampling being coarse, not the primary being wrong.
 * 2. **ProPhoto's green and blue are imaginary on purpose.** They are outside
 *    the locus entirely - no light of any spectrum has that chromaticity - and
 *    that is the space's design: an encoding large enough to hold every real
 *    surface colour has to spend some of itself on colours that do not exist.
 *    `imaginary` flags it so the page can say so rather than clamp it away.
 */
import {
  SRGB_TRIANGLE, D65_WHITE, insidePolygon, distanceToPolygon, SPECTRAL_LOCUS,
  type Xy, type XyY,
} from './cie';
import type { RGB } from './colorConversions';

export type GamutId = 'srgb' | 'p3' | 'a98' | 'rec2020' | 'prophoto';

export interface Gamut {
  id: GamutId;
  /** What the picker calls it. */
  name: string;
  /** Red, green, blue, in that order - the order every triangle here uses. */
  primaries: readonly [Xy, Xy, Xy];
  white: Xy;
  /** The white point's name, because two of these are not D65. */
  whiteName: string;
  /** The document the three chromaticities are typed from. */
  source: string;
  /** True when at least one primary lies outside the spectral locus. */
  imaginary: boolean;
}

/** D50 as the ICC and ISO 22028-2 define it. ProPhoto's white, and only its. */
const D50_WHITE: Xy = { x: 0.3457, y: 0.3585 };

const DEFS: ReadonlyArray<Omit<Gamut, 'imaginary'>> = [
  {
    id: 'srgb',
    name: 'sRGB',
    // Not typed: derived from the matrix in cie.ts, so there is one sRGB here.
    primaries: SRGB_TRIANGLE as readonly [Xy, Xy, Xy],
    white: D65_WHITE,
    whiteName: 'D65',
    source: 'IEC 61966-2-1, derived from the matrix in cie.ts',
  },
  {
    id: 'p3',
    name: 'Display P3',
    primaries: [
      { x: 0.680, y: 0.320 },
      { x: 0.265, y: 0.690 },
      { x: 0.150, y: 0.060 },
    ],
    white: D65_WHITE,
    whiteName: 'D65',
    source: 'SMPTE RP 431-2 primaries on D65 (CSS Color 4 display-p3)',
  },
  {
    id: 'a98',
    name: 'Adobe RGB (1998)',
    primaries: [
      { x: 0.6400, y: 0.3300 },
      { x: 0.2100, y: 0.7100 },
      { x: 0.1500, y: 0.0600 },
    ],
    white: D65_WHITE,
    whiteName: 'D65',
    source: 'Adobe RGB (1998) Colour Image Encoding, s4.3.4.1',
  },
  {
    id: 'rec2020',
    name: 'Rec. 2020',
    primaries: [
      { x: 0.708, y: 0.292 },
      { x: 0.170, y: 0.797 },
      { x: 0.131, y: 0.046 },
    ],
    white: D65_WHITE,
    whiteName: 'D65',
    source: 'ITU-R BT.2020-2, Table 1-1 (monochromatic: 630, 532, 467 nm)',
  },
  {
    id: 'prophoto',
    name: 'ProPhoto RGB',
    primaries: [
      { x: 0.734699, y: 0.265301 },
      { x: 0.159597, y: 0.840403 },
      { x: 0.036598, y: 0.000105 },
    ],
    white: D50_WHITE,
    whiteName: 'D50',
    source: 'ISO 22028-2 / ROMM RGB (green and blue are imaginary)',
  },
];

/**
 * A primary counts as imaginary when it is outside the drawn locus by more
 * than a chord can explain.
 *
 * The 5 nm polygon cuts every corner it turns, so a point genuinely on the
 * curve falls a little outside it. Measured against the chords rather than
 * against the samples: the largest miss on this table is Rec. 2020's green at
 * 0.00071 of a chromaticity unit, while ProPhoto's green is out by 0.033 and
 * its blue by 0.105 - forty-six and a hundred and forty times as far. So a
 * tolerance separates the two cases with two orders of magnitude to spare, and
 * `insidePolygon` alone does not.
 *
 * Measured to the nearest *sample* instead, Rec. 2020's green reads 0.0177 out,
 * because 532 nm lies between two 5 nm rows and the chord passes close while
 * both endpoints are far. That version of the test called Rec. 2020 imaginary.
 */
const CHORD_SLACK = 0.005;

function outsideLocus(p: Xy): boolean {
  if (insidePolygon(p, SPECTRAL_LOCUS)) return false;
  return distanceToPolygon(p, SPECTRAL_LOCUS) > CHORD_SLACK;
}

export const GAMUTS: readonly Gamut[] = DEFS.map((d) => ({
  ...d,
  imaginary: d.primaries.some(outsideLocus),
}));

export function gamutById(id: GamutId): Gamut {
  const g = GAMUTS.find((x) => x.id === id);
  if (!g) throw new Error(`no gamut ${id}`);
  return g;
}

/** Signed-area magnitude of a polygon in the xy plane. Shoelace. */
export function xyArea(poly: readonly Xy[]): number {
  let a2 = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    a2 += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a2) / 2;
}

/** The horseshoe's own area: the denominator every coverage figure divides by. */
export const LOCUS_AREA = xyArea(SPECTRAL_LOCUS);

/**
 * A gamut's triangle as a share of the locus's area.
 *
 * It is an area ratio in the xy plane and nothing more. Two warnings travel
 * with it, and the page carries both:
 *
 * - It is **not** a share of visible colours. xy area is not proportional to
 *   anything perceptual, which is the whole reason CIE 1976 u'v' exists.
 * - For ProPhoto it is not even a share of the horseshoe, because a third of
 *   its triangle lies outside the horseshoe altogether.
 *
 * The figures that come out - sRGB 33.6%, Display P3 45.6%, Adobe RGB 45.4%,
 * Rec. 2020 63.6% - do not all match the ones quoted in press material. "Rec.
 * 2020 covers 75.8%" is the same kind of ratio taken in CIE 1976 u'v', where
 * the horseshoe is a different shape; 63.6% is what the 1931 diagram this page
 * draws actually says. Computed here rather than quoted, so the number on
 * screen belongs to the picture beside it.
 */
export function locusAreaShare(g: Gamut): number {
  return xyArea(g.primaries) / LOCUS_AREA;
}

/* ────────────────────────────────────────────────────────────────────────
 * Getting in and out of a gamut.
 *
 * Everything above is the *definition* of a space - three chromaticities and
 * a white. Everything below is the machinery for using one: the matrix those
 * four points imply, the transfer function that says what an 8-bit number
 * means, and the readings the lab page takes off them.
 *
 * WHY THIS EXISTS AT ALL. The picker's hexagon is the same picture in every
 * RGB space: HSB is defined on the cube's own coordinates, so (h, s, b) is
 * six corners on a regular hexagon whatever the primaries are. The colours
 * those coordinates *name* are different in every space, and so is the shape
 * they really occupy. That gap is the lab page's whole subject, and it can
 * only be drawn if one triple can be pushed through more than one space.
 *
 * Every matrix here is derived from the primaries rather than pasted, so
 * there is one place to get a gamut wrong, and gamuts.test.ts checks it
 * against culori.
 * ──────────────────────────────────────────────────────────────────────── */

type M3 = readonly (readonly number[])[];

function invert3(m: M3): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [C / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}

const mul3 = (m: M3, v: readonly [number, number, number]): [number, number, number] =>
  [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]) as [number, number, number];

const mulMM = (a: M3, b: M3): number[][] =>
  [0, 1, 2].map((i) => [0, 1, 2].map((j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]));

/** A chromaticity as an XYZ direction at unit Y. Undefined at y = 0. */
const xyzOf = (p: Xy): [number, number, number] => [p.x / p.y, 1, (1 - p.x - p.y) / p.y];

/**
 * The linear-RGB-to-XYZ matrix a gamut's four points imply.
 *
 * The standard derivation: each primary fixes a *direction* in XYZ and
 * nothing more, so the three are scaled by whatever makes (1, 1, 1) land
 * exactly on the white point. That is the only free parameter, and the white
 * point is what spends it.
 *
 * Derived rather than pasted from a table, because a pasted matrix and a
 * pasted set of primaries can disagree - and then the outline on the diagram
 * is not the outline of the colours drawn inside it.
 */
export function rgbToXyzMatrix(g: Gamut): number[][] {
  const [R, G, B] = g.primaries.map(xyzOf);
  const cols: M3 = [
    [R[0], G[0], B[0]],
    [R[1], G[1], B[1]],
    [R[2], G[2], B[2]],
  ];
  const s = mul3(invert3(cols), xyzOf(g.white));
  return [0, 1, 2].map((row) => [R[row] * s[0], G[row] * s[1], B[row] * s[2]]);
}

/**
 * A transfer function, in the one shape all of these happen to take:
 *
 *     linear = v < cut ? v / slope : ((v + a) / (1 + a)) ^ gamma
 *
 * With `cut` at 0 the first branch never fires, and with `a` at 0 the second
 * is a plain power - so a pure-gamma space is the same four numbers with two
 * of them switched off. That matters because these four go to the GPU as one
 * `vec4`: one formula there means the shader and this file cannot drift into
 * disagreeing about where a colour stands.
 */
export interface Trc {
  cut: number;
  slope: number;
  a: number;
  gamma: number;
}

/**
 * Each space's own encoding, from its own standard.
 *
 * - **sRGB** and **Display P3** share one: IEC 61966-2-1's piecewise curve.
 *   P3 is DCI's primaries with sRGB's transfer function, which is what makes
 *   `display-p3` a drop-in for CSS.
 * - **Adobe RGB (1998)** is a pure power of 563/256 = 2.19921875, spelled
 *   that way in the standard rather than as 2.2.
 * - **Rec. 2020** is BT.709's shape with the 12-bit constants BT.2020-2
 *   gives: alpha 1.09929682680944, beta 0.018053968510807.
 * - **ProPhoto** is a 1.8 power with a linear toe below 16/512.
 */
export const TRCS: Record<GamutId, Trc> = {
  srgb: { cut: 0.04045, slope: 12.92, a: 0.055, gamma: 2.4 },
  p3: { cut: 0.04045, slope: 12.92, a: 0.055, gamma: 2.4 },
  a98: { cut: 0, slope: 1, a: 0, gamma: 563 / 256 },
  rec2020: { cut: 4.5 * 0.018053968510807, slope: 4.5, a: 1.09929682680944 - 1, gamma: 1 / 0.45 },
  prophoto: { cut: 16 / 512, slope: 16, a: 0, gamma: 1.8 },
};

/** One encoded channel, 0 to 1, to linear light. */
export function decodeTrc(t: Trc, v: number): number {
  return v < t.cut ? v / t.slope : Math.pow((v + t.a) / (1 + t.a), t.gamma);
}

/**
 * The Bradford chromatic adaptation from one white to another.
 *
 * Needed for exactly one thing here: Oklab is defined on XYZ under D65, and
 * ProPhoto's XYZ are under D50. Feeding D50 numbers to a D65 formula would
 * tint every ProPhoto reading, which would look like a finding rather than
 * like the mistake it is.
 *
 * The cone matrix is Lam's, as the ICC and Lindbloom publish it.
 */
const BRADFORD: M3 = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
];

export function adaptationMatrix(from: Xy, to: Xy): number[][] {
  const s = mul3(BRADFORD, xyzOf(from));
  const d = mul3(BRADFORD, xyzOf(to));
  const diag: M3 = [
    [d[0] / s[0], 0, 0],
    [0, d[1] / s[1], 0],
    [0, 0, d[2] / s[2]],
  ];
  return mulMM(invert3(BRADFORD), mulMM(diag, BRADFORD));
}

export interface GamutMaths {
  toXyz: number[][];
  /** The same, with the result adapted to D65 - which is what Oklab wants. */
  toXyzD65: number[][];
  trc: Trc;
  luminance: { r: number; g: number; b: number };
}

const MATHS = Object.fromEntries(GAMUTS.map((g) => {
  const toXyz = rgbToXyzMatrix(g);
  const adapt = Math.hypot(g.white.x - D65_WHITE.x, g.white.y - D65_WHITE.y) > 1e-9;
  return [g.id, {
    toXyz,
    toXyzD65: adapt ? mulMM(adaptationMatrix(g.white, D65_WHITE), toXyz) : toXyz,
    trc: TRCS[g.id],
    luminance: { r: toXyz[1][0], g: toXyz[1][1], b: toXyz[1][2] },
  }];
})) as Record<GamutId, GamutMaths>;

/** Everything derived, per gamut, computed once at module load. */
export function gamutMaths(id: GamutId): GamutMaths {
  return MATHS[id];
}

/**
 * What each primary contributes to white's luminance, in that space.
 *
 * The matrix's middle row, and the reason the xyY solid is lopsided: in sRGB
 * it is 0.2126 / 0.7152 / 0.0722, so green carries ten times what blue does.
 * Every space has its own three and its own lopsidedness, so the solid's roof
 * is a different shape in each - which is content, not a detail.
 */
export function gamutLuminance(id: GamutId): { r: number; g: number; b: number } {
  return MATHS[id].luminance;
}

/** Three 8-bit encoded channels, read as values in `id`, as linear light. */
export function gamutLinear(id: GamutId, r: number, g: number, b: number): [number, number, number] {
  const t = MATHS[id].trc;
  return [decodeTrc(t, r / 255), decodeTrc(t, g / 255), decodeTrc(t, b / 255)];
}

/**
 * Where an 8-bit triple sits in CIE xyY when it is read as a colour in `id`.
 *
 * The same three numbers land somewhere different in every space, which is
 * the fact the picker cannot show you and the diagram can. Null for black
 * alone, for the reason `rgbToXyY` is null there: black is the centre of the
 * projection and has no chromaticity.
 */
export function gamutRgbToXyY(id: GamutId, r: number, g: number, b: number): XyY | null {
  const [X, Y, Z] = mul3(MATHS[id].toXyz, gamutLinear(id, r, g, b));
  const s = X + Y + Z;
  if (s <= 0) return null;
  return { x: X / s, y: Y / s, Y };
}

/** The same triple in XYZ under D65, adapted where the space's white is not. */
export function gamutRgbToXyzD65(id: GamutId, r: number, g: number, b: number): [number, number, number] {
  return mul3(MATHS[id].toXyzD65, gamutLinear(id, r, g, b));
}

/**
 * How a colour should be spelled in CSS so a wide-gamut screen shows it.
 *
 * `color(display-p3 ...)` and its siblings are rendered at full width on a
 * display that has the width, and clamped on one that does not - so on an
 * sRGB screen this is the same picture as before, and on a P3 screen the
 * colours outside the sRGB triangle are finally real. sRGB itself stays a hex
 * string, because nothing is gained by respelling it and a hex is what the
 * rest of the app speaks.
 *
 * The `color()` keyword for each space is CSS Color 4's, which is why the ids
 * here and the keywords there mostly coincide.
 */
const CSS_SPACE: Record<GamutId, string | null> = {
  srgb: null,
  p3: 'display-p3',
  a98: 'a98-rgb',
  rec2020: 'rec2020',
  prophoto: 'prophoto-rgb',
};

export function cssColorIn(id: GamutId, r: number, g: number, b: number): string {
  const space = CSS_SPACE[id];
  const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  if (!space) return `#${hex(r)}${hex(g)}${hex(b)}`;
  const f = (v: number) => (v / 255).toFixed(5);
  return `color(${space} ${f(r)} ${f(g)} ${f(b)})`;
}

/** The encode, the inverse of `decodeTrc`. Linear light to 0-1 encoded. */
export function encodeTrc(t: Trc, v: number): number {
  const cutLinear = t.cut > 0 ? t.cut / t.slope : 0;
  return v < cutLinear ? v * t.slope : (1 + t.a) * Math.pow(v, 1 / t.gamma) - t.a;
}

/**
 * The brightest colour of a chromaticity that a given space can hold, or null
 * when that space cannot hold one.
 *
 * `brightestRgbAt` in cie.ts is this for sRGB, and it stays where it is: the
 * diagram has painted its fill with that function since the page existed and
 * nothing is gained by routing it through here. This is for the other case -
 * a canvas opened in Display P3 on a screen that has Display P3, where the
 * honest fill is wider than it used to be and reaches colours an sRGB buffer
 * could only clamp.
 *
 * The method is the same one: a chromaticity names a ray out of black, so
 * take the ray at unit luminance, ask the space for it, and refuse the ones
 * that need a negative primary. Then scale until the largest channel is 1 -
 * the top of the ray, which is the only point on it worth painting.
 */
export function brightestInGamut(id: GamutId, x: number, y: number): RGB | null {
  if (y <= 0) return null;
  const inv = invert3(MATHS[id].toXyz);
  const lin = mul3(inv, [x / y, 1, (1 - x - y) / y]);
  // A hair of tolerance: a primary sits exactly on zero and arrives a float
  // either side of it. The same EPS cie.ts uses, and for the same reason.
  const EPS = -1e-9;
  if (lin[0] < EPS || lin[1] < EPS || lin[2] < EPS) return null;
  const m = Math.max(lin[0], lin[1], lin[2]);
  if (m <= 0) return null;
  const t = MATHS[id].trc;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(encodeTrc(t, v / m) * 255)));
  return { r: ch(lin[0]), g: ch(lin[1]), b: ch(lin[2]) };
}
