import { useRef, useEffect, useCallback, useLayoutEffect, useState, useMemo, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, hexToRgb, rgbToHsl, hslToRgb, lighter, type RGB, type HSB, type HSL } from '../utils/colorConversions';
import { type ColorSpace } from '../utils/sliderGradients';
import { buildChain } from './hex/chain';
import { hsbFromField } from './hex/pointer';
import type { Channel, ChannelOrder, PointerDownState } from './hex/hexConstants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ChevronRight } from 'lucide-react';
import { COLLAPSE_MS } from './CollapsibleSection';
import NAMED_COLORS from '../utils/namedColors';
import { HANDLE, ringRadius } from '../utils/handleStyle';
import { HSB_TWEEN_MS } from '../utils/colorTween';
import { DEMO_OPEN, DEMO_RESTORE, HEXAGON_SECTION, addressedTo } from '../utils/demoSections';
import { toneController } from '../utils/toneControllerLazy';
import {
  HEX_SIZE, SIZE, HEX_PANEL_WIDTH, CENTER_X, CENTER_Y, RADIUS, PI, DIRS, DISPLAY_HEIGHT,
  BL_BAR_X, BL_BAR_TOP, BL_BAR_HEIGHT, BL_ARROW_SIZE,
  SAT_BAR_LEFT, SAT_BAR_WIDTH, DISPLAY_HEIGHT_SAT, SVG_HEIGHT_SAT,
  HUE_LABEL_OFFSET,
  hexEdgeDist, shapePoints, colorAtPoint, getOrder, shapeLimitScale,
} from './hex/hexConstants';
import HexCanvas from './hex/HexCanvas';
import BrightnessBar from './hex/BrightnessBar';
import ColorLabels from './hex/ColorLabels';
import HueHandle from './hex/HueHandle';
import { HIGHLIGHT_IN, HIGHLIGHT_OUT, CALLOUT_LINE } from '../utils/highlight';
import BrightnessHandle from './hex/BrightnessHandle';
import BrightnessMarkers from './hex/BrightnessMarkers';
import SaturationBar from './hex/SaturationBar';
import SaturationHandle from './hex/SaturationHandle';
import SaturationMarkers from './hex/SaturationMarkers';

/** The three channel vectors, at full strength. Stems and handle borders share
 *  these so the two can never drift apart. */
const CHANNEL_COLOR: Record<'r' | 'g' | 'b', string> = {
  r: '#ff0000',
  g: '#00ff00',
  b: '#0000ff',
};

/**
 * The two callout lines that tie a slider to the hexagon.
 *
 * White rather than the grey the limit hexagon wears. These only exist while a
 * slider is being dragged, so they are a transient pointer and have to read at
 * a glance - and they cross the colour field, which can be any hue at any
 * brightness, so no single flat colour has contrast everywhere. The shadow is
 * what carries them over the pale end: white on full-brightness yellow is
 * nearly invisible without it.
 *
 * Shared rather than repeated at all three callsites - the brightness line is
 * drawn twice, once against the bar and once for hosts that put brightness on
 * their own slider, and the three drifted apart the first time they were
 * written out by hand.
 */
/**
 * How the two shapes each slider explains look at rest.
 *
 * Dragging a slider swaps them for CALLOUT_LINE, so the shape the connector
 * points at picks up the connector's own colour. Spreading a whole object
 * rather than branching per attribute keeps `style` out of the resting case -
 * an omitted prop clears the filter, a `style: undefined` would not read as
 * clearly.
 */

/**
 * Where each stem's channel tooltip sits: a fixed side per channel, at a
 * fixed gap from the stem's midpoint, never flipped. Red below, green to the
 * north-east, blue to the north-west - each the side away from the rest of
 * the chain in the default order, and a fixed side rather than a computed one
 * because a tooltip that changes sides as the chain moves is harder to read
 * than one that leaves the hexagon.
 */
const TIP_SIDE: Record<Channel, { x: number; y: number }> = {
  r: { x: 0, y: 1 },
  g: { x: Math.sqrt(3) / 2, y: -0.5 },
  b: { x: -Math.sqrt(3) / 2, y: -0.5 },
};
const TIP_GAP = 28;
const TIP_LABEL: Record<Channel, string> = { r: 'RED', g: 'GREEN', b: 'BLUE' };
/**
 * The tooltip's fill: Tailwind's 600 step of each hue (red-600, green-600,
 * blue-600), the lightest step Tailwind itself puts white text on. Dial the
 * intensity by moving all three to another step together - 500 is brighter,
 * 700 deeper - rather than by nudging one. Slightly open, so the stem it
 * labels shows through the edge of the pill.
 */
const TIP_FILL: Record<Channel, string> = { r: '#e7000b', g: '#00a63e', b: '#155dfc' };
const TIP_FILL_OPACITY = 0.9;

const QUIET_LIMIT_HEX = {
  stroke: 'rgba(128,128,128,0.5)',
  strokeLinecap: 'round' as const,
};
const QUIET_HUE_LINE = {
  stroke: 'rgba(255,255,255,0.5)',
  strokeLinecap: 'round' as const,
};

interface ColorHexagonProps {
  rgb: RGB;
  hue: number;
  brightness: number;
  saturation: number;
  hsl: HSL;
  onHueChange: (h: number) => void;
  onRgbChange: (channel: 'r' | 'g' | 'b', value: number) => void;
  onHsbChange: (newHsb: Partial<HSB>) => void;
  onHslChange: (channel: 'h' | 's' | 'l', value: number) => void;
  onAnimateToHsb?: (target: HSB) => void;
  blMode: 'brightness' | 'lightness';
  onBlModeChange: (mode: 'brightness' | 'lightness') => void;
  colorSpace: ColorSpace;
  onColorSpaceChange?: (cs: ColorSpace) => void;
  hoverMatchRgb?: RGB | null;
  showHtmlOnHex?: boolean;
  onHoverHtmlColor?: (marker: HoveredMarker | null) => void;
  /** Drop the card border and "Hexagon" title: the host already frames it. */
  bare?: boolean;
  /** Content for the header slot the title vacates in `bare` mode. */
  headerLeft?: ReactNode;
  /** Extra controls rendered directly under the hexagon. */
  belowStage?: ReactNode;
  /**
   * A colour the user chose outright - a vertex letter, a bar marker, an HTML
   * colour on the field - which should join Recent at once rather than after
   * the settle delay. The host owns the swatch library (see SwatchLibrary) and
   * hands its addToRecent in here; a host without one leaves it out.
   */
  onRecordColor?: (hex: string) => void;
  /**
   * Channels whose stem and joint light as "changing", from the host's
   * useImpact: every channel whose value moved plus every channel the held
   * stem or joint drives. Empty or absent draws nothing.
   */
  impactChannels?: ReadonlySet<Channel>;
  /** Hue is moving from a control that is not the badge. */
  hueBadgeLit?: boolean;
  /** A saturation slider is held, so the hue line fills like the sat bar does. */
  hueFillLit?: boolean;
  /** Another control is moving the brightness / lightness bar's value. */
  blBarLit?: boolean;
  /** Another control is moving the saturation bar's value. */
  satBarLit?: boolean;
  /**
   * Let the wheel over the hexagon drive brightness/lightness. On a page that
   * is the natural gesture; in a panel that scrolls, it steals the wheel from
   * the panel, so a host with its own scroll turns it off.
   */
  /**
   * Let the wheel over the field change brightness (or lightness).
   *
   * Off everywhere. The deck and the plugin turned it off because they own
   * their own scrolling, and the picker followed once it turned out to be a
   * liability rather than a shortcut: a wheel over the field is a scroll
   * gesture on a trackpad and in device emulation, so the one place on the
   * page you most want to look at while scrolling past is the one place that
   * eats the scroll and changes your colour instead.
   *
   * Turning it off also gives the browser its scrolling fast path back over
   * the hexagon - the listener has to be non-passive to preventDefault, and a
   * non-passive wheel listener costs that whether or not it fires.
   */
  wheelAdjusts?: boolean;
  /**
   * Draw the vertical brightness bar beside the hexagon. Off lets a host put
   * brightness on its own horizontal slider, and hands the width the bar was
   * reserving back to the hexagon.
   */
  blBar?: boolean;
  /**
   * Rendered stem thickness in CSS px as [min, max]. The stems scale with the
   * hexagon, which across the plugin's range means 1.15px at the narrow end and
   * 3.3px at the wide one - too thin to read, then heavier than the handles.
   * Given a range they scale between those bounds instead. Omit for the plain
   * 2-user-unit behavior.
   */
  stemRange?: [number, number] | null;
  /**
   * The HSB/HSL tabs. On by default, including in `bare` hosts - the plugin
   * wants them, since a panel is a place you work. The intro deck does not: the
   * hexagon is there to make a point about geometry, and a mode switch beside
   * it is a control on a diagram.
   */
  blModeTabs?: boolean;
  /**
   * The R/Y/G/C/B/M letters at the vertices. On by default; off where the
   * hexagon is a diagram rather than a control, and the letters would be
   * labelling an argument the narration is already making.
   */
  vertexLabels?: boolean;
  /**
   * The brightness bar's furniture - its axis title, the 100/50/0 targets and
   * the value pill. On by default. Off leaves the track and its arrow, which is
   * the plain slider the intro deck's wheel already had. The track and the
   * arrow both stay draggable without the pill.
   */
  blMarkers?: boolean;
  /**
   * The hue ray and its angle badge. On by default. The badge is what forces
   * the component to reserve space either side of the hexagon; without it that
   * padding is empty, and a host can crop to the shape itself.
   */
  hueIndicator?: boolean;
  /**
   * How much of the RGB chain to draw: 1 all of it, 0 only the handle at the
   * end. Between them the stems, the joints and the origin fade.
   *
   * The handle never fades, because it is the selected color and every picker
   * shows that. What fades is the *explanation* - the three segments saying
   * which channel contributed what. A wheel cannot support that claim, having
   * no geometry that corresponds to the channels, so the intro's wheel shows
   * the handle alone and lets the stems arrive with the hexagon that earns them.
   */
  chainReveal?: number;
  /**
   * The shape of the field: 1 the hexagon, 0 the circle it is inscribed in,
   * between them the morph. Animate it to turn one into the other.
   *
   * Not decoration. The intro argues that the wheel every picker shows is a
   * guess at a shape the cube actually has, and a cut between two pictures
   * makes that a claim while a morph makes it a demonstration. One value
   * carries the field, the outline, the brightness cross-section, the pointer
   * mapping and the handle fills together, so the picker stays coherent at
   * every frame rather than only at the ends.
   */
  shapeMix?: number;
  /**
   * The horizontal saturation bar under the hexagon, and the dashed line tying
   * it to the vector chain's tip. Off in `bare` hosts, which put saturation on
   * an ordinary slider in their own editor - see figma/ui/lite/no-saturation.
   */
  satBar?: boolean;
}

interface HoveredMarker {
  x: number;
  y: number;
  hex: string;
  name: string;
}

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb, blMode, onBlModeChange, colorSpace, hoverMatchRgb, showHtmlOnHex, onHoverHtmlColor, bare, headerLeft, belowStage, onRecordColor, impactChannels, hueBadgeLit = false, hueFillLit = false, blBarLit = false, satBarLit = false, wheelAdjusts = false, blBar = true, stemRange = null, satBar = true, blModeTabs = true, vertexLabels = true, blMarkers = true, hueIndicator = true, shapeMix = 1, chainReveal = 1 }: ColorHexagonProps) {
  // Horizontal extent of the SVG coordinate space. Without the bar the hexagon
  // is the whole picture, so the 50px reserved to its right goes away - and the
  // extent becomes twice CENTER_X, which is what actually puts the hexagon in
  // the middle. At HEX_SIZE it sat 10px left of center.
  const EXTENT = blBar ? SIZE : CENTER_X * 2;
  // A root <svg> clips at its viewBox, and clearing the circumscribed circle
  // needs more canvas than the 88 spare units under the hexagon. So the box
  // itself grows, and everything that turns a user-space y into a percentage
  // divides by this rather than by HEX_SIZE.
  const svgHeight = satBar ? SVG_HEIGHT_SAT : HEX_SIZE;
  const stageHeight = satBar ? DISPLAY_HEIGHT_SAT : DISPLAY_HEIGHT;
  const [hexOpen, setHexOpen] = useState(true);
  // Clip while collapsed or mid-tween only; see the note on the animator below.
  // Derived, so the effect never sets state synchronously.
  const [hexSettling, setHexSettling] = useState(false);
  useEffect(() => {
    if (!hexSettling) return;
    const t = window.setTimeout(() => setHexSettling(false), COLLAPSE_MS + 20);
    return () => window.clearTimeout(t);
  }, [hexSettling]);
  const hexClipped = !hexOpen || hexSettling;
  const toggleHex = () => {
    setHexSettling(true);
    setHexOpen((o) => !o);
  };

  /*
   * The demo opens this panel if the user had it closed, and closes it again
   * afterwards. Same contract as CollapsibleSection's, spelled out separately
   * because this card collapses on its own hexOpen rather than through one.
   */
  const hexOpenRef = useRef(hexOpen);
  useEffect(() => { hexOpenRef.current = hexOpen; }, [hexOpen]);
  const hexDemoRestore = useRef<boolean | null>(null);
  useEffect(() => {
    const onOpen = (e: Event) => {
      if (!addressedTo(e, HEXAGON_SECTION) || hexOpenRef.current) return;
      hexDemoRestore.current = false;
      setHexSettling(true);
      setHexOpen(true);
    };
    const onRestore = () => {
      if (hexDemoRestore.current === null) return;
      const back = hexDemoRestore.current;
      hexDemoRestore.current = null;
      setHexSettling(true);
      setHexOpen(back);
    };
    window.addEventListener(DEMO_OPEN, onOpen);
    window.addEventListener(DEMO_RESTORE, onRestore);
    return () => {
      window.removeEventListener(DEMO_OPEN, onOpen);
      window.removeEventListener(DEMO_RESTORE, onRestore);
    };
  }, []);
  const [vectorMode] = useState<ChannelOrder>('rgb');
  const liveHsbRef = useRef<HSB>({ h: hue, s: saturation, b: brightness });
  useEffect(() => { liveHsbRef.current = { h: hue, s: saturation, b: brightness }; }, [hue, saturation, brightness]);
  const toneActiveRef = useRef(false);
  const holdToneTimer = useRef<number | null>(null);
  const scheduleHoldTone = useCallback(() => {
    if (holdToneTimer.current !== null) clearTimeout(holdToneTimer.current);
    holdToneTimer.current = window.setTimeout(() => {
      if (!toneActiveRef.current) {
        toneController.start(liveHsbRef.current);
        toneActiveRef.current = true;
      }
      holdToneTimer.current = null;
    }, 250);
  }, []);
  const cancelHoldTone = useCallback(() => {
    if (holdToneTimer.current !== null) { clearTimeout(holdToneTimer.current); holdToneTimer.current = null; }
  }, []);

  // "Reset all" returns the panel's own show/hide state, the same way
  // CollapsibleSection's listener does for the sections. The swatch lists
  // reset themselves; see useSwatchLibrary.
  useEffect(() => {
    const onReset = () => {
      hexDemoRestore.current = null;
      setHexSettling(true);
      setHexOpen(true);
    };
    window.addEventListener('color-taylor:reset-all', onReset);
    return () => window.removeEventListener('color-taylor:reset-all', onReset);
  }, []);

  /**
   * Record a colour the user picked outright. The library lives with the host
   * now, so this is a relay; the settle-delayed recording is the host's too.
   */
  const addToRecent = useCallback((hex: string) => { onRecordColor?.(hex); }, [onRecordColor]);

  // Display order — sorts a snapshot of the user's arrangement without mutating it.
  // Switching back to "user" mode restores the original positions.
  const draggingBL = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingHue = useRef(false);
  const draggingDot = useRef<{ index: number; channel: Channel; relative: boolean; startValue: number; startProjection: number; lockedRgb: RGB; lockedOrder: Channel[] } | null>(null);
  const draggingFree = useRef(false);
  const hexPointerDown = useRef<PointerDownState | null>(null);
  /**
   * The B and L a hex drag started from, for the rubber-band.
   *
   * Both B and L, not just brightness: the cross-section is bounded by `b/100`
   * under HSB and by `1 - |2L-1|` under HSL, and those are not the same number
   * for anything less than fully saturated.
   *
   * `h` and `sHsl` ride along because the neutral axis has neither to recover.
   * Grey, black and white are all points on it: every model reports hue 0
   * there, and at L=0 or L=100 the saturation goes with it. So a drag through
   * the centre, a saturation drag that bottoms out, or a lightness drag that
   * reaches either end would all come back as red or as grey. Holding what the
   * drag began with is what makes those excursions reversible.
   *
   * Null when no drag is in flight.
   */
  const dragOrigin = useRef<{ b: number; l: number; h: number; sHsl: number } | null>(null);
  const blPointerDown = useRef<PointerDownState | null>(null);
  const draggingSat = useRef(false);
  const satPointerDown = useRef<PointerDownState | null>(null);
  // Rendered state, not just the refs: the connectors are drawn output, so they
  // need a re-render at the moment a drag begins and ends.
  const [isBLDragging, setIsBLDragging] = useState(false);
  const [isSatDragging, setIsSatDragging] = useState(false);
  const startBLDrag = useCallback(() => {
    draggingBL.current = true;
    setIsBLDragging(true);
    dragOrigin.current = dragOrigin.current ?? { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
  }, [brightness, hsl?.l, hsl?.s, hue]);
  const startSatDrag = useCallback(() => {
    draggingSat.current = true;
    setIsSatDragging(true);
    dragOrigin.current = dragOrigin.current ?? { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
  }, [brightness, hsl?.l, hsl?.s, hue]);

  // Clicking a track or one of its markers tweens rather than drags, so there is
  // no pointer to hold the highlight up. These hold it for exactly the tween's
  // own duration - HSB_TWEEN_MS is the same constant the tween reads, so the
  // two cannot drift.
  const [blTweening, setBlTweening] = useState(false);
  const [satTweening, setSatTweening] = useState(false);
  const blTweenTimer = useRef<number | null>(null);
  const satTweenTimer = useRef<number | null>(null);
  const holdBLTween = useCallback(() => {
    setBlTweening(true);
    if (blTweenTimer.current) clearTimeout(blTweenTimer.current);
    blTweenTimer.current = window.setTimeout(() => {
      setBlTweening(false);
      blTweenTimer.current = null;
    }, HSB_TWEEN_MS);
  }, []);
  const holdSatTween = useCallback(() => {
    setSatTweening(true);
    if (satTweenTimer.current) clearTimeout(satTweenTimer.current);
    satTweenTimer.current = window.setTimeout(() => {
      setSatTweening(false);
      satTweenTimer.current = null;
    }, HSB_TWEEN_MS);
  }, []);
  useEffect(() => () => {
    if (blTweenTimer.current) clearTimeout(blTweenTimer.current);
    if (satTweenTimer.current) clearTimeout(satTweenTimer.current);
  }, []);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null); // index of hovered dot
  // Separate from hoveredDot: a segment and the handle at its end are different
  // targets, and highlighting one should not light up the other.
  const [hoveredLeg, setHoveredLeg] = useState<number | null>(null);
  // State, not the draggingDot ref: the channel tooltips fade while a stem or
  // joint is being dragged, and a fade is a render.
  const [dotDragging, setDotDragging] = useState(false);
  // SVG user units per rendered pixel. The hexagon and its legs scale with the
  // viewBox, but the handles should stay the same physical size, so their radii
  // and strokes are multiplied by this.
  const [uiScale, setUiScale] = useState(1);
  /*
   * A drag on the field itself, as opposed to on a handle.
   *
   * Zero-value stems and handles used to be hidden while this was true, so a
   * channel at 0 popped out of existence for the length of a drag and back
   * afterwards. It made the chain change shape under the cursor, and it was the
   * only place a handle behaved differently for its value - which is what made
   * a zero channel feel like a special case rather than a joint that happens to
   * coincide with the one before it.
   *
   * The flag was kept anyway, as the hook for a drag-time treatment if one was
   * ever wanted. This is that: the channel tooltips are suppressed while it is
   * set, because a drag across the field pulls the chain along under the cursor
   * and crosses its own stems on the way.
   */
  const [isHexDragging, setIsHexDragging] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<HoveredMarker | null>(null);

  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUiScale(EXTENT / w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [EXTENT]);

  const getSvgCoords = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = EXTENT / rect.width;
    const sy = svgHeight / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, [EXTENT, svgHeight]);

  // The mapping lives in hex/pointer.ts, pure and unit-tested. The gesture
  // origin is read through the ref so a drag keeps the bounds it began with.
  const getHsbFromPosition = useCallback((svgX: number, svgY: number, clampOnly = false) =>
    hsbFromField(svgX, svgY, {
      brightness, lightness: hsl?.l ?? 50, hue, blMode, shapeMix,
      origin: dragOrigin.current, clampOnly,
    }),
  [brightness, hsl?.l, hue, blMode, shapeMix]);

  const hueFromMouse = useCallback((e: { clientX: number; clientY: number }) => {
    const { x, y } = getSvgCoords(e);
    let angle = Math.atan2(-(y - CENTER_Y), x - CENTER_X) * (180 / PI);
    if (angle < 0) angle += 360;
    const h = Math.round(angle);
    onHueChange(h);
    return h;
  }, [onHueChange, getSvgCoords]);

  // Vector chain
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rgb accessed via dynamic key; r/g/b deps cover all reads
  const order = useMemo(() => getOrder(vectorMode, rgb), [vectorMode, rgb.r, rgb.g, rgb.b]);
  const scale = RADIUS / 255;
  // The chain itself lives in hex/chain.ts, pure and unit-tested; this memo
  // only ties it to the props.
  const { points, dotNames } = useMemo(
    () => buildChain(rgb, order, { hue, saturation, shapeMix }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rgb is read by channel; r/g/b cover it
    [order, rgb.r, rgb.g, rgb.b, shapeMix, hue, saturation],
  );

  /**
   * Same hue, lifted - the hover state of any element is its own color,
   * lighter.
   *
   * A pure primary is already at full brightness, so raising it does nothing
   * and hover would be invisible. With no headroom left, lighten by pulling
   * saturation out instead, which is what "lighter" means for a saturated
   * color.
   */
  /** Straight RGB lerp between two hex colors. t of 1 returns `b` exactly. */
  const mixHex = useCallback((a: string, b: string, t: number) => {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    if (!ca || !cb) return b;
    return rgbToHex(
      Math.round(ca.r + (cb.r - ca.r) * t),
      Math.round(ca.g + (cb.g - ca.g) * t),
      Math.round(ca.b + (cb.b - ca.b) * t),
    );
  }, []);

  const lift = useCallback((hex: string, amount = 22) => {
    const c = hexToRgb(hex);
    if (!c) return hex;
    const h = rgbToHsb(c.r, c.g, c.b);
    const next = h.b >= 100
      ? { h: h.h, s: Math.max(0, h.s - amount * 1.6), b: 100 }
      : lighter(h.h, h.s, h.b, amount);
    const out = hsbToRgb(next.h, next.s, next.b);
    return rgbToHex(out.r, out.g, out.b);
  }, []);

  /** The color the field shows at each joint - each handle's fill. */
  const dotColors = useMemo(() => points.map((p) => {
    const c = colorAtPoint(p.x, p.y, brightness, hsl?.l ?? 50, blMode, shapeMix);
    return rgbToHex(c.r, c.g, c.b);
  }), [points, brightness, hsl?.l, blMode, shapeMix]);

  // hueLabel is the pill's center - HueHandle is translated -50%/-50% onto it -
  // so the hue line ending here points at the pill rather than stopping short
  // at the circumscribed circle. The pill is opaque and painted above the SVG,
  // so the last stretch is hidden behind it.
  const { hueLabel } = useMemo(() => {
    const rad = (hue * PI) / 180;
    return {
      hueLabel: {
        x: CENTER_X + (RADIUS + HUE_LABEL_OFFSET) * Math.cos(rad),
        y: CENTER_Y - (RADIUS + HUE_LABEL_OFFSET) * Math.sin(rad),
      },
    };
  }, [hue]);

  const hoverDot = useMemo(() => {
    if (!hoverMatchRgb) return null;
    const hsb = rgbToHsb(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b);
    const rad = (hsb.h * PI) / 180;
    const edgeDist = hexEdgeDist(rad, RADIUS);
    const dist = (hsb.s / 100) * edgeDist;
    return {
      x: CENTER_X + dist * Math.cos(rad),
      y: CENTER_Y - dist * Math.sin(rad),
      hex: rgbToHex(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b),
    };
  }, [hoverMatchRgb]);

  // "This control is what's changing right now" - by pointer or by the tween a
  // click on its track started. Everything the control highlights reads this.
  const blActive = isBLDragging || blTweening;
  const satActive = isSatDragging || satTweening || hueFillLit;
  const showHueLine = hueIndicator && (saturation > 0 || satActive);

  // Named color markers on hex
  const htmlColorMarkers = useMemo(() => {
    if (!showHtmlOnHex) return [];
    return NAMED_COLORS.flatMap((c) => {
      const hsb = rgbToHsb(c.r, c.g, c.b);
      // Only show colors within ±15 brightness of current
      if (Math.abs(hsb.b - brightness) > 15) return [];
      const rad = (hsb.h * PI) / 180;
      // Position at where it would be at the color's own brightness level
      const colorLimitRadius = RADIUS * hsb.b / 100;
      const edgeDist = hexEdgeDist(rad, colorLimitRadius);
      const dist = (hsb.s / 100) * edgeDist;
      return [{
        x: CENTER_X + dist * Math.cos(rad),
        y: CENTER_Y - dist * Math.sin(rad),
        hex: rgbToHex(c.r, c.g, c.b),
        name: c.name,
      }];
    });
  }, [showHtmlOnHex, brightness]);
  // Solve for multiple channel values given a target 2D position
  const solveChannels = useCallback((targetX: number, targetY: number, channelKeys: Channel[]) => {
    const dx = targetX - CENTER_X;
    const dy = targetY - CENTER_Y;
    const n = channelKeys.length;

    if (n === 1) {
      const dir = DIRS[channelKeys[0]];
      const proj = dx * dir.x + dy * dir.y;
      return { [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(proj / scale))) };
    }

    if (n === 2) {
      // Solve 2x2 linear system: dx = a*d1x + b*d2x, dy = a*d1y + b*d2y
      const d1 = DIRS[channelKeys[0]], d2 = DIRS[channelKeys[1]];
      const det = d1.x * d2.y - d1.y * d2.x;
      if (Math.abs(det) < 0.0001) return null;
      const a = (dx * d2.y - dy * d2.x) / det / scale;
      const b = (d1.x * dy - d1.y * dx) / det / scale;
      return {
        [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(a))),
        [channelKeys[1]]: Math.max(0, Math.min(255, Math.round(b))),
      };
    }

    // n >= 3: underdetermined, use geometric H+S approach
    return null;
  }, [scale]);

  // Drag handlers
  const handleDotDrag = useCallback((e: { clientX: number; clientY: number }) => {
    if (draggingDot.current && onRgbChange) {
      const { index, channel } = draggingDot.current;
      const isLast = index === points.length - 1;
      const isRelative = draggingDot.current.relative;

      // Dot drag (non-relative): free multi-channel solve based on which dot
      if (!isRelative) {
        const { x, y } = getSvgCoords(e);

        // Last dot (all 3 channels): set color from hex position
        if (isLast && onHsbChange) {
          dragOrigin.current = dragOrigin.current ?? { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
          const picked = getHsbFromPosition(x, y, true);
          if (picked) onHsbChange(picked);
          return;
        }

        // Solve for channels 0..index-1
        const channelKeys = order.slice(0, index);
        const solved = solveChannels(x, y, channelKeys);
        if (solved) {
          for (const [ch, val] of Object.entries(solved)) {
            onRgbChange(ch as 'r' | 'g' | 'b', val as number);
          }
          return;
        }
      }

      // Segment drag (relative): adjust only this dot's channel
      const { x, y } = getSvgCoords(e);
      const { startValue, startProjection } = draggingDot.current;
      let prev = { x: CENTER_X, y: CENTER_Y };
      for (let i = 0; i < index - 1; i++) {
        const ch = order[i];
        const dir = DIRS[ch];
        prev = {
          x: prev.x + rgb[ch] * scale * dir.x,
          y: prev.y + rgb[ch] * scale * dir.y,
        };
      }
      const dir = DIRS[channel];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const currentProjection = dx * dir.x + dy * dir.y;
      const delta = (currentProjection - startProjection) / scale;
      const value = Math.max(0, Math.min(255, Math.round(startValue + delta)));
      onRgbChange(channel, value);
    }
    if (draggingFree.current && onHsbChange) {
      const { x, y } = getSvgCoords(e);
      const picked = getHsbFromPosition(x, y, true);
      if (picked) onHsbChange(picked);
    }
  }, [getSvgCoords, onRgbChange, onHsbChange, points, scale, getHsbFromPosition, order, rgb, brightness, hsl?.l, hsl?.s, hue, solveChannels]);

  const getBLValueFromClientY = useCallback((clientY: number) => {
    if (!svgRef.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    const sy = svgHeight / svgRect.height;
    const svgY = (clientY - svgRect.top) * sy;
    const y = Math.max(0, Math.min(svgY - BL_BAR_TOP, BL_BAR_HEIGHT));
    return Math.round((1 - y / BL_BAR_HEIGHT) * 100);
  }, [svgHeight]);

  const applyBLValue = useCallback((value: number) => {
    if (blMode === 'brightness') {
      // HSB holds its own h and s through b=0, so the merge is enough.
      onHsbChange({ b: value });
      return;
    }
    /*
     * HSL is rebuilt from the drag's own origin rather than from the current
     * colour, because at L=0 and L=100 there is no colour left to read it off:
     * black and white convert back with hue 0 and saturation 0. Going to either
     * end and returning would land on black-to-grey instead of the colour it
     * started from. Stating H and S outright makes the whole range reversible.
     */
    const h = dragOrigin.current?.h ?? hue;
    const sHsl = dragOrigin.current?.sHsl ?? (hsl?.s ?? 0);
    const targetRgb = hslToRgb(h, sHsl, value);
    const next = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    // h explicitly, so the hue survives in state at the ends too, where `next`
    // reports 0.
    onHsbChange({ h, s: next.s, b: next.b });
  }, [blMode, hue, hsl?.s, onHsbChange]);

  const animateBLToValue = useCallback((targetValue: number) => {
    if (!onAnimateToHsb) return;
    holdBLTween();
    if (blMode === 'brightness') {
      onAnimateToHsb({ h: hue, s: saturation, b: targetValue });
      return;
    }
    // Hue comes from state rather than from the current colour: reading it back
    // off RGB gives 0 whenever that colour is black, white or grey, which sends
    // a marker click from either end of the bar to red. `hue` survives those,
    // because applyBLValue writes it through explicitly.
    const h = dragOrigin.current?.h ?? hue;
    const currentRgb = hsbToRgb(h, saturation, brightness);
    const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
    const sHsl = dragOrigin.current?.sHsl ?? currentHsl.s;
    const targetRgb = hslToRgb(h, sHsl, targetValue);
    const next = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    onAnimateToHsb({ h, s: next.s, b: next.b });
  }, [blMode, onAnimateToHsb, hue, saturation, brightness, holdBLTween]);

  const getSatValueFromClientX = useCallback((clientX: number) => {
    if (!svgRef.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    // The SVG's own scale, not the hexagon's: EXTENT differs from HEX_SIZE and
    // the bar is measured in the same user units the viewBox is.
    const sx = EXTENT / svgRect.width;
    const svgX = (clientX - svgRect.left) * sx;
    const x = Math.max(0, Math.min(svgX - SAT_BAR_LEFT, SAT_BAR_WIDTH));
    return Math.round((x / SAT_BAR_WIDTH) * 100);
  }, [EXTENT]);

  /**
   * The saturation the bar is showing and setting.
   *
   * HSB's S and HSL's S are different quantities, and writing one while the bar
   * is labelled the other moves the axis next to it: holding HSB's b fixed and
   * changing s changes L, because L = b(2-s)/2. Around #441745 that read as the
   * lightness slider drifting whenever saturation moved. The brightness bar has
   * always branched on blMode for the same reason; this one now does too.
   */
  const satValue = blMode === 'brightness' ? saturation : (hsl?.s ?? 0);

  const applySatValue = useCallback((value: number) => {
    // Explicit, not inferred: at S=0 the colour is grey and every conversion
    // back out of it reports hue 0, so sliding away from zero would land on red
    // instead of returning to where the drag began.
    const h = dragOrigin.current?.h ?? hue;
    if (blMode === 'brightness') {
      onHsbChange?.({ h, s: value });
      return;
    }
    const targetRgb = hslToRgb(h, value, hsl?.l ?? 50);
    const next = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    onHsbChange?.({ h, s: next.s, b: next.b });
  }, [blMode, hue, hsl?.l, onHsbChange]);

  const animateSatToValue = useCallback((targetValue: number) => {
    if (!onAnimateToHsb) return;
    holdSatTween();
    const h = dragOrigin.current?.h ?? hue;
    if (blMode === 'brightness') {
      onAnimateToHsb({ h, s: targetValue, b: brightness });
      return;
    }
    // Same round trip animateBLToValue makes: hold the other two HSL channels,
    // convert, and let the tween run in HSB. Hue is carried explicitly for the
    // grey case, where currentHsl.h would read 0.
    const currentRgb = hsbToRgb(h, saturation, brightness);
    const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
    const targetRgb = hslToRgb(h, targetValue, currentHsl.l);
    const next = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    onAnimateToHsb({ h, s: next.s, b: next.b });
  }, [blMode, onAnimateToHsb, hue, saturation, brightness, holdSatTween]);

  const handleHexSurfaceDrag = useCallback((e: { clientX: number; clientY: number }) => {
    if (!hexPointerDown.current || !onHsbChange) return null;
    const { x, y } = getSvgCoords(e);
    const picked = getHsbFromPosition(x, y, true);
    if (picked) onHsbChange(picked);
    return picked ?? null;
  }, [getSvgCoords, getHsbFromPosition, onHsbChange]);

  // Global mouse listeners
  useEffect(() => {
    const clearAll = (at?: { clientX: number; clientY: number }) => {
      draggingHue.current = false;
      draggingDot.current = null;
      draggingFree.current = false;
      draggingBL.current = false;
      draggingSat.current = false;
      setIsBLDragging(false);
      setIsSatDragging(false);
      hexPointerDown.current = null;
      blPointerDown.current = null;
      satPointerDown.current = null;
      dragOrigin.current = null;
      // Hover is re-read from whatever is under the release point rather than
      // cleared: pointerenter does not fire again for an element the pointer
      // never left, so after a drag on a joint the tooltip would stay away
      // until the pointer went out and came back. The tooltips are only
      // suppressed for the drag itself.
      const under = at ? document.elementFromPoint(at.clientX, at.clientY)?.closest<Element>('[data-stem],[data-joint]') : null;
      const stem = under?.getAttribute('data-stem');
      const joint = under?.getAttribute('data-joint');
      setHoveredLeg(stem !== null && stem !== undefined ? Number(stem) : null);
      setHoveredDot(joint !== null && joint !== undefined ? Number(joint) : null);
      setDotDragging(false);
      setIsHexDragging(false);
      cancelHoldTone();
      if (toneActiveRef.current) {
        toneController.release();
        toneActiveRef.current = false;
      }
    };
    const ensureToneStart = () => {
      cancelHoldTone();
      if (!toneActiveRef.current) {
        toneController.start(liveHsbRef.current);
        toneActiveRef.current = true;
      }
    };
    const updateTone = (partial: Partial<HSB>) => {
      if (!toneActiveRef.current) return;
      toneController.update({ ...liveHsbRef.current, ...partial });
    };
    const onPointerMove = (e: PointerEvent) => {
      if (draggingHue.current) {
        ensureToneStart();
        const newH = hueFromMouse(e);
        if (typeof newH === 'number') updateTone({ h: newH });
      }
      if (draggingDot.current) {
        ensureToneStart();
        handleDotDrag(e);
        updateTone({});
      }
      if (draggingBL.current) {
        ensureToneStart();
        const val = getBLValueFromClientY(e.clientY);
        if (val !== null) {
          applyBLValue(val);
          if (blMode === 'brightness') updateTone({ b: val });
          else updateTone({});
        }
      }
      if (draggingSat.current) {
        ensureToneStart();
        const val = getSatValueFromClientX(e.clientX);
        if (val !== null) {
          applySatValue(val);
          updateTone({ s: val });
        }
      }
      if (draggingFree.current) {
        ensureToneStart();
        const { x, y } = getSvgCoords(e);
        const picked = getHsbFromPosition(x, y);
        if (picked) { onHsbChange(picked); updateTone(picked); }
      }
      if (hexPointerDown.current) {
        const pd = hexPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
            setIsHexDragging(true);
          }
        }
        if (pd.isDragging) {
          ensureToneStart();
          const picked = handleHexSurfaceDrag(e);
          if (picked) updateTone(picked);
        }
      }
      if (blPointerDown.current) {
        const pd = blPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
            setIsBLDragging(true);
            dragOrigin.current = dragOrigin.current ?? { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
          }
        }
        if (pd.isDragging) {
          ensureToneStart();
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) {
            applyBLValue(val);
            if (blMode === 'brightness') updateTone({ b: val });
            else updateTone({});
          }
        }
      }
      if (satPointerDown.current) {
        const pd = satPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
            setIsSatDragging(true);
            dragOrigin.current = dragOrigin.current ?? { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
          }
        }
        if (pd.isDragging) {
          ensureToneStart();
          const val = getSatValueFromClientX(e.clientX);
          if (val !== null) {
            applySatValue(val);
            updateTone({ s: val });
          }
        }
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (hexPointerDown.current && !hexPointerDown.current.isDragging) {
        const elapsed = Date.now() - hexPointerDown.current.time;
        if (elapsed <= clickMaxDuration && onAnimateToHsb) {
          const { x, y } = getSvgCoords(e);
          const picked = getHsbFromPosition(x, y);
          if (picked) {
            const targetRgb = hsbToRgb(picked.h, picked.s, picked.b);
            addToRecent(rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b));
            onAnimateToHsb(picked);
            if (navigator.vibrate) navigator.vibrate(12);
          }
        }
      }
      if (blPointerDown.current && !blPointerDown.current.isDragging) {
        const elapsed = Date.now() - blPointerDown.current.time;
        if (elapsed <= clickMaxDuration) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) animateBLToValue(val);
        }
      }
      if (satPointerDown.current && !satPointerDown.current.isDragging) {
        const elapsed = Date.now() - satPointerDown.current.time;
        if (elapsed <= clickMaxDuration) {
          const val = getSatValueFromClientX(e.clientX);
          if (val !== null) animateSatToValue(val);
        }
      }
      clearAll(e);
    };
    const onPointerLeave = () => clearAll();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [hueFromMouse, handleDotDrag, handleHexSurfaceDrag, getBLValueFromClientY, applyBLValue, animateBLToValue, getSatValueFromClientX, applySatValue, animateSatToValue, getSvgCoords, getHsbFromPosition, onAnimateToHsb, onHsbChange, addToRecent, blMode, brightness, hsl?.l, hsl?.s, hue, cancelHoldTone]);

  // Non-passive wheel listener to prevent page scroll. Not registered at all
  // when the host owns the wheel - a listener that conditionally declines to
  // preventDefault still has to be non-passive, which costs the browser its
  // scrolling fast path for no reason.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !wheelAdjusts) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = Math.abs(e.deltaY) > 50 ? 2 : 1;
      const delta = e.deltaY > 0 ? -step : step;
      if (blMode === 'brightness') {
        const target = Math.max(0, Math.min(100, brightness + delta));
        onHsbChange({ b: target });
      } else if (onHslChange) {
        const currentL = hsl?.l ?? 50;
        const target = Math.max(0, Math.min(100, currentL + delta));
        if (target >= 99) {
          onHsbChange({ h: hue, s: 0, b: 100 });
        } else if (target <= 1) {
          onHsbChange({ h: hue, s: saturation, b: 0 });
        } else {
          onHslChange('l', target);
        }
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [wheelAdjusts, blMode, brightness, hsl?.l, hue, saturation, onHsbChange, onHslChange]);

  const handleHueDragStart = (e: ReactPointerEvent) => {
    e.preventDefault();
    draggingHue.current = true;
    hueFromMouse(e);
    scheduleHoldTone();
  };

  const handleDotMouseDown = (e: ReactPointerEvent, dotIndex: number, relative = false) => {
    if (dotIndex === 0) return;
    e.preventDefault();
    e.stopPropagation();
    setHoveredDot(dotIndex);
    if (relative) setHoveredLeg(dotIndex - 1);
    setDotDragging(true);
    const channel = order[dotIndex - 1];
    const { x, y } = getSvgCoords(e);
    let prev = { x: CENTER_X, y: CENTER_Y };
    for (let i = 0; i < dotIndex - 1; i++) {
      const ch = order[i];
      const dir = DIRS[ch];
      prev = {
        x: prev.x + rgb[ch] * scale * dir.x,
        y: prev.y + rgb[ch] * scale * dir.y,
      };
    }
    const dir = DIRS[channel];
    const startProjection = (x - prev.x) * dir.x + (y - prev.y) * dir.y;
    draggingDot.current = {
      index: dotIndex,
      channel,
      lockedRgb: { ...rgb },
      lockedOrder: [...order],
      startValue: rgb[channel],
      startProjection,
      relative,
    };
  };

  const handleHexMouseDown = useCallback((e: ReactPointerEvent) => {
    const { x, y } = getSvgCoords(e);
    const dx = x - CENTER_X;
    const dy = y - CENTER_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return;
    dragOrigin.current = { b: brightness, l: hsl?.l ?? 50, h: hue, sHsl: hsl?.s ?? 0 };
    hexPointerDown.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now(),
      isDragging: false,
    };
    scheduleHoldTone();
  }, [getSvgCoords, brightness, hsl?.l, hsl?.s, hue, scheduleHoldTone]);

  const handleColorLabelClick = useCallback((deg: number) => {
    if (!onAnimateToHsb) return;
    let target;
    if (blMode === 'brightness') {
      target = { h: deg, s: 100, b: 100 };
    } else {
      const targetRgb = hslToRgb(deg, 100, 50);
      target = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    }
    const rgb = hsbToRgb(target.h, target.s, target.b);
    addToRecent(rgbToHex(rgb.r, rgb.g, rgb.b));
    onAnimateToHsb(target);
  }, [onAnimateToHsb, blMode, addToRecent]);

  // Brightness limit hex
  /**
   * User units that render at a fixed pixel size, whatever the panel width.
   *
   * Everything inside the SVG is drawn in a fixed viewBox, so a plain
   * strokeWidth scales with the panel - at the narrow end the dashed strokes
   * fall under a device pixel and wash out. Multiplying by uiScale (user units
   * per rendered px) cancels that exactly.
   *
   * Dash patterns go through it too, or the texture drifts even when the line
   * itself holds. At the viewBox's natural size every call below is a no-op,
   * so these resolve to the values the hexagon has always used.
   */
  const pxUnits = (n: number) => n * uiScale;

  const limitHex = useMemo(() => {
    const limitScale = shapeLimitScale(blMode, brightness, hsl?.l ?? 50, shapeMix);
    return { limitScale, limitRadius: RADIUS * Math.min(limitScale, 1) };
  }, [blMode, brightness, hsl?.l, shapeMix]);

  return (
    <div
      id="color-hexagon"
      // The demo frames whichever of these it is working in, rather than
      // centring one small target and leaving the card's top off screen.
      data-demo-section=""
      // Built by joining whole strings, not by interpolating into one. Tailwind
      // scans raw source text: `...max-w-full${cond}` makes the extractor read
      // `max-w-full${cond` as the candidate, so the utility is never generated
      // and the card silently overflows its column.
      className={[
        'flex flex-col items-center gap-1 max-w-full',
        bare ? 'w-full' : 'panel-frame border border-border rounded-lg p-3',
      ].join(' ')}
      // This card collapses on its own `hexOpen` rather than through
      // CollapsibleSection, so it reports its state itself. .panel-frame reads
      // it to drop the glow while closed and keep just the keyline. Omitted in
      // `bare` hosts, where there is no frame and no collapse affordance.
      {...(bare ? {} : { 'data-panel-open': hexOpen ? 'true' : 'false' })}
      style={bare ? undefined : { width: HEX_PANEL_WIDTH }}
    >
      {/*
        relative z-10 because #hex-svg overhangs this row. Its box is HEX_SIZE
        tall inside a DISPLAY_HEIGHT stage, so 40 user units of empty canvas
        stick out above the stage - and a root <svg> takes the hit over its
        whole box, tabs included. It used to clear the header by a few px only
        because the caption below the tabs padded this row out; dropping that
        caption pulled the stage up and the SVG started swallowing tab clicks.
        The stage cannot simply clip instead: the hue badge legitimately sits
        outside it near 90 degrees.
      */}
      {/* Skipped entirely when it would be empty. A bare host with no
          headerLeft and no tabs still rendered the row and the gap under it,
          which pushed the stage down and left the hexagon's centre a dozen
          pixels below the wheel's on the slide before it. */}
      {(!bare || headerLeft || (hexOpen && blModeTabs)) && (
      <div className="relative z-10 flex items-start gap-1.5 w-full">
        {/* In `bare` hosts the surrounding chrome is the container, so the
            title and its collapse affordance are redundant. The Bright/Light
            tabs stay - they are a control, not decoration. */}
        {!bare && (
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer select-none"
            onClick={toggleHex}
          >
            <ChevronRight className={`!size-4 text-muted-foreground transition-transform duration-200 ${hexOpen ? 'rotate-90' : ''}`} />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Hexagon</h2>
          </div>
        )}
        {bare && <div className="flex-1 min-w-0">{headerLeft}</div>}
        {/*
          The caption under these tabs used to read "Luminance", which is a
          photometric quantity neither axis computes - B is max(R,G,B) and L is
          (max+min)/2, both unweighted and both over gamma-encoded values. Blue
          and yellow land on the same spot of the bar and differ 13x in actual
          luminance. The bar names the live axis itself, so that caption went.

          What is there now says what the tabs *are*, not what they compute,
          which is a claim that cannot be wrong the way the old one was.
        */}
        {hexOpen && blModeTabs && (
          <div className="flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Tabs value={blMode} onValueChange={onBlModeChange}>
              <TabsList>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span><TabsTrigger value="brightness" className="w-14">HSB</TabsTrigger></span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSB brightness</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span><TabsTrigger value="lightness" className="w-14">HSL</TabsTrigger></span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSL lightness</TooltipContent>
                </Tooltip>
              </TabsList>
            </Tabs>
            {/* Names what the tabs are for rather than what they compute. The
                caption that used to sit here read "Luminance", which was a
                claim about the axis and a false one; this is a claim about the
                control, which is the thing that needed saying - in a `bare`
                host most of all, where there is no "Hexagon" heading beside it
                and the tabs otherwise float unexplained.

                Centred under the tabs and at the same size as the plugin's own
                "Selected: n", which is the same shape - a caption naming the
                control above it. */}
            <span className="select-none text-[10px] text-muted-foreground">
              Hex Mode
            </span>
          </div>
        )}
      </div>
      )}
      {/*
        The same collapse animation CollapsibleSection uses, applied by hand
        because this panel is not one - it has its own hexOpen, so it was the one
        panel that snapped shut while every other section tweened.

        Two rows animating 0fr <-> 1fr, content kept mounted so there is
        something to transition, and the clip lifted once open so the swatch
        selection rings inside Recent and Saved are not cropped.

        flex-1 only while open, the same condition CollapsibleSection's `fill`
        carries. It is what passes the card's height down to the stage below, so
        Recent and Saved can sit at the bottom of the card - but a flex-1 on a
        row animating to 0fr would hold the height open and the collapse would
        not close at all.
      */}
      <div
        className={`grid w-full transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${hexOpen ? 'flex-1 min-h-0' : ''}`}
        style={{ gridTemplateRows: hexOpen ? '1fr' : '0fr' }}
      >
      <div
        inert={!hexOpen}
        className={`flex w-full min-h-0 flex-col items-center gap-1 ${hexClipped ? 'overflow-clip' : ''}`}
      >
      {/* id is a styling hook for narrow hosts. The hue badge and brightness
          pill are absolutely positioned against this element at percentage
          offsets but sized in fixed px, so anything narrower than
          HEX_PANEL_WIDTH must cap this width to keep them on screen. Padding
          cannot do it - abs-positioned children resolve against the padding
          box. See figma/ui/figma.css.

          `grow` makes this the panel's slack absorber, so whatever the card has
          spare over its content lands here and Recent and Saved sit at the
          bottom of the card rather than trailing empty space beneath them. That
          space was up to 128px at a 900px window, where the hexagon shrinks with
          the width but the sliders column's rows do not.

          The wheel does not grow with it: the wrapper below is absolute and
          top-1/2 -translate-y-1/2, so it keeps the size its own width gives it
          and simply centres in whatever height this ends up with. That is the
          point - the slack reads as margin around a centred graphic instead of
          as a gap between two cards.

          `grow` and not `flex-1`: flex-1 sets flex-basis to 0, and this box has
          no in-flow children to measure - its height comes entirely from the
          aspect-ratio, which a definite basis overrides. It would collapse to
          nothing and the wheel would overflow it. Growing from an auto basis
          keeps the aspect-derived height as the floor. */}
      {/* mb-1 rather than m-4's mb-4 while the saturation bar is on: the value
          pill ends 2 units off the stage's bottom edge, so a full margin under
          it reads as a gap between the control and Recent. The 12px freed goes
          to `grow`, which lands below the saturation bar now that the box is
          top-pinned.

          The stage is an inline-size container so the box below can take its
          crop in cqw: the crop is a fixed share of the width, and a percentage
          `top` would resolve against the stage's height, which grows. */}
      <div id="hex-stage" className={`w-full relative grow ${satBar ? 'mx-4 mt-4 mb-1' : 'm-4'}`} style={{ maxWidth: EXTENT, aspectRatio: `${EXTENT} / ${stageHeight}`, containerType: 'inline-size' }}>
      {/* Centred while the content is symmetric about CENTER_Y. With the
          saturation bar on it hangs well below, so the box is pinned to the
          stage's top instead, shifted up by the crop - the same 40 units
          DISPLAY_HEIGHT has always taken, which is the amount the hue badge is
          known to survive. Top rather than bottom so that when the card grows
          the hexagon and its bars stay put and the slack collects underneath. */}
      <div
        className={`absolute left-0 w-full ${satBar ? '' : 'top-1/2 -translate-y-1/2'}`}
        style={{
          aspectRatio: `${EXTENT} / ${svgHeight}`,
          top: satBar ? `calc(${((svgHeight - stageHeight) / EXTENT) * -100}cqw)` : undefined,
        }}
      >
        <HexCanvas brightness={brightness} lightness={hsl?.l ?? 50} blMode={blMode} colorSpace={colorSpace} extent={EXTENT} svgHeight={svgHeight} shapeMix={shapeMix} />
        <svg
          id="hex-svg"
          ref={svgRef}
          /*
           * The field is a hex hold like the handles on it.
           *
           * `holdKeyOf` walks up to the nearest [data-hold], so everything with
           * its own tag - the stems, the joints, both bars, the hue handle -
           * still wins; this only catches a press on the field itself, which
           * used to read as 'other' and light the whole chain. Clicking the
           * field moves the chain as directly as dragging a handle does, so it
           * is the same case: the thing that moved under your hand is its own
           * feedback, and the halos are for showing what it did elsewhere.
           */
          data-hold="hex:field"
          viewBox={`0 0 ${EXTENT} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Color hexagon with RGB vector visualization"
          className="absolute inset-0 z-[5] w-full h-full touch-none"
          onPointerDown={handleHexMouseDown}
        >
          <circle id="hex-circumscribe" cx={CENTER_X} cy={CENTER_Y} r={RADIUS} fill="none" stroke="var(--input)" strokeWidth={1.5} />
          <polygon id="hex-outline" points={shapePoints(CENTER_X, CENTER_Y, RADIUS, shapeMix)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/*
            Brightness limit hex - the cube's cross-section at this value.

            Hidden at rest once it reaches full size, where it would just double
            the hexagon's own outline. During a drag it stays drawn all the way
            to 100%, so the shape you are sizing does not blink out at the top
            of the range - at that point it lands on the outline and reads as
            the outline lighting up.
          */}
          {limitHex.limitScale < 1 && (
            <polygon
              id="hex-brightness-limit"
              points={shapePoints(CENTER_X, CENTER_Y, limitHex.limitRadius, shapeMix)}
              fill="none"
              {...QUIET_LIMIT_HEX}
              strokeWidth={pxUnits(2)}
              strokeDasharray={`${pxUnits(1)} ${pxUnits(4)}`}
            />
          )}
          {/*
            ...and the highlight is a second polygon crossfaded over it, rather
            than the first one changing colour. Opacity is the only property
            here that transitions cleanly - going from a dash array to `none`
            mid-fade does not - and keeping it mounted at opacity 0 is what lets
            it fade rather than blink when the tween finishes. Solid, because
            dashed reads as an annotation you can look past and the
            cross-section is the thing being set.
          */}
          <polygon
            id="hex-brightness-limit-active"
            points={shapePoints(CENTER_X, CENTER_Y, limitHex.limitRadius, shapeMix)}
            fill="none"
            {...CALLOUT_LINE}
            strokeWidth={pxUnits(2.5)}
            opacity={blActive ? 1 : 0}
            className={blActive ? HIGHLIGHT_IN : HIGHLIGHT_OUT}
            pointerEvents="none"
          />
          {/* HTML named color markers */}
          {htmlColorMarkers.map((m) => (
            <circle
              key={m.name}
              cx={m.x}
              cy={m.y}
              r={4}
              fill={m.hex}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
              className="cursor-pointer"
              onMouseEnter={() => { setHoveredMarker(m); onHoverHtmlColor?.(m); }}
              onMouseLeave={() => { setHoveredMarker(null); onHoverHtmlColor?.(null); }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAnimateToHsb) {
                  const parsed = rgbToHsb(
                    parseInt(m.hex.slice(1, 3), 16),
                    parseInt(m.hex.slice(3, 5), 16),
                    parseInt(m.hex.slice(5, 7), 16),
                  );
                  addToRecent(m.hex);
                  onAnimateToHsb(parsed);
                }
              }}
            />
          ))}

          {/*
            Hue line, and - while saturation is being dragged - the filled part
            of it.

            A horizontal track cannot match the handle's direction of travel at
            every hue: the handle's horizontal component goes as cos(hue), so it
            agrees at 0 degrees, opposes at 180, and vanishes entirely at 90 and
            270 where the handle moves straight up. Rather than chase that, the
            fill gives the eye a quantity that behaves the same way everywhere -
            more saturation is a longer segment, whichever way the ray points.

            The fill ends at the vector chain's tip, so it stops exactly where
            the colour handle is. That also makes it honest about brightness:
            the tip rides the limit hexagon, so a dim colour at S=100 fills a
            shorter ray, which is what the shrunken limit hexagon beside it is
            already saying.
          */}
          {showHueLine && (
            <line id="hue-line" x1={CENTER_X} y1={CENTER_Y} x2={hueLabel.x} y2={hueLabel.y}
              {...QUIET_HUE_LINE}
              strokeWidth={pxUnits(2)}
              strokeDasharray={`${pxUnits(4)} ${pxUnits(4)}`}
            />
          )}
          {showHueLine && (
            <line
              id="hue-line-fill"
              x1={CENTER_X} y1={CENTER_Y}
              x2={points[points.length - 1].x} y2={points[points.length - 1].y}
              {...CALLOUT_LINE}
              strokeWidth={pxUnits(3)}
              opacity={satActive ? 1 : 0}
              className={satActive ? HIGHLIGHT_IN : HIGHLIGHT_OUT}
              pointerEvents="none"
            />
          )}

          {/* Vector line segments */}
          {points.slice(1).map((p, i) => {
            const prev = points[i];
            const ch = order[i];
            const baseColor = CHANNEL_COLOR[ch];
            const hoverColor = lift(baseColor);
            // uiScale is user-units-per-rendered-px, so a target thickness in
            // px converts by multiplying, and the natural size is where the
            // upper bound lands.
            const stemPx = stemRange
              ? Math.min(stemRange[1], Math.max(stemRange[0], stemRange[1] / uiScale))
              : 2 / uiScale;
            const stemUnits = stemPx * uiScale;
            const isHighlighted = hoveredLeg === i;
            const dotIndex = i + 1;
            return (
              // Faded stems are not draggable. An invisible hit target is worse
              // than no target, and the intro's wheel would otherwise carry
              // three of them across a field that shows no lines at all.
              <g key={i} opacity={chainReveal} style={{ pointerEvents: chainReveal < 1 ? 'none' : undefined }}>
                {/* Invisible wider hit area for easier clicking */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke="transparent"
                  strokeWidth={12}
                  strokeLinecap="round"
                  className="cursor-pointer touch-none"
                  data-hold={`hex:${ch}`}
                  data-stem={i}
                  onPointerEnter={() => {
                    if (draggingDot.current || draggingFree.current) return;
                    setHoveredLeg(i);
                  }}
                  onPointerLeave={() => {
                    if (!draggingDot.current && !draggingFree.current) setHoveredLeg(null);
                  }}
                  onPointerDown={(e) => handleDotMouseDown(e, dotIndex, true)}
                />
                {/* Visible segment */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke={isHighlighted ? hoverColor : baseColor}
                  strokeWidth={isHighlighted ? stemUnits * 1.5 : stemUnits}
                  strokeLinecap="round"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Dots */}
          {points.map((p, i) => {
            const isDraggable = i > 0;
            const ch = i > 0 ? order[i - 1] : null;
            const isHighlighted = isDraggable && hoveredDot === i;
            const isOrigin = i === 0;
            // The handle at the end is the selected color, so it stays whatever
            // the chain is doing. Everything before it is the explanation.
            const isTip = i === points.length - 1;
            const dotOpacity = isTip ? 1 : chainReveal;
            // uiScale keeps the handles a constant size on screen while the
            // hexagon and its legs scale with the viewBox.
            const k = uiScale;

            // `|| !ch` is the same test as isOrigin - ch is null exactly when
            // i is 0 - written out so ch narrows to a Channel below.
            if (isOrigin || !ch) {
              return (
                <circle
                  key={i} id={`rgb-dot-${dotNames[i]}`} cx={p.x} cy={p.y}
                  r={3 * k} fill="#ff0000" opacity={dotOpacity}
                />
              );
            }

            const handlers = isDraggable ? {
              onPointerDown: (e: ReactPointerEvent) => handleDotMouseDown(e, i),
              // Ignored mid-drag: the element being dragged keeps the highlight
              // rather than handing it to whatever the pointer passes over.
              onPointerEnter: () => {
                if (draggingDot.current || draggingFree.current) return;
                setHoveredDot(i);
              },
              onPointerLeave: () => {
                if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
              },
            } : {};

            // Border is the channel this handle belongs to, at full strength;
            // fill is the color the field shows underneath it.
            //
            // Except at the tip with no chain drawn: the handle belongs to no
            // channel then, and a blue ring on an orange color is a label for
            // an explanation that is not on screen. White is what every picker
            // marks a selection with, and it takes on the channel's color as
            // the stems that justify it arrive.
            //
            // The tip is a size up from the joints - it is the selection, they
            // are the explanation - but it carries its channel's colour like
            // them; the highlight colour is what a drag shows.
            const baseRing = isTip ? mixHex('#ffffff', CHANNEL_COLOR[ch], chainReveal) : CHANNEL_COLOR[ch];
            const hoverRing = lift(baseRing);
            // Thickens outward on hover, same 1.5x the stems use.
            const ringW = isHighlighted ? HANDLE.ring * HANDLE.hoverScale : HANDLE.ring;
            const ringR = ringRadius(ringW) + (isTip ? 2 : 0);
            // Every channel up to and including this joint moves when it is
            // dragged; the halo lights when the host says its own channel is.
            const drives = order.slice(0, i).join('');

            return (
              <g
                key={i}
                opacity={dotOpacity}
                className={isDraggable ? 'cursor-pointer touch-none' : ''}
                data-hold={`hex:${drives}`}
                data-joint={i}
                // Through pxUnits like every other stroke here: a CSS filter on
                // an SVG element measures in user space, so the shadow scaled
                // with the panel - about 1.3px of blur when narrow and 3.8px
                // when wide, against the slider handles flat 2.5px.
                style={{
                  filter: `drop-shadow(0 ${pxUnits(HANDLE.shadowY)}px ${pxUnits(HANDLE.shadowBlur)}px ${HANDLE.shadowColor})`,
                  pointerEvents: dotOpacity < 1 ? 'none' : undefined,
                }}
                {...handlers}
              >
                <circle
                  id={`rgb-dot-${dotNames[i]}`}
                  cx={p.x} cy={p.y} r={ringR * k}
                  fill={dotColors[i]}
                  stroke={isHighlighted ? hoverRing : baseRing}
                  strokeWidth={ringW * k}
                />
                {/* The tint inside the ring, matching the slider handles. */}
                <circle
                  cx={p.x} cy={p.y} r={(ringR + ringW / 2 - 0.5) * k}
                  fill="none" stroke={HANDLE.inner} strokeWidth={k}
                />
              </g>
            );
          })}

          {/* Channel tooltips, one per stem, shown for the stem under the
              pointer or for every stem the hovered joint drives. Anchored to
              the stem's midpoint on the channel's fixed side; drawn at a
              constant px size through k like the handles. */}
          {points.slice(1).map((p, i) => {
            const ch = order[i];
            const prev = points[i];
            const shown = hoveredLeg !== null ? hoveredLeg === i : hoveredDot !== null && i < hoveredDot;
            if (chainReveal < 1) return null;
            // Mounted whether or not it is showing, and crossfaded - the same
            // shape the halos use, and for the same reason: a pill that is
            // only in the DOM while hovered has nothing to ease in from, so it
            // popped where the halo around it eased.
            /*
             * Hidden while anything on the field is being dragged, not only a
             * handle. A drag across the field pulls the chain along under the
             * cursor, so it crosses its own stems and used to raise their
             * tooltips as it went - a gesture that is not asking what a stem
             * is, answered anyway, over the thing it is moving.
             */
            const on = shown && !dotDragging && !isHexDragging;
            const k = uiScale;
            const side = TIP_SIDE[ch];
            const cx = (prev.x + p.x) / 2 + side.x * TIP_GAP * k;
            const cy = (prev.y + p.y) / 2 + side.y * TIP_GAP * k;
            const label = TIP_LABEL[ch];
            const w = (label.length * 7 + 16) * k;
            const h = 20 * k;
            return (
              // Named on hover, quiet while moving: the tooltips fade out for
              // the drag so the halos are what the eye follows.
              <g
                key={`tip-${ch}`}
                id={`stem-tip-${ch}`}
                // In on the halos' timing; out on the drag fade's, which is
                // slower on purpose so the tooltips clear the way for a drag
                // without snatching themselves off the screen.
                className={`pointer-events-none select-none ${on ? HIGHLIGHT_IN : 'transition-opacity duration-300 ease-out motion-reduce:transition-none'}`}
                opacity={on ? 1 : 0}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))', userSelect: 'none' }}
              >
                <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h / 2} fill={TIP_FILL[ch]} fillOpacity={TIP_FILL_OPACITY} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={11 * k} fontWeight={600} letterSpacing={0.5 * k} style={{ fontFamily: 'var(--sans)' }}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* The impact layer, drawn after the joints so it sits above their
              drop shadows - inside the stem and joint groups the shadows of
              the joints fell across the halos. A lit stem is redrawn here as a
              white halo with the channel colour back on top, trimmed at each
              end to the joint's keyline so nothing crosses a core; a lit joint
              gets its keyline flush outside the ring. Hover state is repeated
              so the redraw matches the stem it covers. */}
          <g className="pointer-events-none" opacity={chainReveal}>
            {points.slice(1).map((p, i) => {
              const ch = order[i];
              const prev = points[i];
              const on = impactChannels?.has(ch) ?? false;
              const k = uiScale;
              const dx = p.x - prev.x, dy = p.y - prev.y, len = Math.hypot(dx, dy);
              // Resting ring geometry: the hover thickening is outward and
              // small, so the trim is taken at rest and the overlap on hover
              // is under the joint's own keyline.
              const outer = (j: number) => (ringRadius(HANDLE.ring) + HANDLE.ring / 2 + (j === points.length - 1 ? 2 : 0) + 2.5) * k;
              const t0 = i === 0 ? 4 * k : outer(i);
              const t1 = outer(i + 1);
              if (len <= t0 + t1) return null;
              const ux = dx / len, uy = dy / len;
              const x1 = prev.x + ux * t0, y1 = prev.y + uy * t0, x2 = p.x - ux * t1, y2 = p.y - uy * t1;
              const stemPx = stemRange
                ? Math.min(stemRange[1], Math.max(stemRange[0], stemRange[1] / uiScale))
                : 2 / uiScale;
              const stemUnits = stemPx * uiScale;
              const isHighlighted = hoveredLeg === i;
              return (
                <g key={`impact-stem-${ch}`} id={`impact-stem-${ch}`} opacity={on ? 1 : 0} className={on ? HIGHLIGHT_IN : HIGHLIGHT_OUT}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} {...CALLOUT_LINE} strokeLinecap="butt" strokeWidth={stemUnits + pxUnits(4)} />
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isHighlighted ? lift(CHANNEL_COLOR[ch]) : CHANNEL_COLOR[ch]}
                    strokeWidth={isHighlighted ? stemUnits * 1.5 : stemUnits}
                    strokeLinecap="butt"
                  />
                </g>
              );
            })}
            {points.slice(1).map((p, i) => {
              const ch = order[i];
              const on = impactChannels?.has(ch) ?? false;
              const k = uiScale;
              const isTip = i === points.length - 2;
              const ringW = hoveredDot === i + 1 ? HANDLE.ring * HANDLE.hoverScale : HANDLE.ring;
              const ringR = ringRadius(ringW) + (isTip ? 2 : 0);
              return (
                <circle
                  key={`impact-joint-${ch}`}
                  cx={p.x} cy={p.y} r={(ringR + ringW / 2 + 1.25) * k}
                  fill="none" {...CALLOUT_LINE} strokeWidth={2.5 * k}
                  opacity={on ? 1 : 0}
                  className={on ? HIGHLIGHT_IN : HIGHLIGHT_OUT}
                />
              );
            })}
          </g>

          {/* Hover preview dot for named color match */}
          {hoverDot && (
            <circle
              cx={hoverDot.x}
              cy={hoverDot.y}
              r={10}
              fill={hoverDot.hex}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="3 3"
              className="pointer-events-none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
            />
          )}

          {blBar && (
            <BrightnessBar
              hue={hue} saturation={saturation} brightness={brightness} hsl={hsl}
              blMode={blMode} blPointerDownRef={blPointerDown} onArrowDragStart={startBLDrag}
              animateBLToValue={animateBLToValue} colorSpace={colorSpace}
              lit={blBarLit}
            />
          )}

          {satBar && (
            <SaturationBar
              hue={hue} saturation={satValue} brightness={brightness}
              blMode={blMode} lightness={hsl?.l ?? 50}
              satPointerDownRef={satPointerDown} onArrowDragStart={startSatDrag}
              animateSatToValue={animateSatToValue} colorSpace={colorSpace}
              lit={satBarLit}
            />
          )}
        </svg>

        {vertexLabels && <ColorLabels onColorClick={handleColorLabelClick} extent={EXTENT} svgHeight={svgHeight} />}

        {/* HTML color marker tooltip */}
        {hoveredMarker && (() => {
          const mr = parseInt(hoveredMarker.hex.slice(1, 3), 16);
          const mg = parseInt(hoveredMarker.hex.slice(3, 5), 16);
          const mb = parseInt(hoveredMarker.hex.slice(5, 7), 16);
          const tc = (mr * 0.299 + mg * 0.587 + mb * 0.114) > 150 ? '#000' : '#fff';
          return (
            <div
              className="absolute z-[9] -translate-x-1/2 pointer-events-none"
              style={{ left: hoveredMarker.x, top: hoveredMarker.y - 14 }}
            >
              <div
                className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-md -translate-y-full"
                style={{ backgroundColor: hoveredMarker.hex, color: tc }}
              >
                {hoveredMarker.name}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `5px solid ${hoveredMarker.hex}`,
                  }}
                />
              </div>
            </div>
          );
        })()}
        {showHueLine && <HueHandle hue={hue} hueLabel={hueLabel} extent={EXTENT} svgHeight={svgHeight} onMouseDown={handleHueDragStart} lit={hueBadgeLit} />}
        {blBar && blMarkers && <BrightnessMarkers blMode={blMode} svgHeight={svgHeight} onPick={animateBLToValue} />}
        {blBar && blMarkers && (
          <BrightnessHandle
            hue={hue}
            saturation={saturation}
            brightness={brightness}
            hsl={hsl}
            blMode={blMode}
            svgHeight={svgHeight}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startBLDrag();
              scheduleHoldTone();
            }}
          />
        )}
        {satBar && <SaturationMarkers extent={EXTENT} svgHeight={svgHeight} onPick={animateSatToValue} />}
        {satBar && (
          <SaturationHandle
            hue={hue}
            saturation={satValue}
            swatchSaturation={saturation}
            brightness={brightness}
            extent={EXTENT}
            svgHeight={svgHeight}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startSatDrag();
              scheduleHoldTone();
            }}
          />
        )}
      </div>
      </div>

      {belowStage && <div className="w-full">{belowStage}</div>}

      </div>
      </div>

    </div>
  );
}
