/**
 * Frames: a capture-only framing layer for the video products.
 *
 * A frame is a region of the page, in CSS px, that fills the capture. The
 * runner pushes in on the hexagon, pans across the editor, and resets to the
 * whole app, and the picture that comes out of OBS is that region rather than
 * the window. Nothing about it is ever part of the shipped walkthrough: the
 * viewer owns their window, so the layer mounts only when the URL carries
 * `frames=<ratio>` and never in `mode: 'production'`.
 *
 * It is not zoom and it is not focus. A pan is a frame that moves without
 * changing size; keyboard focus is somebody else's word.
 *
 * **The file.** `public/scripts/<cut>-frames.json` is a JSON array of
 * keyframes, `{ t, ms?, ease?, regions }`, where `regions` holds one region
 * per ratio: `"16:9"` always, and `"1:1"`, `"9:16"`, `"4:5"` when they have
 * been set. A region is `{ target, pad? }` (preferred: it survives a layout
 * change), `{ zoom, at? }` (the capture box's own size divided by `zoom`,
 * centred on `at`'s target - the app root when `at` is not said - and slid,
 * never shrunk, to stay inside the app root), `{ x, y, w, h }` in CSS px, or
 * the string `"reset"`. Separate from the action cues on purpose - a re-time
 * of the choreography must never touch the frames, and the choreography
 * stays ratio-agnostic.
 *
 * **Timing: `t`, `ms`, `hold`.** They are three different things and the file
 * is unreadable if they are confused, so, exactly:
 *
 * - `t` is when the framing has **arrived**. At `t` the picture is settled on
 *   this keyframe's region; `t` is not when it starts to move.
 * - `ms` is the length of the move **into** `t`, so that move runs from
 *   `t - ms` to `t` (800 ms when it is not said). It belongs to this
 *   keyframe's arrival, not to the one before it.
 * - `hold` is seconds of stillness **after** `t`, before the next keyframe's
 *   move is allowed to begin. It belongs to this keyframe's stay. Omitted it
 *   is 0, and the frame still stands until the next move starts on its own -
 *   which is what every file written before `hold` existed already did.
 *
 * A move is clamped so it never starts inside the previous keyframe's hold:
 * the start is `max(t - ms, prev.t + prev.hold)`. The gap between keyframes is
 * not a field; it is whatever `ms` and `hold` leave.
 *
 * Everything the layer shows is a pure function of the transport's clock -
 * the region in force at `t` is interpolated, not transitioned - so a seek
 * into the middle of a move lands mid-move rather than snapping to an end.
 *
 * **How it is applied.** One CSS transform on the app root (`#root`), origin
 * `0 0`: the region is scaled to fit the capture box - a box of the chosen
 * ratio centred in the viewport - and translated into it. The ghost cursor,
 * the callouts and the transport are portalled to `document.body`, outside
 * that subtree, so they stay in viewport coordinates; and because every target
 * is measured with `getBoundingClientRect` off the live layout, a target
 * inside the transformed root reports where it is *on screen*, which is where
 * the hand has to go. The cursor follows the frame without knowing it exists.
 *
 * Regions, though, are stated in the page's own px, so every measurement here
 * is taken with the transform momentarily off (`withIdentity`).
 *
 * See docs/demo-script.md, "Frames".
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { FRAME_TARGETS, targetRect } from './ScriptRunner';
import type { DemoHost } from './steps';
import { setFrameState, type CaptureBox } from './frameState';

export type Ratio = '16:9' | '1:1' | '9:16' | '4:5';

/** In the order the products want them: YouTube first. */
export const RATIOS: Ratio[] = ['16:9', '1:1', '9:16', '4:5'];

const RATIO_VALUE: Record<Ratio, number> = {
  '16:9': 16 / 9,
  '1:1': 1,
  '9:16': 9 / 16,
  '4:5': 4 / 5,
};

/** One color per ratio, so a keyframe's four outlines read apart at a glance. */
export const RATIO_COLOR: Record<Ratio, string> = {
  '16:9': '#00e5ff',
  '1:1': '#ffd166',
  '9:16': '#ff5ecb',
  '4:5': '#8bff6b',
};

/**
 * The one cyan every frames control in the transport shares, so the group
 * reads as a single linked thing at a glance. Not a ratio color - those stay
 * in `RATIO_COLOR`, which keeps telling the four outlines apart.
 */
const FRAMES_ACCENT = '#22d3ee';

/** The little name on an outline: inside its top-left corner, out of the way. */
const outlineLabel: CSSProperties = {
  position: 'absolute',
  left: 2,
  top: 2,
  font: '11px/1.2 ui-monospace, Consolas, monospace',
  whiteSpace: 'nowrap',
};

export type Region =
  | { target: string; pad?: number }
  | { zoom: number; at?: string }
  | { x: number; y: number; w: number; h: number }
  | 'reset';

export interface Keyframe {
  /** When this framing has arrived - settled, not starting to move. */
  t: number;
  /** The move into `t`, in ms: it runs `t - ms` to `t`. 800 when not said. */
  ms?: number;
  /** A CSS timing function. The runner's own ease when it is not said. */
  ease?: string;
  /** Seconds of stillness after `t`, before the next move may begin. 0. */
  hold?: number;
  regions: Partial<Record<Ratio, Region>>;
}

/** How long a frame change takes when the keyframe does not say. */
const DEFAULT_MS = 800;

interface Rect { x: number; y: number; w: number; h: number }

/** `?frames=<ratio>`: the only thing that mounts any of this. */
export function framesRatio(): Ratio | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('frames');
    return RATIOS.includes(raw as Ratio) ? (raw as Ratio) : null;
  } catch {
    return null;
  }
}

/**
 * `?capture=1`: hide the transport for a screen grab without mounting any of
 * the frame layer. The grab is then the app at 1x in a 1920x1080 window, with
 * no framing applied - the no-frames variant of a capture. Nothing else of
 * this module is involved; only `hiddenForCapture` in `PresentationMode.tsx`
 * is shared, and **T** brings the bar back the same way it does under
 * `frames=`.
 */
export function captureFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('capture') === '1';
  } catch {
    return false;
  }
}

const framesUrl = (name: string) => `/__frames/${name}`;
const appRoot = () => document.getElementById('root');

/** The box of the chosen ratio, as large as the viewport allows, centred. */
export function captureBoxFor(ratio: Ratio): CaptureBox {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = RATIO_VALUE[ratio];
  let width = vw;
  let height = vw / r;
  if (height > vh) { height = vh; width = vh * r; }
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
}

/**
 * Run `fn` with the frame transform off, so what it measures is the page's own
 * layout rather than the frame's picture of it.
 *
 * The rendered transform is read first and put back before the caller sets the
 * next one, so a change that lands mid-transition animates from where the page
 * actually is rather than snapping to the frame it was leaving.
 */
function withIdentity<T>(root: HTMLElement, fn: () => T): T {
  const rendered = getComputedStyle(root).transform;
  const transition = root.style.transition;
  root.style.transition = 'none';
  root.style.transform = 'none';
  void root.offsetWidth;
  const out = fn();
  root.style.transform = rendered && rendered !== 'none' ? rendered : '';
  void root.offsetWidth;
  root.style.transition = transition;
  return out;
}

const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

/**
 * A frame target's box. The runner's vocabulary, plus two names that only a
 * frame wants: `app-root` is the default frame's region, and `hexagon` is the
 * hexagon's whole panel rather than the runner's `hex-field`, which is the
 * drawing inside it.
 */
function frameTargetRect(name: string, host: DemoHost): Rect | null {
  if (name === 'app-root') {
    const root = appRoot();
    return root ? toRect(root.getBoundingClientRect()) : null;
  }
  if (name === 'hexagon') {
    const el = document.querySelector('#color-hexagon');
    return el ? toRect(el.getBoundingClientRect()) : null;
  }
  const r = targetRect(name, host);
  return r ? toRect(r) : null;
}

/**
 * Slide `r` inside `b` rather than shrink it: each axis is clamped only when
 * `r` fits within `b` on that axis, and centred on it when `r` is the larger
 * of the two - which is what a zoom past the app root's own size needs.
 */
function slideInto(r: Rect, b: Rect): Rect {
  const x = r.w <= b.w ? Math.min(Math.max(r.x, b.x), b.x + b.w - r.w) : b.x + (b.w - r.w) / 2;
  const y = r.h <= b.h ? Math.min(Math.max(r.y, b.y), b.y + b.h - r.h) : b.y + (b.h - r.h) / 2;
  return { x, y, w: r.w, h: r.h };
}

/** A region as a rect of the page, measured now. Null when it cannot be. */
function regionRect(region: Region, host: DemoHost, box?: CaptureBox | null): Rect | null {
  if (region === 'reset') return frameTargetRect('app-root', host);
  if ('target' in region) {
    const r = frameTargetRect(region.target, host);
    return r ? pad(r, region.pad ?? 0) : null;
  }
  if ('zoom' in region) {
    if (!box) return null;
    const root = frameTargetRect('app-root', host);
    const w = box.width / region.zoom;
    const h = box.height / region.zoom;
    const center = (region.at ? frameTargetRect(region.at, host) : null) ?? root;
    if (!center) return null;
    const raw = { x: center.x + center.w / 2 - w / 2, y: center.y + center.h / 2 - h / 2, w, h };
    return root ? slideInto(raw, root) : raw;
  }
  return { x: region.x, y: region.y, w: region.w, h: region.h };
}

/**
 * The transform that puts `region` in `box`.
 *
 * Fit rather than fill: a region is scaled until it is inside the capture box
 * and centred there. A drawn region already wears the box's ratio, so fit and
 * fill are the same thing for it; for the ones that do not - the default frame
 * being the whole app, whatever shape the window is - fitting is what keeps
 * the app whole instead of cropping its edges out of the picture.
 */
function transformFor(region: Rect, box: CaptureBox) {
  const scale = Math.min(box.width / region.w, box.height / region.h);
  return {
    scale,
    tx: box.left + (box.width - region.w * scale) / 2 - region.x * scale,
    ty: box.top + (box.height - region.h * scale) / 2 - region.y * scale,
  };
}

/** The keyframe in force at `t`: the last one arrived. */
function keyframeAt(frames: Keyframe[], t: number): number {
  let idx = -1;
  for (let i = 0; i < frames.length && frames[i].t <= t; i += 1) idx = i;
  return idx;
}

const msOf = (k: Keyframe) => Math.max(0, k.ms ?? DEFAULT_MS);
const holdOf = (k: Keyframe) => Math.max(0, k.hold ?? 0);

/**
 * When the move into keyframe `j` begins: `ms` before its arrival, but never
 * inside the hold of the one before it. See the timing rule in the header.
 */
export function moveStart(frames: Keyframe[], j: number): number {
  const k = frames[j];
  const floor = j > 0 ? frames[j - 1].t + holdOf(frames[j - 1]) : 0;
  return Math.max(k.t - msOf(k) / 1000, Math.min(floor, k.t));
}

/**
 * Where the clock is between keyframes: moving from `from` to `to` with `u` of
 * the move done, or standing on one frame when the two are the same. `-1` is
 * the default frame - the whole app - which is what stands before the first
 * keyframe arrives.
 */
export interface Tween { from: number; to: number; u: number }

export function tweenAt(frames: Keyframe[], t: number): Tween {
  if (!frames.length) return { from: -1, to: -1, u: 1 };
  const j = frames.findIndex((k) => k.t > t);
  // Past the last arrival: it holds for the rest of the cut.
  if (j < 0) return { from: frames.length - 1, to: frames.length - 1, u: 1 };
  const start = moveStart(frames, j);
  if (t < start) return { from: j - 1, to: j - 1, u: 1 };
  const span = frames[j].t - start;
  return { from: j - 1, to: j, u: span > 0 ? (t - start) / span : 1 };
}

/**
 * drive.ts moves the hand on smootherstep, which leaves and lands at a
 * standstill; a frame with nothing said about its ease moves the same way.
 */
const smootherstep = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

/**
 * A keyframe's `ease` as a number, since the move is interpolated here rather
 * than handed to CSS. `cubic-bezier(...)` is solved for x by bisection - the
 * curve is monotonic in x, so twenty halvings are well past sub-pixel - and
 * anything else falls back to the default.
 */
function easeValue(u: number, ease?: string): number {
  const x = Math.max(0, Math.min(1, u));
  if (!ease) return smootherstep(x);
  if (ease === 'linear') return x;
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(ease.trim());
  if (!m) return smootherstep(x);
  const n = m[1].split(',').map((v) => Number(v.trim()));
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return smootherstep(x);
  const [x1, y1, x2, y2] = n;
  const bez = (a: number, b: number, s: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    if (bez(x1, x2, mid) < x) lo = mid; else hi = mid;
  }
  return bez(y1, y2, (lo + hi) / 2);
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({
  x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u),
});
const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

/** The region a keyframe frames for `ratio`, with 16:9 as the fallback. */
const regionFor = (k: Keyframe | null, ratio: Ratio): Region =>
  k?.regions[ratio] ?? k?.regions['16:9'] ?? 'reset';

/** Grow a drawn rect to the ratio, about its middle: nothing drawn is lost. */
function snapToRatio(r: Rect, ratio: Ratio): Rect {
  const want = RATIO_VALUE[ratio];
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  let { w, h } = r;
  if (w / h > want) h = w / want; else w = h * want;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const area = (r: Rect) => Math.max(0, r.w) * Math.max(0, r.h);
function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * The known target a drawn rect is mostly about, with the padding that
 * reproduces the size it was drawn at - so the frame survives a layout change
 * and still shows what was composed.
 *
 * "Mostly" is three quarters of the target inside the rect and half the rect
 * spent on the target: a rect drawn round the hexagon is the hexagon, and a
 * rect drawn over a corner of it is not. One pad for both axes, because that
 * is what a pad is; the fit rule absorbs the difference.
 */
function snapToTarget(r: Rect, host: DemoHost): { target: string; pad: number } | null {
  let best: { target: string; pad: number; score: number } | null = null;
  for (const name of FRAME_TARGETS) {
    const t = frameTargetRect(name, host);
    if (!t || area(t) <= 0) continue;
    const o = overlap(r, t);
    if (o / area(t) < 0.75 || o / area(r) < 0.5) continue;
    const score = o / (area(r) + area(t) - o);
    const p = Math.round(((r.w - t.w) / 2 + (r.h - t.h) / 2) / 2);
    if (!best || score > best.score) best = { target: name, pad: Math.max(0, p), score };
  }
  return best ? { target: best.target, pad: best.pad } : null;
}

/** The four corners a region can be resized by. Edges would only repeat them. */
type Corner = 'nw' | 'ne' | 'sw' | 'se';

const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];
const CORNER_CURSOR: Record<Corner, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
};

/** The side of a handle, and how far a nudge moves plain and with Shift. */
const HANDLE = 10;
const NUDGE = 1;
const NUDGE_SHIFT = 10;
/** A hand-edited region never shrinks below this: it stays grabbable. */
const MIN_REGION = 24;
/** A nudge burst is one edit: the write waits this long for the next key. */
const NUDGE_COMMIT_MS = 300;

/** Keep a region inside the app - the fit rule assumes none of it hangs out. */
function clampInto(r: Rect, b: Rect): Rect {
  const w = Math.min(r.w, b.w);
  const h = Math.min(r.h, b.h);
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, b.x), b.x + b.w - w),
    y: Math.min(Math.max(r.y, b.y), b.y + b.h - h),
  };
}

/**
 * A corner drag: the opposite corner stays put and the region keeps the
 * ratio, so a resize recomposes the same shot larger or smaller rather than
 * changing what shape it is. The pointer leads on whichever axis has moved
 * further, which is what makes a diagonal drag feel like it is being followed.
 */
function resizedRect(base: Rect, corner: Corner, dx: number, dy: number, ratio: Ratio, b: Rect): Rect {
  const sx = corner === 'ne' || corner === 'se' ? 1 : -1;
  const sy = corner === 'sw' || corner === 'se' ? 1 : -1;
  const ax = sx > 0 ? base.x : base.x + base.w;
  const ay = sy > 0 ? base.y : base.y + base.h;
  const want = RATIO_VALUE[ratio];
  let w = Math.max(MIN_REGION, base.w + sx * dx, (base.h + sy * dy) * want);
  // The app's edge caps the width on both axes; the ratio survives the cap.
  w = Math.min(w, sx > 0 ? b.x + b.w - ax : ax - b.x);
  w = Math.min(w, (sy > 0 ? b.y + b.h - ay : ay - b.y) * want);
  w = Math.max(1, w);
  const h = w / want;
  return { x: sx > 0 ? ax : ax - w, y: sy > 0 ? ay : ay - h, w, h };
}

/** What the endpoint speaks; the file itself is the bare array. */
interface FramesBody { source: string; frames: Keyframe[]; clear?: boolean }

export interface FramesApi {
  /** Whether any of this is mounted at all. */
  active: boolean;
  ratio: Ratio;
  setRatio: (r: Ratio) => void;
  /** F: the full page with the capture drawn on it, rather than the frame. */
  full: boolean;
  setFull: (v: boolean) => void;
  keyframes: Keyframe[];
  /** The keyframe in force at the playhead, and where it is in the list. */
  activeIndex: number;
  /** That keyframe itself, for the editor's timing fields. */
  activeKeyframe: Keyframe | null;
  /** The Frame tool: a drag over the app draws the region. */
  drawing: boolean;
  setDrawing: (v: boolean) => void;
  /** Drop the keyframe at the playhead. */
  removeActive: () => void;
  /** Frame the whole app at the playhead: a `"reset"` region for the ratio. */
  resetRegion: () => void;
  /** Set `ms` or `hold` on the keyframe at the playhead; null clears the field. */
  setTiming: (patch: { ms?: number | null; hold?: number | null }) => void;
  /** Tell the layer the playhead jumped, so it re-measures the live layout. */
  jumped: () => void;
  error: string | null;
  /** The layer itself, portalled to the body. Render it. */
  overlay: ReactNode;
}

export interface UseFramesOptions {
  name: string;
  host: DemoHost;
  /** The transport's clock, in seconds. */
  time: number;
  /** False in production and without `frames=`: nothing mounts. */
  enabled: boolean;
  /** The editor - the tool, the keys, the outlines - is dev-only, like notes. */
  authoring: boolean;
}

export function useFrames({ name, host, time, enabled, authoring }: UseFramesOptions): FramesApi {
  const urlRatio = useMemo(() => framesRatio(), []);
  const active = enabled && urlRatio !== null;
  const [ratio, setRatio] = useState<Ratio>(urlRatio ?? '16:9');
  const [full, setFull] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** The live drag, in client px, and the box the capture will keep. */
  const [drag, setDrag] = useState<Rect | null>(null);
  const [box, setBox] = useState<CaptureBox | null>(null);
  /**
   * The rects the editor draws, in page px: the region in force at the
   * playhead (interpolated while a move is running), the capture frame it
   * fills, and the other ratios' regions of the same keyframe.
   */
  const [shown, setShown] = useState<{
    region: Rect; frame: Rect; others: { ratio: Ratio; rect: Rect }[];
  } | null>(null);
  /** The measured ends of the move being drawn; see `measureKey`. */
  const measured = useRef<{
    key: string; from: Rect | null; to: Rect | null; others: { ratio: Ratio; rect: Rect }[];
  } | null>(null);
  /** Bumped when the page under the frames may have moved: re-measure. */
  const [stamp, setStamp] = useState(0);
  /** The host, for the measuring the effects below do. Written in an effect of
   *  its own, first, so the ones after it read this render's host. */
  const hostRef = useRef(host);
  useEffect(() => { hostRef.current = host; });
  /** R's handler, so the key effect does not churn with every edit. */
  const resetRegionRef = useRef<() => void>(() => {});
  /**
   * The region being moved or resized by hand, in page px. It stands in front
   * of the measured one for as long as the gesture and its write last, so the
   * outlines follow the pointer without a POST per frame.
   */
  const [edited, setEdited] = useState<Rect | null>(null);
  const gesture = useRef<{ mode: 'move' | Corner; px: number; py: number; base: Rect; bounds: Rect } | null>(null);
  /** Set at the write, cleared once the saved keyframe has measured back. */
  const awaitingSave = useRef(false);
  /** The arrow keys' pending write, and the handler the key effect calls. */
  const nudgeTimer = useRef<number | null>(null);
  const nudgeRef = useRef<((key: string, shift: boolean) => void) | null>(null);

  const activeIndex = active ? keyframeAt(keyframes, time) : -1;
  const tween = useMemo(
    () => (active ? tweenAt(keyframes, time) : { from: -1, to: -1, u: 1 }),
    [active, keyframes, time],
  );
  /* Measuring costs two forced reflows, so the ends of a move are measured
     once and only the interpolation runs per frame. Everything that can move
     them - the two ends, the keyframe being edited, the ratio, the capture
     box, the view, an edit to any of their regions, a seek - is in the key. */
  const measureKey = useMemo(() => {
    const regions = (i: number) => (i >= 0 ? JSON.stringify(keyframes[i]?.regions ?? null) : '*');
    return `${tween.from}>${tween.to}@${activeIndex}`
      + `|${regions(tween.from)}>${regions(tween.to)}@${regions(activeIndex)}`
      + `|${ratio}|${full ? 1 : 0}`
      + `|${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)}|${stamp}`;
  }, [activeIndex, box, full, keyframes, ratio, stamp, tween.from, tween.to]);

  /* The frames file. Read once; the editor writes the whole list back. */
  useEffect(() => {
    if (!active) return;
    let live = true;
    fetch(`${import.meta.env.BASE_URL}scripts/${name}-frames.json`)
      .then((res) => (res.ok ? (res.json() as Promise<Keyframe[] | FramesBody>) : null))
      .then((data) => {
        if (!live || !data) return;
        const list = Array.isArray(data) ? data : data.frames;
        if (Array.isArray(list)) setKeyframes([...list].sort((a, b) => a.t - b.t));
      })
      .catch((err: unknown) => {
        if (live) setError(`frames: ${err instanceof Error ? err.message : String(err)}`);
      });
    return () => { live = false; };
  }, [active, name]);

  /* The capture box, published for the camera panel and drawn for the editor.
     It is the viewport's size, which only an effect can read. */
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBox(null);
      setFrameState({ scale: 1, box: null });
      return;
    }
    const compute = () => setBox(captureBoxFor(ratio));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [active, ratio]);

  /**
   * The transform itself, as a pure function of the clock.
   *
   * There is no CSS transition: the region is interpolated between the ends of
   * the move and written every frame, which is what makes a seek into the
   * middle of a move land in the middle of it rather than at one end. Between
   * moves nothing changes and the writes are no-ops.
   */
  useEffect(() => {
    const root = appRoot();
    if (!active || !root || !box) return;
    if (measured.current?.key !== measureKey) {
      const measure = (i: number): Rect | null => {
        const region = i >= 0 ? regionFor(keyframes[i] ?? null, ratio) : 'reset';
        return withIdentity(root, () => regionRect(region, hostRef.current, box))
          ?? withIdentity(root, () => frameTargetRect('app-root', hostRef.current));
      };
      // The keyframe in force is the one the editor is composing, so its other
      // ratios are drawn alongside; a moving frame has none of its own.
      const others: { ratio: Ratio; rect: Rect }[] = [];
      const kf = activeIndex >= 0 ? keyframes[activeIndex] : null;
      if (kf) {
        for (const r of RATIOS) {
          if (r === ratio || !kf.regions[r]) continue;
          const rect = withIdentity(root, () => regionRect(kf.regions[r]!, hostRef.current, box));
          if (rect) others.push({ ratio: r, rect });
        }
      }
      measured.current = { key: measureKey, from: measure(tween.from), to: measure(tween.to), others };
    }
    const ends = measured.current;
    const rect = tween.from !== tween.to && ends.from && ends.to
      ? lerpRect(ends.from, ends.to, easeValue(tween.u, keyframes[tween.to]?.ease))
      : (ends.to ?? ends.from);
    if (!rect || rect.w <= 0 || rect.h <= 0) return;
    // The F toggle disables the layer outright rather than framing the whole
    // app: the point of it is to see the page the way the editor draws on it.
    if (full) {
      root.style.transition = 'none';
      root.style.transform = '';
      root.style.transformOrigin = '';
      document.documentElement.style.overflow = '';
      setFrameState({ scale: 1, box });
    } else {
      const { scale, tx, ty } = transformFor(rect, box);
      root.style.transformOrigin = '0 0';
      root.style.willChange = 'transform';
      root.style.transition = 'none';
      root.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      // A zoomed root is bigger than the viewport. Left alone the document
      // grows scroll bars, which are in the picture and also narrow the
      // viewport, reflowing the app under the frame (the framed take, 2026-09-15).
      document.documentElement.style.overflow = 'hidden';
      setFrameState({ scale, box });
    }
    // Only the full page has room for the outlines, and only the editor wants
    // them; the framed view is the picture itself. The rects can only be known
    // after a layout, which is what an effect is for; the updaters below return
    // the state they were given whenever nothing moved, so a still frame is one
    // render and not a cascade.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!authoring || !full) { setShown((s) => (s === null ? s : null)); return; }
    const frame = snapToRatio(rect, ratio);
    setShown((s) => (s && sameRect(s.region, rect) && s.others === ends.others
      ? s : { region: rect, frame, others: ends.others }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, activeIndex, authoring, box, full, keyframes, measureKey, ratio, tween]);

  /* Leaving takes the transform with it: nothing of this outlives the layer. */
  useEffect(() => () => {
    const root = appRoot();
    if (root) {
      root.style.transition = '';
      root.style.transform = '';
      root.style.transformOrigin = '';
      root.style.willChange = '';
    }
    document.documentElement.style.overflow = '';
    setFrameState({ scale: 1, box: null });
  }, []);

  /* F toggles the full page against the framed view; R frames the whole app;
     the arrows nudge the region while there is an editable one on screen.
     Authoring only. R is free in the transport, which keeps Space, the arrows,
     N, C, T and F - and gets the arrows back the moment the region outline is
     gone, which F alone is enough to do.

     This listener is registered before the transport's, both on the capture
     phase, because `useFrames` is called before that effect is declared. So
     the nudge has first claim on an arrow and stops the event when it takes
     one; when it does not, the press falls through to the transport, where
     under a frame layer a plain arrow walks the keyframes and Shift+arrow
     scrubs. See the arrow branch of PresentationMode's key handler. */
  useEffect(() => {
    if (!active || !authoring) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      // A chord is the browser's: Ctrl+R is a reload, and its keydown arrives
      // here before the page goes. Without this line every reload of the
      // tab saved a `reset` at the playhead - keyframe 0 from the top, and a
      // scatter of new keyframes at whatever second the tab was reloaded on
      // (2026-09-16, seven times before it was found).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.startsWith('Arrow') && nudgeRef.current) {
        e.preventDefault();
        e.stopPropagation();
        nudgeRef.current(e.key, e.shiftKey);
        return;
      }
      const key = e.key.toLowerCase();
      if (key !== 'f' && key !== 'r') return;
      e.preventDefault();
      e.stopPropagation();
      if (key === 'f') setFull((v) => !v);
      // R writes to disk at once, like every edit here, and it rewrites the
      // keyframe in force - at the top of the cut, keyframe 0. Three times
      // on 2026-09-16 a stray R in a tab that was only watching the framed
      // picture turned the opening 130% into `reset` in both repos and a
      // take went out at 100%. So R works only in the full-page view (F),
      // where the outlines are up and the editor is plainly in use; the
      // Reset button in the cyan group is unchanged.
      else if (full) resetRegionRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, authoring, full]);

  const persist = useCallback((next: Keyframe[], clear = false) => {
    setKeyframes(next);
    const body: FramesBody = { source: name, frames: next, ...(clear ? { clear: true } : {}) };
    fetch(framesUrl(name), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        setError(null);
      })
      .catch((err: unknown) => setError(`frames: ${err instanceof Error ? err.message : String(err)}`));
  }, [name]);

  /** Save a region for the current ratio at the playhead. */
  const saveRegion = useCallback((region: Region) => {
    const t = Math.round(time * 100) / 100;
    const next = [...keyframes];
    // Within a fifth of a second of an existing keyframe is that keyframe:
    // the ratios of one shot are set together, one drag at a time.
    const at = next.findIndex((k) => Math.abs(k.t - t) <= 0.2);
    if (at >= 0) next[at] = { ...next[at], regions: { ...next[at].regions, [ratio]: region } };
    else next.push({ t, regions: { [ratio]: region } });
    next.sort((a, b) => a.t - b.t);
    persist(next);
  }, [keyframes, persist, ratio, time]);

  /** Reset: the whole app, at the playhead, for the ratio being edited. */
  const resetRegion = useCallback(() => saveRegion('reset'), [saveRegion]);
  useEffect(() => { resetRegionRef.current = resetRegion; }, [resetRegion]);

  /**
   * A hand-edited region, back into the keyframe in force - not into a new one
   * at the instant the playhead happens to read: the edit is of that frame.
   *
   * A region that named a target keeps naming it only while the same target
   * with some pad still *reproduces* the rect - which a resize about the
   * middle does and a move does not, since a pad cannot say "off to the left".
   * Anything else, `"reset"` included, is pixels from the first edit on. The
   * keyframe's other ratios are not touched: they are other shots.
   */
  const commitRegion = useCallback((r: Rect) => {
    if (activeIndex < 0) return;
    const kf = keyframes[activeIndex];
    const was = regionFor(kf, ratio);
    const root = appRoot();
    const named = typeof was === 'object' && 'target' in was && root
      ? withIdentity(root, () => {
        const hit = snapToTarget(r, hostRef.current);
        if (!hit || hit.target !== was.target) return null;
        const back = regionRect(hit, hostRef.current);
        return back && Math.abs(back.x - r.x) <= 2 && Math.abs(back.y - r.y) <= 2
          && Math.abs(back.w - r.w) <= 2 && Math.abs(back.h - r.h) <= 2 ? hit : null;
      })
      : null;
    const region: Region = named
      ?? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
    const next = [...keyframes];
    next[activeIndex] = { ...kf, regions: { ...kf.regions, [ratio]: region } };
    awaitingSave.current = true;
    persist(next);
  }, [activeIndex, keyframes, persist, ratio]);

  /* The local rect stands until the saved keyframe has been measured back, so
     the outline never flashes through the rect it is on its way from. The
     keyframes are in the deps as well as the measurement: a write that changes
     nothing measurable still has to hand the outline back. */
  useEffect(() => {
    if (!awaitingSave.current || gesture.current) return;
    awaitingSave.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdited(null);
  }, [keyframes, shown]);

  /* The region is editable while the editor is showing one it can write back:
     the full page, a keyframe in force, and no move running through it. */
  const editable = active && authoring && full && !drawing
    && activeIndex >= 0 && tween.from === tween.to && shown !== null;
  /** The rect under the hand right now: the local one during an edit. */
  const liveRegion = shown ? (edited ?? shown.region) : null;

  /* Re-armed every render, so it closes over this render's rect. Null when
     there is nothing to nudge, which is what hands the arrows back. */
  useEffect(() => {
    nudgeRef.current = editable && liveRegion ? (key, shift) => {
      const step = shift ? NUDGE_SHIFT : NUDGE;
      const d: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const move = d[key];
      const root = appRoot();
      const bounds = root ? withIdentity(root, () => frameTargetRect('app-root', hostRef.current)) : null;
      if (!move || !bounds) return;
      const next = clampInto(
        { ...liveRegion, x: liveRegion.x + move[0], y: liveRegion.y + move[1] }, bounds,
      );
      setEdited(next);
      if (nudgeTimer.current !== null) window.clearTimeout(nudgeTimer.current);
      nudgeTimer.current = window.setTimeout(() => {
        nudgeTimer.current = null;
        commitRegion(next);
      }, NUDGE_COMMIT_MS);
    } : null;
  });

  /* A pending nudge does not outlive the layer. */
  useEffect(() => () => {
    if (nudgeTimer.current !== null) window.clearTimeout(nudgeTimer.current);
  }, []);

  const setTiming = useCallback((patch: { ms?: number | null; hold?: number | null }) => {
    if (activeIndex < 0) return;
    const next = [...keyframes];
    const k = { ...next[activeIndex] };
    for (const field of ['ms', 'hold'] as const) {
      const v = patch[field];
      if (v === undefined) continue;
      if (v === null || !Number.isFinite(v)) delete k[field];
      else k[field] = Math.max(0, v);
    }
    next[activeIndex] = k;
    persist(next);
  }, [activeIndex, keyframes, persist]);

  const removeActive = useCallback(() => {
    if (activeIndex < 0) return;
    const next = keyframes.filter((_, i) => i !== activeIndex);
    persist(next, next.length === 0);
  }, [activeIndex, keyframes, persist]);

  /* A seek can land anywhere, including on a layout the ends were not
     measured against; re-measure rather than interpolate stale rects. */
  const jumped = useCallback(() => { setStamp((s) => s + 1); }, []);

  /* The drag: a rect over the app, in client px, with the layer disabled. */
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag({ ...drag, w: e.clientX - drag.x, h: e.clientY - drag.y });
  };
  const onUp = () => {
    if (!drag) return;
    const raw: Rect = {
      x: Math.min(drag.x, drag.x + drag.w),
      y: Math.min(drag.y, drag.y + drag.h),
      w: Math.abs(drag.w),
      h: Math.abs(drag.h),
    };
    setDrag(null);
    setDrawing(false);
    if (raw.w < 24 || raw.h < 24) return;
    const snapped = snapToRatio(raw, ratio);
    const root = appRoot();
    const onTarget = root ? withIdentity(root, () => snapToTarget(snapped, hostRef.current)) : null;
    saveRegion(onTarget ?? {
      x: Math.round(snapped.x), y: Math.round(snapped.y),
      w: Math.round(snapped.w), h: Math.round(snapped.h),
    });
  };

  /* Moving and resizing the region by hand. Only the full page offers it, and
     there the layer's transform is off, so a client px is a page px and the
     pointer's numbers go straight into the rect. */
  const onEditDown = (mode: 'move' | Corner) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!editable || !liveRegion) return;
    const root = appRoot();
    const bounds = root ? withIdentity(root, () => frameTargetRect('app-root', hostRef.current)) : null;
    if (!bounds) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { mode, px: e.clientX, py: e.clientY, base: liveRegion, bounds };
  };
  const onEditMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    // A move keeps the size and a resize keeps the ratio, so neither of them
    // re-snaps the ratio the way a freshly drawn rect does.
    setEdited(g.mode === 'move'
      ? clampInto({ ...g.base, x: g.base.x + dx, y: g.base.y + dy }, g.bounds)
      : resizedRect(g.base, g.mode, dx, dy, ratio, g.bounds));
  };
  const onEditUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!gesture.current) return;
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (edited) commitRegion(edited);
  };
  const editHandlers = {
    onPointerMove: onEditMove,
    onPointerUp: onEditUp,
    onPointerCancel: onEditUp,
  };

  /** What the framing keeps: the region grown to the ratio, edits included. */
  const fitRect = shown ? (edited ? snapToRatio(edited, ratio) : shown.frame) : null;

  const live = drag ? {
    x: Math.min(drag.x, drag.x + drag.w),
    y: Math.min(drag.y, drag.y + drag.h),
    w: Math.abs(drag.w),
    h: Math.abs(drag.h),
  } : null;

  const overlay = active && box ? createPortal(
    <div
      data-testid="frame-layer"
      data-frame-ratio={ratio}
      data-frame-full={full ? '1' : '0'}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 75, pointerEvents: 'none' }}
    >
      {/* What the capture keeps, with everything outside it dimmed. Drawn on
          the full page, which is the view frames are set from; in the framed
          view the box is the picture and an outline round it is furniture. */}
      {full && (
        <div
          data-testid="frame-capture-outline"
          style={{
            position: 'absolute',
            left: box.left, top: box.top, width: box.width, height: box.height,
            outline: `2px solid ${RATIO_COLOR[ratio]}`,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.38)',
          }}
        />
      )}
      {/* What is being framed, and what the framing will actually keep. The
          region is what was drawn (or the target it snapped to); the frame is
          that region grown to the ratio, which is the piece of page the
          capture ends up holding - fitting a region centred in the box shows
          exactly as much page as growing the region about its middle does.
          Two rects because they are two different things, and a shot composed
          on the first is cropped by the second. Both move with the tween. */}
      {full && shown && liveRegion && fitRect && (
        <>
          {shown.others.map((o) => (
            <div
              key={o.ratio}
              data-testid="frame-region"
              data-region-ratio={o.ratio}
              style={{
                position: 'absolute',
                left: o.rect.x, top: o.rect.y, width: o.rect.w, height: o.rect.h,
                outline: `2px dashed ${RATIO_COLOR[o.ratio]}`,
              }}
            >
              <span style={{ ...outlineLabel, color: RATIO_COLOR[o.ratio] }}>{o.ratio}</span>
            </div>
          ))}
          <div
            data-testid="frame-fit"
            data-region-ratio={ratio}
            style={{
              position: 'absolute',
              left: fitRect.x, top: fitRect.y,
              width: fitRect.w, height: fitRect.h,
              outline: `1px solid ${RATIO_COLOR[ratio]}`,
            }}
          >
            <span style={{ ...outlineLabel, top: -16, color: RATIO_COLOR[ratio] }}>
              {ratio} frame
            </span>
          </div>
          {/* The region takes the pointer when there is a keyframe to write it
              back to: the interior moves it, a corner resizes it at the ratio.
              The write waits for the release, so the drag itself is local. */}
          <div
            data-testid="frame-region"
            data-region-ratio={ratio}
            data-region-current="1"
            data-region-editable={editable ? '1' : '0'}
            onPointerDown={onEditDown('move')}
            {...editHandlers}
            style={{
              position: 'absolute',
              left: liveRegion.x, top: liveRegion.y,
              width: liveRegion.w, height: liveRegion.h,
              outline: `2px dashed ${RATIO_COLOR[ratio]}`,
              background: `${RATIO_COLOR[ratio]}14`,
              pointerEvents: editable ? 'auto' : 'none',
              cursor: editable ? 'move' : 'default',
              touchAction: 'none',
            }}
          >
            <span style={{ ...outlineLabel, color: RATIO_COLOR[ratio] }}>region</span>
            {editable && CORNERS.map((c) => (
              <div
                key={c}
                data-testid={`frame-handle-${c}`}
                onPointerDown={onEditDown(c)}
                {...editHandlers}
                style={{
                  position: 'absolute',
                  left: (c === 'nw' || c === 'sw' ? 0 : liveRegion.w) - HANDLE / 2,
                  top: (c === 'nw' || c === 'ne' ? 0 : liveRegion.h) - HANDLE / 2,
                  width: HANDLE, height: HANDLE,
                  background: RATIO_COLOR[ratio],
                  pointerEvents: 'auto',
                  cursor: CORNER_CURSOR[c],
                  touchAction: 'none',
                }}
              />
            ))}
          </div>
        </>
      )}
      {/* The Frame tool. It only takes the pointer while it is armed, so the
          app underneath stays usable the rest of the time. */}
      {drawing && (
        <div
          data-testid="frame-draw"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'auto', cursor: 'crosshair', touchAction: 'none',
          }}
        >
          {live && (
            <div style={{
              position: 'absolute',
              left: live.x, top: live.y, width: live.w, height: live.h,
              outline: `2px solid ${RATIO_COLOR[ratio]}`,
              background: `${RATIO_COLOR[ratio]}22`,
            }} />
          )}
        </div>
      )}
    </div>,
    document.body,
  ) : null;

  return {
    active, ratio, setRatio, full, setFull, keyframes, activeIndex,
    activeKeyframe: activeIndex >= 0 ? keyframes[activeIndex] : null,
    drawing, setDrawing, removeActive, resetRegion, setTiming, jumped, error, overlay,
  };
}

/**
 * One of a keyframe's two timing fields.
 *
 * It writes on blur and on Enter rather than on every keystroke: each write is
 * a POST that rewrites the frames file, and "12" on the way to "1200" is not a
 * value anybody meant. Keyed by the keyframe, so moving the playhead reloads
 * the box from the file.
 */
function TimingField({ field, label, frames, step, title, button }: {
  field: 'ms' | 'hold';
  /** The dim tag before the input - survives a typed value, unlike a placeholder. */
  label: string;
  frames: FramesApi;
  step: number;
  title: string;
  button: CSSProperties;
}) {
  const kf = frames.activeKeyframe;
  const commit = (raw: string) => {
    const v = raw.trim();
    frames.setTiming({ [field]: v === '' ? null : Number(v) });
  };
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={framesLabelStyle}>{label}</span>
      <input
        type="number"
        data-testid={`frame-${field}`}
        key={`${frames.activeIndex}-${kf?.[field] ?? ''}`}
        className="frame-timing-input"
        defaultValue={kf?.[field] ?? ''}
        min={0}
        step={step}
        disabled={!kf}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); }}
        title={title}
        style={{ ...button, width: 60, cursor: 'text' }}
      />
    </span>
  );
}

/**
 * The border every frames control sits inside, so the group reads as one
 * linked thing. No vertical padding and an outline rather than a border - an
 * outline draws outside the box without adding to its height - so the group
 * is exactly as tall as the buttons it holds and the transport row never
 * grows to fit it.
 */
const framesGroupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 6px',
  borderRadius: 4,
  outline: `1px solid ${FRAMES_ACCENT}`,
  outlineOffset: 0,
};

/** The dim "frames" tag at the group's left edge - out of the way, cyan-tinted. */
const framesLabelStyle: CSSProperties = {
  font: '9px/1 ui-monospace, Consolas, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgba(34, 211, 238, 0.55)',
  whiteSpace: 'nowrap',
};

/** A frames control's own button, in the group's one accent. */
const framesButtonStyle = (button: CSSProperties): CSSProperties => (
  { ...button, color: FRAMES_ACCENT, borderColor: FRAMES_ACCENT }
);

/** The transport row's frame controls, grouped in one cyan-bordered box. */
export function FrameControls({ frames, button }: { frames: FramesApi; button: CSSProperties }) {
  if (!frames.active) return null;
  const controlStyle = framesButtonStyle(button);
  return (
    <>
      {/* Scoped rather than inline: a focus ring is a pseudo-class, and the
          group's own inline styles cannot reach `:focus`. */}
      <style>{`
        .frame-timing-input:focus {
          outline: 2px solid ${FRAMES_ACCENT};
          outline-offset: 1px;
        }
      `}</style>
      <div data-testid="frames-group" style={framesGroupStyle}>
        <span style={framesLabelStyle}>frames</span>
        <select
          data-testid="frame-ratio"
          value={frames.ratio}
          onChange={(e) => frames.setRatio(e.target.value as Ratio)}
          title="Which ratio a drawn frame is for. 16:9 is the YouTube capture; the others are for social cuts."
          style={controlStyle}
        >
          {RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          type="button"
          data-testid="frame-draw-tool"
          onClick={() => {
            const next = !frames.drawing;
            frames.setDrawing(next);
            // A region is drawn in page px, and the page is only itself with the
            // layer off: arming the tool is asking for the full page.
            if (next) frames.setFull(true);
          }}
          title="Draw a frame: drag a rectangle over the app. It snaps to the picked ratio and becomes the keyframe at the playhead."
          style={frames.drawing
            ? { ...button, color: '#111', background: FRAMES_ACCENT, borderColor: FRAMES_ACCENT }
            : controlStyle}
        >
          Frame
        </button>
        <button
          type="button"
          data-testid="frame-reset"
          onClick={frames.resetRegion}
          title="Keyframe at the playhead that returns to the whole app at 100% (R)."
          style={controlStyle}
        >
          Reset
        </button>
        <button
          type="button"
          data-testid="frame-delete"
          onClick={frames.removeActive}
          disabled={frames.activeIndex < 0}
          title="Delete the keyframe at the playhead."
          style={controlStyle}
        >
          Delete
        </button>
        {/* The two timing fields of the keyframe at the playhead. Empty is the
            default: 800 ms into it, and no hold after it. */}
        <TimingField
          field="ms"
          label="ease ms"
          frames={frames}
          step={100}
          title="How long the move into the keyframe at the playhead takes, in milliseconds. 800 when empty."
          button={controlStyle}
        />
        <TimingField
          field="hold"
          label="hold s"
          frames={frames}
          step={0.1}
          title="Seconds the frame stays still after arriving, before the next move may start. 0 when empty."
          button={controlStyle}
        />
      </div>
      {/* The group's one line of key help: the view toggle, and the arrows that
          walk the keyframes so each zoom mark can be looked at in turn. */}
      <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
        {frames.full ? 'full page (F)' : 'framed (F)'}
        {' · ←/→ previous/next keyframe'}
        {frames.error ? ` · ${frames.error}` : ''}
      </span>
    </>
  );
}
