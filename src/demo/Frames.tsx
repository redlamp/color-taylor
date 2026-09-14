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

export type Region =
  | { target: string; pad?: number }
  | { x: number; y: number; w: number; h: number }
  | 'reset';

export interface Keyframe {
  t: number;
  /** The transition into this frame, in ms. 800 when it is not said. */
  ms?: number;
  /** A CSS timing function. The runner's own ease when it is not said. */
  ease?: string;
  regions: Partial<Record<Ratio, Region>>;
}

/** How long a frame change takes when the keyframe does not say. */
const DEFAULT_MS = 800;
/**
 * The runner's usual ease, as near as a cubic-bezier gets to it: drive.ts
 * moves the hand on smootherstep, which leaves and lands at a standstill.
 */
const DEFAULT_EASE = 'cubic-bezier(0.5, 0, 0.5, 1)';
/**
 * Crossing a keyframe within this of its time is playback, and animates;
 * anything further is a scrub, and lands. An explicit seek says so outright
 * (`jumped`), so this only has to catch the frame-by-frame case.
 */
const PLAYING_WINDOW = 0.5;

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

/** The keyframe in force at `t`: the last one begun. */
function keyframeAt(frames: Keyframe[], t: number): number {
  let idx = -1;
  for (let i = 0; i < frames.length && frames[i].t <= t; i += 1) idx = i;
  return idx;
}

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
  /** The Frame tool: a drag over the app draws the region. */
  drawing: boolean;
  setDrawing: (v: boolean) => void;
  /** Drop the keyframe at the playhead. */
  removeActive: () => void;
  /** Tell the layer the playhead jumped, so the next frame lands rather than eases. */
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
  const applied = useRef<{ index: number; ratio: Ratio; full: boolean } | null>(null);
  const landNext = useRef(false);
  const hostRef = useRef(host);
  hostRef.current = host;

  const activeIndex = active ? keyframeAt(keyframes, time) : -1;

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

  /* The capture box, published for the camera panel and drawn for the editor. */
  useEffect(() => {
    if (!active) {
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
   * The transform itself.
   *
   * Re-run whenever the keyframe in force changes, the ratio changes, the F
   * toggle changes or the window resizes - not every frame. The transition is
   * CSS's, so the layer costs nothing between keyframes.
   */
  useEffect(() => {
    const root = appRoot();
    if (!active || !root || !box) return;
    const wanted = { index: activeIndex, ratio, full };
    const was = applied.current;
    const same = was && was.index === wanted.index && was.ratio === wanted.ratio && was.full === wanted.full;
    if (same) return;
    const kf = activeIndex >= 0 ? keyframes[activeIndex] : null;
    // The F toggle disables the layer outright rather than framing the whole
    // app: the point of it is to see the page the way the editor draws on it.
    if (full) {
      root.style.transition = 'none';
      root.style.transform = '';
      root.style.transformOrigin = '';
      applied.current = wanted;
      setFrameState({ scale: 1, box });
      return;
    }
    const region: Region = kf?.regions[ratio] ?? kf?.regions['16:9'] ?? 'reset';
    const rect = withIdentity(root, () => regionRect(region, hostRef.current))
      ?? withIdentity(root, () => frameTargetRect('app-root', hostRef.current));
    if (!rect || rect.w <= 0 || rect.h <= 0) return;
    const { scale, tx, ty } = transformFor(rect, box);
    // Playback eases; a scrub, an explicit seek and a resize land. Seeking has
    // to put the picture where the cut says it is, the way actions do.
    const ease = !landNext.current
      && was !== null
      && kf !== null
      && time - kf.t >= 0
      && time - kf.t < PLAYING_WINDOW;
    landNext.current = false;
    root.style.transformOrigin = '0 0';
    root.style.willChange = 'transform';
    root.style.transition = ease ? `transform ${kf?.ms ?? DEFAULT_MS}ms ${kf?.ease ?? DEFAULT_EASE}` : 'none';
    root.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    applied.current = wanted;
    setFrameState({ scale, box });
    // `time` is read but deliberately not a dependency: it changes every frame
    // and only decides whether this one change eases.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeIndex, keyframes, ratio, full, box]);

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

  /* F toggles the full page against the framed view. Authoring only. */
  useEffect(() => {
    if (!active || !authoring) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key !== 'f' && e.key !== 'F') return;
      e.preventDefault();
      e.stopPropagation();
      setFull((v) => !v);
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
    // A newly written frame is the picture you were just composing, so it has
    // to be on screen now rather than after the next seek.
    applied.current = null;
    landNext.current = true;
    persist(next);
  }, [keyframes, persist, ratio, time]);

  const removeActive = useCallback(() => {
    if (activeIndex < 0) return;
    const next = keyframes.filter((_, i) => i !== activeIndex);
    applied.current = null;
    landNext.current = true;
    persist(next, next.length === 0);
  }, [activeIndex, keyframes, persist]);

  const jumped = useCallback(() => { landNext.current = true; }, []);

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

  /* The outlines of the keyframe at the playhead, one per ratio it holds. */
  const kf = activeIndex >= 0 ? keyframes[activeIndex] : null;
  const outlines: { ratio: Ratio; rect: Rect }[] = [];
  if (active && full && kf) {
    const root = appRoot();
    for (const r of RATIOS) {
      const region = kf.regions[r];
      if (!region) continue;
      const rect = root ? withIdentity(root, () => regionRect(region, hostRef.current)) : null;
      if (rect) outlines.push({ ratio: r, rect });
    }
  }

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
      {full && outlines.map((o) => (
        <div
          key={o.ratio}
          data-testid="frame-region"
          data-region-ratio={o.ratio}
          style={{
            position: 'absolute',
            left: o.rect.x, top: o.rect.y, width: o.rect.w, height: o.rect.h,
            outline: `2px dashed ${RATIO_COLOR[o.ratio]}`,
            background: o.ratio === ratio ? `${RATIO_COLOR[o.ratio]}14` : 'transparent',
          }}
        >
          <span style={{
            position: 'absolute', left: 0, top: -16,
            font: '11px/1.2 ui-monospace, Consolas, monospace',
            color: RATIO_COLOR[o.ratio],
          }}>
            {o.ratio}
          </span>
        </div>
      ))}
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
    drawing, setDrawing, removeActive, jumped, error, overlay,
  };
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
        data-testid="frame-delete"
        onClick={frames.removeActive}
        disabled={frames.activeIndex < 0}
        title="Delete the keyframe at the playhead"
        style={button}
      >
        x
      </button>
      <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
        {frames.full ? 'full page (F)' : 'framed (F)'}
        {frames.error ? ` · ${frames.error}` : ''}
      </span>
    </>
  );
}
