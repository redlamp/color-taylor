/**
 * The script runner's camera.
 *
 * A `camera` cue frames part of the app: the wrapper `#app-camera` (App.tsx)
 * is given `transform: translate(tx, ty) scale(z)` with its origin at `0 0`,
 * so the browser re-renders the app's text and vectors at the new scale
 * instead of the recording being an upscaled 1080p crop. The ghost cursor,
 * the drawn callouts and presentation mode's transport are all portalled to
 * `document.body`, outside the wrapper, so none of them are scaled by this.
 *
 * Two things make it safe to drive from the cue file:
 *
 * 1. The tween is ours, on `requestAnimationFrame`, and the whole state is a
 *    single (zoom, focal point) pair - never read back off the DOM. So
 *    `seek()` can land on any moment by applying the last cue before it with
 *    a zero-length move, exactly the way `color` does.
 * 2. Every frame is clamped so the viewport stays inside the scaled app: a
 *    move to the edge of the hexagon slides up against the app's edge and
 *    stops rather than showing whatever is outside it.
 *
 * Coordinates. "Local" is the wrapper's own untransformed pixel space, top
 * left at (0, 0). A local point `p` lands on screen at `L + t + z * p`, where
 * `L` is the wrapper's untransformed client position. Everything else in the
 * runner works in client pixels read from `getBoundingClientRect`, which is
 * already in transformed screen space - which is why the Driver's synthetic
 * events keep hitting the right controls while zoomed - so the only
 * conversion needed is client -> local, to find what a cue is pointing at.
 */

import type { Point } from './drive';

/** The id of the element the transform goes on. */
export const CAMERA_ID = 'app-camera';

/** Default length of a camera move, and the full-frame zoom. */
export const CAMERA_MS = 800;
export const CAMERA_HOME = 1;

/** Where the camera is: a zoom, and the local point held at the viewport's centre. */
export interface CameraState {
  zoom: number;
  /** Focal point, in the wrapper's untransformed pixels. */
  focus: Point;
}

export type CameraEase = 'linear' | 'smooth';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (u: number) => u * u * (3 - 2 * u);
const easeFn = (name: CameraEase | undefined) => (name === 'linear' ? (u: number) => u : smoothstep);

/**
 * How the layer is asked to re-rasterise during a move. `plain` is the
 * shipping behaviour: the transform is written to the inline style every
 * frame and nothing promotes the wrapper, so Chrome repaints it at the scale
 * of the frame. The other two exist to be measured against it (`?cam=wc`,
 * `?cam=nudge`).
 */
export type CameraMode = 'plain' | 'wc' | 'nudge';

export function cameraMode(): CameraMode {
  try {
    const raw = new URLSearchParams(window.location.search).get('cam');
    return raw === 'wc' || raw === 'nudge' ? raw : 'plain';
  } catch {
    return 'plain';
  }
}

/**
 * The wrapper as it would be with no transform on it: its position in the
 * page (so a scroll can be taken off it) and its size. Measured by taking
 * the transform off for one read, so it is done once and on resize, not per
 * frame.
 */
interface Frame {
  /** Page-space position of the wrapper's top left. */
  px: number;
  py: number;
  /** Untransformed size. */
  w: number;
  h: number;
}

export class Camera {
  private el: HTMLElement | null;
  private mode: CameraMode;
  private state: CameraState;
  private frame: Frame;
  private raf = 0;
  /** Bumped by every move, set and reset, so a stale frame loop retires. */
  private gen = 0;
  private locked = false;
  private onResize = () => { this.frame = this.measure(); this.write(this.state); };

  constructor(el: HTMLElement | null, mode: CameraMode = 'plain') {
    this.el = el;
    this.mode = mode;
    if (el && mode === 'wc') el.style.willChange = 'transform';
    this.frame = this.measure();
    this.state = this.home();
    window.addEventListener('resize', this.onResize);
  }

  get zoom() { return this.state.zoom; }
  /** The local point the viewport is centred on now: a cue with no target keeps it. */
  get focus(): Point { return { ...this.state.focus }; }

  /** The identity state: the whole app, centred. */
  home(): CameraState {
    return { zoom: CAMERA_HOME, focus: { x: this.frame.w / 2, y: this.frame.h / 2 } };
  }

  private measure(): Frame {
    const el = this.el;
    if (!el) return { px: 0, py: 0, w: window.innerWidth, h: window.innerHeight };
    const had = el.style.transform;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const f = { px: r.left + window.scrollX, py: r.top + window.scrollY, w: r.width, h: r.height };
    el.style.transform = had;
    return f;
  }

  /** Untransformed client position of the wrapper's top left, right now. */
  private origin(): Point {
    return { x: this.frame.px - window.scrollX, y: this.frame.py - window.scrollY };
  }

  /**
   * The translate that puts `s.focus` at the centre of the viewport, clamped
   * so the viewport never reaches past the app. When the scaled app is
   * smaller than the viewport in an axis (zoom 1) it is centred in it
   * instead, which is what brings `zoom: 1` back to the identity transform.
   */
  private offsets(s: CameraState): { tx: number; ty: number } {
    const o = this.origin();
    const axis = (focus: number, size: number, view: number, org: number) => {
      const span = size * s.zoom;
      if (span <= view) return (view - span) / 2 - org;
      return clamp(view / 2 - org - s.zoom * focus, view - span - org, -org);
    };
    return {
      tx: axis(s.focus.x, this.frame.w, window.innerWidth, o.x),
      ty: axis(s.focus.y, this.frame.h, window.innerHeight, o.y),
    };
  }

  /** Client point -> the wrapper's untransformed pixels, at the current state. */
  toLocal(p: Point): Point {
    const o = this.origin();
    const { tx, ty } = this.offsets(this.state);
    return { x: (p.x - o.x - tx) / this.state.zoom, y: (p.y - o.y - ty) / this.state.zoom };
  }

  /** A 0-1 pair of the app's width and height -> untransformed pixels. */
  fractionToLocal(x: number, y: number): Point {
    return { x: this.frame.w * x, y: this.frame.h * y };
  }

  /**
   * A scaled-up wrapper spills past the bottom of the document, and the
   * spill counts towards the scrollable area, so the page grows a scrollbar
   * the moment the camera pushes in. The root's overflow is held while the
   * camera is off home; `hidden` rather than `clip` so `scroll` cues can
   * still move the page programmatically.
   */
  private lockScroll(zoomed: boolean) {
    if (zoomed === this.locked) return;
    this.locked = zoomed;
    document.documentElement.style.overflow = zoomed ? 'hidden' : '';
    // Taking the scrollbar away widens the viewport, so the app reflows:
    // measure again before the offsets are worked out from it.
    this.frame = this.measure();
  }

  private write(s: CameraState) {
    this.state = s;
    const el = this.el;
    if (!el) return;
    this.lockScroll(s.zoom > 1.0001);
    const { tx, ty } = this.offsets(s);
    el.style.transformOrigin = '0 0';
    el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.zoom.toFixed(4)})`;
    if (this.mode === 'nudge') {
      // Mitigation (iii): touch a property that dirties layout for the
      // subtree, so the rasterised layer cannot be reused for this frame.
      el.style.paddingBottom = el.style.paddingBottom === '0.01px' ? '0px' : '0.01px';
    }
  }

  /** Land on a state with no tween: seek, and a cue whose `ms` is 0. */
  set(s: CameraState) {
    this.gen += 1;
    cancelAnimationFrame(this.raf);
    this.write(s);
  }

  /**
   * Move to `s` over `ms`. The tween runs on the zoom and the focal point,
   * with the translate recomputed (and re-clamped) from them each frame, so
   * the subject stays centred the whole way across instead of drifting off
   * and back the way a straight translate tween does.
   */
  move(s: CameraState, ms: number, ease?: CameraEase): void {
    if (!this.el || ms <= 0) { this.set(s); return; }
    this.gen += 1;
    const mine = this.gen;
    cancelAnimationFrame(this.raf);
    const from = { zoom: this.state.zoom, focus: { ...this.state.focus } };
    const f = easeFn(ease);
    const t0 = performance.now();
    const step = (now: number) => {
      if (mine !== this.gen) return;
      const u = clamp((now - t0) / ms, 0, 1);
      const k = f(u);
      this.write({
        zoom: from.zoom + (s.zoom - from.zoom) * k,
        focus: {
          x: from.focus.x + (s.focus.x - from.focus.x) * k,
          y: from.focus.y + (s.focus.y - from.focus.y) * k,
        },
      });
      if (u < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /** No transform at all, and no leftover layer hint. */
  reset() {
    this.gen += 1;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.lockScroll(false);
    this.state = this.home();
    const el = this.el;
    if (!el) return;
    el.style.transform = '';
    el.style.transformOrigin = '';
    el.style.willChange = '';
    el.style.paddingBottom = '';
  }
}
