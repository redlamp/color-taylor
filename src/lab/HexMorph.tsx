/**
 * The hexagon, told the truth: the picker's own field, bent into the shape the
 * colours are really in.
 *
 * Drag the morph slider and nothing is recoloured - every pixel keeps the
 * colour it had and moves to where the target space puts it. So every
 * difference you can see between the two ends is a claim the hexagon makes
 * that is not true.
 *
 * Four things ride the morph, and each is there for a different reason:
 *
 * - **The field**, in WebGL, because it is the thing being claimed about. See
 *   hexMorphRenderer.ts for why both ends live in the vertex buffer.
 * - **Your own colour's marker**, because watching the colour you chose move
 *   is a stronger argument than watching a field move.
 * - **The six corners**, labelled, because the collapse from six-fold to
 *   three-fold is the single best thing the figure shows and it is only
 *   followable if you can keep your eye on which corner is which.
 * - **A ray every 30 degrees of HSB hue**, because evenly spaced spokes
 *   bunching up is what makes the distortion legible rather than merely
 *   pretty. The hexagon spaces them 30 degrees apart by construction; nothing
 *   else does.
 *
 * The arithmetic is in src/utils/gamutMorph.ts and asserted against culori in
 * gamutMorph.test.ts. Nothing here computes a colour position itself.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rgbToHex, type HSB, type RGB } from '@/utils/colorConversions';
import {
  cornerReadings, rimShape, anchorReach, xyToMorphPoint, CORNERS, type MorphTarget,
} from '@/utils/gamutMorph';
import { SPECTRAL_LOCUS, type Xy } from '@/utils/cie';
import { gamutById, gamutRgbToXyY } from '@/utils/gamuts';
import type { Gamut, GamutId } from '@/utils/gamuts';
import {
  CENTER_X, CENTER_Y, RADIUS, HEX_SIZE, colorAtPoint, pointForColor,
} from '@/components/hex/hexConstants';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GAMUT_TINT } from './CieDiagram';
import { perfTime } from './perf';
import {
  buildMorphMesh, createHexMorphRenderer, fieldPointFor, hexPointAt,
  HEX_WINDOW, type FieldPoint, type HexMorphRenderer, type MorphWindow,
} from './hexMorphRenderer';

/** A ray every 30 degrees: the twelve the hexagon claims are evenly spaced. */
const RAY_STEP = 30;
/** Points along one ray. Enough that a bent ray reads as a curve, not a kink. */
const RAY_SAMPLES = 32;
/** Points round an outline. 180 hits all six corners exactly. */
const RIM_SAMPLES = 180;

/**
 * Text inside the figure is sized in SVG user units, the same way CieDiagram
 * sizes its labels and for the same reason: it scales with the viewBox, so a
 * Tailwind step would not survive the figure being resized and `text-base`
 * would not mean anything here. 20 units is about 17 CSS px at the size this
 * renders, which is a label.
 */
const LABEL_PX = 20;
const READOUT_PX = 16;

/** One thing that moves: the same points at both ends of the morph. */
interface Track {
  a: FieldPoint[];
  b: FieldPoint[];
}

const lerp = (p: FieldPoint, q: FieldPoint, t: number) => ({
  x: p.x + (q.x - p.x) * t,
  y: p.y + (q.y - p.y) * t,
});

const points = (track: Track, t: number) => track.a
  .map((p, i) => {
    const q = lerp(p, track.b[i], t);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  })
  .join(' ');

/**
 * Which picture the morph is framed inside.
 *
 * `hex` is the hexagon's own box, and the figure fills it. `cie` pulls the
 * camera back far enough to take in the CIE 1931 spectral locus and draws it,
 * with the gamut triangles, round the outside - so the same morph answers a
 * second question: not only "where do these colours really go", but "where
 * does the whole wheel sit inside everything the eye can see".
 */
export type MorphFrame = 'hex' | 'cie';

/**
 * The chromaticity window the CIE frame shows, in the same coordinates
 * CieDiagram.tsx uses, so the two panels crop the diagram the same way.
 */
const CIE_WINDOW = { X0: -0.085, X1: 0.80, Y0: -0.05, Y1: 0.90 };

/** A chromaticity in field units - where the xy morph lands it at t = 1. */
const xyToField = (p: Xy, gamut: GamutId): FieldPoint => {
  const m = xyToMorphPoint(p.x, p.y, gamut);
  return { x: CENTER_X + RADIUS * m.x, y: CENTER_Y - RADIUS * m.y };
};

/**
 * The square of field units that holds the whole chromaticity window.
 *
 * Computed from the window's four corners rather than assumed, because the
 * morph plane is the xy plane turned by red's angle from that space's white -
 * a fifth of a degree in sRGB, more in some of the others - so the mapped
 * window is a rectangle slightly off square with the field axes. Its bounding
 * box is what has to fit. The figure is square, so the shorter side is grown
 * to match the longer and the result is centred on the window.
 *
 * Per gamut, because the plane is anchored on that space's own white and red:
 * a wider space puts one hexagon radius further out in chromaticity, so the
 * locus is closer in and the whole picture zooms.
 */
const cieFrameWindow = (gamut: GamutId): MorphWindow => {
  const corners = [
    { x: CIE_WINDOW.X0, y: CIE_WINDOW.Y0 }, { x: CIE_WINDOW.X1, y: CIE_WINDOW.Y0 },
    { x: CIE_WINDOW.X1, y: CIE_WINDOW.Y1 }, { x: CIE_WINDOW.X0, y: CIE_WINDOW.Y1 },
  ].map((p) => xyToField(p, gamut));
  const xs = corners.map((p) => p.x), ys = corners.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const size = Math.max(maxX - minX, maxY - minY);
  return { x: (minX + maxX) / 2 - size / 2, y: (minY + maxY) / 2 - size / 2, size };
};

/**
 * THE MORPH, EXTENDED PAST THE GAMUT - AND IT IS AN EXTRAPOLATION.
 *
 * Inside the gamut the morph is a fact. Every point of the field is a colour,
 * that colour has a place on the hexagon and a place in the target space, and
 * the figure moves it from one to the other. Nothing is invented.
 *
 * The spectral locus is not inside the gamut. Those chromaticities are not
 * sRGB colours - no light of that purity is - so they have no HSB
 * coordinates, no place on the hexagon, and the morph simply does not say
 * where they go. Leaving them still while everything else moves is one answer
 * and it is a poor one: it draws the horseshoe as though the hexagon had a
 * canonical place for it, which it has not.
 *
 * The extension used here, and it is a choice rather than a discovery:
 *
 * - Work in polar coordinates about white, which both spaces pin at the
 *   origin.
 * - In a given direction, the gamut boundary already has a correspondence -
 *   the rim of the hexagon against the rim of the gamut - which fixes both a
 *   remapped angle and a radial ratio for that direction.
 * - Carry a point outside the gamut along its own ray by the same ratio, at
 *   the same remapped angle.
 *
 * That is continuous, it agrees with the real morph exactly on the boundary,
 * and it is defined everywhere but at white itself. What it is not is a fact
 * about colour: the horseshoe's shape at t = 0 is a consequence of this rule,
 * and a different rule would draw a different curve. The panel's tooltip says
 * so, because a figure that does not admit its extrapolations is worse than
 * no figure.
 *
 * Only for the `xy` target. Oklab's a/b plane has no horseshoe to warp - a
 * chromaticity is a whole line there rather than a point, see
 * `xyToMorphPoint` - so there is nothing to extend and the frame is not
 * offered.
 */
interface RimRow {
  /** Angle in the target plane, 0 to 2pi. The key this table is searched by. */
  tAngle: number;
  /** Where that direction comes from on the hexagon. */
  hAngle: number;
  /** Hexagon radius over target radius in that direction: the ratio carried. */
  k: number;
}

const TWO_PI = Math.PI * 2;
const wrap = (a: number) => ((a % TWO_PI) + TWO_PI) % TWO_PI;

/** Shortest way round between two angles, so a remap never spins the long way. */
const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= TWO_PI;
  while (d < -Math.PI) d += TWO_PI;
  return a + d * t;
};

/** Polar about the figure's centre, with y up the way the morph plane counts. */
const polar = (p: FieldPoint) => {
  const dx = p.x - CENTER_X, dy = CENTER_Y - p.y;
  return { angle: wrap(Math.atan2(dy, dx)), r: Math.hypot(dx, dy) };
};

function buildRimMap(rim: Track): RimRow[] {
  const rows: RimRow[] = [];
  for (let i = 0; i < rim.a.length; i++) {
    const h = polar(rim.a[i]), t = polar(rim.b[i]);
    if (t.r <= 1e-6) continue;
    rows.push({ tAngle: t.angle, hAngle: h.angle, k: h.r / t.r });
  }
  rows.sort((p, q) => p.tAngle - q.tAngle);
  return rows;
}

/** Where a point of the target plane came from, under the extension above. */
function unwarp(rows: RimRow[], p: FieldPoint): FieldPoint {
  if (rows.length < 2) return p;
  const { angle, r } = polar(p);
  // The table is sorted and closed, so the bracket is a binary search and one
  // wrap-around case: the gap between the last row and the first.
  let lo = 0, hi = rows.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].tAngle <= angle) lo = mid + 1; else hi = mid;
  }
  const i = (lo - 1 + rows.length) % rows.length;
  const j = (i + 1) % rows.length;
  let span = rows[j].tAngle - rows[i].tAngle;
  if (span <= 0) span += TWO_PI;
  let along = angle - rows[i].tAngle;
  if (along < 0) along += TWO_PI;
  const u = span > 0 ? Math.min(1, along / span) : 0;
  const hAngle = lerpAngle(rows[i].hAngle, rows[j].hAngle, u);
  const k = rows[i].k + (rows[j].k - rows[i].k) * u;
  const d = r * k;
  return { x: CENTER_X + d * Math.cos(hAngle), y: CENTER_Y - d * Math.sin(hAngle) };
}

/**
 * HOW FAR THE FIGURE IS TURNED BEFORE ANYONE TOUCHES IT.
 *
 * The morph pins red at the hexagon's own corner, due east. The chromaticity
 * diagram draws x rightward and y upward and puts red wherever its
 * chromaticity falls, which is not due east from white: 0.2 degrees off in
 * sRGB, 1.4 in Display P3, 5.3 in Rec. 2020 and 13.5 in ProPhoto, whose red
 * is far round and whose white is D50. So at t = 1 this figure and the flat
 * diagram were showing the same triangle at different angles - invisible for
 * sRGB and plainly wrong for the wide spaces.
 *
 * Two frames, two right answers:
 *
 * - In the **hexagon** frame the figure is the picker's own, and red east is
 *   the picker's convention. No turn.
 * - In the **CIE** frame the figure is the chromaticity plane, drawn beside a
 *   panel that draws the same plane. It is turned back by red's own angle, so
 *   at t = 1 the triangle, the horseshoe and the outlines land exactly as the
 *   flat panel draws them - and at t = 0 the hexagon is the one tilted, which
 *   is the honest way round: it is the hexagon that has no business claiming
 *   an orientation in chromaticity.
 *
 * The anchoring itself is untouched. Red is still pinned, still fixes the
 * scale, and the collapse you watch is still the spacing rather than the
 * field turning. This is a rotation of the *picture*, applied after.
 */
function baseRotation(frame: MorphFrame, gamut: GamutId): number {
  if (frame !== 'cie') return 0;
  const red = gamutRgbToXyY(gamut, 255, 0, 0);
  if (!red) return 0;
  const w = gamutById(gamut).white;
  // Field units have y down and SVG turns clockwise, so the sign flips twice
  // and comes back: this is red's angle above the horizontal, as a clockwise
  // screen rotation that undoes it.
  return (Math.atan2(red.y - w.y, red.x - w.x) * 180) / Math.PI;
}

/** How the figure is being looked at, over and above the frame's own window. */
interface Lens {
  /** 1 is the frame's own window; above 1 is closer in. */
  zoom: number;
  /** Where the centre has been dragged to, in field units. */
  panX: number;
  panY: number;
  /** Degrees clockwise, on top of the frame's base rotation. */
  turn: number;
}

const NEUTRAL_LENS: Lens = { zoom: 1, panX: 0, panY: 0, turn: 0 };

export interface HexMorphProps {
  rgb: RGB;
  hsb: HSB;
  target: MorphTarget;
  frame: MorphFrame;
  /** Outlined in the CIE frame. Ignored in the hexagon frame, which has no room. */
  gamuts: readonly Gamut[];
  activeId: GamutId;
  /** Drop the reading matter beside the figure; the host puts it elsewhere. */
  compact?: boolean;
}

export default function HexMorph({ rgb, hsb, target, frame, gamuts, activeId, compact = false }: HexMorphProps) {
  /*
   * The picker's three numbers are read as values in the gamut the
   * chromaticity panel is reading from, and everything below follows: the
   * field, the rays, the six corners, the marker and the frame. The hexagon
   * at t = 0 is identical in every space - that is the point - and where it
   * lands at t = 1 is not.
   */
  const gamut = activeId;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<HexMorphRenderer | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [t, setT] = useState(0);
  /*
   * The lens is reset whenever the frame or the space changes: each frame has
   * its own idea of where the middle is and how far out to stand, so carrying
   * a zoom across would land somewhere arbitrary.
   */
  /*
   * The lens carries the frame and the space it was set in, and a lens from
   * another one reads as no lens at all. That is the reset, done during
   * render and without an effect: an effect would let the figure paint once
   * at the old zoom before snapping, and a ref written during render is what
   * this project's lint rules exist to stop.
   */
  const lensKey = `${frame}:${gamut}`;
  const [stored, setStored] = useState<Lens & { key: string }>({ ...NEUTRAL_LENS, key: lensKey });
  const lens: Lens = stored.key === lensKey ? stored : NEUTRAL_LENS;
  const setLens = useCallback((next: Lens | ((prev: Lens) => Lens)) => {
    setStored((prev) => {
      const from: Lens = prev.key === lensKey ? prev : NEUTRAL_LENS;
      return { ...(typeof next === 'function' ? next(from) : next), key: lensKey };
    });
  }, [lensKey]);

  const base = useMemo(() => (frame === 'cie' ? cieFrameWindow(gamut) : HEX_WINDOW), [frame, gamut]);
  const view = useMemo<MorphWindow>(() => {
    const size = base.size / lens.zoom;
    const cx = base.x + base.size / 2 + lens.panX;
    const cy = base.y + base.size / 2 + lens.panY;
    return {
      x: cx - size / 2,
      y: cy - size / 2,
      size,
      rotate: baseRotation(frame, gamut) + lens.turn,
      // Turned about the figure's own centre - white - rather than about the
      // window's, so panning and turning stay independent of each other.
      rotateAbout: { x: CENTER_X, y: CENTER_Y },
    };
  }, [base, lens, frame, gamut]);
  // Only the ResizeObserver reads these, and only after a paint - so writing
  // them from an effect is both correct and what CieSolid does next door.
  const tRef = useRef(0);
  const viewRef = useRef<MorphWindow>(HEX_WINDOW);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { viewRef.current = view; }, [view]);

  /*
   * The expensive half, and it deliberately does not depend on `t`: both ends
   * of every vertex are computed here and the slider only mixes them. It does
   * depend on brightness, because the field is the picker's field at whatever
   * the bar says - so a brightness drag rebuilds and a morph drag does not.
   */
  const mesh = useMemo(
    () => perfTime('morph mesh', () => buildMorphMesh(hsb.b, target, gamut)),
    [hsb.b, target, gamut],
  );

  /** The overlay's tracks, on the same terms: both ends once, mixed per frame. */
  const overlay = useMemo(() => {
    const ray = (hueDeg: number): Track => {
      const a: FieldPoint[] = [], b: FieldPoint[] = [];
      for (let i = 0; i < RAY_SAMPLES; i++) {
        const f = i / (RAY_SAMPLES - 1);
        const p = hexPointAt(hueDeg, f);
        a.push(p);
        // The colour the picker paints there, read straight off the field's
        // own rule, so a ray is made of the pixels it runs over rather than of
        // an idealised HSB ramp.
        const c = colorAtPoint(p.x, p.y, hsb.b);
        b.push(fieldPointFor(c.r, c.g, c.b, target, gamut));
      }
      return { a, b };
    };
    const ring = (fraction: number): Track => {
      const a: FieldPoint[] = [], b: FieldPoint[] = [];
      for (let i = 0; i <= RIM_SAMPLES; i++) {
        const h = ((i % RIM_SAMPLES) / RIM_SAMPLES) * 360;
        const p = hexPointAt(h, fraction);
        a.push(p);
        const c = colorAtPoint(p.x, p.y, hsb.b);
        b.push(fieldPointFor(c.r, c.g, c.b, target, gamut));
      }
      return { a, b };
    };
    return {
      rays: Array.from({ length: 360 / RAY_STEP }, (_, i) => ({
        hue: i * RAY_STEP,
        landmark: (i * RAY_STEP) % 60 === 0,
        track: ray(i * RAY_STEP),
      })),
      rim: ring(1),
      // What is actually reachable at this brightness. The picker draws it as
      // a dashed limit; at 100 it is the rim itself, so there is nothing to
      // draw twice.
      crossSection: hsb.b < 100 && hsb.b > 0 ? ring(hsb.b / 100) : null,
      landmarks: CORNERS.map((c) => ({
        name: c.name,
        letter: c.name[0],
        hex: rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b),
        a: hexPointAt(c.hsbHue, 1),
        b: fieldPointFor(c.rgb.r, c.rgb.g, c.rgb.b, target, gamut),
      })),
    };
  }, [hsb.b, target, gamut]);

  /*
   * The marker. `pointForColor` is what the picker uses to place a colour on
   * its own field, so at t = 0 this sits exactly where the picker's handle
   * would - not near it.
   */
  const marker = useMemo(() => ({
    a: pointForColor(rgb, 'brightness', 1),
    b: fieldPointFor(rgb.r, rgb.g, rgb.b, target, gamut),
  }), [rgb, target, gamut]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let r: HexMorphRenderer | null = null;
    try { r = createHexMorphRenderer(canvas); } catch (e) { console.error(e); }
    if (!r) { queueMicrotask(() => setUnsupported(true)); return; }
    rendererRef.current = r;
    const ro = new ResizeObserver(() => r.draw(tRef.current, viewRef.current));
    ro.observe(canvas);
    return () => { ro.disconnect(); r.destroy(); rendererRef.current = null; };
  }, []);

  /*
   * Wheel to zoom, drag to pan, shift-drag to turn, double-click to reset.
   *
   * On the wrapper rather than on the canvas, because the SVG overlay sits on
   * top of it and would otherwise swallow every press. Nothing else in this
   * figure wants a drag, so a plain one can be the pan.
   */
  const gesture = useRef<{ x: number; y: number; lens: Lens; turning: boolean } | null>(null);
  const onGesturePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    gesture.current = { x: e.clientX, y: e.clientY, lens, turning: e.shiftKey };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [lens]);

  const onGesturePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (g.turning) {
      setLens({ ...g.lens, turn: g.lens.turn + dx * 0.4 });
      return;
    }
    // A drag moves the picture with the pointer, so the window moves against
    // it - and in field units, which shrink as the zoom grows.
    const box = e.currentTarget.getBoundingClientRect();
    const perPx = box.width > 0 ? (viewRef.current.size / box.width) : 1;
    setLens({ ...g.lens, panX: g.lens.panX - dx * perPx, panY: g.lens.panY - dy * perPx });
  }, [setLens]);
  const endGesture = useCallback(() => { gesture.current = null; }, []);
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    setLens((l) => ({ ...l, zoom: Math.max(0.25, Math.min(8, l.zoom * Math.exp(-e.deltaY * 0.0015))) }));
  }, [setLens]);

  useEffect(() => { perfTime('morph upload', () => rendererRef.current?.setMesh(mesh)); }, [mesh]);
  // One draw per frame, for the reason CieSolid coalesces its own: a drag on
  // the hexagon drives this panel too, and the frames in between are not seen.
  const drawRaf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(drawRaf.current);
    drawRaf.current = requestAnimationFrame(() => {
      perfTime('morph draw', () => rendererRef.current?.draw(tRef.current, viewRef.current));
    });
    return () => cancelAnimationFrame(drawRaf.current);
  }, [t, mesh, view]);

  const shape = useMemo(() => rimShape(target, 1440, gamut), [target, gamut]);
  const here = useMemo(() => {
    const m = fieldPointFor(rgb.r, rgb.g, rgb.b, target, gamut);
    const dx = m.x - CENTER_X, dy = CENTER_Y - m.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { angle: angle < 0 ? angle + 360 : angle, reach: Math.hypot(dx, dy) / RADIUS };
  }, [rgb, target, gamut]);

  /*
   * The horseshoe and the gamut outlines as tracks, so they move with the
   * slider like everything else in the figure. At t = 1 they are where the
   * chromaticity diagram draws them; at t = 0 they are where the extension
   * above puts them, which is what the hexagon's regularity costs the rest of
   * the plane.
   */
  const cieTracks = useMemo(() => {
    if (frame !== 'cie') return null;
    const rows = buildRimMap(overlay.rim);
    const track = (pts: readonly Xy[]): Track => {
      const b = pts.map((q) => xyToField(q, gamut));
      return { a: b.map((q) => unwarp(rows, q)), b };
    };
    return {
      locus: track(SPECTRAL_LOCUS),
      gamuts: gamuts.map((g) => ({ id: g.id, track: track(g.primaries) })),
    };
  }, [frame, overlay.rim, gamut, gamuts]);

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const at = (track: { a: FieldPoint; b: FieldPoint }) => lerp(track.a, track.b, t);
  const markerAt = at(marker);
  const spaceName = target === 'xy' ? 'CIE xy' : 'Oklab a/b';

  return (
    <div className={compact
      ? 'flex min-h-0 min-w-0 flex-1 flex-col'
      : 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]'}>
      {/* Capped rather than free: the figure is square, so a full-width column
          on a wide page makes it a thousand pixels tall and pushes the reading
          matter beside it off the screen. In a compact host the cell's own
          height is the cap instead, and the figure is centred in what is left. */}
      <div className={compact
        ? 'flex min-h-0 min-w-0 flex-1 flex-col items-center gap-2'
        : 'mx-auto flex w-full min-w-0 max-w-[560px] flex-col gap-3'}>
        {/* In a compact host the figure is square and the cell decides how
            much room it has, so the width comes from the cell's own height
            through `container-type: size` - the same arrangement CieLab's
            `Fit` uses, and for the same reason: a square that takes the full
            width would be taller than the cell and lose its slider. */}
        <div
          className={compact
            ? 'flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]'
            : 'contents'}
        >
        <div
          className="relative w-full cursor-grab touch-none overflow-hidden rounded-md bg-muted/40 active:cursor-grabbing"
          style={{ aspectRatio: '1 / 1', ...(compact ? { width: 'min(100%, 100cqh)' } : null) }}
          onPointerDown={onGesturePointerDown}
          onPointerMove={onGesturePointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onDoubleClick={() => setLens(NEUTRAL_LENS)}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
          {unsupported && (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-base text-muted-foreground">
              This figure needs WebGL2, which this browser has not given us.
            </p>
          )}
          <svg
            viewBox={`${view.x} ${view.y} ${view.size} ${view.size}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={
              `The picker's hexagon morphed ${(t * 100).toFixed(0)}% of the way into ${spaceName}`
              + `${frame === 'cie'
                ? `, with the CIE 1931 spectral locus and the gamut outlines carried by the same warp - `
                  + `its shape at ${(t * 100).toFixed(0)} per cent is an extrapolation outside the gamut, not a measurement`
                : ''}. `
              + `The colour ${hex.toUpperCase()} sits at ${here.angle.toFixed(1)} degrees from red, `
              + `${here.reach.toFixed(2)} of red's distance from white.`
            }
          >
            {/* Everything the figure draws turns together with the field the
                shader draws underneath it - same angle, same centre, same
                sense - or the outline slides off its own paint. */}
            <g transform={`rotate(${(view.rotate ?? 0).toFixed(4)} ${CENTER_X} ${CENTER_Y})`}>
            {/* ── the CIE 1931 shape, carried by the same warp ───────────
                Drawn first, so everything else is over it.

                These move. At t = 1 the horseshoe is where the chromaticity
                diagram draws it and the field's rim sits exactly on the
                *selected* gamut's triangle - a theorem this page proves
                elsewhere, and true of whichever gamut is being read from,
                because a fully saturated colour is a mix of two of that
                space's primaries. At t = 0 the field is a regular hexagon and
                the horseshoe has been dragged out of shape to allow it.

                Outside the gamut that dragging is an *extrapolation* and not
                a measurement - see the block comment on `unwarp` for the rule
                and for why one was needed at all. */}
            {cieTracks && (
              <g fill="none" strokeLinejoin="round">
                <polygon points={points(cieTracks.locus, t)} stroke="#000000" strokeOpacity={0.45} strokeWidth={5} />
                <polygon points={points(cieTracks.locus, t)} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2.5} />
                {cieTracks.gamuts.map((g) => {
                  const tint = GAMUT_TINT[g.id];
                  const stroke = `rgb(${tint.map((v) => Math.round(v * 255)).join(' ')})`;
                  return (
                    <polygon
                      key={g.id}
                      points={points(g.track, t)}
                      stroke={stroke}
                      strokeOpacity={g.id === activeId ? 0.95 : 0.6}
                      strokeWidth={g.id === activeId ? 3 : 2}
                      strokeDasharray={g.id === activeId ? undefined : '9 7'}
                    />
                  );
                })}
              </g>
            )}
            {/* The twelve hue rays. Even at t = 0 they are the figure's claim:
                thirty degrees apart, all the way round, by construction. */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {overlay.rays.map((r) => (
                <g key={r.hue}>
                  <polyline points={points(r.track, t)} stroke="#000000" strokeOpacity={0.35} strokeWidth={r.landmark ? 4 : 3} />
                  <polyline points={points(r.track, t)} stroke="#ffffff" strokeOpacity={r.landmark ? 0.95 : 0.55} strokeWidth={r.landmark ? 2 : 1} />
                </g>
              ))}
            </g>

            {/* The reachable cross-section at this brightness: the picker's
                dashed limit, morphed with everything else. */}
            {overlay.crossSection && (
              <g fill="none" strokeLinejoin="round">
                <polyline points={points(overlay.crossSection, t)} stroke="#000000" strokeOpacity={0.4} strokeWidth={4} strokeDasharray="8 8" />
                <polyline points={points(overlay.crossSection, t)} stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="8 8" />
              </g>
            )}

            {/* The outline. A regular hexagon at one end, the gamut at the other. */}
            <g fill="none" strokeLinejoin="round">
              <polyline points={points(overlay.rim, t)} stroke="#000000" strokeOpacity={0.45} strokeWidth={6} />
              <polyline points={points(overlay.rim, t)} stroke="#ffffff" strokeOpacity={0.95} strokeWidth={3} />
            </g>

            {/* White, pinned. It is an anchor rather than a measurement - the
                hexagon puts it here by construction and so does the morph. */}
            <g stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2}>
              <line x1={CENTER_X - 9} y1={CENTER_Y} x2={CENTER_X + 9} y2={CENTER_Y} />
              <line x1={CENTER_X} y1={CENTER_Y - 9} x2={CENTER_X} y2={CENTER_Y + 9} />
            </g>

            {/* Where the shape's own middle is, once nothing holds it at white. */}
            <g>
              {(() => {
                const c = lerp(
                  { x: CENTER_X, y: CENTER_Y },
                  { x: CENTER_X + RADIUS * shape.centroid.x, y: CENTER_Y - RADIUS * shape.centroid.y },
                  t,
                );
                return (
                  <circle
                    cx={c.x} cy={c.y} r={7} fill="none"
                    stroke="#ffffff" strokeOpacity={0.55 * t} strokeWidth={2} strokeDasharray="3 4"
                  />
                );
              })()}
            </g>

            {/* The six corners, tracked and named. */}
            <g>
              {overlay.landmarks.map((l) => {
                const p = lerp(l.a, l.b, t);
                const dx = p.x - CENTER_X, dy = p.y - CENTER_Y;
                const len = Math.hypot(dx, dy) || 1;
                return (
                  <g key={l.name}>
                    <circle cx={p.x} cy={p.y} r={8} fill={l.hex} stroke="#000000" strokeOpacity={0.6} strokeWidth={4} />
                    <circle cx={p.x} cy={p.y} r={8} fill={l.hex} stroke="#ffffff" strokeWidth={2} />
                    <text
                      x={p.x + (dx / len) * 26} y={p.y + (dy / len) * 26 + 7}
                      textAnchor="middle" fontSize={LABEL_PX} fontWeight={600}
                      fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke"
                    >{l.letter}</text>
                  </g>
                );
              })}
            </g>

            {/* Your colour. The trail is where it came from, so the move reads
                as a move even when the slider is parked at one end. */}
            <line
              x1={marker.a.x} y1={marker.a.y} x2={markerAt.x} y2={markerAt.y}
              stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 5"
            />
            <g data-testid="morph-marker" data-t={t.toFixed(3)} data-x={markerAt.x.toFixed(2)} data-y={markerAt.y.toFixed(2)}>
              <circle cx={markerAt.x} cy={markerAt.y} r={13} fill="none" stroke="#000000" strokeOpacity={0.5} strokeWidth={7} />
              <circle cx={markerAt.x} cy={markerAt.y} r={13} fill={hex} stroke="#ffffff" strokeWidth={4} />
            </g>

            </g>
            {/* Outside the rotated group: a label that turned with the figure
                would be unreadable at the one moment it matters. */}
            <text
              x={view.x + 12} y={view.y + view.size - 12} fontSize={READOUT_PX * (view.size / HEX_SIZE)} className="tabular-nums"
              fill="#ffffff" stroke="#000000" strokeWidth={3 * (view.size / HEX_SIZE)} paintOrder="stroke"
            >{t === 0 ? 'the hexagon' : t === 1 ? spaceName : `${(t * 100).toFixed(0)}% of the way to ${spaceName}`}</text>
          </svg>
        </div>
        </div>

        {/* Full width of the cell, with the panel's own padding as the only
            inset: the slider is what this panel is for. The readout beside it
            is a fixed 4rem with tabular figures, so the track's length does
            not change as t counts up - the same static-size rule as the text
            blocks, in the horizontal direction. */}
        <div className="flex w-full items-center gap-3">
          <span className="w-16 shrink-0 text-base tabular-nums text-muted-foreground">t {t.toFixed(2)}</span>
          <Slider
            aria-label="Morph the hexagon into the target space"
            value={[t]}
            min={0}
            max={1}
            step={0.005}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === 'number') setT(next);
            }}
            className="flex-1"
          />
          <div className="flex shrink-0 gap-1">
            {([['0', 0], ['½', 0.5], ['1', 1]] as const).map(([label, v]) => (
              <Button key={label} size="sm" variant="outline" onClick={() => setT(v)}>{label}</Button>
            ))}
          </div>
        </div>
      </div>

      {!compact && <MorphReadings rgb={rgb} hsb={hsb} target={target} />}
    </div>
  );
}

/**
 * The numbers beside the figure: where this colour went, where the six corners
 * went, and what one hexagon radius is worth in the target's own units.
 *
 * Split out because the 2x2 grid has no room for a table beside a square
 * figure. The host shows it on the page's second tab, next to the prose that
 * quotes the same figures - which is a better place for it than a column that
 * had to be 420px wide.
 */
export function MorphReadings({ rgb, hsb, target, gamut = 'srgb' }: {
  rgb: RGB; hsb: HSB; target: MorphTarget; gamut?: GamutId;
}) {
  const readings = useMemo(() => cornerReadings(target, gamut), [target, gamut]);
  const here = useMemo(() => {
    const m = fieldPointFor(rgb.r, rgb.g, rgb.b, target, gamut);
    const dx = m.x - CENTER_X, dy = CENTER_Y - m.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { angle: angle < 0 ? angle + 360 : angle, reach: Math.hypot(dx, dy) / RADIUS };
  }, [rgb, target, gamut]);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const spaceName = target === 'xy' ? 'CIE xy' : 'Oklab a/b';

  return (
      <div className="flex min-w-0 flex-col gap-3">
        <div className="rounded-md border border-border p-3">
          <h3 className="mb-1 font-semibold">This colour</h3>
          <p className="text-base text-muted-foreground">
            The hexagon puts <code className="font-mono">{hex.toUpperCase()}</code> at
            hue <span className="tabular-nums text-foreground">{hsb.h.toFixed(0)}&deg;</span> and
            saturation <span className="tabular-nums text-foreground">{hsb.s.toFixed(0)}</span>.
            {' '}{spaceName} puts it at <span className="tabular-nums text-foreground">{here.angle.toFixed(1)}&deg;</span> from
            red, <span className="tabular-nums text-foreground">{here.reach.toFixed(2)}</span> of
            red&rsquo;s own distance from white. Drag the slider and watch the marker make that trip.
          </p>
        </div>

        <table className="w-full text-base tabular-nums">
          <caption className="mb-1 text-left font-semibold">
            The six corners in {spaceName}
          </caption>
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="text-left font-medium">Corner</th>
              <th scope="col" className="text-right font-medium">HSB</th>
              <th scope="col" className="text-right font-medium">Here</th>
              <th scope="col" className="text-right font-medium">Gap</th>
              <th scope="col" className="text-right font-medium">Reach</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((c) => (
              <tr key={c.name}>
                <th scope="row" className="text-left font-normal">{c.name}</th>
                <td className="text-right text-muted-foreground">{c.hsbHue}&deg;</td>
                <td className="text-right">{c.angle.toFixed(1)}&deg;</td>
                <td className="text-right">{c.gap.toFixed(1)}&deg;</td>
                <td className="text-right">{c.reach.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t border-border text-muted-foreground">
              <th scope="row" className="text-left font-normal">Hexagon</th>
              <td className="text-right">&mdash;</td>
              <td className="text-right">even</td>
              <td className="text-right">60.0&deg;</td>
              <td className="text-right">1.00</td>
            </tr>
          </tbody>
        </table>

        <p className="text-base text-muted-foreground">
          Reach is a multiple of red&rsquo;s own distance from white, which is one
          hexagon radius by construction &mdash; {anchorReach(target, gamut).toFixed(3)} in {spaceName}&rsquo;s
          own units. White and red are the only two points pinned; everything
          else went where it was sent.
        </p>
      </div>
  );
}
