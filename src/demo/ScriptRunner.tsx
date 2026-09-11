/**
 * The video script runner.
 *
 * A time-locked player for a recorded cut: `?script=<name>` loads
 * `public/scripts/<name>.json`, waits for Space (or `&go=N` seconds), fires a
 * one-frame white flash for sync, and then starts each action when the clock
 * reaches its `at`. It drives the app through the same `Driver` the built-in
 * demo uses, so every gesture goes through the real controls, and draws its
 * own ghost cursor with `DemoCursor`. The drawn callouts (`rect`, `circle`)
 * go into an SVG layer under the cursor; a `circle`, and a `rect` whose
 * `hands` are `free`, draws itself there without the cursor, so the hands
 * are free for something else meanwhile.
 *
 * Unlike the demo, actions are not a sequence: each one is an independent
 * promise started on the clock, and a late one never delays the next. When a
 * new action starts while another is still running, the driver is interrupted
 * first, so the abandoned one unwinds at its next await. The `demo` action
 * hands over to the built-in demo; while that is open this cursor is hidden
 * and due actions are held until it exits.
 *
 * The clock is pluggable. Recording mode (`?script=`) runs on `performance.now()`
 * from the moment Space is pressed; presentation mode (`?present=`, see
 * PresentationMode.tsx) hands in a clock read off an audio element, and can
 * seek. The vocabulary is documented in docs/demo-script.md.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DemoCursor, { CURSOR_BOX, cursorKind, hotspotOf, type CursorKind } from './DemoCursor';
import { Driver, DemoAborted, centerOf, type Point, type Stage } from './drive';
import { fieldPoint, hexClientPoint, smooth, type DemoHost } from './steps';
import { markScriptRunner, setScriptOverDemo } from './handover';
import { CENTER_X, CENTER_Y, HUE_LABEL_OFFSET, PI, RADIUS } from '../components/hex/hexConstants';

export interface ScriptAction {
  /** Seconds into the cut at which the action begins. */
  at: number;
  do: 'rest' | 'hover' | 'walk' | 'click' | 'loop' | 'circle' | 'rect' | 'ray' | 'orbit' | 'stem' | 'wander'
    | 'demo' | 'slider' | 'box' | 'tip' | 'color' | 'scroll' | 'leave' | 'underline' | 'pip';
  target?: string;
  targets?: string[];
  ms?: number;
  /** `tip`: take the hexagon's hue pill round the ring instead of the tip handle. */
  via?: 'hue-label';
  /**
   * `rect`: re-measure the target every frame, so the box tracks a group whose
   * own size is what the line is about (`range:rgb`, which is the span of the
   * three RGB handles). It stands live for its whole `hold` as well as while
   * it is drawn.
   */
  live?: boolean;
  /** `rect`: `free` draws the box itself, without the cursor, the way a `circle` does. */
  hands?: 'free';
  /**
   * `rect`/`circle`/`ray`: the callout's stroke, any CSS color. Default is the
   * layer's own red, so a callout that is not naming a channel needs nothing.
   */
  color?: string;
  /**
   * Run even while the built-in demo is on screen, and show this runner's
   * cursor for as long as it does. Only for a gesture aimed at the demo's own
   * chrome (`underline` on `demo-caption`); everything else stays held.
   */
  over?: 'demo';
  /** `loop`/`circle`/`orbit`: full turns around the target; `wobble`: radius (or saturation) modulation, 0-1. */
  turns?: number;
  wobble?: number;
  /**
   * `slider`: track positions, 0-100 (`editor-hue`: 0-360; `from` defaults
   * to the current hue). `box`: `[s, b]` pairs (`from` defaults to the
   * current color). `rect`: the corner to start from.
   */
  from?: number | RectCorner | [number, number];
  /**
   * `slider`/`box`: where the drag lands. `tip` with `via: "hue-label"`: an
   * absolute hue to take the pill to, the short way round (`degrees` is the
   * relative form, and wins where both are given). `pip`: which side of the
   * screen edge the camera panel ends up on.
   */
  to?: number | [number, number] | 'off' | 'on';
  /** `rect`/`circle`: how long the drawn shape stands after the gesture, before it fades (default 900). */
  hold?: number;
  degrees?: number;
  /** `stem`: which channel's stem, and how far along it as a fraction of its length (-1..1). */
  ch?: 'r' | 'g' | 'b';
  amount?: number;
  h?: number;
  s?: number;
  b?: number;
}

export type RectCorner = 'tl' | 'tr' | 'bl' | 'br';

export interface Script {
  actions: ScriptAction[];
}

/**
 * Where the runner reads the time from. Recording mode builds its own from
 * `performance.now()`; presentation mode reads the voice track's position.
 */
export interface ScriptClock {
  /** Seconds into the cut. */
  now: () => number;
  /** Whether the clock is advancing. Nothing is dispatched while it is not. */
  running: () => boolean;
}

/** What a parent can ask of the schedule once it is up. */
export interface ScriptRunnerHandle {
  /**
   * Jump the schedule to `t` seconds: the running action is interrupted, the
   * latest `color` at or before `t` is applied, the ghost goes to the last
   * `rest`/`hover` target before `t`, and dispatching resumes with the first
   * action at or after `t`. Nothing earlier fires again until a seek back.
   */
  seek: (t: number) => void;
}

export interface ScriptRunnerProps {
  host: DemoHost;
  /** Start the built-in demo, its ghost picking up from where this one stands. */
  onDemo: (from?: Point | null) => void;
  /** Tween the app's color; the tween length is the app's own. */
  onColor: (hsb: { h: number; s: number; b: number }) => void;
  /** Whether the built-in demo is on screen, which hides this runner's cursor. */
  demoOpen: boolean;
  /**
   * Presentation mode: a script the parent has already loaded and a clock it
   * drives. With both omitted the runner is in recording mode, loading
   * `?script=<name>` itself and running on Space or `&go=N`.
   */
  script?: Script;
  clock?: ScriptClock;
  /** Receives the seek handle when the schedule is up, and null when it goes down. */
  onHandle?: (handle: ScriptRunnerHandle | null) => void;
}

/** How long the sync flash stays at full opacity. */
const FLASH_MS = 100;
/** Travel time between targets; a walk spends the rest of its budget dwelling. */
const MOVE_MS = 400;
/** How long the ghost takes to reach its pose after a seek. */
const SEEK_MOVE_MS = 200;

// The lean, lifted from DemoRunner so the two ghosts move alike.
const TILT_MAX = 20;
const TILT_PER_PX = 1.5;
const TILT_FROM_VERTICAL = 0.5;
const TILT_SPRING = 0.10;
const TILT_DAMP = 0.65;
const TILT_LIMIT = 30;
const RIPPLE_MS = 480;
const RIPPLE_FROM = 12;
const RIPPLE_TO = 58;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const q = (selector: string) => document.querySelector(selector);
const tipEl = () => {
  const joints = document.querySelectorAll('[data-joint]');
  return joints.length ? joints[joints.length - 1] : null;
};

/**
 * How far the camera panel is currently pushed off its home position, and how
 * to put it there. Kept on the element rather than in the schedule, so a seek
 * can set it without replaying the drag, and so the panel's own markup is the
 * only thing that knows how it is moved.
 */
const pipOffset = (el: HTMLElement) => Number(el.dataset.pipX ?? '0') || 0;
function setPipOffset(el: HTMLElement, x: number) {
  el.dataset.pipX = String(Math.round(x));
  el.style.transform = `translateX(${Math.round(x)}px)`;
}

/** Hue, in degrees, of each corner of the hexagon. */
const CORNER_HUE: Record<string, number> = { r: 0, y: 60, g: 120, c: 180, b: 240, m: 300 };

interface Target {
  el: Element;
  /** Read at the moment it is needed: the page scrolls and the panels reflow. */
  at: () => Point;
  /**
   * The target's own radius in client pixels, for a `loop` around it. Omitted
   * for elements, which use half their box width.
   */
  radius?: () => number;
  /**
   * For a group of controls: the box a `rect` is drawn around, in client
   * pixels, padded. A `loop`/`circle` around a target with a box goes round
   * it as an ellipse instead of a circle.
   */
  rect?: () => DOMRect;
}

/** Client-space union of some elements' boxes, padded. */
function unionRect(els: Element[], pad: number): DOMRect {
  let l = Infinity; let t = Infinity; let r = -Infinity; let b = -Infinity;
  for (const el of els) {
    const q = el.getBoundingClientRect();
    l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
  }
  return new DOMRect(l - pad, t - pad, r - l + pad * 2, b - t + pad * 2);
}
const rectCenter = (r: DOMRect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
/** Padding around a group of controls for `rect`, and around a header row. */
const GROUP_PAD = 10;
/**
 * Padding around one channel's row. Tighter than a group's: the three rows
 * are about 40 px apart, and at GROUP_PAD the red, green and blue boxes of
 * beat 3.3 overlapped each other and climbed into the bank's toggle row.
 */
const ROW_PAD = 4;
/** How tall the header band of a section is taken to be, for `editor-top`. */
const HEADER_BAND = 60;
/** A circuit around a vertex letter, as a multiple of the letter's half-size. */
const LETTER_RING = 1.6;
/**
 * A circuit around a slider handle, as a multiple of its half-size. Wider than
 * a letter's, because the handle is the smallest thing anything is ringed
 * around and a ring hugging it reads as part of the control.
 */
const HANDLE_RING = 1.8;
/**
 * The least a ring around a handle may be. The RGB banks mark their value
 * with a 10px arrow, and 1.8x its half-size is a ring smaller than the stroke
 * it is drawn in.
 */
const HANDLE_RING_MIN = 18;
/** How far the span of a group of handles is padded for `range:rgb`. */
const RANGE_PAD = 8;

/** Default turns and wobble for a `loop`, and the y squash that keeps it off a circle. */
const LOOP_TURNS = 1.3;
const LOOP_WOBBLE = 0.18;
const LOOP_SQUASH = 0.85;
const LOOP_RADIUS = 0.55;
const smoothstep = (u: number) => u * u * (3 - 2 * u);
/** A `circle` is a little over one lap, drawn over this long by default. */
const CIRCLE_TURNS = 1.1;
const CIRCLE_MS = 1200;
/** How far a `rect`'s diagonal bows off the straight line, in px: a hand, not a ruler. */
const DIAG_BOW = 6;
/**
 * The least a gesture gets once its travel is paid for, for the actions whose
 * `ms` is the whole budget (`rect`, `box`, `slider` on `editor-hue`): the
 * diagonal or the drag, whatever the trip to its first point cost.
 */
const GESTURE_MIN_MS = 400;
/** The travel and the gesture a budget splits into: up to MOVE_MS of travel, the rest for the gesture. */
const splitBudget = (ms: number) => {
  const travel = Math.min(MOVE_MS, Math.max(0, ms - GESTURE_MIN_MS));
  return { travel, gesture: Math.max(GESTURE_MIN_MS, ms - travel) };
};
/** The drawn callouts: a solid bright red stroke, thick enough to read on video. */
const SHAPE_STROKE = 8;
const SHAPE_FILL_OPACITY = 0.05;
const SHAPE_COLOR = '#ff3333';
const shapeColor = (): string => SHAPE_COLOR;
/** A `ray`'s thickness in client px, and the stroke each channel's callouts wear. */
const RAY_WIDTH = 36;
/**
 * How far past each end the bar runs, in client px: back behind the middle of
 * the hexagon, and out past the vertex letter. The bar is the claim that this
 * channel's direction joins the centre to that letter, so it has to contain
 * both of them - it used to stop 19px short of the letter, which left the
 * thing being named outside the thing doing the naming.
 */
const RAY_CENTER_OVER = 24;
const RAY_LETTER_OVER = 20;
const CHANNEL_COLOR: Record<string, string> = { r: '#ff3333', g: '#2ecc40', b: '#3b82f6' };
/** How long a finished callout stands before it fades, and how long the fade takes. */
const HOLD_MS = 900;
const FADE_MS = 300;
const SVG_NS = 'http://www.w3.org/2000/svg';
/** `orbit`: the saturation band the wobble is allowed to roam. */
const ORBIT_SAT_MIN = 0.55;
const ORBIT_SAT_MAX = 1.0;
/** `wander`: how far the control points sit off the travel line, as a fraction of its length. */
const WANDER_BOW = 0.25;
/** How far outside the hue pill's rim the arrow's tip sits while holding it, in px. */
const HUE_GRIP_CLEAR = 2;
/**
 * The camera panel: where the ghost takes hold of it (from its top-left
 * corner, so the hand stays on screen for nearly the whole trip), and how far
 * past the right edge "off" is.
 */
const PIP_GRIP_X = 28;
const PIP_GRIP_Y = 14;
const PIP_OFF_CLEAR = 8;
/** `underline`: how far under the text the line runs, and how far it bows down in the middle, in px. */
const UNDERLINE_GAP = 4;
const UNDERLINE_BOW = 2;
/** How long `underline` waits for its target to exist and stop moving. */
const SETTLE_MS = 600;
const SETTLE_POLL_MS = 32;

/**
 * The hand's own irregularity for a circuit: a few slow sines at non-integer
 * multiples of the turn, so no two laps trace the same line.
 */
const wobbleAt = (wobble: number, phase: number) =>
  1 + wobble * (0.5 * Math.sin(phase * 0.37 + 0.6) + 0.3 * Math.sin(phase * 0.71 + 2.1) + 0.2 * Math.sin(phase * 1.13 + 4.0));

/**
 * A hand-drawn circuit around `c`: an ellipse of `rx` by `ry`, `turns` laps
 * from the top, clockwise, with the angular progress eased over the whole
 * path so it starts and ends at rest.
 */
function circuitPoint(c: Point, rx: number, ry: number, turns: number, wobble: number): (u: number) => Point {
  return (u) => {
    const angle = -PI / 2 + 2 * PI * turns * smoothstep(u);
    const w = wobbleAt(wobble, angle);
    return { x: c.x + rx * w * Math.cos(angle), y: c.y + ry * w * Math.sin(angle) };
  };
}

/** The radii a circuit around a target uses: its own, or a box's. */
function circuitRadii(t: Target, scale: number): { rx: number; ry: number } {
  if (t.rect && !t.radius) {
    const r = t.rect();
    return { rx: r.width / 2, ry: r.height / 2 };
  }
  const r = scale * (t.radius ? t.radius() : t.el.getBoundingClientRect().width / 2);
  return { rx: r, ry: r * LOOP_SQUASH };
}

/** The corner of `r` a `rect` starts from, and the one across from it. */
function rectCorners(r: DOMRect, from: RectCorner): { start: Point; end: Point } {
  const corners: Record<RectCorner, Point> = {
    tl: { x: r.left, y: r.top }, tr: { x: r.right, y: r.top },
    br: { x: r.right, y: r.bottom }, bl: { x: r.left, y: r.bottom },
  };
  const opposite: Record<RectCorner, RectCorner> = { tl: 'br', tr: 'bl', br: 'tl', bl: 'tr' };
  return { start: corners[from], end: corners[opposite[from]] };
}

/**
 * A marquee's diagonal from `a` to `b`, eased, bowed a few pixels off the
 * straight line. The rectangle that grows with it stays straight-edged; only
 * the hand curves.
 */
function diagonalPoint(a: Point, b: Point): (u: number) => Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return (u) => {
    const t = smoothstep(u);
    const off = DIAG_BOW * Math.sin(PI * t);
    return { x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off };
  };
}

/** A shape being drawn: fed the cursor's point each frame, then told the gesture is over. */
interface Drawn {
  update: (p: Point) => void;
  done: () => void;
}

/**
 * The drawn callouts behind the cursor: a marquee for `rect`, grown by the
 * gesture that draws it, and a ring for `circle`, which draws itself on the
 * layer's own frame loop without the cursor. Each is an element in the fixed
 * SVG layer, held and faded on its own timers, so the next action taking the
 * cursor does not take the shape down with it.
 */
class Callouts {
  private timers = new Set<number>();
  private frames = new Set<number>();
  private color = shapeColor();

  constructor(private layer: SVGSVGElement | null) {}

  private add(tag: 'rect' | 'polyline', color?: string): SVGElement {
    const el = document.createElementNS(SVG_NS, tag);
    const ink = color ?? this.color;
    el.setAttribute('fill', tag === 'rect' ? ink : 'none');
    el.setAttribute('fill-opacity', String(SHAPE_FILL_OPACITY));
    el.setAttribute('stroke', ink);
    el.setAttribute('stroke-width', String(SHAPE_STROKE));
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    this.layer?.appendChild(el);
    return el;
  }

  private later(ms: number, fn: () => void) {
    const id = window.setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
  }

  private nextFrame(fn: (now: number) => void) {
    const id = requestAnimationFrame((now) => { this.frames.delete(id); fn(now); });
    this.frames.add(id);
  }

  /** Hold the finished shape, fade it, take it out. */
  private retire(el: SVGElement, hold: number) {
    this.later(hold, () => {
      el.style.transition = `opacity ${FADE_MS}ms ease-out`;
      el.style.opacity = '0';
      this.later(FADE_MS, () => el.remove());
    });
  }

  /**
   * A selection marquee anchored at `a`, spanning to wherever the cursor is.
   * Nothing shows until the first update: a zero-size rect is not drawn.
   */
  marquee(a: Point, hold: number, color?: string): Drawn {
    const el = this.add('rect', color);
    el.setAttribute('x', String(a.x));
    el.setAttribute('y', String(a.y));
    el.setAttribute('width', '0');
    el.setAttribute('height', '0');
    return {
      update: (p) => {
        el.setAttribute('x', String(Math.min(a.x, p.x)));
        el.setAttribute('y', String(Math.min(a.y, p.y)));
        el.setAttribute('width', String(Math.abs(p.x - a.x)));
        el.setAttribute('height', String(Math.abs(p.y - a.y)));
      },
      done: () => this.retire(el, hold),
    };
  }

  /**
   * A marquee that draws itself, the way `ring` does: from `a` toward `b`
   * over `ms`, eased, then held and faded. For a `rect` whose hands are
   * free - the cursor is busy with a drag while the box goes up.
   */
  box(a: Point, b: Point, ms: number, hold: number, color?: string) {
    const shape = this.marquee(a, hold, color);
    const t0 = performance.now();
    const step = (now: number) => {
      const t = smoothstep(clamp((now - t0) / Math.max(1, ms), 0, 1));
      shape.update({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (t < 1) this.nextFrame(step);
      else shape.done();
    };
    this.nextFrame(step);
  }

  /**
   * A marquee that both draws itself and keeps measuring: `box()` is read
   * every frame, the diagonal grows across it over `ms`, and for the rest of
   * `hold` the rectangle is the target's own, live. For a callout whose whole
   * point is that the thing it is around changes size while it stands.
   */
  liveBox(box: () => DOMRect, from: RectCorner, ms: number, hold: number, color?: string) {
    const el = this.add('rect', color);
    const t0 = performance.now();
    const step = (now: number) => {
      const elapsed = now - t0;
      const { start: a, end: b } = rectCorners(box(), from);
      const t = smoothstep(clamp(elapsed / Math.max(1, ms), 0, 1));
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      el.setAttribute('x', String(Math.min(a.x, p.x)));
      el.setAttribute('y', String(Math.min(a.y, p.y)));
      el.setAttribute('width', String(Math.abs(p.x - a.x)));
      el.setAttribute('height', String(Math.abs(p.y - a.y)));
      if (elapsed < ms + hold) this.nextFrame(step);
      else {
        el.style.transition = `opacity ${FADE_MS}ms ease-out`;
        el.style.opacity = '0';
        this.later(FADE_MS, () => el.remove());
      }
    };
    this.nextFrame(step);
  }

  /**
   * A ring that draws itself: `point(u)` is read every frame for `ms`, u
   * from 0 to 1, and the stroke is laid down point by point, then held and
   * faded. No cursor is involved, so nothing that takes the hands can cut
   * it short; only `clear` does.
   */
  ring(point: (u: number) => Point, ms: number, hold: number, color?: string) {
    const el = this.add('polyline', color);
    const pts: string[] = [];
    const t0 = performance.now();
    const step = (now: number) => {
      const u = clamp((now - t0) / Math.max(1, ms), 0, 1);
      const p = point(u);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      el.setAttribute('points', pts.join(' '));
      if (u < 1) this.nextFrame(step);
      else this.retire(el, hold);
    };
    this.nextFrame(step);
  }

  /**
   * A bar from `c` out to `tip`, `width` px thick, drawn on the ray between
   * them: an axis-aligned rect rotated about `c`, growing outward over `ms`,
   * then held and faded. Self-drawn like `ring`, so a drag can run under it.
   * The geometry is read once - it is pinned to the hexagon, which does not
   * move while the bar is up.
   */
  beam(c: Point, tip: Point, width: number, ms: number, hold: number, color?: string) {
    const el = this.add('rect', color);
    const len = Math.hypot(tip.x - c.x, tip.y - c.y);
    const deg = (Math.atan2(tip.y - c.y, tip.x - c.x) * 180) / PI;
    el.setAttribute('x', String(c.x));
    el.setAttribute('y', String(c.y - width / 2));
    el.setAttribute('height', String(width));
    el.setAttribute('width', '0');
    el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${c.x} ${c.y})`);
    const t0 = performance.now();
    const step = (now: number) => {
      const u = smoothstep(clamp((now - t0) / Math.max(1, ms), 0, 1));
      el.setAttribute('width', String(len * u));
      if (u < 1) this.nextFrame(step);
      else this.retire(el, hold);
    };
    this.nextFrame(step);
  }

  /** Everything off at once, timers and frame loops included. */
  clear() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
    this.frames.forEach((id) => cancelAnimationFrame(id));
    this.frames.clear();
    while (this.layer?.firstChild) this.layer.firstChild.remove();
  }
}

/** A cubic bezier from `p0` to `p3`, bowing to alternate sides, eased. */
function wanderPoint(p0: Point, p3: Point): (u: number) => Point {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = WANDER_BOW * len;
  const p1 = { x: p0.x + dx / 3 + nx * bow, y: p0.y + dy / 3 + ny * bow };
  const p2 = { x: p0.x + (2 * dx) / 3 - nx * bow, y: p0.y + (2 * dy) / 3 - ny * bow };
  return (u) => {
    const t = smoothstep(u);
    const s = 1 - t;
    return {
      x: s * s * s * p0.x + 3 * s * s * t * p1.x + 3 * s * t * t * p2.x + t * t * t * p3.x,
      y: s * s * s * p0.y + 3 * s * s * t * p1.y + 3 * s * t * t * p2.y + t * t * t * p3.y,
    };
  };
}

/**
 * The hue of an orbit, in turns: `turns` laps, landing back on the starting
 * hue. The whole laps go round; the fractional part is a bulge that goes
 * out and comes back, so 1.2 turns reads as a lap and a bit without ending
 * 72 degrees off. Monotone for any fraction (the bulge's slope never beats
 * a whole lap's).
 */
function orbitTurns(turns: number, u: number): number {
  const whole = Math.floor(turns);
  const frac = turns - whole;
  const p = smoothstep(u);
  return whole * p + frac * Math.sin(PI * p);
}

/**
 * How far a stadium (a `rounded-full` box `w` by `h`, `w` >= `h`) reaches
 * from its center along the unit direction (`ux`, `uy`).
 */
function stadiumReach(w: number, h: number, ux: number, uy: number): number {
  const r = h / 2;
  const a = Math.max(0, w / 2 - r);
  const ax = Math.abs(ux);
  const ay = Math.abs(uy);
  // Straight side first: the ray leaves through the flat edge if it gets
  // there before the caps; otherwise through a cap.
  if (ay > 0 && (r / ay) * ax <= a) return r / ay;
  return a * ax + Math.sqrt(Math.max(0, a * a * ax * ax - a * a + r * r));
}

/**
 * Where to hold the hue pill so the pointer reads as hue `h`.
 *
 * The pill sits on the ring HUE_LABEL_OFFSET outside the hexagon, where
 * ColorHexagon's `hueLabel` puts it. The app reads hue as the pointer's
 * angle from the center and then draws the pill on that angle, so a
 * pointer holding the pill is always on the pill's own radial line: a grip
 * off to one side is not a thing the control can do - the pill would swing
 * under the pointer. So the grip is radial, on the pill's outer edge plus
 * a little clearance: the arrow's tip touches the pill's rim and its body
 * trails away outside it, off the number for most of the ring. The point
 * is on the ray at `h` exactly, so pressing does not nudge the hue and a
 * full turn lands back where it started.
 */
function hueGripPoint(pill: Element, h: number): Point | null {
  const c = hexClientPoint(CENTER_X, CENTER_Y);
  const rad = (h * PI) / 180;
  const ring = RADIUS + HUE_LABEL_OFFSET;
  const p = hexClientPoint(CENTER_X + ring * Math.cos(rad), CENTER_Y - ring * Math.sin(rad));
  if (!c || !p) return null;
  const len = Math.hypot(p.x - c.x, p.y - c.y) || 1;
  const ux = (p.x - c.x) / len;
  const uy = (p.y - c.y) / len;
  const r = pill.getBoundingClientRect();
  const reach = stadiumReach(Math.max(r.width, r.height), Math.min(r.width, r.height), ux, uy) + HUE_GRIP_CLEAR;
  return { x: p.x + ux * reach, y: p.y + uy * reach };
}

/** Both ends of a stem, in client pixels: the SVG line the hit target is. */
function stemEnds(el: Element): { a: Point; b: Point } | null {
  const n = (attr: string) => Number(el.getAttribute(attr));
  const a = hexClientPoint(n('x1'), n('y1'));
  const b = hexClientPoint(n('x2'), n('y2'));
  return a && b ? { a, b } : null;
}

/**
 * Read the URL once: the script name, the optional auto-start delay, and
 * whether to play the voice track alongside (`&audio=1`, for checking a take
 * by ear; the recording itself is silent).
 */
export function scriptParams(): { name: string | null; go: number | null; audio: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('script');
    const name = raw && /^[\w-]+$/.test(raw) ? raw : null;
    const go = params.get('go');
    const n = go === null ? NaN : Number(go);
    return { name, go: Number.isFinite(n) && n >= 0 ? n : null, audio: params.get('audio') === '1' };
  } catch {
    return { name: null, go: null, audio: false };
  }
}

/** The voice track that goes with a script, served beside its JSON. */
export const scriptAudioUrl = (name: string) => `${import.meta.env.BASE_URL}scripts/${name}.m4a`;

/** The actions of a script, in clock order. */
export const sortActions = (actions: ScriptAction[]) => [...actions].sort((a, b) => a.at - b.at);

/**
 * The slider id a `slider:<c>` target names. The full form is the bank and
 * the channel (`hsb-s`); a bare `r`, `g` or `b` is the RGB bank's.
 */
/** `<bank>-<ch>` from a target's suffix; a bare `r`/`g`/`b` is the RGB bank's. */
const bankChannel = (c: string) => (c.includes('-') ? c : `rgb-${c}`);
const sliderChannel = (name: string) => bankChannel(name.slice(7));
/**
 * A slider's marker. ColorSlider draws either a ring (`-handle`) or an arrow
 * under the track (`-arrow`), depending on the bank, and both are the same
 * thing to anything pointing at "the handle".
 */
const markerEl = (channel: string) =>
  q(`#slider-${channel}-handle`) ?? q(`#slider-${channel}-arrow`);

/**
 * A logical target name to the element it means and where to point at it.
 * `host` is read for the targets whose point depends on the color (the hue
 * pill's grip sits where the current hue puts the pill).
 */
function resolve(name: string, host: DemoHost): Target | null {
  const byEl = (el: Element | null): Target | null => (el ? { el, at: () => centerOf(el) } : null);
  const onHex = (svgX: number, svgY: number): Target | null => {
    const el = q('#hex-svg');
    if (!el) return null;
    return {
      el,
      at: () => hexClientPoint(svgX, svgY) ?? centerOf(el),
      // The hexagon's circumscribed radius, measured on screen.
      radius: () => {
        const c = hexClientPoint(CENTER_X, CENTER_Y);
        const e = hexClientPoint(CENTER_X + RADIUS, CENTER_Y);
        return c && e ? e.x - c.x : el.getBoundingClientRect().width / 2;
      },
    };
  };
  if (name === 'about-watch-demo') return byEl(q('#about-watch-demo'));
  if (name === 'about-close') return byEl(q('#about-close'));
  if (name === 'help-button') return byEl(q('#demo-button'));
  if (name === 'editor') return byEl(q('#color-editor-group'));
  if (name === 'hex-field' || name === 'hex-center') return onHex(CENTER_X, CENTER_Y);
  if (name === 'between-panels') {
    const a = q('#color-hexagon');
    const b = q('#color-editor-group');
    if (!a || !b) return null;
    return {
      el: a,
      at: () => {
        const p = centerOf(a);
        const r = centerOf(b);
        return { x: (p.x + r.x) / 2, y: (p.y + r.y) / 2 };
      },
    };
  }
  if (name === 'hex-tip') return byEl(tipEl());
  if (name === 'hex-hue-label') {
    // The hue pill (`#hue-handle`; `#hue-label` is the word above it), held
    // at its outer rim. See hueGripPoint.
    const el = q('#hue-handle');
    if (!el) return null;
    return { el, at: () => hueGripPoint(el, host.field().h) ?? centerOf(el) };
  }
  if (name === 'about-author') return byEl(q('#about-author'));
  if (name === 'demo-caption') {
    // The line the built-in demo is showing, as its own inline span rather
    // than the paragraph, whose box is the whole caption column: an
    // `underline` measures what it is given, and "Have fun!" is four inches
    // of a fourteen-inch box.
    return byEl(q('[data-demo-caption="on"] > span'));
  }
  if (name.startsWith('value:')) {
    // One channel's numeric field, the stepper, as a box of its own: the
    // readout a callout names ("the H readout"), not the whole bank.
    const el = q(`#slider-${bankChannel(name.slice(6))}-stepper`);
    if (!el) return null;
    const rect = () => unionRect([el], GROUP_PAD);
    return { el, at: () => rectCenter(rect()), rect };
  }
  if (name.startsWith('row:')) {
    // A channel's label, track and stepper together: the whole row, which is
    // what "the R slider" means to somebody watching - the letter to the left
    // of the track is the half that says which channel it is, and a box that
    // began at the track left it outside.
    const ch = bankChannel(name.slice(4));
    const els = [q(`#slider-${ch}-label`), q(`#slider-${ch}-track`), q(`#slider-${ch}-stepper`)]
      .filter((el): el is Element => !!el);
    if (els.length < 3) return null;
    const rect = () => unionRect(els, ROW_PAD);
    return { el: els[0], at: () => rectCenter(rect()), rect };
  }
  if (name === 'values:rgb' || name === 'values:hsb') {
    // A bank's three numeric fields, the steppers, as one box.
    const bank = name.slice(7);
    const channels = bank === 'rgb' ? ['r', 'g', 'b'] : ['h', 's', 'b'];
    const els = channels.map((c) => q(`#slider-${bank}-${c}-stepper`)).filter((el): el is Element => !!el);
    if (els.length < 3) return null;
    const rect = () => unionRect(els, GROUP_PAD);
    return { el: els[0], at: () => rectCenter(rect()), rect };
  }
  if (name === 'sliders:rgb' || name === 'sliders:hsb') {
    // The whole bank: each `#slider-<ch>` row holds its label, track and
    // stepper, so the union of the three rows is the group.
    const bank = name.slice(8);
    const channels = bank === 'rgb' ? ['r', 'g', 'b'] : ['h', 's', 'b'];
    const els = channels.map((c) => q(`#slider-${bank}-${c}`)).filter((el): el is Element => !!el);
    if (els.length < 3) return null;
    const rect = () => unionRect(els, GROUP_PAD);
    return { el: els[0], at: () => rectCenter(rect()), rect };
  }
  if (name === 'editor-top') {
    const el = q('#color-editor-group');
    if (!el) return null;
    const rect = () => {
      const r = el.getBoundingClientRect();
      return new DOMRect(r.left, r.top, r.width, Math.min(HEADER_BAND, r.height));
    };
    return { el, at: () => rectCenter(rect()), rect, radius: () => rect().width / 2 };
  }
  if (name.startsWith('letter:')) {
    const el = q(`#hex-letter-${name.slice(7)}`);
    if (!el) return null;
    const half = () => { const r = el.getBoundingClientRect(); return Math.max(r.width, r.height) / 2; };
    return { el, at: () => centerOf(el), radius: () => LETTER_RING * half() };
  }
  if (name.startsWith('editor-group:')) return byEl(q(`#slider-group-${name.slice(13)}`));
  if (name === 'settings-button') return byEl(q('#settings-button'));
  if (name === 'settings-about') return byEl(q('#settings-about'));
  if (name.startsWith('stem:')) return byEl(q(`[data-stem][data-hold="hex:${name.slice(5)}"]`));
  if (name.startsWith('corner:')) {
    const hue = CORNER_HUE[name.slice(7)];
    if (hue === undefined) return null;
    const rad = (hue * PI) / 180;
    return onHex(CENTER_X + RADIUS * Math.cos(rad), CENTER_Y - RADIUS * Math.sin(rad));
  }
  if (name.startsWith('handle:')) {
    // One slider's handle, not its track: for a ring that means "this value",
    // which on a 300px track a ring round the whole thing does not.
    const el = markerEl(bankChannel(name.slice(7)));
    if (!el) return null;
    const half = () => { const r = el.getBoundingClientRect(); return Math.max(r.width, r.height) / 2; };
    return { el, at: () => centerOf(el), radius: () => Math.max(HANDLE_RING_MIN, HANDLE_RING * half()) };
  }
  if (name === 'range:rgb') {
    // The span the three RGB handles occupy: left edge on the lowest value,
    // right edge on the highest, top and bottom on the R and B tracks. The
    // box is the saturation - it opens as the values spread and closes to a
    // sliver at gray - so a `rect` on it wants `live`, and re-measures.
    const handles = ['r', 'g', 'b'].map((c) => markerEl(`rgb-${c}`)).filter((el): el is Element => !!el);
    const top = q('#slider-rgb-r-track');
    const bottom = q('#slider-rgb-b-track');
    if (handles.length < 3 || !top || !bottom) return null;
    const rect = () => {
      const xs = handles.map((el) => centerOf(el).x);
      const t = top.getBoundingClientRect();
      const b = bottom.getBoundingClientRect();
      const l = Math.min(...xs);
      const r = Math.max(...xs);
      return new DOMRect(l - RANGE_PAD, t.top - RANGE_PAD, r - l + RANGE_PAD * 2, b.bottom - t.top + RANGE_PAD * 2);
    };
    return { el: handles[0], at: () => rectCenter(rect()), rect };
  }
  if (name.startsWith('slider:')) {
    // The track carries a padded box, so a `circle` round it is a flat
    // ellipse hugging the track rather than a ring half the track's width
    // in radius, which swallowed the color box above it.
    const el = q(`#slider-${sliderChannel(name)}-track`);
    if (!el) return null;
    return { el, at: () => centerOf(el), rect: () => unionRect([el], GROUP_PAD) };
  }
  if (name === 'hex-sat') return byEl(q('#sat-bar'));
  if (name === 'hex-bri') return byEl(q('#bl-bar'));
  // The color editor's own two controls, at the top of the panel: the
  // saturation/brightness box (`box` drags its handle) and the hue strip
  // beside it (`slider` runs 0-360 down it). Both carry a padded box.
  if (name === 'editor-sb') {
    const el = q('#sb-area');
    if (!el) return null;
    return { el, at: () => centerOf(el), rect: () => unionRect([el], GROUP_PAD) };
  }
  if (name === 'editor-hue') {
    const el = q('#hue-bar');
    if (!el) return null;
    return { el, at: () => centerOf(el), rect: () => unionRect([el], GROUP_PAD) };
  }
  // The section's own toggle, by id: `#equations-group button` matched the
  // first button inside the content once the section was open, so the
  // closing click landed on a control in the panel instead of the header.
  if (name === 'equations') return byEl(q('#equations-group-trigger'));
  if (name === 'figma-banner') return byEl(q('#plugin-banner'));
  if (name === 'figma-button') return byEl(q('#plugin-banner-cta'));
  if (name === 'hsl-tab') return byEl(q('#hex-mode-hsl'));
  if (name === 'hsb-tab') return byEl(q('#hex-mode-hsb'));
  if (name === 'top') {
    return { el: document.documentElement, at: () => ({ x: window.innerWidth / 2, y: 24 }) };
  }
  return null;
}

/**
 * Where on a track a value sits, 0-100 along its axis. Slider tracks inset
 * their usable span by the handle's radius, so the handle is measured where
 * there is one; the hexagon's bars run edge to edge.
 */
function trackPoint(name: string, track: Element, value: number): Point {
  const r = track.getBoundingClientRect();
  // The editor's hue strip runs 0-360 from the top, red to red.
  if (name === 'editor-hue') return { x: r.left + r.width / 2, y: r.top + (clamp(value, 0, 360) / 360) * r.height };
  const v = clamp(value, 0, 100) / 100;
  if (name === 'hex-bri') return { x: r.left + r.width / 2, y: r.top + (1 - v) * r.height };
  if (name === 'hex-sat') return { x: r.left + v * r.width, y: r.top + r.height / 2 };
  const handle = name.startsWith('slider:') ? q(`#slider-${sliderChannel(name)}-handle`) : null;
  const inset = handle ? handle.getBoundingClientRect().width / 2 : 0;
  return { x: r.left + inset + v * (r.width - inset * 2), y: r.top + r.height / 2 };
}

/** Where `[s, b]` sits on the editor's saturation/brightness box: s across, b up. */
function boxPoint(box: Element, s: number, b: number): Point {
  const r = box.getBoundingClientRect();
  return { x: r.left + (clamp(s, 0, 100) / 100) * r.width, y: r.top + (1 - clamp(b, 0, 100) / 100) * r.height };
}

/** The actions that never take the cursor, so they neither interrupt nor get interrupted. */
const handsFree = (a: ScriptAction) =>
  a.do === 'circle' || a.do === 'ray' || (a.do === 'rect' && a.hands === 'free');

function warnMissing(action: ScriptAction, name: string | undefined) {
  console.warn(`[script] t=${action.at}s ${action.do}: no target for "${name ?? '(none)'}"`);
}

export default function ScriptRunner({
  host, onDemo, onColor, demoOpen, script: given, clock: external, onHandle,
}: ScriptRunnerProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const shapesRef = useRef<SVGSVGElement | null>(null);
  const [kind] = useState<CursorKind>(() => cursorKind());
  const [loaded, setLoaded] = useState<Script | null>(null);
  const script = given ?? loaded;
  // Under an external clock the ghost is on screen from the start: it does
  // not wait for Space.
  const [started, setStarted] = useState(() => external !== undefined);
  // On while an `over: "demo"` action is in hand, which is the one case the
  // ghost is on screen with the built-in demo's own.
  const [overDemo, setOverDemo] = useState(false);

  // The schedule outlives any one render; it reaches the host through refs.
  const hostRef = useRef(host);
  const onDemoRef = useRef(onDemo);
  const onColorRef = useRef(onColor);
  const demoOpenRef = useRef(demoOpen);
  const onHandleRef = useRef(onHandle);
  useEffect(() => {
    hostRef.current = host;
    onDemoRef.current = onDemo;
    onColorRef.current = onColor;
    demoOpenRef.current = demoOpen;
    onHandleRef.current = onHandle;
  }, [host, onDemo, onColor, demoOpen, onHandle]);

  useEffect(() => {
    if (given) return;
    const { name } = scriptParams();
    if (!name) return;
    let live = true;
    fetch(`${import.meta.env.BASE_URL}scripts/${name}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<Script>;
      })
      .then((data) => {
        if (!live) return;
        if (!Array.isArray(data.actions)) throw new Error('script has no actions array');
        setLoaded({ actions: sortActions(data.actions) });
      })
      .catch((err: unknown) => console.error('[script] could not load', name, err));
    return () => { live = false; };
  }, [given]);

  /* The ghost, the driver and the clock: one effect for the life of the script. */
  useEffect(() => {
    if (!script) return;
    const hot = hotspotOf(kind);
    const start: Point = { x: window.innerWidth * 0.5, y: -80 };
    let target: Point = { ...start };
    let shown: Point = { ...start };
    let vx = 0;
    let vy = 0;
    let tilt = 0;
    let tiltV = 0;
    let pressed = false;
    let ring: { x: number; y: number; start: number } | null = null;
    let raf = 0;

    const stage: Stage = {
      setCursor(p) { target = p; },
      setPressed(v) { pressed = v; },
      ripple(p) { ring = { x: p.x, y: p.y, start: performance.now() }; },
    };
    const d = new Driver(stage, { reduced: false, speed: 1 }, start);
    const callouts = new Callouts(shapesRef.current);

    const frame = () => {
      const dx = target.x - shown.x;
      const dy = target.y - shown.y;
      shown = target;
      vx = vx * 0.75 + dx * 0.25;
      vy = vy * 0.75 + dy * 0.25;
      const goal = clamp((vx - vy * TILT_FROM_VERTICAL) * TILT_PER_PX, -TILT_MAX, TILT_MAX);
      tiltV = (tiltV + (goal - tilt) * TILT_SPRING) * TILT_DAMP;
      tilt = clamp(tilt + tiltV, -TILT_LIMIT, TILT_LIMIT);
      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.left = `${shown.x}px`;
        cursor.style.top = `${shown.y}px`;
        cursor.style.transformOrigin = `${hot.x}px ${hot.y}px`;
        cursor.style.transform = `rotate(${tilt.toFixed(2)}deg) scale(${pressed ? 0.86 : 1})`;
      }
      const dot = rippleRef.current;
      if (dot && ring) {
        const t = (performance.now() - ring.start) / RIPPLE_MS;
        if (t >= 1) {
          ring = null;
          dot.style.opacity = '0';
        } else {
          const eased = 1 - Math.pow(1 - t, 3);
          const size = RIPPLE_FROM + (RIPPLE_TO - RIPPLE_FROM) * eased;
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.left = `${ring.x - size / 2}px`;
          dot.style.top = `${ring.y - size / 2}px`;
          dot.style.opacity = `${(1 - eased) * 0.85}`;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* One action, as an independent promise. */
    let running = 0;
    /**
     * An element once it exists and its box has held still between two
     * polls, within SETTLE_MS; whatever `find` gives at the deadline
     * otherwise. For a target on a panel that is still animating in.
     */
    const settled = async (find: () => Element | null): Promise<Element | null> => {
      const deadline = performance.now() + SETTLE_MS;
      let last = '';
      for (;;) {
        const el = find();
        if (el) {
          const r = el.getBoundingClientRect();
          const key = [r.left, r.top, r.width, r.height].map((v) => v.toFixed(1)).join(',');
          if (r.width > 0 && key === last) return el;
          last = key;
        }
        if (performance.now() > deadline) return el;
        await d.wait(SETTLE_POLL_MS);
      }
    };
    const run = async (a: ScriptAction): Promise<void> => {
      const need = (name: string | undefined): Target | null => {
        const t = name ? resolve(name, hostRef.current) : null;
        if (!t) warnMissing(a, name);
        return t;
      };
      switch (a.do) {
        case 'rest': {
          const t = need(a.target);
          if (!t) return;
          await d.bring(t.el);
          await d.moveTo(t.at);
          return;
        }
        case 'hover': {
          const t = need(a.target);
          if (!t) return;
          await d.bring(t.el);
          await d.moveTo(t.at);
          await d.wait(a.ms ?? 0);
          return;
        }
        case 'walk': {
          const names = a.targets ?? [];
          if (!names.length) return;
          const dwell = Math.max(0, (a.ms ?? 0) / names.length - MOVE_MS);
          for (const name of names) {
            const t = need(name);
            if (!t) continue;
            await d.bring(t.el);
            await d.moveTo(t.at, MOVE_MS);
            await d.wait(dwell);
          }
          return;
        }
        case 'click': {
          const t = need(a.target);
          if (!t) return;
          await d.bring(t.el);
          // Travel scales with distance: a hop to the next button over is
          // quick, so a click scheduled close behind a hover still lands
          // before the following action takes the hands.
          const p = t.at();
          const dist = Math.hypot(p.x - d.pos.x, p.y - d.pos.y);
          await d.moveTo(() => p, clamp(dist * 1.2, 160, 520));
          await d.click(t.el);
          return;
        }
        case 'loop': {
          const t = need(a.target);
          if (!t) return;
          await d.bring(t.el);
          const c = t.at();
          // A loop keeps well inside its target.
          const { rx, ry } = circuitRadii(t, LOOP_RADIUS);
          const point = circuitPoint(c, rx, ry, a.turns ?? LOOP_TURNS, a.wobble ?? LOOP_WOBBLE);
          // Travel to the top of the circuit first; the loop itself is on a
          // linear clock because the path carries its own easing.
          await d.moveTo(() => point(0), MOVE_MS);
          await d.path(point, a.ms ?? 3000);
          return;
        }
        case 'circle': {
          const t = need(a.target);
          if (!t) return;
          // A ring at the target's own radius that draws itself over `ms`;
          // the cursor is not involved, so the hands are free for the action
          // sharing its `at`. The target is read every frame, so a ring
          // around something the page is scrolling stays on it.
          const turns = a.turns ?? CIRCLE_TURNS;
          const wobble = a.wobble ?? LOOP_WOBBLE;
          callouts.ring((u) => {
            const { rx, ry } = circuitRadii(t, 1);
            return circuitPoint(t.at(), rx, ry, turns, wobble)(u);
          }, a.ms ?? CIRCLE_MS, a.hold ?? HOLD_MS, a.color);
          return;
        }
        case 'ray': {
          // A bar along one channel's axis, from the middle of the hexagon
          // out to that channel's vertex letter: the letter's own place on
          // screen carries the angle, so nothing here has to know the
          // geometry. Self-drawn, like a `circle`.
          const t = need(`letter:${a.ch ?? ''}`);
          if (!t) return;
          const c = hexClientPoint(CENTER_X, CENTER_Y);
          if (!c) { warnMissing(a, 'hex-center'); return; }
          // Over both ends rather than short of one: the bar runs from behind
          // the middle of the hexagon out past the vertex letter, so what it
          // encloses is exactly the two things it is joining.
          const tip = t.at();
          const len = Math.hypot(tip.x - c.x, tip.y - c.y) || 1;
          const ux = (tip.x - c.x) / len;
          const uy = (tip.y - c.y) / len;
          const root = { x: c.x - ux * RAY_CENTER_OVER, y: c.y - uy * RAY_CENTER_OVER };
          const end = { x: tip.x + ux * RAY_LETTER_OVER, y: tip.y + uy * RAY_LETTER_OVER };
          callouts.beam(root, end, RAY_WIDTH, a.ms ?? CIRCLE_MS, a.hold ?? HOLD_MS,
            a.color ?? CHANNEL_COLOR[a.ch ?? '']);
          return;
        }
        case 'rect': {
          const t = need(a.target);
          if (!t) return;
          if (!t.rect) { console.warn(`[script] t=${a.at}s rect: "${a.target}" has no box`); return; }
          const from: RectCorner = typeof a.from === 'string' ? a.from : 'tl';
          if (a.live) {
            // Hands free by definition: nothing can hold a box that is still
            // being re-measured, and the point of it is the drag going on
            // underneath.
            const box = t.rect;
            callouts.liveBox(() => box(), from, a.ms ?? CIRCLE_MS, a.hold ?? HOLD_MS, a.color);
            return;
          }
          if (a.hands === 'free') {
            // Self-drawn, so it can go up while the cursor is holding
            // something else; the whole `ms` is the diagonal. No scrolling:
            // the hands are not free to, so the target has to be in shot.
            const { start: p0, end: p1 } = rectCorners(t.rect(), from);
            callouts.box(p0, p1, a.ms ?? CIRCLE_MS, a.hold ?? HOLD_MS, a.color);
            return;
          }
          await d.bring(t.el);
          const { start: p0, end: p1 } = rectCorners(t.rect(), from);
          // The travel to the first corner comes out of the action's own
          // budget, so the diagonal is done by the time the next action is
          // due rather than still running when it takes the hands.
          const { travel, gesture } = splitBudget(a.ms ?? 1100);
          // A selection marquee: the box grows from the first corner to
          // wherever the cursor is, and stands once the diagonal is done. Cut
          // short at any point, it snaps to its full size and stands anyway:
          // a partial box reads as a mistake, a whole one as the callout.
          const shape = callouts.marquee(p0, a.hold ?? HOLD_MS, a.color);
          let complete = false;
          try {
            await d.moveTo(() => p0, travel);
            const point = diagonalPoint(p0, p1);
            await d.path((u) => { const p = point(u); shape.update(p); return p; }, gesture);
            complete = true;
          } finally {
            if (!complete) shape.update(p1);
            shape.done();
          }
          return;
        }
        case 'wander': {
          const t = need(a.target);
          if (!t) return;
          await d.bring(t.el);
          await d.path(wanderPoint({ ...d.pos }, t.at()), a.ms ?? 1500);
          return;
        }
        case 'orbit': {
          const tip = tipEl();
          if (!tip) { warnMissing(a, 'hex-tip'); return; }
          await d.bring(tip);
          const c = centerOf(tip);
          await d.moveTo(() => c);
          const f = hostRef.current.field();
          const s0 = clamp(f.s / 100, ORBIT_SAT_MIN, ORBIT_SAT_MAX);
          const turns = a.turns ?? 1;
          const wobble = a.wobble ?? 0.15;
          // Saturation wanders about where it started and comes back to it:
          // the same sines as a circuit's wobble, under a sin envelope so
          // both ends are the starting value, and held to the band.
          const sat = (u: number) => {
            const swing = 3 * wobble * (wobbleAt(1, 2 * PI * turns * u * 1.7) - 1);
            return clamp(s0 + swing * Math.sin(PI * u), ORBIT_SAT_MIN, ORBIT_SAT_MAX);
          };
          await d.drag(tip, (u) => fieldPoint(f.h + 360 * orbitTurns(turns, u), sat(u), f) ?? c, a.ms ?? 4000, true);
          return;
        }
        case 'stem': {
          const name = `stem:${a.ch ?? ''}`;
          const t = need(name);
          if (!t) return;
          const ends = stemEnds(t.el);
          if (!ends) { warnMissing(a, name); return; }
          await d.bring(t.el);
          // Along the stem's own axis, from its midpoint: the component
          // projects the pointer onto the channel's direction, so a move of
          // `amount` x the stem's length changes the channel by that fraction.
          const mid = { x: (ends.a.x + ends.b.x) / 2, y: (ends.a.y + ends.b.y) / 2 };
          const vx = (ends.b.x - ends.a.x) * (a.amount ?? 0);
          const vy = (ends.b.y - ends.a.y) * (a.amount ?? 0);
          await d.moveTo(() => mid);
          await d.drag(t.el, (u) => ({ x: mid.x + vx * smooth(u), y: mid.y + vy * smooth(u) }), a.ms ?? 1000, true);
          return;
        }
        case 'demo': {
          // The built-in demo has its own cursor; ours hides while it runs -
          // and its starts from exactly where ours stopped, so the two read as
          // one cursor changing hands rather than one vanishing and another
          // walking in from off screen.
          if (!demoOpenRef.current) onDemoRef.current({ ...d.pos });
          return;
        }
        case 'slider': {
          const name = a.target ?? '';
          const t = need(name);
          if (!t) return;
          // The hue strip starts from wherever the hue is, so the press lands
          // on the marker rather than jumping the color to `from`; and, as a
          // gesture that has to land on a value, its travel is inside `ms`,
          // so the drag is done before the next action takes the hands. The
          // hexagon's bars and the slider banks keep the travel outside.
          const hueStrip = name === 'editor-hue';
          const current = hueStrip ? hostRef.current.field().h : 0;
          const from = typeof a.from === 'number' ? a.from : current;
          const to = typeof a.to === 'number' ? a.to : from;
          const budget = a.ms ?? 1000;
          const split = hueStrip ? splitBudget(budget) : null;
          await d.bring(t.el);
          await d.moveTo(() => trackPoint(name, t.el, from), split?.travel);
          await d.drag(t.el, (u) => trackPoint(name, t.el, from + (to - from) * smooth(u)), split?.gesture ?? budget, true);
          return;
        }
        case 'box': {
          const t = need(a.target ?? 'editor-sb');
          if (!t) return;
          // The editor's saturation/brightness box: press where the handle is
          // (or at `from`) and drag to `to`, both as `[s, b]`. The travel is
          // inside `ms`, as for the hue strip, so the drag lands.
          const f = hostRef.current.field();
          const from: [number, number] = Array.isArray(a.from) ? a.from : [f.s, f.b];
          const to: [number, number] = Array.isArray(a.to) ? a.to : from;
          const { travel, gesture } = splitBudget(a.ms ?? 1500);
          await d.bring(t.el);
          await d.moveTo(() => boxPoint(t.el, from[0], from[1]), travel);
          await d.drag(t.el, (u) => {
            const k = smooth(u);
            return boxPoint(t.el, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k);
          }, gesture, true);
          return;
        }
        case 'tip': {
          if (a.via === 'hue-label') {
            // The hue pill instead of the tip: the pill is placed from the
            // hue and the hue read from the pointer, so the path is the
            // pill's own track round the ring, held by the same corner all
            // the way. The start is read once; the path carries it round.
            const t = need('hex-hue-label');
            if (!t) return;
            await d.bring(t.el);
            // Travel scales with distance, and is nothing when the cursor is
            // already on the pill (the hover before, or the turn before), so
            // a 1.4 s turn cued 1.5 s before the next one is done in time.
            const p = t.at();
            const dist = Math.hypot(p.x - d.pos.x, p.y - d.pos.y);
            await d.moveTo(() => p, clamp(dist * 1.2, 0, MOVE_MS));
            const h0 = hostRef.current.field().h;
            // `degrees` is the relative form and wins; `to` is an absolute hue,
            // taken the short way round, so a cue can say where the pill ends
            // up without knowing where the last gesture left it.
            const degrees = a.degrees ?? (typeof a.to === 'number' ? ((a.to - h0 + 540) % 360) - 180 : 0);
            const c = t.at();
            await d.drag(t.el, (u) => hueGripPoint(t.el, h0 + degrees * smooth(u)) ?? c, a.ms ?? 1000, true);
            return;
          }
          const tip = tipEl();
          if (!tip) { warnMissing(a, 'hex-tip'); return; }
          await d.bring(tip);
          const c = centerOf(tip);
          // Travel scales with distance, so a turn cued right behind another
          // one (the +-30 pair in beat 8) starts on time instead of overrunning.
          const dist = Math.hypot(c.x - d.pos.x, c.y - d.pos.y);
          await d.moveTo(() => c, clamp(dist * 1.2, 0, MOVE_MS));
          // Read once and held: the whole turn stays on this cross-section.
          const f = hostRef.current.field();
          const sat = clamp(f.s / 100, 0.05, 1);
          const degrees = a.degrees ?? 0;
          await d.drag(tip, (u) => fieldPoint(f.h + degrees * smooth(u), sat, f) ?? c, a.ms ?? 1000, true);
          return;
        }
        case 'pip': {
          // The camera panel, dragged off the right edge and back. It is not a
          // control - nothing listens - so the gesture is the whole effect:
          // the ghost takes it by its top-left corner, presses, and the panel
          // really moves under it.
          const el = document.getElementById('camera-pip');
          if (!el) { warnMissing(a, 'camera-pip'); return; }
          const from = pipOffset(el);
          const r = el.getBoundingClientRect();
          // Home is where the panel sits with no offset on it.
          const homeLeft = r.left - from;
          const to = a.to === 'on' ? 0 : window.innerWidth - homeLeft + PIP_OFF_CLEAR;
          const grip = (x: number): Point => ({ x: homeLeft + PIP_GRIP_X + x, y: r.top + PIP_GRIP_Y });
          try {
            await d.moveTo(() => grip(from), MOVE_MS);
            await d.drag(el, (u) => {
              const x = from + (to - from) * smooth(u);
              setPipOffset(el, x);
              return grip(x);
            }, a.ms ?? 1200, true);
          } finally {
            // Land exactly, interrupted or not: a drag cut a frame short of its
            // end leaves the panel a pixel off, and home is a place rather than
            // nearly a place.
            setPipOffset(el, to);
          }
          return;
        }
        case 'color': {
          onColorRef.current({ h: a.h ?? 0, s: a.s ?? 0, b: a.b ?? 0 });
          return;
        }
        case 'scroll': {
          if (a.target === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          const t = need(a.target);
          if (!t) return;
          t.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        case 'leave': {
          const out = d.exitTarget();
          await d.moveTo(() => out, 900);
          d.leave();
          return;
        }
        case 'underline': {
          // The link may be on a panel still animating in: wait for it to
          // exist and for its box to stop moving before measuring it.
          const el = await settled(() => (a.target ? resolve(a.target, hostRef.current)?.el ?? null : null));
          if (!el) { warnMissing(a, a.target); return; }
          const r = el.getBoundingClientRect();
          const y = r.bottom + UNDERLINE_GAP;
          const p0 = { x: r.left, y };
          const p1 = { x: r.right, y };
          // To just under the left end, then the sweep to the right end over
          // `ms`, bowing down a little in the middle: a hand, not a ruler.
          // Hover only, and the cursor rests where the line ends.
          await d.moveTo(() => p0, MOVE_MS);
          await d.path((u) => {
            const t = smoothstep(u);
            return { x: p0.x + (p1.x - p0.x) * t, y: y + UNDERLINE_BOW * Math.sin(PI * t) };
          }, a.ms ?? 1000);
          return;
        }
        default:
          console.warn(`[script] t=${a.at}s: unknown action "${String(a.do)}"`);
      }
    };
    const dispatch = (a: ScriptAction) => {
      // The simple rule: a new action takes the hands from whatever had them.
      // A hands-free one (a self-drawing `circle`, or a `rect` with its
      // hands free) takes nothing, so it can share an `at` with a hover
      // without cutting it short, and nothing later cuts it short either.
      if (handsFree(a)) {
        run(a).catch((err: unknown) => console.error(`[script] t=${a.at}s ${a.do} failed`, err));
        return;
      }
      if (running > 0) d.interrupt();
      running += 1;
      // An over-demo gesture brings the ghost out for as long as it lasts;
      // the rest of the demo's span it is the demo's cursor on screen alone.
      if (a.over === 'demo') { setOverDemo(true); setScriptOverDemo(true); }
      run(a)
        .catch((err: unknown) => {
          if (err instanceof DemoAborted) return;
          console.error(`[script] t=${a.at}s ${a.do} failed`, err);
        })
        .finally(() => {
          running -= 1;
          if (a.over === 'demo') { setOverDemo(false); setScriptOverDemo(false); }
        });
    };

    /* The clock: time-locked, so a late action never delays the next. */
    const actions = sortActions(script.actions);
    let next = 0;
    let loop = 0;
    // What recording mode's clock has to undo on unmount; nothing under an
    // external one. Declared before the clock is built, which is what sets it.
    let teardown: () => void = () => {};
    const clk: ScriptClock = external ?? recordingClock();
    // Fire every action whose cue has passed. Safe to call from more than
    // one clock: an action dispatches once, when `next` moves past it.
    const step = () => {
      // Held while the built-in demo is on screen; released, in order, when
      // it exits. Later actions are time-locked, so nothing is delayed.
      if (clk.running()) {
        const now = clk.now();
        while (next < actions.length && actions[next].at <= now) {
          // The first action the demo is holding stops the queue: everything
          // behind it waits its turn rather than jumping the one in front.
          // A `demo` action is never held: the script names the demo's span,
          // and if the demo is already on screen (the cut opens it by clicking
          // the help button a couple of seconds earlier) there is nothing for
          // it to do. Held, it would come due the moment the demo ended and
          // start the whole thing over.
          if (demoOpenRef.current && actions[next].over !== 'demo' && actions[next].do !== 'demo') break;
          dispatch(actions[next]);
          next += 1;
        }
      }
    };
    const tick = () => {
      step();
      // An external clock can be wound back, so its loop never retires.
      if (external || next < actions.length) loop = requestAnimationFrame(tick);
    };

    /*
     * A jump on the clock. The state at `t` is what the actions before it
     * would have left behind, as far as that can be re-established without
     * replaying them: the color, and where the hands rest.
     */
    const seek = (t: number) => {
      if (running > 0) d.interrupt();
      callouts.clear();
      let i = 0;
      while (i < actions.length && actions[i].at < t) i += 1;
      next = i;
      let color: ScriptAction | null = null;
      let pose: ScriptAction | null = null;
      let pip: ScriptAction | null = null;
      for (const a of actions) {
        if (a.at >= t) break;
        if (a.do === 'color') color = a;
        if (a.do === 'pip') pip = a;
        if ((a.do === 'rest' || a.do === 'hover') && a.target) pose = a;
      }
      if (color) onColorRef.current({ h: color.h ?? 0, s: color.s ?? 0, b: color.b ?? 0 });
      // The camera panel is where the last `pip` before `t` put it, at once
      // and without the gesture: a scrub is not a performance.
      const panel = document.getElementById('camera-pip');
      if (panel) {
        const home = panel.getBoundingClientRect().left - pipOffset(panel);
        setPipOffset(panel, pip && pip.to === 'off' ? window.innerWidth - home + PIP_OFF_CLEAR : 0);
      }
      const target = pose?.target ? resolve(pose.target, hostRef.current) : null;
      if (!target) return;
      running += 1;
      d.bring(target.el)
        .then(() => d.moveTo(target.at, SEEK_MOVE_MS))
        .catch((err: unknown) => {
          if (!(err instanceof DemoAborted)) console.error('[script] seek failed', err);
        })
        .finally(() => { running -= 1; });
    };

    /*
     * Recording mode's own clock: `performance.now()` from the moment Space
     * is pressed (or `&go=N` fires), with the sync flash and, on `&audio=1`,
     * the voice track started from the same instant.
     */
    function recordingClock(): ScriptClock {
      let t0 = 0;
      let begun = false;
      const { go, audio: withAudio, name } = scriptParams();
      const voice = withAudio && name ? new Audio(scriptAudioUrl(name)) : null;
      if (voice) voice.preload = 'auto';
      const begin = () => {
        if (begun) return;
        begun = true;
        window.removeEventListener('keydown', onKey, true);
        setStarted(true);
        // A single white frame for lining the recording up against the cut.
        const flash = flashRef.current;
        if (flash) {
          flash.style.opacity = '1';
          window.setTimeout(() => { flash.style.opacity = '0'; }, FLASH_MS);
        }
        t0 = performance.now();
        if (voice) {
          voice.currentTime = 0;
          voice.play().catch((err: unknown) => console.warn('[script] voice track did not start', err));
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.code !== 'Space' && e.key !== ' ') return;
        e.preventDefault();
        begin();
      };
      window.addEventListener('keydown', onKey, true);
      const goTimer = go === null ? 0 : window.setTimeout(begin, go * 1000);
      teardown = () => {
        window.removeEventListener('keydown', onKey, true);
        window.clearTimeout(goTimer);
        if (voice) voice.pause();
      };
      return {
        now: () => (performance.now() - t0) / 1000,
        running: () => begun,
      };
    }

    loop = requestAnimationFrame(tick);
    onHandleRef.current?.({ seek });
    // The built-in demo's goodbye asks whether a script is on screen before it
    // decides how long to wait for one. See handover.ts.
    markScriptRunner(true);

    // requestAnimationFrame is suspended while the document is hidden (a tab
    // switched away, a minimized or occluded window) but the clock driving
    // the run keeps advancing, so a cue due in that window sat unfired until
    // the next visible frame. A slow poll on `step` keeps dispatch alive
    // without adding a second animation loop.
    const fallback = window.setInterval(step, 250);

    return () => {
      markScriptRunner(false);
      setScriptOverDemo(false);
      onHandleRef.current?.(null);
      teardown();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(loop);
      window.clearInterval(fallback);
      d.stop();
      callouts.clear();
    };
  }, [script, kind, external]);

  const hot = hotspotOf(kind);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" data-testid="script-runner">
      {/* The sync flash: full white for one frame at t=0, invisible otherwise. */}
      <div
        ref={flashRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-white"
        style={{ opacity: 0 }}
      />

      {/* The drawn callouts (`rect`, `circle`): under the cursor, over the app. */}
      <svg
        ref={shapesRef}
        aria-hidden="true"
        data-testid="script-callouts"
        className="pointer-events-none fixed inset-0 h-full w-full overflow-visible"
      />

      <div
        ref={rippleRef}
        aria-hidden="true"
        className="pointer-events-none fixed rounded-full border-2 border-foreground"
        style={{ opacity: 0, boxShadow: '0 0 0 1px rgba(0,0,0,0.35)' }}
      />

      <div
        ref={cursorRef}
        aria-hidden="true"
        data-testid="script-cursor"
        className="pointer-events-none fixed"
        style={{
          width: CURSOR_BOX,
          height: CURSOR_BOX,
          marginLeft: -hot.x,
          marginTop: -hot.y,
          transformOrigin: `${hot.x}px ${hot.y}px`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
          opacity: started && (!demoOpen || overDemo) ? 1 : 0,
        }}
      >
        <DemoCursor kind={kind} />
      </div>
    </div>,
    document.body,
  );
}
