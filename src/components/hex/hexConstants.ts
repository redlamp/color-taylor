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
// Hex panel width including its p-3 padding on both sides (12 + 12 = 24)
export const HEX_PANEL_WIDTH = SIZE + 24;
export const CENTER_X = 260;
export const CENTER_Y = HEX_SIZE / 2;
export const RADIUS = 210;
export const BL_BAR_X = HEX_SIZE + BL_BAR_GAP;
export const BL_BAR_TOP = CENTER_Y - RADIUS;
export const BL_BAR_HEIGHT = RADIUS * 2;
export const SQRT3_2 = Math.sqrt(3) / 2;
export const PI = Math.PI;

// --- Saturation bar -------------------------------------------------------
// The horizontal mirror of the brightness bar, hung under the hexagon. Every
// constant below is a deliberate echo of a BL_* one: SAT_BAR_HEIGHT is
// BL_BAR_WIDTH, SAT_BAR_WIDTH is BL_BAR_HEIGHT, and so on. Keep them paired.

/**
 * The bar clears the circumscribed circle, not the hexagon.
 *
 * The hexagon's flat bottom edge is at RADIUS * sin(60), some 28 units higher,
 * and budgeting from there puts the track visibly against the circle - which is
 * the widest thing actually drawn down here.
 */
export const SAT_CIRCLE_BOTTOM = CENTER_Y + RADIUS;
export const SAT_ARROW_SIZE = 8;
/** Breathing room between the circle and the title above the bar. */
export const SAT_BAR_GAP = 6;
/** Band holding the axis title. The brightness title runs vertically down its
 *  bar's inboard side; horizontally that lane becomes a strip above the bar. */
export const SAT_TITLE_SPACE = 20;
export const SAT_BAR_TOP = SAT_CIRCLE_BOTTOM + SAT_BAR_GAP + SAT_TITLE_SPACE + SAT_ARROW_SIZE;
export const SAT_BAR_HEIGHT = 22;
/** Spans the hexagon corner to corner, the way the brightness bar spans its
 *  full height. 0% sits under the west corner, 100% under the east one. */
export const SAT_BAR_LEFT = CENTER_X - RADIUS;
export const SAT_BAR_WIDTH = RADIUS * 2;
/** Row under the bar, shared by the 0/50/100 labels and the value pill - the
 *  same doubling-up the brightness bar does in its right-hand gutter. */
export const SAT_LABEL_SPACE = 30;
/**
 * How far past the circumscribed circle the hue badge's centre sits.
 *
 * Bounded at both ends. Too small and the pill laps the colour field; too large
 * and at hue 270 it hangs straight down into the saturation track - at the old
 * 28 its lower edge reached SAT_BAR_TOP + 8. The pill is 28 units tall, so the
 * worst case is CENTER_Y + RADIUS + this + 14 against SAT_BAR_TOP.
 */
export const HUE_LABEL_OFFSET = 16;

/**
 * A taller viewBox, used only while the saturation bar is on.
 *
 * The 88 units of empty canvas under the hexagon are not enough once the track
 * clears the circle, and a root <svg> clips at its viewBox - so the canvas has
 * to grow rather than the crop widen. Everything that converts a user-space y
 * into a percentage takes this as `svgHeight`; HEX_SIZE alone is only correct
 * when the bar is off.
 */
export const SVG_HEIGHT_SAT = SAT_BAR_TOP + SAT_BAR_HEIGHT + SAT_LABEL_SPACE + 2;
/**
 * Units cropped off the top of the stage. 40 is what DISPLAY_HEIGHT has always
 * taken off each end, and the hue badge is known to survive it - so the new
 * room all arrives at the bottom and the framing above the hexagon is unchanged.
 */
export const STAGE_TOP_CROP = 40;
export const DISPLAY_HEIGHT_SAT = SVG_HEIGHT_SAT - STAGE_TOP_CROP;

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
