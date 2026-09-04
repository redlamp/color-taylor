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

/**
 * Smootherstep, for the travel between one target and the next.
 *
 * This was easeInOutQuad, which lands from 2x its average speed and does the
 * whole deceleration in the last quarter - on a long trip across the tool that
 * is 44px per frame arriving in under a fifth of a second, and it reads as the
 * hand being stopped rather than stopping. The quintic has zero acceleration at
 * both ends as well as zero velocity, so the last tenth of the trip is 40%
 * slower and the last twentieth three times slower, off a slightly lower peak.
 *
 * Deliberately not the same shape the gesture paths use, which is the plain
 * cubic: a sweep is already a sine of its own parameter, and the quintic's
 * steeper middle would speed up its turn as well as softening its ends.
 */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
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
   * `linear` hands the path an unshaped t. A move between two points wants the
   * ease - it starts and stops, and should look like it. A gesture path does
   * not, because it carries its own: every one of them in steps.ts is written
   * as a function of `smooth(t)`, which is what gives it a resting start and a
   * resting finish. Easing the clock on top of that warps the turn as well as
   * the ends, and the sweep lurches through its middle.
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

  /**
   * Keep the ghost on a moving target for `ms`. Unlike `moveTo`, which reads
   * its destination once and flies a curve to it, this re-reads every frame -
   * so it tracks something the app is animating rather than landing where it
   * used to be.
   */
  async follow(at: () => Point, ms: number): Promise<void> {
    await this.animate(ms, () => this.place(at()), true);
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

  /**
   * A point off the screen, through whichever edge the panel is not on. The
   * ghost used to always leave downwards, which on a phone - where the panel
   * is a band across the foot - walked it straight through the thing it was
   * leaving behind.
   */
  exitTarget(): Point {
    const p = document.querySelector('[data-demo-chrome]')?.getBoundingClientRect();
    const panelAtTop = !!p && p.top + p.height / 2 < window.innerHeight / 2;
    return { x: this.pos.x, y: panelAtTop ? window.innerHeight + 160 : -160 };
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

  /**
   * The strip of screen the demo's own panel is sitting on. Anything the ghost
   * is about to work has to end up below it: on a phone the panel is a band
   * across the top of the picker, and "scrolled into view" is not the same
   * question as "visible", because the middle of the viewport can be behind it.
   */
  private clearBand() {
    const full = { top: 8, bottom: window.innerHeight - 16 };
    const p = document.querySelector('[data-demo-chrome]')?.getBoundingClientRect();
    if (!p || p.bottom <= 0 || p.top >= window.innerHeight) return full;
    // Which edge it is against, not which edge it was put against: the panel
    // sits in the header on a wide window and at the foot of the screen on a
    // narrow one, and the band is whatever it leaves.
    return p.top + p.height / 2 < window.innerHeight / 2
      ? { top: p.bottom + 12, bottom: full.bottom }
      : { top: full.top, bottom: p.top - 12 };
  }

  /**
   * Put a target where it can actually be watched: inside the band the demo
   * panel leaves, not merely inside the window. A no-op when it is already
   * there, so a step can ask before every beat without the page hopping about.
   */
  async bring(el: Element, always = false): Promise<void> {
    this.guard();
    const band = this.clearBand();
    const r = el.getBoundingClientRect();
    // `always` asks for the framing whether or not the target is already
    // visible. A step whose point is the card rather than the control wants
    // that: left to itself this returns early the moment the control happens
    // to be on screen, so how the step looks is decided by wherever the
    // previous one left the page. Cheap when it is already right - the scroll
    // destination comes out the same and the wait resolves on the first frame.
    if (!always && r.top >= band.top && r.bottom <= band.bottom) return;
    const delta = this.scrollDelta(el, r, band);
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const destination = Math.max(0, Math.min(window.scrollY + delta, max));
    window.scrollTo({ top: destination, behavior: this.opts.reduced ? 'auto' : 'smooth' });
    await this.scrollReaches(destination);
  }

  /**
   * How far to scroll to put a target where it can be watched.
   *
   * Framing the card it belongs to, where there is one: on a phone the demo
   * moves between two stacked panels, and centring one small control leaves
   * the top of its card off screen with the tail of the previous one above it.
   * Landing the card's top at the top of the band is what makes each step read
   * as "now we are in the colour editor" rather than as a scroll to nowhere.
   *
   * The card only wins if the target still ends up inside the band - a panel
   * taller than the screen cannot be framed and have its last control visible,
   * and the control is the thing being demonstrated.
   */
  private scrollDelta(el: Element, r: DOMRect, band: { top: number; bottom: number }) {
    const centre = r.top + r.height / 2 - (band.top + band.bottom) / 2;
    const section = el.closest('[data-demo-section]');
    if (!section) return centre;
    const s = section.getBoundingClientRect();
    const framed = s.top - band.top;
    const lands = { top: r.top - framed, bottom: r.bottom - framed };
    return lands.top >= band.top && lands.bottom <= band.bottom ? framed : centre;
  }

  /**
   * Back to the top of the page, for the last beat.
   *
   * On a phone the script ends deep in the page, looking at whatever it was
   * last working. The demo is over by then and what should be on screen is the
   * tool - its title, its menu - rather than the six sliders it happened to
   * finish on.
   */
  async toTop(): Promise<void> {
    this.guard();
    if (window.scrollY === 0) return;
    window.scrollTo({ top: 0, behavior: this.opts.reduced ? 'auto' : 'smooth' });
    await this.scrollReaches(0);
  }

  /**
   * Wait until the page is actually where it was sent.
   *
   * Two earlier versions of this got it wrong. A fixed pause was divided by
   * `speed`, so at demospeed=8 it gave a smooth scroll 65ms to finish; and
   * watching for the scroll position to stop changing resolved immediately,
   * because it has not started changing yet either - three identical frames
   * before the animation begins look exactly like three after it ends.
   *
   * Waiting for a known destination has neither failure. It matters because
   * everything downstream takes a getBoundingClientRect: return early and the
   * whole step is aimed at where its target used to be.
   */
  private scrollReaches(destination: number): Promise<void> {
    this.guard();
    return new Promise<void>((resolve, reject) => {
      this.pending.add(reject);
      const deadline = performance.now() + 2000;
      let last = window.scrollY;
      let stillFor = 0;
      /*
       * Whether the page has moved at all yet, which is the guard that makes
       * "it has stopped" mean anything. Without it, the frames before the
       * animation begins look exactly like the frames after it ends - which is
       * what made an earlier version of this resolve instantly.
       */
      let moved = Math.abs(last - destination) <= 1;
      const tick = () => {
        if (this.stopped) return;
        const y = window.scrollY;
        if (Math.abs(y - last) > 0.5) { moved = true; stillFor = 0; } else { stillFor += 1; }
        last = y;
        /*
         * Arrived, or settled somewhere short of it. The second case is real:
         * the page can clamp at its own end, and the document can grow or
         * shrink under a smooth scroll that is already in flight. Waiting out
         * the full deadline for those costs the step two seconds and then
         * starts it against a page that stopped moving long ago.
         */
        const done = Math.abs(y - destination) <= 1 || (moved && stillFor >= 8);
        if (done || performance.now() > deadline) {
          this.pending.delete(reject);
          resolve();
          return;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }
}
