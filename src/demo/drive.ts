/**
 * The demo's hands.
 *
 * Everything here works the app the way a person does: synthetic pointer
 * events at the real controls, so the hold tracking, the impact highlights,
 * the channel tooltips and the tone all happen through the app's own
 * handlers. Setting state directly would mean re-implementing each of those,
 * and they would drift. See wiki/notes/plan-picker-demo.md.
 *
 * Two things this file knows that a first attempt gets wrong:
 *
 * 1. `pointerenter` does not reach React. React synthesises enter/leave from
 *    `pointerover`/`pointerout` listened for at the root container, so a
 *    non-bubbling `pointerenter` dispatched at an element is dropped on the
 *    floor. Hover goes through `pointerover` with `bubbles: true`.
 * 2. Drags press on the element and move on `window`, because that is where
 *    `useDrag` listens. The hold key is read from the pointerdown target, so
 *    the press has to land on the tagged element itself.
 */

export type Point = { x: number; y: number };

/** Thrown at every await point once the demo is stopped, and caught by the runner. */
export class DemoAborted extends Error {
  constructor() {
    super('demo aborted');
    this.name = 'DemoAborted';
  }
}

export interface Stage {
  /** Move the ghost cursor. The stage derives its tilt from the movement. */
  setCursor(p: Point): void;
  /** Scale the ghost down while it holds something. */
  setPressed(pressed: boolean): void;
  /** Ring the spot: a synthetic press makes no sound and moves no hardware. */
  ripple(p: Point): void;
}

export interface DriverOptions {
  /** No arcs and no dwell on the moves; the highlights already respect it in CSS. */
  reduced: boolean;
  /** Wall-clock divisor. 1 is the demo as designed; the Playwright spec runs it hot. */
  speed: number;
}

/** How long a press is held before it becomes a click. Steps total themselves with it. */
export const CLICK_MS = 110;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** The centre of an element in client coordinates. Zero-height SVG lines included. */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function pointerEvent(type: string, x: number, y: number, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    ...init,
  });
}

export class Driver {
  private stopped = false;
  private timers = new Set<number>();
  private pending = new Set<(reason: DemoAborted) => void>();
  private raf = 0;
  private pressedEl: Element | null = null;
  private under: Element | null = null;
  /** Alternates so consecutive legs bow to opposite sides and the path reads as a hand. */
  private bow = 1;
  pos: Point;

  constructor(private stage: Stage, private opts: DriverOptions, start: Point) {
    this.pos = start;
  }

  get aborted() { return this.stopped; }

  /**
   * Cancel whatever is in flight and let go of whatever is held, without
   * ending the demo: this is what a jump between steps does. Every waiting
   * promise rejects with DemoAborted, so the abandoned step unwinds at its
   * next await instead of running on underneath its replacement.
   */
  interrupt() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
    cancelAnimationFrame(this.raf);
    this.releaseNow();
    const reason = new DemoAborted();
    const waiting = [...this.pending];
    this.pending.clear();
    waiting.forEach((reject) => reject(reason));
  }

  /**
   * Interrupt for good, and leave whatever the ghost was over, so the app is
   * not left with a hold that never releases or a tooltip that never clears.
   */
  stop() {
    if (this.stopped) return;
    this.interrupt();
    this.leave();
    this.stopped = true;
  }

  private guard() {
    if (this.stopped) throw new DemoAborted();
  }

  /** A wait that rejects the moment the demo is skipped, so no step runs on past it. */
  wait(ms: number): Promise<void> {
    this.guard();
    return new Promise<void>((resolve, reject) => {
      this.pending.add(reject);
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        this.pending.delete(reject);
        resolve();
      }, Math.max(0, ms / this.opts.speed));
      this.timers.add(id);
    });
  }

  /**
   * A wait in real seconds, whatever the speed. The pause before the demo
   * takes itself down is time for a person to read a line, not choreography,
   * so it should not run eight times faster because the spec is in a hurry.
   */
  linger(ms: number): Promise<void> {
    this.guard();
    return new Promise<void>((resolve, reject) => {
      this.pending.add(reject);
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        this.pending.delete(reject);
        resolve();
      }, Math.max(0, ms));
      this.timers.add(id);
    });
  }

  /** The speed knob, for anything sizing itself against a scheduled duration. */
  get speed() { return this.opts.speed; }

  /**
   * Run `onFrame(t)` for `ms`, resolving at t=1.
   *
   * `linear` hands the path an unshaped t. A move between two points wants
   * the ease - it starts and stops, and should look like it. A sweep that is
   * already a sine of t does not: easing the clock as well squeezes the fast
   * part of the curve into the fast part of the sweep, so it lurches through
   * the middle and snaps at each turn.
   */
  private animate(ms: number, onFrame: (t: number) => void, linear = false): Promise<void> {
    this.guard();
    const duration = Math.max(1, ms / this.opts.speed);
    return new Promise<void>((resolve, reject) => {
      this.pending.add(reject);
      const t0 = performance.now();
      const step = (now: number) => {
        if (this.stopped) return;
        const raw = clamp01((now - t0) / duration);
        const t = linear ? raw : ease(raw);
        onFrame(t);
        if (t < 1) {
          this.raf = requestAnimationFrame(step);
        } else {
          this.pending.delete(reject);
          resolve();
        }
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  /**
   * Move the ghost to a target on a quadratic bezier bowing alternately to
   * each side. `at` is a thunk because targets move while the demo runs.
   */
  async moveTo(at: () => Point, ms = 520): Promise<void> {
    const p2 = at();
    if (this.opts.reduced) {
      this.place(p2);
      await this.wait(90);
      return;
    }
    const p0 = { ...this.pos };
    const d = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    const nx = -(p2.y - p0.y) / (d || 1);
    const ny = (p2.x - p0.x) / (d || 1);
    const bow = Math.min(90, d * 0.3) * this.bow;
    this.bow = -this.bow;
    const c = { x: (p0.x + p2.x) / 2 + nx * bow, y: (p0.y + p2.y) / 2 + ny * bow };
    await this.animate(ms, (t) => {
      const u = 1 - t;
      this.place({
        x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y,
      });
    });
  }

  private place(p: Point) {
    this.pos = p;
    this.stage.setCursor(p);
    this.syncUnder();
  }

  /**
   * Keep the element under the ghost honest, the way a real pointer does: an
   * out on what it left and an over on what it arrived at, each carrying the
   * other as `relatedTarget`, which is what React reads to work out the
   * enter/leave chain.
   *
   * Doing this every frame, rather than only where a step asks for a hover,
   * is what makes the ghost behave. The picker re-shows a channel tooltip on
   * release if the pointer is still over the handle it dragged, so after the
   * tip drag the tooltips come back - and only a real leave clears them.
   */
  private syncUnder() {
    // A pressed pointer keeps its target, and the app is tracking the drag on
    // window rather than listening for hover.
    if (this.pressedEl) return;
    const { x, y } = this.pos;
    const el = document.elementFromPoint(x, y);
    if (el === this.under) return;
    const prev = this.under;
    this.under = el;
    if (prev) prev.dispatchEvent(pointerEvent('pointerout', x, y, { buttons: 0, relatedTarget: el }));
    if (el) {
      el.dispatchEvent(pointerEvent('pointerover', x, y, { buttons: 0, relatedTarget: prev }));
      el.dispatchEvent(pointerEvent('pointermove', x, y, { buttons: 0 }));
    }
  }

  /** Leave whatever the ghost is over, for when it bows out. */
  leave() {
    const prev = this.under;
    if (!prev) return;
    this.under = null;
    prev.dispatchEvent(pointerEvent('pointerout', this.pos.x, this.pos.y, { buttons: 0, relatedTarget: null }));
  }

  /**
   * Press an element, walk `path` for `ms`, release. The press lands on `el`
   * so `holdKeyOf` reads the right tag; the moves go to `window` because that
   * is where the app's drag listeners are.
   */
  async drag(el: Element, path: (t: number) => Point, ms: number, linear = false): Promise<void> {
    this.guard();
    const p0 = path(0);
    this.place(p0);
    el.dispatchEvent(pointerEvent('pointerdown', p0.x, p0.y));
    this.pressedEl = el;
    this.stage.setPressed(true);
    this.stage.ripple(p0);
    try {
      await this.animate(ms, (t) => {
        const p = path(t);
        this.place(p);
        window.dispatchEvent(pointerEvent('pointermove', p.x, p.y));
      }, linear);
    } finally {
      this.releaseNow();
    }
  }

  /** Press and release in place - for buttons, which want a click. */
  async click(el: Element): Promise<void> {
    this.guard();
    const { x, y } = this.pos;
    el.dispatchEvent(pointerEvent('pointerdown', x, y));
    this.pressedEl = el;
    this.stage.setPressed(true);
    this.stage.ripple({ x, y });
    await this.wait(CLICK_MS);
    this.releaseNow();
    this.guard();
    el.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y,
    }));
  }

  private releaseNow() {
    if (!this.pressedEl) return;
    this.pressedEl = null;
    this.stage.setPressed(false);
    const { x, y } = this.pos;
    window.dispatchEvent(pointerEvent('pointerup', x, y, { buttons: 0 }));
    // The app re-reads what is under the pointer on release; match it, so the
    // next move away is an honest leave rather than a tooltip left behind.
    this.syncUnder();
  }

  /** Scroll a target into view before working it - narrow viewports need it. */
  async bring(el: Element): Promise<void> {
    this.guard();
    const r = el.getBoundingClientRect();
    if (r.top >= 8 && r.bottom <= window.innerHeight - 96) return;
    el.scrollIntoView({ block: 'center', behavior: this.opts.reduced ? 'auto' : 'smooth' });
    await this.wait(this.opts.reduced ? 60 : 520);
  }
}
