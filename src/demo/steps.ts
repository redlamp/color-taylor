/**
 * The demo script: five steps the user can walk forwards and backwards, and a
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
import { HSB_TWEEN_MS } from '../utils/colorTween';
import {
  CENTER_X, CENTER_Y, PI, RADIUS, blLimitScale, hexEdgeDist, type BLMode,
} from '../components/hex/hexConstants';

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
  beforeAction: 400,
  /**
   * After a drag lets go, while the highlights are still lit.
   *
   * The fade is `duration-500` and nothing holds the highlight lit before it
   * starts, so anything past about 950 here is dead air - and it is spent
   * three times over the run.
   */
  afterAction: 950,
  /** Between one step going quiet and the next starting. */
  betweenSteps: 300,
  /**
   * How long each drag itself takes. Longer than felt right while building
   * them: the hand knows where it is going and the eye does not, and every
   * one of these is asking somebody to watch three other things move.
   */
  dragTip: 3800,
  dragBox: 2800,
  dragHue: 2600,
  dragBar: 2600,
  dragSlider: 2600,
  /** Blend: how long each state is held up for inspection. */
  blendHold: 1000,
} as const;

/**
 * The colour as the app holds it, plus the two things the hexagon's mapping
 * needs to turn a colour back into a point on the field.
 */
export interface FieldState {
  h: number;
  s: number;
  b: number;
  /** HSL lightness, which is what bounds the cross-section in lightness mode. */
  l: number;
  blMode: BLMode;
}

export interface DemoHost {
  /**
   * Put the slider banks back only if there are none.
   *
   * This used to force the default pair and hand the user's arrangement back
   * afterwards, which flickered HSL off and on again for anyone who had all
   * three showing. Nothing in the script targets a particular bank any more -
   * the one step that dragged a slider is gone - so the demo has no business
   * having an opinion. The single exception is a user with every bank closed,
   * where the step about what lights up would have nothing to light.
   */
  ensureSliders(): void;
  /**
   * Where the colour is now. Read, never written - the script still works the
   * real controls, and this only tells it where to aim them. A gesture on the
   * hexagon is a position, so a step that means to land on a particular colour
   * has to know the one it is starting from.
   */
  field(): FieldState;
  /**
   * Whether handing the colour back is going to move anything.
   *
   * The demo lands on LANDING, which is the app's own default, so for a
   * visitor who had not changed the colour the restore is a no-op - and the
   * walk home is then a cursor crossing the screen to stand over a hexagon
   * and watch nothing happen. Asked before the walk rather than discovered
   * after it, because by then the trip has been taken.
   */
  restoreMovesColour(): boolean;
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

/** The last word, after the five steps. */
export const SIGN_OFF = 'Have fun!';

/**
 * How long the sign-off stands before the demo takes itself down. Real
 * seconds, not scaled by `?demospeed`: it is time for a person to read one
 * short line, which does not get shorter because the spec is in a hurry.
 *
 * Two words needs nowhere near four seconds; what sets this is the goodbye
 * that now runs inside it - home, the colour tweening back, the walk off -
 * which takes 2.7 of them.
 */
export const SIGN_OFF_MS = 4000;

/** The fade on the way out, so the panel leaves rather than blinks off. */
export const SIGN_OFF_FADE_MS = 350;

const el = (selector: string) => document.querySelector(selector);
const joints = () => Array.from(document.querySelectorAll('[data-joint]'));

/**
 * Smoothstep: zero rate of change at both ends, unity in the middle.
 *
 * Every gesture path below is written as a function of `smooth(t)` rather than
 * `t`, and `drag` is then given a linear clock so the shaping is applied
 * exactly once. That is what stops a sweep arriving at its own end at full
 * speed: `sin(pi * t)` is at its fastest as it lands, which reads as the hand
 * being yanked off the control. `sin(pi * smooth(t))` traces the identical
 * path and reaches the same peak speed - about 3.11 against pi, because the
 * two factors peak at different moments - but starts and stops at rest.
 *
 * Easing the clock instead, which is what `animate` does when `linear` is off,
 * warps the turn as well as the ends and makes the sweep lurch through its
 * middle. The shaping belongs in the path, where it knows what it is shaping.
 */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * A sweep along a track, out and back, from wherever the handle happens to be.
 *
 * The obvious version - swing symmetrically about the start and clamp to the
 * smaller side - collapses to nothing at an end of the track, which is exactly
 * where the brightness handle sits by default. So it goes toward whichever end
 * has the room and comes back, which is a real gesture at any starting point
 * and still finishes where it began.
 */
function sweepFrom(lo: number, hi: number, start: number, fraction = 0.55) {
  const before = start - lo;
  const after = hi - start;
  const dir = after >= before ? 1 : -1;
  const reach = Math.min(dir > 0 ? after : before, (hi - lo) * fraction);
  return (t: number) => start + dir * reach * Math.sin(smooth(t) * Math.PI);
}

/**
 * Where the demo means to leave the colour.
 *
 * A demo that wanders and stops wherever the last gesture happened to end
 * looks like a recording of somebody fiddling. Landing every time on one
 * chosen colour makes the same script read as a thing that was composed - and
 * the hexagon, the colour box and the hue strip all arrive at it from
 * different directions, which is quietly the argument the demo is making.
 */
export const LANDING = { h: 216, s: 69, b: 100 } as const;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** A point in the hexagon's user space, in client coordinates. */
function hexClientPoint(svgX: number, svgY: number): Point | null {
  const svg = el('#hex-svg');
  const box = svg?.getAttribute('viewBox')?.split(/\s+/).map(Number);
  if (!svg || !box || box.length < 4) return null;
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  // The wrapper pins the element's aspect ratio to the viewBox's, so this is
  // the exact inverse of the component's own getSvgCoords.
  return { x: r.left + (svgX / box[2]) * r.width, y: r.top + (svgY / box[3]) * r.height };
}

/**
 * Where to put the pointer to select a hue and a saturation on the field.
 *
 * The inverse of `hsbFromField`, which reads angle as hue and radius as chroma:
 * the handle sits at (s/100) x the cross-section's own edge, and the bound on
 * that cross-section is the one thing that differs between the two B/L modes.
 * `f` is read once and held for the whole gesture, the same way the component
 * freezes its drag origin - so the sweep stays on one cross-section instead of
 * chasing a bound that its own movement is changing.
 */
function fieldPoint(hueDeg: number, satFraction: number, f: FieldState): Point | null {
  const rad = (hueDeg * PI) / 180;
  const dist = satFraction * blLimitScale(f.blMode, f.b, f.l) * hexEdgeDist(rad, RADIUS);
  return hexClientPoint(CENTER_X + dist * Math.cos(rad), CENTER_Y - dist * Math.sin(rad));
}


export const STEPS: DemoStep[] = [
  {
    caption: 'Work with the tools that feel most familiar to you.',
    audio: '01-color-box.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + DWELL.dragBox
      + DWELL.betweenSteps + DWELL.move + DWELL.dragHue + DWELL.afterAction,
    /**
     * The colour editor, and the demo opens here on purpose: it is the control
     * every other tool has, so the first thing that moves is a thing the user
     * already knows. It is also the one gesture that works identically from
     * any starting colour - the box maps x and y straight onto saturation and
     * brightness, with no cross-section to collapse and no angle to be
     * undefined at the centre - so black and white are ordinary here.
     *
     * The box first, then the hue strip beside it, because saturation and
     * brightness alone never leave the one hue and the pair is what makes it a
     * picker.
     *
     * Both are worked by the track rather than the handle. Reaching for a 10px
     * marker is what a person does because they have to; watching a cursor hunt
     * for one teaches nothing, and a near miss looks like a bug.
     */
    async run({ d, host }) {
      const area = el('#sb-area');
      const wrapper = el('#sb-wrapper');
      if (!area || !wrapper) return;
      await d.bring(wrapper);

      // In the box's own units rather than fractions of a rectangle: the
      // gesture is meant to end on a colour, and saying so in saturation and
      // brightness is the only way to be sure it does.
      const r = area.getBoundingClientRect();
      const pt = (sat: number, bri: number): Point => ({
        x: r.left + (sat / 100) * r.width,
        y: r.top + (1 - bri / 100) * r.height,
      });
      const f = host.field();
      const start = pt(f.s, f.b);
      await d.moveTo(() => start, DWELL.moveFar);
      await d.wait(DWELL.beforeAction);

      // Out through the dark and back up to the top edge. Both terms vanish at
      // t=1, so it finishes exactly on the landing colour however it started.
      await d.drag(area, (t) => {
        const u = smooth(t);
        return pt(
          clamp(f.s + (LANDING.s - f.s) * u + 30 * Math.sin(u * PI * 2), 2, 98),
          clamp(f.b + (LANDING.b - f.b) * u - 42 * Math.sin(u * PI), 4, 100),
        );
      }, DWELL.dragBox, true);
      await d.wait(DWELL.betweenSteps);

      // The hue strip. Absolute mapping on clientY, so pressing at the marker's
      // own height changes nothing on contact and the sweep starts from where
      // the colour already is - and a full period of a sine takes it above and
      // below that hue and hands it back where it began.
      const bar = el('#hue-bar');
      if (bar) {
        await d.bring(bar);
        const br = bar.getBoundingClientRect();
        const x = br.left + br.width / 2;
        const h0 = host.field().h;
        const y = (hue: number) => br.top + (hue / 360) * br.height;

        /*
         * The strip loops; the ghost must not.
         *
         * Wrapping the hue into 0-360 to find a height is right for the value
         * and wrong for the hand: the moment the sweep crossed an end the
         * cursor jumped the length of the control, which is not a thing a
         * pointer does. So the path is chosen to stay on the strip instead -
         * out to whichever end has the room, then back to the landing hue.
         *
         * One reversal, not two. Both ends fit only when the start and the
         * target are near the middle, and a sweep that turns twice in two and
         * a half seconds reads as fidgeting rather than as showing a range.
         */
        const pad = 6;
        const lo = Math.min(h0, LANDING.h);
        const hi = Math.max(h0, LANDING.h);
        const room = { up: 360 - pad - hi, down: lo - pad };
        const peak = room.up >= room.down ? hi + room.up : lo - room.down;

        await d.moveTo(() => ({ x, y: y(h0) }), DWELL.move);
        // Time split by distance, so the speed is even across the turn, and
        // smoothed within each leg, so it comes to rest before reversing.
        const legs = [Math.abs(peak - h0), Math.abs(LANDING.h - peak)];
        const split = legs[0] / (legs[0] + legs[1] || 1);
        await d.drag(bar, (t) => ({
          x,
          y: y(t < split
            ? h0 + (peak - h0) * smooth(split ? t / split : 1)
            : peak + (LANDING.h - peak) * smooth(split < 1 ? (t - split) / (1 - split) : 1)),
        }), DWELL.dragHue, true);
      }
      await d.wait(DWELL.afterAction);
    },
  },

  {
    caption: 'Move one value and everything it affects lights up across the app.',
    audio: '02-impact.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + DWELL.dragSlider
      + DWELL.betweenSteps + DWELL.move + DWELL.dragSlider + DWELL.afterAction,
    /**
     * The claim and its demonstration, which used to be two steps and used to
     * be made on the hexagon's bars.
     *
     * The bars looked like the better argument: they are not in the slider
     * bank, so the bank lighting up is unmistakably somewhere else. On a phone
     * that reasoning inverts. The hexagon and the bank cannot be on screen at
     * once, so a gesture on the hexagon makes a claim about readouts the user
     * cannot see - the one step whose whole subject is what happens elsewhere,
     * demonstrated off screen.
     *
     * Two sliders from two different banks says the same thing inside one
     * card: neither lights itself, each lights the other, and the hexagon's
     * chain and bars light too for anyone with the room to see them.
     *
     * Both are sweeps that hand the colour back where they found it, so the
     * landing colour survives the step.
     */
    async run({ d }) {
      // Whatever the user has showing, one slider from each of the first two
      // banks. The demo runs against their arrangement rather than setting it,
      // so this cannot assume the default pair is on screen.
      const picks = ['rgb-g', 'hsb-s', 'hsl-l', 'rgb-b']
        .map((c) => ({ track: el(`#slider-${c}-track`), arrow: el(`#slider-${c}-arrow`) }))
        .filter((p): p is { track: Element; arrow: Element } => !!p.track && !!p.arrow)
        .slice(0, 2);
      if (!picks.length) return;

      // The bank rather than the card: framing the card from its top pushes the
      // last slider under the panel on a phone, and the sliders are the whole
      // point of this step. Asked for outright, so the shot is a decision
      // rather than a consequence of where the previous step stopped.
      const banks = el('#slider-banks');
      if (banks) await d.bring(banks, true);

      for (const [i, { track, arrow }] of picks.entries()) {
        /*
         * The ghost rides the track, not the handle. Reaching for a 10px arrow
         * is what a person does because they have to; watching a cursor hunt
         * for one teaches nothing, and a near miss looks like a bug. Pressing
         * the track is the same gesture with nothing to aim at, and it presses
         * at the handle's own x so the value does not jump on contact.
         */
        const r = track.getBoundingClientRect();
        const from = { x: centerOf(arrow).x, y: r.top + r.height / 2 };
        const sweep = sweepFrom(r.left + 10, r.right - 10, from.x);
        await d.moveTo(() => from, i === 0 ? DWELL.moveFar : DWELL.move);
        if (i === 0) await d.wait(DWELL.beforeAction);
        await d.drag(track, (t) => ({ x: sweep(t), y: from.y }), DWELL.dragSlider, true);
        if (i === 0) await d.wait(DWELL.betweenSteps);
      }
      await d.wait(DWELL.afterAction);
    },
  },

  {
    caption: 'Press this button to toggle between Source and Mixed color sliders.',
    audio: '03-blend.mp3',
    duration: DWELL.moveFar + DWELL.beforeAction + 4 * CLICK_MS + 3 * DWELL.blendHold + DWELL.afterAction,
    /** Blend on and off, which is a claim about the sliders you can only see. */
    async run({ d }) {
      const toggle = el('#blend-toggle');
      if (!toggle) return;
      /*
       * The same shot as the step before it, deliberately.
       *
       * What this step is about is the slider tracks changing under the
       * button, which is what step 2 is about too - so it frames the bank
       * block rather than the card, and the two steps then agree. Framing the
       * card from its top instead moved the page 112px between two steps that
       * are looking at the same thing, which on a phone is a hiccup right as
       * the first press lands. The toggle sits at the top of the block, so
       * centring the block keeps it comfortably in view.
       */
      await d.bring(el('#slider-banks') ?? toggle, true);
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
  {
    caption: 'Press button to show HTML named colors in the hex.',
    audio: '04-html-colors.mp3',
    duration: DWELL.move + DWELL.beforeAction + 2 * CLICK_MS + DWELL.blendHold + DWELL.afterAction,
    /**
     * The named colours pinned on the field, on and then off again: a claim
     * about the hexagon made from the editor, the way the blend step is a
     * claim about the sliders. Two presses so the picker is left as it was
     * found, and it sits before the chain step so the field it walks onto is
     * the one the user had. The toggle is on the same row as the blend button
     * the step before ended on, so this is a short move, not a far one.
     */
    async run({ d }) {
      const toggle = el('#html-colors-toggle');
      if (!toggle) return;
      // The control itself, not the bank block the step before framed: the
      // button sits under the sliders, and on a phone framing the block from
      // its top leaves it below the band, behind the demo panel - where the
      // ghost then taps at a point the button is not.
      await d.bring(toggle);
      await d.moveTo(() => centerOf(toggle), DWELL.move);
      await d.wait(DWELL.beforeAction);
      await d.click(toggle);
      await d.wait(DWELL.blendHold);
      await d.click(toggle);
      await d.wait(DWELL.afterAction);
    },
  },
  {
    caption: 'Play with the Hex handles to see how each one maps to a color channel.',
    audio: '05-handles.mp3',
    duration: (DWELL.move + DWELL.hoverStem) + 2 * (DWELL.move + DWELL.hoverJoint)
      + DWELL.move + DWELL.dragTip + DWELL.afterAction,
    /**
     * The chain, and the hexagon it lives on - last, because it is the
     * unfamiliar one and because everything before it fits in the colour
     * editor. On a phone that means the demo does its first three steps in one
     * card and only scrolls once, at the end, to the thing worth scrolling to.
     *
     * Going after the colour editor also hands this step a colour at full
     * brightness, which matters more than it sounds: the hexagon's
     * cross-section is a hexagon of radius b/100, so at a dark starting colour
     * the whole field collapses toward a point and the lap below would happen
     * inside a few pixels. From b=100 it is always the full field.
     *
     * Three stops, not all six, one per channel in chain order: the red
     * handle, the green stem, the blue handle. Visiting every joint and stem
     * made the point three times and took nine seconds doing it - the
     * tooltips name a channel the same whether or not you have seen its
     * neighbour, and by the third stop the pattern is established rather than
     * being demonstrated. A handle then a stem then a handle also shows both
     * kinds of thing on the chain, and ends on the tip, the one handle that is
     * the selection rather than an explanation of it.
     */
    async run({ d, host }) {
      const dots = joints();
      if (!dots.length) return;
      const tip = dots[dots.length - 1];
      await d.bring(tip);

      // By channel, through the data-hold the hexagon marks each piece with:
      // a joint carries every channel up to it, a stem its own. A missing one
      // is skipped, not thrown over.
      const joint = (hold: string) => document.querySelector(`[data-joint][data-hold="hex:${hold}"]`) ?? undefined;
      const stem = (ch: string) => document.querySelector(`[data-stem][data-hold="hex:${ch}"]`) ?? undefined;
      const tour: Array<[Element | undefined, number]> = [
        [joint('r'), DWELL.hoverJoint],
        [stem('g'), DWELL.hoverStem],
        [tip, DWELL.hoverJoint],
      ];
      for (const [target, dwell] of tour) {
        if (target) await hoverBriefly(d, target, dwell);
      }

      // Then the tip goes all the way round.
      //
      // It used to nudge 56px and come back, which moved the readouts without
      // ever saying what the field is: a short arc near one hue looks like a
      // colour being adjusted, and a full turn looks like a hue wheel, which
      // is what it is. Brightness is held for the whole gesture - the mapping
      // freezes its bound at pointer-down and every point on this path stays
      // inside it - so the only things moving are hue and saturation.
      await d.bring(tip);
      const c = centerOf(tip);
      await d.moveTo(() => c, DWELL.move);

      // Read once and held: this is the cross-section the whole sweep is on.
      const f = host.field();
      // One full turn, plus however far round the landing hue is from here, so
      // it arrives there however the colour started.
      const turn = 360 + ((((LANDING.h - f.h) % 360) + 360) % 360);
      const s0 = clamp(f.s / 100, 0.12, 0.92);
      const s1 = LANDING.s / 100;
      await d.drag(tip, (t) => {
        const u = smooth(t);
        // The wobble decays to nothing, so the last stretch is a clean
        // approach and the gesture lands exactly on the colour it meant to.
        const sat = clamp(s0 + (s1 - s0) * u + 0.2 * Math.sin(u * PI * 3) * (1 - u), 0.1, 0.92);
        return fieldPoint(f.h + turn * u, sat, f) ?? c;
      }, DWELL.dragTip, true);
      await d.wait(DWELL.afterAction);
    },
  },

];

/**
 * Stage the controls the script assumes, before the first step.
 *
 * Deliberately almost nothing. Blend is left wherever the user had it: step
 * four presses the toggle an even number of times, so it demonstrates the same
 * thing from either state and gives it back either way.
 */
export async function openingPose(ctx: StepContext): Promise<void> {
  ctx.host.ensureSliders();
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
}

/**
 * Ride the tip home while the colour tweens back to where the demo found it.
 *
 * `moveTo` reads its destination once, so parking on the handle and letting go
 * left the ghost sitting where the handle used to be while the chain walked
 * off without it. Following it frame by frame is what makes the ending read as
 * the cursor putting the colour back rather than the colour leaving on its own.
 */
export async function carryHome({ d }: StepContext): Promise<void> {
  const tip = joints().at(-1);
  if (tip) await d.follow(() => centerOf(tip), HSB_TWEEN_MS + 120);
  else await d.wait(HSB_TWEEN_MS);
  // Nothing should be left hovered under a cursor that is about to leave.
  d.leave();
}

/** How long the walk off the screen takes, and the fade that rides it. */
export const EXIT_MS = 900;

/**
 * And off, through whichever edge the panel is not on, rather than blinking
 * off where it stood: a cursor that vanishes mid-screen reads as a dropped
 * frame, and one that walks out through its own caption reads as a mistake.
 */
export async function exitPose({ d }: StepContext): Promise<void> {
  const out = d.exitTarget();
  await d.moveTo(() => out, EXIT_MS);
  d.leave();
}

/**
 * Arriving is the hover: the driver keeps the element under the ghost in sync
 * every frame, so standing still on a target is all this has to do.
 */
async function hoverBriefly(d: Driver, target: Element, dwell: number) {
  // Cheap when it is already clear, which is the usual case; on a phone it is
  // what keeps the ghost from hovering something behind the panel.
  await d.bring(target);
  await d.moveTo(() => centerOf(target), DWELL.move);
  await d.wait(dwell);
}
