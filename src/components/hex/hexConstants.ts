import { hsbToRgb, hslToRgb, rgbToHsb, rgbToHsl, type RGB } from '../../utils/colorConversions';

export const HEX_SIZE = 540;
/**
 * The field's viewBox: square, and the hexagon alone.
 *
 * The bars used to be drawn inside it, which made the box a different shape in
 * each host and tied two separate controls to the hexagon's coordinate space.
 * They are laid out by the stage now (see the block below), so the field's box
 * is one constant everywhere - the 540-unit square the shader paints.
 */
export const FIELD_SIZE = HEX_SIZE;
// Visible vertical extent of the hex panel. The hex polygon is only
// RADIUS·√3 ≈ 363.7 tall inside HEX_SIZE=540, so the rest is empty SVG
// canvas. Crop the top/bottom with an overflow-hidden wrapper to make
// the panel snug; internal coords stay anchored to HEX_SIZE.
export const DISPLAY_HEIGHT = 460;

// --- Bar geometry ---------------------------------------------------------
// One set of numbers for both bars, since one component draws both: a track,
// a value arrow on its inboard side, ticks and a label gutter on the outboard
// one. HexBar reads these as its own proportions; the block after this one
// uses them only to budget the room the stage has to reserve.

/** Track thickness, across the bar. */
export const BAR_TRACK = 22;
/** Depth of the value arrow, inboard of the track. */
export const BAR_ARROW = 8;
/** Length of a tick mark, outboard of the track. */
export const BAR_TICK = 4;
/** Gutter past the vertical bar's ticks, shared by its labels and its pill. */
export const BAR_LABEL_SPACE = 40;
/** The same gutter under a horizontal bar, where the labels sit on one line. */
export const BAR_LABEL_SPACE_H = 30;
/** Band holding a horizontal bar's axis title. The vertical bar's title runs
 *  down its inboard side and needs no band of its own. */
export const BAR_TITLE_SPACE = 20;
/**
 * How far above its arrow a horizontal bar's title sits, in px.
 *
 * Px and not units because it is set at a fixed text size: the band above the
 * track is budgeted in units and the word inside it is not, which is what the
 * stacked stage has to pay for at narrow widths. HexBar places the title with
 * it; SAT_TITLE_LETTER_SPAN is the room it has to come out of.
 */
export const BAR_TITLE_LIFT = 18;

// --- Stage layout ---------------------------------------------------------
// The card's stage is one coordinate space holding three controls: the
// hexagon's field, the vertical brightness/lightness bar to its right and the
// horizontal saturation bar beneath. Only the boxes are here; what goes inside
// each bar is HexBar's.

export const BL_BAR_GAP = -20;
/** Stage width with both bars on. */
export const SIZE = HEX_SIZE + BL_BAR_GAP + BAR_TRACK + BAR_ARROW + BAR_LABEL_SPACE;
// Hex panel width plus room for its padding on both sides. The card wears
// p-2.5 now (10 + 10); the 24 dates from p-3 and the 4px spare is harmless -
// this only has to be wide enough to keep the hue badge, sized in px and
// positioned by percentage, on screen. The brightness pill clamps itself; see
// BL_PILL_OVERHANG.
export const HEX_PANEL_WIDTH = SIZE + 24;
/**
 * How far the brightness pill may hang past the stage's right edge, in px.
 *
 * The pill is fixed-size HTML at a percentage `left`, so below full width it
 * outruns the gutter drawn for it in SIZE. The card's p-2.5 is the only room
 * beyond the stage, and the pill already uses 9px of it at full width - so the
 * bound is that padding, not the stage edge, or the layout would shift where
 * it fits today. Past the bound the pill slides left onto the bar instead.
 */
export const BL_PILL_OVERHANG = 10;
export const CENTER_X = 260;
export const CENTER_Y = HEX_SIZE / 2;
export const RADIUS = 210;
/** The vertical bar's track: hard against the field's right edge, spanning the
 *  hexagon's full height. */
export const BL_BAR_X = HEX_SIZE + BL_BAR_GAP;
export const BL_BAR_TOP = CENTER_Y - RADIUS;
export const BL_BAR_SPAN = RADIUS * 2;
export const SQRT3_2 = Math.sqrt(3) / 2;
export const PI = Math.PI;

/**
 * The horizontal bar clears the circumscribed circle, not the hexagon.
 *
 * The hexagon's flat bottom edge is at RADIUS * sin(60), some 28 units higher,
 * and budgeting from there puts the track visibly against the circle - which is
 * the widest thing actually drawn down here.
 */
export const SAT_CIRCLE_BOTTOM = CENTER_Y + RADIUS;
/** Breathing room between the circle and the title above the bar. */
export const SAT_BAR_GAP = 6;
export const SAT_BAR_TOP = SAT_CIRCLE_BOTTOM + SAT_BAR_GAP + BAR_TITLE_SPACE + BAR_ARROW;
/** Spans the hexagon corner to corner, the way the brightness bar spans its
 *  full height. 0% sits under the west corner, 100% under the east one. */
export const SAT_BAR_LEFT = CENTER_X - RADIUS;
export const SAT_BAR_SPAN = RADIUS * 2;
/**
 * How far past the circumscribed circle the hue badge's centre sits.
 *
 * Bounded at both ends. Too small and the pill laps the colour field; too large
 * and at hue 270 it hangs straight down into the saturation track - at the old
 * 28 its lower edge reached SAT_BAR_TOP + 8. The pill is 28 units tall, so the
 * worst case is CENTER_Y + RADIUS + this + 14 against SAT_BAR_TOP.
 */
export const HUE_LABEL_OFFSET = 16;
/** The vertex letters' anchors, just past the hexagon's corners. ColorLabels
 *  places them; the stage budget below has to know where they end up. */
export const LETTER_OFFSET = 20;
/** Half a vertex letter's button (ColorLabels' h-6), centred on its anchor. */
export const LETTER_HALF = 12;

/**
 * A taller stage, used only while the saturation bar is on.
 *
 * The 88 units of empty canvas under the hexagon are not enough once the track
 * clears the circle, so the stage's own coordinate span grows rather than the
 * crop widening. Everything the stage places by percentage divides by this;
 * HEX_SIZE alone is only correct when the bar is off.
 */
export const STAGE_SPAN_SAT = SAT_BAR_TOP + BAR_TRACK + BAR_LABEL_SPACE_H + 2;
/**
 * Units cropped off the top of the stage: everything above the circumscribed
 * circle, whose top is CENTER_Y - RADIUS. Nothing is drawn up there, and the
 * two things that reach past it - the hue badge near 90 degrees and the
 * brightness bar's 100% pill - are HTML, positioned by percentage and not
 * clipped by the stage, so they overhang into the card's margin above it
 * instead. It was 40, the same as DISPLAY_HEIGHT takes off each end, which
 * left a 20-unit band of empty canvas between the header and the wheel at
 * every hue.
 */
export const STAGE_TOP_CROP = CENTER_Y - RADIUS;
export const DISPLAY_HEIGHT_SAT = STAGE_SPAN_SAT - STAGE_TOP_CROP;

// --- Narrow stages --------------------------------------------------------
// Two widths at which the card reflows. Both are measured rather than chosen,
// and both are of the card's *content* box - what `@container/hex` queries and
// what a ResizeObserver reports, which is 22px inside the card's own width
// here: a 1px border and 10px of padding on each side. See
// wiki/notes/plan-narrow-widths.md.

/**
 * Under this, the HSB/HSL toggle takes a row of its own.
 *
 * The header needs 210px to hold the chevron, "Hexagon" and the toggle on one
 * line; under that the title's flex item stops shrinking - a word has no
 * narrower min-content - and the toggle rides over it.
 *
 * Recorded here but spelled out again as `@max-[214px]/hex:` in ColorHexagon,
 * because Tailwind extracts candidates from source text and cannot read a
 * constant. Change one and change the other. Its variant is a strict `<`, so
 * the switch happens just under 214 rather than at it.
 */
export const HEX_TOGGLE_ROW_MAX = 214;
/**
 * At or under this, the brightness bar lies down under the saturation bar.
 *
 * The geometric break, not a layout one. It is the widest card at which the
 * standing bar is still honestly standing: below it the value pill's clamp has
 * to start dragging the handle back over its own track, and further down the
 * pill and the hue badge overlap outright at hue 0, brightness 50.
 *
 * It used to be 350, held down by the two-column layout - whose hexagon card is
 * 353.98px at an 800px viewport - so that card would not reflow. Taylor's call
 * is the other way round: the hexagon itself is what the card is for, and the
 * bar lying down is what gives it the vertical bar's gutter back, so the
 * two-column card takes the stacked layout from an 800px viewport up to about
 * 929, where it finally measures more than this.
 */
export const HEX_STACKED_BARS_MAX = 468;
/**
 * The horizontal brightness track, clear of the saturation bar's own labels.
 *
 * Same budget the saturation bar takes off the circle above it: its labels,
 * the gap, the title band and the arrow.
 */
export const BL_BAR_TOP_H = SAT_BAR_TOP + BAR_TRACK + BAR_LABEL_SPACE_H + SAT_BAR_GAP + BAR_TITLE_SPACE + BAR_ARROW;
/**
 * A horizontal bar's 0/50/100 row, in px: how far below the track it reaches.
 *
 * The buttons are text-sm with py-1, placed BAR_LABEL_INSET_H units under the
 * track less 4px of that padding - so what they occupy below it is that offset
 * plus this. Fixed text on a stage whose units shrink with the card, which is
 * why the stacked budget below is written in px against units.
 */
export const BAR_LABEL_TEXT_PX = 18;
/** Where a horizontal bar's labels start, in units, below its track. HexBar
 *  places them with it and the budget below has to subtract the same number. */
export const BAR_LABEL_INSET_H = 6;
/**
 * The units between one stacked bar's label row and the next bar's title.
 *
 * From the upper track's bottom down to the lower bar's title band: the stage's
 * own spacing, less the arrow above the lower track and the inset the labels
 * already start at.
 */
export const BAR_STACK_SPAN = BL_BAR_TOP_H - (SAT_BAR_TOP + BAR_TRACK) - (BAR_ARROW + 2) - BAR_LABEL_INSET_H;
/**
 * The px that span has to hold: the upper bar's label row, a gap, and the
 * lower bar's title riding above its arrow.
 *
 * This replaced BAR_PILL_DROP, a flat 30px added between the stacked bars and
 * again beneath them because the saturation pill hung under its track. With no
 * pills while stacked the room needed is the text's, and text is the only thing
 * down here that does not scale - so the stage adds the shortfall rather than a
 * constant, and adds nothing at all at the widest stacked card.
 */
export const BAR_STACK_TEXT_PX = BAR_LABEL_TEXT_PX + 4 + BAR_TITLE_LIFT;
/** The same question under the lowest track: the units the stage keeps past it
 *  (BAR_LABEL_SPACE_H plus the stage's 2-unit tail), less the label inset. */
export const BAR_TAIL_SPAN = BAR_LABEL_SPACE_H + 2 - BAR_LABEL_INSET_H;
/** And the px that has to hold - the label row, and 2px off the card's edge. */
export const BAR_TAIL_TEXT_PX = BAR_LABEL_TEXT_PX + 2;
/**
 * Fixed chrome between the lowest vertex letters and the saturation title.
 *
 * The B and M letters hang LETTER_HALF px below their anchors and the title
 * rides BAR_TITLE_LIFT px above its arrow. Neither scales with the card, so at
 * narrow widths the word lands across the two letters - it was 14px into them
 * at a 174px card, which is the whole title.
 */
export const SAT_TITLE_LETTER_PX = LETTER_HALF + BAR_TITLE_LIFT;
/**
 * The units that chrome has to fit into: from the two lowest letters' anchors,
 * on the 240 and 300 degree corners, down to the top of the title's band.
 *
 * Under SAT_TITLE_LETTER_PX / this many px per unit the two meet, which is
 * every width the bars stack at - so the stacked stage adds the difference in
 * px, the same shape BAR_STACK_TEXT_PX takes and for the same reason.
 */
export const SAT_TITLE_LETTER_SPAN = SAT_BAR_TOP - (BAR_ARROW + 2) - (CENTER_Y + (RADIUS + LETTER_OFFSET) * SQRT3_2);
export const STAGE_SPAN_STACKED = BL_BAR_TOP_H + BAR_TRACK + BAR_LABEL_SPACE_H + 2;
export const DISPLAY_HEIGHT_STACKED = STAGE_SPAN_STACKED - STAGE_TOP_CROP;

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

/**
 * The cross-section bound, softened toward "no bound" as the shape leaves the
 * hexagon.
 *
 * The cross-section is a fact about the cube: at brightness b the reachable
 * colors are a hexagon of radius b/100, which is why chroma and not saturation
 * is what the rim means. A circle is not that cross-section and cannot show it.
 * On a wheel the reading is the plain one everybody already has - angle is hue,
 * distance is saturation, brightness is elsewhere - so the bound opens out to
 * the full edge and every point is reachable again.
 *
 * One helper because three things have to agree at every value: the field, the
 * dashed limit it draws, and where a drag decides you clicked.
 */
export function shapeLimitScale(mode: BLMode, b: number, l: number, shapeMix: number): number {
  const cross = blLimitScale(mode, b, l);
  return 1 + (cross - 1) * shapeMix;
}

export function colorAtPoint(px: number, py: number, brightness: number, lightness = 50, mode: BLMode = 'brightness', shapeMix = 1): RGB {
  const dx = px - CENTER_X;
  const dy = py - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = shapeEdgeDist(angle, RADIUS, shapeMix);
  let h = (angle * 180) / PI;
  if (h < 0) h += 360;

  const limit = edgeDist * shapeLimitScale(mode, brightness, lightness, shapeMix);
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

/**
 * The inverse of `colorAtPoint` for a colour at its own value: where a colour
 * sits on the field if the B/L bar were already at that colour's own
 * brightness (or lightness). Used to place a colour that isn't the current
 * one - a hovered name-field match, a tag marker - honestly, rather than
 * against the full-size hexagon or the current cross-section.
 *
 * Mirrors `colorAtPoint` exactly: the saturation compared against the rim is
 * HSB s in brightness mode and HSL s in lightness mode (colorAtPoint feeds
 * the same `sIn` into `hsbToRgb`/`hslToRgb` respectively), and the rim itself
 * is scaled by the colour's own b/l through `shapeLimitScale`, not the
 * field's current value.
 */
export function pointForColor(rgb: RGB, mode: BLMode, shapeMix: number): { x: number; y: number } {
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const angle = (hsb.h * PI) / 180;
  const sIn = mode === 'brightness' ? hsb.s : hsl.s;
  const edgeDist = shapeEdgeDist(angle, RADIUS, shapeMix);
  const limitScale = shapeLimitScale(mode, hsb.b, hsl.l, shapeMix);
  const dist = (sIn / 100) * edgeDist * limitScale;
  return {
    x: CENTER_X + dist * Math.cos(angle),
    y: CENTER_Y - dist * Math.sin(angle),
  };
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
