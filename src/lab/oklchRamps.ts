/**
 * Track backgrounds for the Oklch bank on lab/oklch.html.
 *
 * These are here rather than in src/utils/sliderGradients.ts on purpose. That
 * module is shared by the picker, the plugin and the presentation, and threads
 * a `ColorSpace` through every caller; none of what follows has earned a place
 * beside them yet. The C track in particular is an open question - see the
 * page's Stop at the gamut edge switch - and the answer belongs in the shared
 * module only once it is an answer.
 */
import { oklchToRgb, oklabToOklch } from '@/utils/colorConversions';
import { cuspForHue } from '@/utils/oklchGamut';
import { okhslToRgb } from '@/utils/okhsl';

/**
 * Top of the C axis. sRGB never reaches past about 0.37, so 0.4 leaves a
 * visible strip of unreachable track at every lightness - which is the point:
 * the limit has to have somewhere to sit.
 */
export const CHROMA_MAX = 0.4;

/** The veil drawn over chroma sRGB cannot reach. Exported for the lab's legend. */
export const OUT_OF_GAMUT_WASH = 'color-mix(in oklab, var(--background) 72%, transparent)';

/** One sampled stop, as the clamped 8-bit color the screen would actually show. */
function stop(l: number, c: number, h: number): string {
  const { rgb } = oklchToRgb(l, c, h);
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

/**
 * A left-to-right ramp of `steps + 1` sampled colors. Oklch is not linear in
 * sRGB, so a two-stop gradient would be wrong everywhere between its ends; the
 * browser interpolates straight lines between whatever it is given, and enough
 * samples make those lines short enough not to lie.
 */
function ramp(steps: number, at: (t: number) => string): string {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stops.push(`${at(t)} ${(t * 100).toFixed(2)}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/** Reach of the Oklab a and b tracks either side of zero. sRGB stays inside about 0.28. */
export const OKLAB_MAX = 0.4;

/** One Oklab sample, as the clamped 8-bit color the screen would show. */
function labStop(l: number, a: number, b: number): string {
  const lch = oklabToOklch(l, a, b);
  return stop(lch.l, lch.c, lch.h);
}

/** Oklab a and b, -OKLAB_MAX..OKLAB_MAX at the current L and the other axis. */
export function oklabAColors(l: number, b: number): string {
  return ramp(32, (t) => labStop(l, (t * 2 - 1) * OKLAB_MAX, b));
}
export function oklabBColors(l: number, a: number): string {
  return ramp(32, (t) => labStop(l, a, (t * 2 - 1) * OKLAB_MAX));
}

/** One OkHSL sample, as the clamped 8-bit color the screen would show. s and l in 0..1. */
function okhslStop(h: number, s: number, l: number): string {
  const { rgb } = okhslToRgb(h, s, l);
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

/** OkHSL h, s and l across their tracks at the other two. */
export function okhslHueColors(s: number, l: number): string {
  return ramp(36, (t) => okhslStop(t * 360, s, l));
}
export function okhslSatColors(h: number, l: number): string {
  return ramp(32, (t) => okhslStop(h, t, l));
}
export function okhslLightColors(h: number, s: number): string {
  return ramp(32, (t) => okhslStop(h, s, t));
}
/** The channels alone: hue at full saturation and a mid lightness, s at that lightness, l at full saturation. */
export function okhslHueSourceColors(): string {
  return okhslHueColors(1, 0.7);
}
export function okhslSatSourceColors(h: number): string {
  return okhslSatColors(h, 0.7);
}
export function okhslLightSourceColors(h: number): string {
  return okhslLightColors(h, 1);
}

/** The bare color ramps, for a readout that wants the colors and none of the marks. */
export function lightnessColors(c: number, h: number): string {
  return ramp(24, (t) => stop(t, c, h));
}
export function chromaColors(l: number, h: number): string {
  return ramp(32, (t) => stop(l, t * CHROMA_MAX, h));
}
export function hueColors(l: number, c: number): string {
  return ramp(36, (t) => stop(l, c, t * 360));
}

/**
 * The source ramps: each channel on its own, the way the picker's Source
 * Colors draws R, G and B from black to the pure channel. L is the neutral
 * axis, C is this hue at the lightness where it is most vivid (its cusp), and
 * H is every hue at its own cusp - the most vivid color each hue has.
 */
export function lightnessSourceColors(): string {
  return ramp(24, (t) => stop(t, 0, 0));
}
export function chromaSourceColors(h: number): string {
  return chromaColors(cuspForHue(h).l, h);
}
/** The axes alone: a mid lightness and the other axis at zero. */
export function oklabASourceColors(): string {
  return oklabAColors(0.7, 0);
}
export function oklabBSourceColors(): string {
  return oklabBColors(0.7, 0);
}
export function hueSourceColors(): string {
  return ramp(36, (t) => {
    const h = t * 360;
    const cusp = cuspForHue(h);
    return stop(cusp.l, cusp.c, h);
  });
}

/** Red for a bound that is the lowest of the maximums, blue for the highest of the minimums. */
export const CEILING_INK = '#e74c4c';
export const FLOOR_INK = '#3385ff';

/** A 2px hairline across the track at a fraction of its length, as one gradient layer. */
export function hairline(fraction: number, ink: string): string {
  const at = `${(Math.max(0, Math.min(1, fraction)) * 100).toFixed(2)}%`;
  return `linear-gradient(to right, transparent calc(${at} - 1px), ${ink} calc(${at} - 1px), ${ink} calc(${at} + 1px), transparent calc(${at} + 1px))`;
}

/**
 * L 0..1 at the current C and H, with the band every hue can hold at this C
 * marked: a blue hairline at its floor and a red one at its ceiling. Between
 * them a hue sweep at this C stays in sRGB. No lines when there is no such
 * band - `lightnessBoundsAtC` reports that as NaN.
 */
export function lightnessRamp(c: number, h: number, bounds: { floor: number; ceiling: number }): string {
  const layers = [lightnessColors(c, h)];
  if (Number.isFinite(bounds.floor) && Number.isFinite(bounds.ceiling) && bounds.floor <= bounds.ceiling) {
    layers.unshift(hairline(bounds.ceiling, CEILING_INK), hairline(bounds.floor, FLOOR_INK));
  }
  return layers.join(', ');
}

/**
 * H 0..360 at the current L and C, with the hues sRGB cannot hold at this L
 * and C under the same wash the C track uses. `spans` are the valid hues as
 * `validHueSpans` returns them, so the wash is their complement; a span past
 * 360 wraps.
 */
export function hueRamp(l: number, c: number, spans: ReadonlyArray<readonly [number, number]>): string {
  const wash = hueWash(spans);
  const colors = hueColors(l, c);
  return wash ? `${wash}, ${colors}` : colors;
}

/**
 * The wash layer alone, for a hue track whose colors come from elsewhere.
 * Null when every hue is in gamut and there is nothing to wash.
 */
export function hueWash(spans: ReadonlyArray<readonly [number, number]>): string | null {
  if (spans.length === 1 && spans[0][0] === 0 && spans[0][1] === 360) return null;
  const pct = (deg: number) => `${((deg / 360) * 100).toFixed(2)}%`;
  // Hard stops: wash everywhere, cut clear over each valid span.
  const edges: Array<[number, number]> = spans
    .flatMap(([a, b]): Array<[number, number]> => (b <= 360 ? [[a, b]] : [[a, 360], [0, b - 360]]))
    .sort((x, y) => x[0] - y[0]);
  const stops: string[] = [];
  let cursor = 0;
  for (const [a, b] of edges) {
    if (a > cursor) stops.push(`${OUT_OF_GAMUT_WASH} ${pct(cursor)} ${pct(a)}`);
    stops.push(`transparent ${pct(a)} ${pct(b)}`);
    cursor = b;
  }
  if (cursor < 360) stops.push(`${OUT_OF_GAMUT_WASH} ${pct(cursor)} 100%`);
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/**
 * Where sRGB ends along one Oklab axis, holding L and the other axis: the
 * in-gamut run as a fraction of the -OKLAB_MAX..OKLAB_MAX track, or null when
 * no value on the axis is in gamut. Sampled at 1/400 of the track. The run is
 * taken as one span - the gamut is convex enough along a straight line through
 * it for that to hold at any L the picker reaches.
 */
export function oklabAxisRange(l: number, other: number, axis: 'a' | 'b'): { from: number; to: number } | null {
  const N = 400;
  let from = -1;
  let to = -1;
  for (let i = 0; i <= N; i++) {
    const v = (i / N) * 2 * OKLAB_MAX - OKLAB_MAX;
    const lch = axis === 'a' ? oklabToOklch(l, v, other) : oklabToOklch(l, other, v);
    if (oklchToRgb(lch.l, lch.c, lch.h).inGamut) {
      if (from < 0) from = i / N;
      to = i / N;
    }
  }
  return from < 0 ? null : { from, to };
}

/** Wash and white edge lines for an Oklab axis track, as layers to put over its colors. */
export function oklabAxisMarks(range: { from: number; to: number } | null): string[] {
  if (!range) return [`linear-gradient(to right, ${OUT_OF_GAMUT_WASH}, ${OUT_OF_GAMUT_WASH})`];
  const a = `${(range.from * 100).toFixed(2)}%`;
  const b = `${(range.to * 100).toFixed(2)}%`;
  return [
    hairline(range.from, 'var(--foreground)'),
    hairline(range.to, 'var(--foreground)'),
    `linear-gradient(to right, ${OUT_OF_GAMUT_WASH} 0 ${a}, transparent ${a} ${b}, ${OUT_OF_GAMUT_WASH} ${b} 100%)`,
  ];
}

/**
 * C 0..CHROMA_MAX at the current L and H, drawn honestly: the color ramp
 * underneath, a wash over the span sRGB cannot reach, and a hairline exactly
 * where the gamut ends.
 *
 * Three background layers in one string, painted last-first, because
 * ColorSlider takes a single `gradient`. The wash is flat rather than hatched:
 * a hatch is a repeating gradient, and limiting one to start at a percentage
 * needs a mask, which needs an element of its own.
 *
 * Past the limit the ramp is flat anyway - every color out there clamps to
 * the same 8-bit value - so without the wash the track simply looks like it
 * has stopped meaning anything, which is true but says nothing about why.
 */
export function chromaRamp(l: number, h: number, hueEdge: number, limit: number, safe: number): string {
  // The white marker is this hue's gamut edge, always. The wash begins where
  // the bank stops, which under Safe zone is the shared edge instead.
  const marker = hairline(hueEdge / CHROMA_MAX, 'var(--foreground)');
  const pct = Math.max(0, Math.min(100, (limit / CHROMA_MAX) * 100));
  const edge = `${pct.toFixed(2)}%`;
  const wash = `linear-gradient(to right, transparent 0 ${edge}, ${OUT_OF_GAMUT_WASH} ${edge} 100%)`;
  // The C every hue holds at this L: the Chroma graph's lowest valley, red
  // because it is the lowest of the maximums.
  const ceiling = hairline(safe / CHROMA_MAX, CEILING_INK);
  return `${marker}, ${ceiling}, ${wash}, ${chromaColors(l, h)}`;
}

/**
 * S 0..100 at the current L and H: the same color ramp as the C track, but
 * ending where the gamut does rather than where the number does.
 *
 * One layer, not three. There is no wash and no hairline because there is
 * nothing left to mark - the far end of the track *is* the cusp, at every L and
 * H, so the whole track means something.
 *
 * That also puts the relative model's price in the track itself, before any
 * readout says it: the two tracks are the same width, but at cyan the right end
 * is a flat teal and at magenta it is a vivid pink. Same 100%, different
 * amounts of color.
 */
export function saturationRamp(l: number, h: number, limit: number): string {
  return ramp(32, (t) => stop(l, t * limit, h));
}
