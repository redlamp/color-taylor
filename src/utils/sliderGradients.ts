import { hsbToRgb, hslToRgb, linearToSrgb } from './colorConversions';

export type ColorSpace = 'srgb' | 'linear';

function rgb(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

/** Convert HSB to display RGB, applying linear→sRGB if in linear color space */
function hsbToDisplay(h: number, s: number, b: number, colorSpace: ColorSpace) {
  if (colorSpace === 'linear') {
    const sNorm = s / 100;
    const bNorm = b / 100;
    const c = bNorm * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = bNorm - c;
    let r1: number, g1: number, b1: number;
    if (h < 60) { [r1, g1, b1] = [c, x, 0]; }
    else if (h < 120) { [r1, g1, b1] = [x, c, 0]; }
    else if (h < 180) { [r1, g1, b1] = [0, c, x]; }
    else if (h < 240) { [r1, g1, b1] = [0, x, c]; }
    else if (h < 300) { [r1, g1, b1] = [x, 0, c]; }
    else { [r1, g1, b1] = [c, 0, x]; }
    return { r: linearToSrgb(r1 + m), g: linearToSrgb(g1 + m), b: linearToSrgb(b1 + m) };
  }
  return hsbToRgb(h, s, b);
}

/** Hue slider: varies H 0-360, keeps current S and B */
export function hueGradient(s: number, b: number, colorSpace: ColorSpace): string {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hsbToDisplay(h, s, b, colorSpace);
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** Saturation slider: varies S 0-100, keeps current H and B */
export function saturationGradient(h: number, b: number, colorSpace: ColorSpace): string {
  const low = hsbToDisplay(h, 0, b, colorSpace);
  const high = hsbToDisplay(h, 100, b, colorSpace);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** Brightness slider: varies B 0-100, keeps current H and S */
export function brightnessGradient(h: number, s: number, colorSpace: ColorSpace): string {
  const low = hsbToDisplay(h, s, 0, colorSpace);
  const high = hsbToDisplay(h, s, 100, colorSpace);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** Red slider: varies R 0-255, keeps current G and B */
export function redGradient(g: number, b: number): string {
  return `linear-gradient(to right, ${rgb(0, g, b)}, ${rgb(255, g, b)})`;
}

/** Green slider: varies G 0-255, keeps current R and B */
export function greenGradient(r: number, b: number): string {
  return `linear-gradient(to right, ${rgb(r, 0, b)}, ${rgb(r, 255, b)})`;
}

/** Blue slider: varies B 0-255, keeps current R and G */
export function blueGradient(r: number, g: number): string {
  return `linear-gradient(to right, ${rgb(r, g, 0)}, ${rgb(r, g, 255)})`;
}

export const redChannelGradient = 'linear-gradient(to right, #000, #f00)';
export const greenChannelGradient = 'linear-gradient(to right, #000, #0f0)';
export const blueChannelGradient = 'linear-gradient(to right, #000, #00f)';

/** HSL Hue slider: varies H 0-360, keeps current S and L */
export function hslHueGradient(s: number, l: number, colorSpace: ColorSpace): string {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hslToRgb(h, s, l);
    if (colorSpace === 'linear') {
      return `${rgb(linearToSrgb(c.r / 255), linearToSrgb(c.g / 255), linearToSrgb(c.b / 255))} ${(h / 360) * 100}%`;
    }
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** HSL Saturation slider: varies S 0-100, keeps current H and L */
export function hslSaturationGradient(h: number, l: number, colorSpace: ColorSpace): string {
  const low = hslToRgb(h, 0, l);
  const high = hslToRgb(h, 100, l);
  if (colorSpace === 'linear') {
    return `linear-gradient(to right, ${rgb(linearToSrgb(low.r / 255), linearToSrgb(low.g / 255), linearToSrgb(low.b / 255))}, ${rgb(linearToSrgb(high.r / 255), linearToSrgb(high.g / 255), linearToSrgb(high.b / 255))})`;
  }
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** HSL Lightness slider: varies L 0-100, keeps current H and S */
export function lightnessGradient(h: number, s: number, colorSpace: ColorSpace): string {
  const stops = [0, 50, 100];
  const colors = stops.map((l) => {
    const c = hslToRgb(h, s, l);
    if (colorSpace === 'linear') {
      return `${rgb(linearToSrgb(c.r / 255), linearToSrgb(c.g / 255), linearToSrgb(c.b / 255))} ${l}%`;
    }
    return `${rgb(c.r, c.g, c.b)} ${l}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/**
 * Small checks, sized for a swatch rather than a full-width track.
 *
 * Positioned at calc(50%% + 4px) rather than 0. A percentage aligns that point
 * of the tile with the same point of the box, so plain 50%% would center a tile
 * on the split and leave the boundary cutting a check in half; half a tile of
 * offset puts a tile edge exactly there instead.
 */
export const SWATCH_CHECKER =
  'repeating-conic-gradient(rgba(128,128,128,.45) 0% 25%, transparent 0% 50%) calc(50% + 4px) 0/8px 8px';

/**
 * Figma's split swatch: the left half is the color flat, the right half is
 * the same color at its alpha over a checkerboard. One chip then answers both
 * "what color is it" and "how transparent is it", which a flat chip cannot -
 * a half-transparent color over a dark panel just reads as a darker color.
 *
 * A fully opaque color gets a plain fill. Splitting a chip whose halves are
 * identical is noise.
 */
export function swatchBackground(hex: string, alpha: number): string {
  if (alpha >= 100) return hex;
  const n = parseInt(hex.slice(1), 16);
  const rgba = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha / 100})`;
  // border-box on each layer, carried inside the shorthand where nothing can
  // reset it. background-origin defaults to padding-box while background-clip
  // defaults to border-box, and a selected chip has a 2px transparent border -
  // that mismatch made both layers tile, so the wrapped edge of the
  // transparent half showed as checks running down the left side.
  return `linear-gradient(to right, ${hex} 50%, ${rgba} 50%) border-box, ${SWATCH_CHECKER} border-box`;
}
