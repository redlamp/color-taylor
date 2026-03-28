import { hsbToRgb } from '../../utils/colorConversions';

export const HEX_SIZE = 640;
export const BL_BAR_WIDTH = 24;
export const BL_BAR_GAP = 6;
export const BL_ARROW_SIZE = 8;
export const BL_LABEL_SPACE = 30;
export const SIZE = HEX_SIZE + BL_BAR_GAP + BL_BAR_WIDTH + BL_ARROW_SIZE + BL_LABEL_SPACE;
export const CENTER = HEX_SIZE / 2;
export const RADIUS = 250;
export const BL_BAR_X = HEX_SIZE + BL_BAR_GAP;
export const BL_BAR_TOP = CENTER - RADIUS;
export const BL_BAR_HEIGHT = RADIUS * 2;
export const SQRT3_2 = Math.sqrt(3) / 2;
export const PI = Math.PI;

export const DIRS = {
  r: { x: 1, y: 0 },
  g: { x: -0.5, y: -SQRT3_2 },
  b: { x: -0.5, y: SQRT3_2 },
};

export function hexEdgeDist(angle, r) {
  let a = ((angle % (2 * PI)) + 2 * PI) % (2 * PI);
  const sectorAngle = a % (PI / 3);
  return (r * SQRT3_2) / Math.cos(sectorAngle - PI / 6);
}

export function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * (PI / 3);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  }).join(' ');
}

export function colorAtPoint(px, py, brightness) {
  const dx = px - CENTER;
  const dy = py - CENTER;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = hexEdgeDist(angle, RADIUS);
  let h = (angle * 180) / PI;
  if (h < 0) h += 360;
  const s = Math.min((dist / edgeDist) * 100, 100);
  return hsbToRgb(h, s, brightness);
}

export function getOrder(mode, rgb) {
  const channels = [
    { key: 'r', value: rgb.r },
    { key: 'g', value: rgb.g },
    { key: 'b', value: rgb.b },
  ];
  if (mode === 'asc') {
    return channels.sort((a, b) => a.value - b.value).map((c) => c.key);
  }
  if (mode === 'desc') {
    return channels.sort((a, b) => b.value - a.value).map((c) => c.key);
  }
  return ['r', 'g', 'b'];
}
