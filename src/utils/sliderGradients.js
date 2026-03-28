import { hsbToRgb, hslToRgb, rgbToHex } from './colorConversions';

function rgb(r, g, b) {
  return `rgb(${r},${g},${b})`;
}

/** Hue slider: varies H 0-360, keeps current S and B */
export function hueGradient(s, b) {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hsbToRgb(h, s, b);
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** Saturation slider: varies S 0-100, keeps current H and B */
export function saturationGradient(h, b) {
  const low = hsbToRgb(h, 0, b);
  const high = hsbToRgb(h, 100, b);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** Brightness slider: varies B 0-100, keeps current H and S */
export function brightnessGradient(h, s) {
  const low = hsbToRgb(h, s, 0);
  const high = hsbToRgb(h, s, 100);
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

/** HSL Hue slider: varies H 0-360, keeps current S and L */
export function hslHueGradient(s, l) {
  const stops = [0, 60, 120, 180, 240, 300, 360];
  const colors = stops.map((h) => {
    const c = hslToRgb(h, s, l);
    return `${rgb(c.r, c.g, c.b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/** HSL Saturation slider: varies S 0-100, keeps current H and L */
export function hslSaturationGradient(h, l) {
  const low = hslToRgb(h, 0, l);
  const high = hslToRgb(h, 100, l);
  return `linear-gradient(to right, ${rgb(low.r, low.g, low.b)}, ${rgb(high.r, high.g, high.b)})`;
}

/** HSL Lightness slider: varies L 0-100, keeps current H and S */
export function lightnessGradient(h, s) {
  const stops = [0, 50, 100];
  const colors = stops.map((l) => {
    const c = hslToRgb(h, s, l);
    return `${rgb(c.r, c.g, c.b)} ${l}%`;
  });
  return `linear-gradient(to right, ${colors.join(', ')})`;
}
