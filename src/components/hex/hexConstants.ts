import { hsbToRgb, hslToRgb, type RGB } from '../../utils/colorConversions';

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

/**
 * A pointer resting on a track, before it is known to be a drag.
 *
 * Both bars and the hexagon itself need this: a press has to wait out
 * `dragTriggerDistance` before it counts as a drag, so that a tap can still
 * tween instead. Declared once here because the two bars took it as a prop and
 * had spelled the shape out inline, separately.
 */
export interface PointerDownState {
  clientX: number;
  clientY: number;
  time: number;
  isDragging: boolean;
}

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

/**
 * The edge distance of a shape between a circle and the hexagon.
 *
 * `mix` 0 is a circle of radius r, 1 is the hexagon inscribed in it, and
 * anything between is the two lerped. That single line is the whole morph: the
 * field, the outline, the brightness cross-section and the pointer mapping all
 * ask the same question - how far is the edge at this angle - so interpolating
 * the answer moves every one of them together and keeps them consistent at
 * every frame, which a clip-path over the top could not.
 */
export function shapeEdgeDist(angle: number, r: number, mix: number): number {
  if (mix >= 1) return hexEdgeDist(angle, r);
  const hex = hexEdgeDist(angle, r);
  return r + (hex - r) * mix;
}

/**
 * The outline as a polygon, sampled finely enough that mix=0 reads as a circle.
 *
 * 72 points puts a vertex every 5 degrees; the hexagon's corners land exactly on
 * multiples of 60, so the shape is still sharp at mix=1 rather than nearly so.
 */
export function shapePoints(cx: number, cy: number, r: number, mix: number, n = 72): string {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * PI;
    const d = shapeEdgeDist(a, r, mix);
    return `${cx + d * Math.cos(a)},${cy - d * Math.sin(a)}`;
  }).join(' ');
}

export function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * (PI / 3);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  }).join(' ');
}

/**
 * The colour the field shows at a pixel - the CPU twin of the fragment shader.
 *
 * Radius is chroma: at `brightness` the reachable colours are the cube's
 * cross-section, a hexagon of radius brightness/100, and saturation is measured
 * against *that* edge. Beyond it the field is previewing what raising
 * brightness would reach, so the colour there is full saturation at whatever
 * brightness the reach implies. Keep this in step with hexShader.ts and with
 * HexCanvas's buildField - all three describe the same surface.
 */
export type BLMode = 'brightness' | 'lightness';

/**
 * How much of the hexagon is reachable at the current value on the B/L bar.
 *
 * Under HSB that is `b/100`. Under HSL the cross-section is widest at L=50 and
 * tapers to nothing at either end, which is a different number for anything
 * less than fully saturated. Everything that draws or hit-tests the
 * cross-section reads the bound from here.
 */
export function blLimitScale(mode: BLMode, b: number, l: number): number {
  return mode === 'brightness' ? b / 100 : 1 - Math.abs(2 * (l / 100) - 1);
}

export function colorAtPoint(px: number, py: number, brightness: number, lightness = 50, mode: BLMode = 'brightness', shapeMix = 1): RGB {
  const dx = px - CENTER_X;
  const dy = py - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = shapeEdgeDist(angle, RADIUS, shapeMix);
  let h = (angle * 180) / PI;
  if (h < 0) h += 360;

  const limit = edgeDist * blLimitScale(mode, brightness, lightness);
  const sIn = limit > 0 ? Math.min((dist / limit) * 100, 100) : 0;
  const r = dist / edgeDist;

  if (mode === 'brightness') {
    return dist <= limit
      ? hsbToRgb(h, sIn, brightness)
      : hsbToRgb(h, 100, Math.min(100, r * 100));
  }
  // Expanding under HSL runs L toward 50, the direction the cross-section
  // widens in - up from the dark half, down from the light one.
  const rPinned = Math.min(1, r);
  const lOut = lightness <= 50 ? rPinned * 50 : 100 - rPinned * 50;
  return dist <= limit ? hslToRgb(h, sIn, lightness) : hslToRgb(h, 100, lOut);
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
