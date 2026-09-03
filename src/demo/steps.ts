/**
 * The demo script: four steps the user can walk forwards and backwards, and a
 * sign-off. Each one works a real control, so what they watch is exactly what
 * their own hand would produce - the hold, the impact highlights on everything
 * that moved, the channel tooltips, the tone. wiki/notes/plan-picker-demo.md.
 *
 * A step is self-contained. It reads the colour as it finds it and leaves it
 * where it lands, so stepping back re-runs a step against the current colour
 * rather than rewinding to an earlier one. Only the demo as a whole puts the
 * colour back, when it ends or is skipped.
 *
 * Every target is looked up at the moment it is needed - the chain's order
 * changes with the vector mode, and the panels reflow - and a missing one
 * skips its step rather than throwing.
 */

import { CLICK_MS, centerOf, type Driver, type Point } from './drive';

/**
 * The pacing, in milliseconds, gathered here because it is the thing most
 * likely to want tuning. A demo that moves at the speed it takes to *do*
 * something is too fast to *watch*: the dwells are what let a highlight land
 * and be read before the ghost moves on.
 */
const DWELL = {
  /** Standing on a stem or a joint, long enough to read its tooltip. */
  hoverStem: 900,
  hoverJoint: 1100,
  /** The travel time of a move between two targets. */
  move: 520,
  /** The same, across the width of the tool rather than within one panel. */
  moveFar: 680,
  /** After a caption appears, before the hand starts working. */
  beforeAction: 600,
  /** After a drag lets go, while the highlights are still lit. */
  afterAction: 1300,
  /** Between one step going quiet and the next starting. */
  betweenSteps: 400,
  /** How long each drag itself takes. */
  dragTip: 1900,
  dragBox: 2800,
  dragSlider: 3200,
  /** Blend: how long each state is held up for inspection. */
  blendHold: 1300,
} as const;

export interface DemoHost {
  /** The demo shows the RGB chain against the HSB sliders, so it sets both. */
  showDefaultSliders(): void;
  setBlend(on: boolean): void;
}

export interface StepContext {
  d: Driver;
  host: DemoHost;
}

export interface DemoStep {
  /** Shown in the caption panel for the length of the step. */
  caption: string;
  /**
   * What the step's own waits and moves add up to, for the playhead in the
   * progress ticks. Written as the sum of the DWELL entries the step actually
   * spends, so it cannot drift from the choreography the way a hand-typed
   * number would. `bring` is the one thing it cannot predict - a step that has
   * to scroll a target into view runs half a second longer - so the playhead
   * clamps at full and the tick goes solid when the step really ends.
   */
  duration: number;
  /**
   * Narration to play alongside, a file under `public/demo/`. Recorded
   * separately; NARRATION_READY gates whether the runner goes looking.
   */
  audio: string;
  run(ctx: StepContext): Promise<void>;
}

/** Flip to true once the recordings are in `public/demo/`. */
export const NARRATION_READY = false;

/** The last word, after the four steps. */
export const SIGN_OFF = 'Have fun!';

/**
 * How long the sign-off stands before the demo takes itself down. Real
 * seconds, not scaled by `?demospeed`: it is time for a person to read one
 * short line, which does not get shorter because the spec is in a hurry.
 */
export const SIGN_OFF_MS = 5000;

/** The fade on the way out, so the panel leaves rather than blinks off. */
export const SIGN_OFF_FADE_MS = 350;

const el = (selector: string) => document.querySelector(selector);
const joints = () => Array.from(document.querySelectorAll('[data-joint]'));
const stems = () => Array.from(document.querySelectorAll('[data-stem]'));

/** The deepest app element under a point. The demo's own chrome does not hit-test. */
const at = (p: Point) => document.elementFromPoint(p.x, p.y);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const STEPS: DemoStep[] = [
  {
    caption: 'Play with the handles to see how each one maps to a color channel.',
    audio: '01-handles.mp3',
    duration: 3 * (DWELL.move + DWELL.hoverStem + DWELL.move + DWELL.hoverJoint)
      + DWELL.move + DWELL.dragTip + DWELL.afterAction,
    /**
     * The chain: each stem, then the joint it ends at, so the tooltips name
     * the channels in order. Then a short drag of the tip - the one handle
     * that is the selection rather than an explanation of it.
     */
    async run({ d }) {
      const dots = joints();
      const legs = stems();
      if (!dots.length || !legs.length) return;
      const tip = dots[dots.length - 1];
      await d.bring(tip);

      for (let i = 0; i < Math.min(legs.length, dots.length); i++) {
        await hoverBriefly(d, legs[i], DWELL.hoverStem);
        await hoverBriefly(d, dots[i], DWELL.hoverJoint);
      }

      // A short arc, ending somewhere new: the sliders, bars and badge light
      // as it moves, and the chain stays quiet because the chain is held.
      const c = centerOf(tip);
      const reach = Math.min(56, window.innerWidth * 0.06);
      await d.moveTo(() => c, DWELL.move);
      await d.drag(tip, (t) => ({
        x: c.x + reach * Math.sin(t * Math.PI * 0.85),
        y: c.y - reach * 0.75 * t,
      }), DWELL.dragTip);
      await d.wait(DWELL.afterAction);
    },
  },

  {
    caption: 'Work with the tools that feel most familiar to you.',
    audio: '02-color-box.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + DWELL.dragBox + DWELL.afterAction,
    /** The colour box - the control most people reach for first. */
    async run({ d }) {
      const wrapper = el('#sb-wrapper');
      if (!wrapper) return;
      await d.bring(wrapper);

      const r = wrapper.getBoundingClientRect();
      // Inset so the path never leaves the box and clamps against an edge.
      const inset = 18;
      const box = (fx: number, fy: number): Point => ({
        x: lerp(r.left + inset, r.right - inset, fx),
        y: lerp(r.top + inset, r.bottom - inset, fy),
      });
      const start = box(0.3, 0.35);
      await d.moveTo(() => start, DWELL.moveFar);
      await d.wait(DWELL.beforeAction);

      const target = at(start);
      if (target) {
        await d.drag(target, (t) => box(
          0.3 + 0.45 * Math.sin(t * Math.PI * 0.9),
          0.35 + 0.4 * Math.sin(t * Math.PI * 1.6),
        ), DWELL.dragBox);
      }
      await d.wait(DWELL.afterAction);
    },
  },

  {
    caption: 'Keep an eye open for how your changes impact other parts of the tool.',
    audio: '03-impact.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + DWELL.dragSlider + DWELL.afterAction,
    /**
     * A slider, so the rest of the tool can answer. The hue slider wraps, and
     * a press on its arrow asks for pointer lock - ColorSlider skips that for
     * an untrusted press, which is what this is.
     */
    async run({ d }) {
      const arrow = el('#slider-hsb-h-arrow');
      const track = el('#slider-hsb-h-track');
      if (!arrow || !track) return;
      await d.bring(track);

      const c = centerOf(arrow);
      const width = track.getBoundingClientRect().width;
      await d.moveTo(() => c, DWELL.moveFar);
      await d.wait(DWELL.beforeAction);

      // A wrapping slider tracks movement, so how far the hue turns is how
      // far the ghost travels: a third of the track each way is about 120
      // degrees, out and back.
      const sweep = width * 0.34;
      await d.drag(arrow, (t) => ({
        x: c.x + sweep * Math.sin(t * Math.PI * 2),
        y: c.y,
      }), DWELL.dragSlider);
      await d.wait(DWELL.afterAction);
    },
  },

  {
    caption: 'Toggle blend to see the source or mixed colors in the sliders.',
    audio: '04-blend.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + 4 * CLICK_MS + 3 * DWELL.blendHold + DWELL.afterAction,
    /** Blend on and off, which is a claim about the sliders you can only see. */
    async run({ d }) {
      const toggle = el('#blend-toggle');
      if (!toggle) return;
      await d.bring(toggle);
      await d.moveTo(() => centerOf(toggle), DWELL.moveFar);
      await d.wait(DWELL.beforeAction);

      // Four presses, ending where it started. The click carries the whole
      // toggle - the button flips on a plain click - so nothing here sets the
      // state behind its back.
      for (let i = 0; i < 4; i++) {
        await d.click(toggle);
        await d.wait(i === 3 ? DWELL.afterAction : DWELL.blendHold);
      }
    },
  },
];

/** Stage the controls the script assumes, before the first step. */
export async function openingPose(ctx: StepContext): Promise<void> {
  ctx.host.showDefaultSliders();
  ctx.host.setBlend(true);
  await ctx.d.wait(DWELL.betweenSteps);
}

/**
 * Home, for the sign-off: back to the hexagon, where the colour it borrowed
 * is about to tween back. Standing on the thing that is about to move is the
 * whole reason to come back here rather than fade out over the blend button.
 */
export async function closingPose({ d }: StepContext): Promise<void> {
  const tip = joints().at(-1);
  if (tip) await d.bring(tip);
  await d.moveTo(() => (tip
    ? centerOf(tip)
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 }), DWELL.moveFar);
  // Nothing should be left hovered under a cursor that is about to leave.
  d.leave();
}

/** How long the walk off the screen takes, and the fade that rides it. */
export const EXIT_MS = 900;

/** Time to watch the colour tween home before the ghost goes. */
export const RESTORE_WATCH_MS = 900;

/**
 * And off. Straight down and out the way it came in, rather than blinking off
 * where it stood: a cursor that vanishes mid-screen reads as a dropped frame.
 */
export async function exitPose({ d }: StepContext): Promise<void> {
  const from = d.pos;
  await d.moveTo(() => ({ x: from.x, y: window.innerHeight + 140 }), EXIT_MS);
  d.leave();
}

/**
 * Arriving is the hover: the driver keeps the element under the ghost in sync
 * every frame, so standing still on a target is all this has to do.
 */
async function hoverBriefly(d: Driver, target: Element, dwell: number) {
  await d.moveTo(() => centerOf(target), DWELL.move);
  await d.wait(dwell);
}
