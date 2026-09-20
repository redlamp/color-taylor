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
import { oklchToRgb } from '@/utils/colorConversions';

/**
 * Top of the C axis. sRGB never reaches past about 0.37, so 0.4 leaves a
 * visible strip of unreachable track at every lightness - which is the point:
 * the limit has to have somewhere to sit.
 */
export const CHROMA_MAX = 0.4;

/**
 * The veil drawn over chroma sRGB cannot reach. Exported because the landmark
 * row on the page marks an unreachable swatch the same way the C track marks
 * unreachable track - one recipe, so the two read as the same statement.
 */
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

/** L 0..1 at the current C and H. */
export function lightnessRamp(c: number, h: number): string {
  return ramp(24, (t) => stop(t, c, h));
}

/** H 0..360 at the current L and C. */
export function hueRamp(l: number, c: number): string {
  return ramp(36, (t) => stop(l, c, t * 360));
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
export function chromaRamp(l: number, h: number, limit: number): string {
  const pct = Math.max(0, Math.min(100, (limit / CHROMA_MAX) * 100));
  const edge = `${pct.toFixed(2)}%`;
  const marker = `linear-gradient(to right, transparent calc(${edge} - 1px), var(--foreground) calc(${edge} - 1px), var(--foreground) calc(${edge} + 1px), transparent calc(${edge} + 1px))`;
  const wash = `linear-gradient(to right, transparent 0 ${edge}, ${OUT_OF_GAMUT_WASH} ${edge} 100%)`;
  return `${marker}, ${wash}, ${ramp(32, (t) => stop(l, t * CHROMA_MAX, h))}`;
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
