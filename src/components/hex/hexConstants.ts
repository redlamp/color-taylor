import { hsbToRgb, type RGB } from '../../utils/colorConversions';

export const HEX_SIZE = 540;
// Visible vertical extent of the hex panel. The hex polygon is only
// RADIUS·√3 ≈ 363.7 tall inside HEX_SIZE=540, so the rest is empty SVG
// canvas. Crop the top/bottom with an overflow-hidden wrapper to make
// the panel snug; internal coords stay anchored to HEX_SIZE.
export const DISPLAY_HEIGHT = 460;
export const BL_BAR_WIDTH = 22;
export const BL_BAR_GAP = -20;
export const BL_ARROW_SIZE = 8;
export const BL_LABEL_SPACE = 40;
export const SIZE = HEX_SIZE + BL_BAR_GAP + BL_BAR_WIDTH + BL_ARROW_SIZE + BL_LABEL_SPACE;
export const CENTER_X = 260;
export const CENTER_Y = HEX_SIZE / 2;
export const RADIUS = 210;
export const BL_BAR_X = HEX_SIZE + BL_BAR_GAP;
export const BL_BAR_TOP = CENTER_Y - RADIUS;
export const BL_BAR_HEIGHT = RADIUS * 2;
export const SQRT3_2 = Math.sqrt(3) / 2;
export const PI = Math.PI;

export type Channel = 'r' | 'g' | 'b';
export type ChannelOrder = 'asc' | 'desc' | 'rgb';

export const DIRS: Record<Channel, { x: number; y: number }> = {
  r: { x: 1, y: 0 },
  g: { x: -0.5, y: -SQRT3_2 },
  b: { x: -0.5, y: SQRT3_2 },
};

export function hexEdgeDist(angle: number, r: number): number {
  const a = ((angle % (2 * PI)) + 2 * PI) % (2 * PI);
  const sectorAngle = a % (PI / 3);
  return (r * SQRT3_2) / Math.cos(sectorAngle - PI / 6);
}

export function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * (PI / 3);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  }).join(' ');
}

export function colorAtPoint(px: number, py: number, brightness: number): RGB {
  const dx = px - CENTER_X;
  const dy = py - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = hexEdgeDist(angle, RADIUS);
  let h = (angle * 180) / PI;
  if (h < 0) h += 360;
  const s = Math.min((dist / edgeDist) * 100, 100);
  return hsbToRgb(h, s, brightness);
}

export function getOrder(mode: ChannelOrder, rgb: RGB): Channel[] {
  const channels: { key: Channel; value: number }[] = [
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
