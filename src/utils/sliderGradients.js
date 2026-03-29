import { hsbToRgb, hslToRgb, rgbToHex, linearToSrgb } from './colorConversions';

function rgb(r, g, b) {
  return `rgb(${r},${g},${b})`;
}

/** Convert HSB to display RGB, applying linear→sRGB if in linear color space */
function hsbToDisplay(h, s, b, colorSpace) {
  if (colorSpace === 'linear') {
    const sNorm = s / 100;
    const bNorm = b / 100;
    const c = bNorm * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = bNorm - c;
    let r1, g1, b1;
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
export function hueGradient(s, b, colorSpace) {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hsbToDisplay(h, s, b, colorSpace);
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** Saturation slider: varies S 0-100, keeps current H and B */
export function saturationGradient(h, b, colorSpace) {
  const low = hsbToDisplay(h, 0, b, colorSpace);
  const high = hsbToDisplay(h, 100, b, colorSpace);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** Brightness slider: varies B 0-100, keeps current H and S */
export function brightnessGradient(h, s, colorSpace) {
  const low = hsbToDisplay(h, s, 0, colorSpace);
  const high = hsbToDisplay(h, s, 100, colorSpace);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** Red slider: varies R 0-255, keeps current G and B */
export function redGradient(g, b) {
  return `linear-gradient(to right, ${rgb(0, g, b)}, ${rgb(255, g, b)})`;
}

/** Green slider: varies G 0-255, keeps current R and B */
export function greenGradient(r, b) {
  return `linear-gradient(to right, ${rgb(r, 0, b)}, ${rgb(r, 255, b)})`;
}

/** Blue slider: varies B 0-255, keeps current R and G */
export function blueGradient(r, g) {
  return `linear-gradient(to right, ${rgb(r, g, 0)}, ${rgb(r, g, 255)})`;
}

/** Pure channel gradients (black to full channel color) */
export const redChannelGradient = 'linear-gradient(to right, #000, #f00)';
export const greenChannelGradient = 'linear-gradient(to right, #000, #0f0)';
export const blueChannelGradient = 'linear-gradient(to right, #000, #00f)';

/** HSL Hue slider: varies H 0-360, keeps current S and L */
export function hslHueGradient(s, l, colorSpace) {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hslToRgb(h, s, l);
    if (colorSpace === 'linear') {
      return `${rgb(linearToSrgb(c.r/255), linearToSrgb(c.g/255), linearToSrgb(c.b/255))} ${(h / 360) * 100}%`;
    }
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** HSL Saturation slider: varies S 0-100, keeps current H and L */
export function hslSaturationGradient(h, l, colorSpace) {
  const low = hslToRgb(h, 0, l);
  const high = hslToRgb(h, 100, l);
  if (colorSpace === 'linear') {
    return `linear-gradient(to right, ${rgb(linearToSrgb(low.r/255), linearToSrgb(low.g/255), linearToSrgb(low.b/255))}, ${rgb(linearToSrgb(high.r/255), linearToSrgb(high.g/255), linearToSrgb(high.b/255))})`;
  }
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** HSL Lightness slider: varies L 0-100, keeps current H and S */
export function lightnessGradient(h, s, colorSpace) {
  const stops = [0, 50, 100];
  const colors = stops.map((l) => {
    const c = hslToRgb(h, s, l);
    if (colorSpace === 'linear') {
      return `${rgb(linearToSrgb(c.r/255), linearToSrgb(c.g/255), linearToSrgb(c.b/255))} ${l}%`;
    }
    return `${rgb(c.r, c.g, c.b)} ${l}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}
