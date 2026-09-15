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
 * change), `{ x, y, w, h }` in CSS px, or the string `"reset"`. Separate from
 * the action cues on purpose - a re-time of the choreography must never touch
 * the frames, and the choreography stays ratio-agnostic.
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

/** A region as a rect of the page, measured now. Null when it cannot be. */
function regionRect(region: Region, host: DemoHost): Rect | null {
  if (region === 'reset') return frameTargetRect('app-root', host);
  if ('target' in region) {
    const r = frameTargetRect(region.target, host);
    return r ? pad(r, region.pad ?? 0) : null;
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
        return withIdentity(root, () => regionRect(region, hostRef.current))
          ?? withIdentity(root, () => frameTargetRect('app-root', hostRef.current));
      };
      // The keyframe in force is the one the editor is composing, so its other
      // ratios are drawn alongside; a moving frame has none of its own.
      const others: { ratio: Ratio; rect: Rect }[] = [];
      const kf = activeIndex >= 0 ? keyframes[activeIndex] : null;
      if (kf) {
        for (const r of RATIOS) {
          if (r === ratio || !kf.regions[r]) continue;
          const rect = withIdentity(root, () => regionRect(kf.regions[r]!, hostRef.current));
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
      setFrameState({ scale: 1, box });
    } else {
      const { scale, tx, ty } = transformFor(rect, box);
      root.style.transformOrigin = '0 0';
      root.style.willChange = 'transform';
      root.style.transition = 'none';
      root.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
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
    setFrameState({ scale: 1, box: null });
  }, []);

  /* F toggles the full page against the framed view; R frames the whole app.
     Authoring only. R is free in the transport, which keeps Space, the arrows,
     N, C, T and F. */
  useEffect(() => {
    if (!active || !authoring) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key !== 'f' && key !== 'r') return;
      e.preventDefault();
      e.stopPropagation();
      if (key === 'f') setFull((v) => !v);
      else resetRegionRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, authoring]);

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
      {full && shown && (
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
              left: shown.frame.x, top: shown.frame.y,
              width: shown.frame.w, height: shown.frame.h,
              outline: `1px solid ${RATIO_COLOR[ratio]}`,
            }}
          >
            <span style={{ ...outlineLabel, top: -16, color: RATIO_COLOR[ratio] }}>
              {ratio} frame
            </span>
          </div>
          <div
            data-testid="frame-region"
            data-region-ratio={ratio}
            data-region-current="1"
            style={{
              position: 'absolute',
              left: shown.region.x, top: shown.region.y,
              width: shown.region.w, height: shown.region.h,
              outline: `2px dashed ${RATIO_COLOR[ratio]}`,
              background: `${RATIO_COLOR[ratio]}14`,
            }}
          >
            <span style={{ ...outlineLabel, color: RATIO_COLOR[ratio] }}>region</span>
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
function TimingField({ field, frames, step, title, button }: {
  field: 'ms' | 'hold';
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
    <input
      type="number"
      data-testid={`frame-${field}`}
      key={`${frames.activeIndex}-${kf?.[field] ?? ''}`}
      defaultValue={kf?.[field] ?? ''}
      min={0}
      step={step}
      placeholder={field}
      disabled={!kf}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); }}
      title={title}
      style={{ ...button, width: 60, cursor: 'text' }}
    />
  );
}

/** The transport row's frame controls, in the transport's own styling. */
export function FrameControls({ frames, button }: { frames: FramesApi; button: CSSProperties }) {
  if (!frames.active) return null;
  return (
    <>
      <select
        data-testid="frame-ratio"
        value={frames.ratio}
        onChange={(e) => frames.setRatio(e.target.value as Ratio)}
        title="Which ratio a drawn frame is for"
        style={{ ...button, color: RATIO_COLOR[frames.ratio] }}
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
        title="Drag a region over the app; it saves as a keyframe at the playhead"
        style={frames.drawing ? { ...button, color: '#111', background: RATIO_COLOR[frames.ratio] } : button}
      >
        Frame
      </button>
      <button
        type="button"
        data-testid="frame-reset"
        onClick={frames.resetRegion}
        title="Frame the whole app at the playhead (R)"
        style={button}
      >
        Reset
      </button>
      <button
        type="button"
        data-testid="frame-delete"
        onClick={frames.removeActive}
        disabled={frames.activeIndex < 0}
        title="Delete the keyframe at the playhead"
        style={button}
      >
        x
      </button>
      {/* The two timing fields of the keyframe at the playhead. Empty is the
          default: 800 ms into it, and no hold after it. */}
      <TimingField
        field="ms"
        frames={frames}
        step={100}
        title="The move into this keyframe, in ms, ending at its time"
        button={button}
      />
      <TimingField
        field="hold"
        frames={frames}
        step={0.1}
        title="Seconds this keyframe holds after its time, before the next move"
        button={button}
      />
      <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
        {frames.full ? 'full page (F)' : 'framed (F)'}
        {frames.error ? ` · ${frames.error}` : ''}
      </span>
    </>
  );
}
