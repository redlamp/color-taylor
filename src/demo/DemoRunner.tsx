/**
 * The demo's stage: the ghost cursor and the one panel that carries the
 * caption, the progress and the controls, plus the loop that walks the steps
 * in steps.ts.
 *
 * Lazy-loaded by ColorPicker, like the deck, so the picker's bundle does not
 * carry it.
 *
 * Three shapes worth knowing:
 *
 * 1. **The caption is a panel in the header, not a bubble at the target.** A
 *    bubble beside whatever the ghost is working covers the thing next to it,
 *    which during this demo is always something the user was just told to
 *    watch. Out of the way and in a larger type beats pointing. It takes the
 *    empty span of the header between the title and the tool buttons, and
 *    drops to a band under the header when that row wraps - which is what a
 *    phone does, and there is nothing beside the title to sit next to.
 * 2. **The step index is the state; the effect is the player.** Changing it
 *    interrupts whatever was running and starts the new step, which is what
 *    makes Back and Next work without a second code path.
 * 3. **The cursor is written to the DOM through a ref.** It moves every frame
 *    and a state update per frame would put a React render inside the same
 *    frame as the app's own drag work. React state here is only what changes
 *    once a step.
 *
 * Nothing here hit-tests except that panel, which is tagged so the
 * skip-on-real-input listener can tell a click on its controls from a click
 * on the app.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import DemoCursor, { CURSOR_BOX, cursorKind, hotspotOf, type CursorKind } from './DemoCursor';
import { Driver, DemoAborted, type Point, type Stage } from './drive';
import {
  STEPS, SIGN_OFF, SIGN_OFF_MS, SIGN_OFF_FADE_MS, EXIT_MS,
  NARRATION_READY, carryHome, closingPose, exitPose, openingPose, type DemoHost,
} from './steps';

/**
 * Every line the panel can show. It lays all of them out in one grid cell and
 * hides the ones it is not saying, so its height is the tallest of them at
 * whatever width it has, and a step with a shorter caption does not resize it.
 * Height is what moves it: the panel is centred on the header row, so one
 * line fewer would lift the whole thing off its place.
 */
const CAPTIONS = [...STEPS.map((s) => s.caption), SIGN_OFF];

/**
 * How hard the arrow leans. The tilt is a spring on the smoothed velocity,
 * pivoting on the hotspot, so the body trails the point and swings past centre
 * when the cursor stops. It is the one piece of the demo that is there purely
 * to be fun, which is the whole argument for the numbers being loose.
 */
const TILT_MAX = 20;        // degrees the velocity can ask for, before overshoot
const TILT_PER_PX = 1.5;    // degrees per px-per-frame of travel
/**
 * How much vertical travel counts toward the lean.
 *
 * It used to count for nothing: the goal was read off horizontal velocity
 * alone, so the two gestures that are purely vertical - the brightness bar and
 * the hue strip - moved a perfectly rigid arrow down a track.
 *
 * The arrow's body runs from its point at (1,1) down to about (5,12), so it is
 * mostly a downward shape with a little rightward in it. A body trailing its
 * point swings by the cross product of those two, which puts the vertical
 * contribution at about 0.36 of the horizontal and pointing the other way.
 * Half rather than 0.36 because this is meant to be fun rather than correct.
 */
const TILT_FROM_VERTICAL = 0.5;
/**
 * Sway rather than spring: heavily damped, so the lean follows the direction of
 * travel and settles without ringing.
 *
 * These were 0.16 / 0.82, which overshoots a step by 44% and takes a dozen
 * crossings to give up - the arrow swung back and forth after every stop.
 * 0.10 / 0.65 overshoots by 3% and is inside half a degree in eleven frames,
 * which reads as weight hanging off the point rather than a spring attached
 * to it.
 */
const TILT_SPRING = 0.10;
const TILT_DAMP = 0.65;
/** Nothing should get here now, but a lean is not allowed to run away. */
const TILT_LIMIT = 30;

/**
 * The ring a press leaves behind. A synthetic click moves no hardware and
 * makes no sound, so without this the blend toggle simply changes on its own
 * while a cursor happens to be nearby. An expanding ring is what every
 * screencast tool draws for a click, which is the point: it needs no
 * explaining.
 */
const RIPPLE_MS = 480;
const RIPPLE_FROM = 12;   // px across, at the moment of the press
const RIPPLE_TO = 58;

/** The handover from the welcome card: how long the panel takes to fly home. */
const MORPH_MS = 480;

/*
 * The panel's own scrim, as a shadow rather than a layer.
 *
 * A drop shadow alone does nothing here - the app is dark by default, and a
 * dark shadow on a dark ground is invisible. What works is the second of these
 * two: a wide, low-alpha shadow with a large *spread*, which paints a soft
 * dark halo well outside the panel and lifts it off whatever it is over
 * without dimming the app the way a full-screen scrim would. The first is the
 * ordinary contact shadow that gives the edge somewhere to sit.
 */
const PANEL_SHADOW = '0 10px 28px rgba(0,0,0,0.45), 0 0 90px 44px rgba(0,0,0,0.34)';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export interface DemoRunnerProps {
  /**
   * Where the panel comes in from, if something handed over to the demo. The
   * welcome card passes its own centre, so the panel travels out of it rather
   * than appearing somewhere else entirely while the card fades.
   */
  from?: Point | null;
  /** Put the colour, the slider groups and blend back the way the demo found them. */
  onRestore: () => void;
  /** Take the overlay down. */
  onExit: () => void;
  host: DemoHost;
}

/** Below this, the header slot is too narrow to read a sentence in. */
const CAPTION_MIN_WIDTH = 420;
const CAPTION_MAX_WIDTH = 720;

export default function DemoRunner({ from = null, onRestore, onExit, host }: DemoRunnerProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);
  const [kind] = useState<CursorKind>(() => cursorKind());
  /** The step being played. STEPS.length is the sign-off. */
  const [index, setIndex] = useState(0);
  const [narrate, setNarrate] = useState(true);
  // Read once: the script's shape depends on it, so it must not change mid-run.
  const [reduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const done = index >= STEPS.length;

  // The script outlives any one render, so it reaches its host through refs
  // rather than through the closure the effect was created with. Kept fresh
  // in an effect, never written during render.
  const restoreRef = useRef(onRestore);
  const hostRef = useRef(host);
  const exitRef = useRef(onExit);
  useEffect(() => {
    restoreRef.current = onRestore;
    hostRef.current = host;
    exitRef.current = onExit;
  }, [onRestore, host, onExit]);

  const driverRef = useRef<Driver | null>(null);
  const staged = useRef(false);
  const [leaving, setLeaving] = useState(false);
  /** The ghost's own exit, which runs before the panel's. */
  const [ghostLeaving, setGhostLeaving] = useState(false);
  /*
   * The playhead's clock. Written when a step starts and read every frame, so
   * the fill in the current tick is driven straight to the DOM and no part of
   * this component re-renders for it.
   */
  const playhead = useRef<{ index: number; start: number; ms: number } | null>(null);
  const tickFills = useRef<(HTMLElement | null)[]>([]);

  /*
   * Put every tick back where the render says it should be, whenever the step
   * changes.
   *
   * The fills are written two ways: React sets `scaleX(i < index ? 1 : 0)` as
   * a style prop, and the frame loop above writes the playing one straight to
   * the DOM. Going forward those agree - the tick just finished goes from 0 to
   * 1 in the prop, so React writes over whatever the loop left. Going *back*
   * they do not: the tick being left was already `i < index === false`, so its
   * prop is scaleX(0) before and after, React sees no change and writes
   * nothing, and the half-filled bar the loop last wrote stays on screen.
   *
   * A layout effect rather than an ordinary one, so the correction lands in
   * the same paint as the index change instead of a frame later. The tick now
   * playing is zeroed here too and the loop refills it on its next frame,
   * which is where it should be starting from anyway.
   */
  useLayoutEffect(() => {
    tickFills.current.forEach((fill, i) => {
      if (fill) fill.style.transform = `scaleX(${i < index ? 1 : 0})`;
    });
  }, [index]);

  const skip = useCallback(() => {
    driverRef.current?.stop();
    restoreRef.current();
    exitRef.current();
  }, []);

  /*
   * Relative, and through the updater rather than off the rendered index: two
   * presses of Next inside one frame both read the same `index` and compute
   * the same target, so the second does nothing. Which is exactly what
   * somebody clicking through the demo does.
   */
  const step = useCallback((delta: number) => {
    setIndex((i) => clamp(i + delta, 0, STEPS.length));
  }, []);

  /* The ghost: one rAF for the life of the overlay, driving position and lean. */
  useEffect(() => {
    const hot = hotspotOf(kind);
    let target: Point = { x: window.innerWidth * 0.5, y: window.innerHeight + 80 };
    let shown: Point = { ...target };
    let vx = 0;
    let vy = 0;
    let tilt = 0;
    let tiltV = 0;
    let pressed = false;
    let raf = 0;

    let ring: { x: number; y: number; start: number } | null = null;
    let entered = false;

    const stage: Stage = {
      setCursor(p) { target = p; },
      setPressed(v) { pressed = v; },
      ripple(p) { ring = reduced ? null : { x: p.x, y: p.y, start: performance.now() }; },
    };

    /*
     * The panel rides the header, but the header scrolls: `bring` pushes a
     * target into view and that can take the whole row off the top of the
     * screen. The caption is the one thing that must not go with it.
     */
    const stickyTop = (top: number) => Math.max(8, top);

    /*
     * The caption goes where the header has room for it: the span between the
     * title and the tool buttons when they share a row, and a band across the
     * picker just under the header when that row has wrapped. Measured every
     * frame rather than on a breakpoint, so a resize, a scroll or the plugin
     * banner appearing all move it without anything else being told.
     */
    /*
     * Room to scroll the last controls clear of a foot-anchored panel.
     *
     * `bring` can only scroll as far as the document allows, and the H slider
     * sits near the bottom of a phone's page - so it scrolled to the end and
     * left the target sitting behind the panel anyway. A tail of empty space
     * below the content costs nothing (it is past everything, and goes when
     * the demo does) and makes the band reachable wherever the target is.
     */
    let padApplied = '';
    const setTail = (value: string) => {
      if (value === padApplied) return;
      padApplied = value;
      document.body.style.paddingBottom = value;
    };

    const placeCaption = () => {
      const box = captionRef.current;
      const header = document.getElementById('picker-header')?.getBoundingClientRect();
      const title = document.getElementById('color-picker-title')?.getBoundingClientRect();
      const tools = document.getElementById('picker-tools')?.getBoundingClientRect();
      const root = document.getElementById('color-picker-root')?.getBoundingClientRect();
      if (!box || !header || !title || !tools || !root) return;
      const gap = tools.left - title.right;
      const sameRow = tools.top < title.bottom - 2;
      if (sameRow && gap >= CAPTION_MIN_WIDTH) {
        const width = Math.min(gap - 28, CAPTION_MAX_WIDTH);
        box.style.width = `${width}px`;
        box.style.left = `${title.right + (gap - width) / 2}px`;
        // Centred on the header row, which lets it stand taller than the row
        // and overhang the panels a little rather than push anything down.
        box.style.top = `${stickyTop(header.top + header.height / 2 - box.offsetHeight / 2)}px`;
        setTail('');
      } else {
        /*
         * No room beside the title, which is what a phone does. The panel goes
         * to the foot of the screen rather than under the header: it is a band
         * the width of the tool either way, and at the top it sat across the
         * hexagon - the one thing the first two steps are about. At the bottom
         * it covers the collapsed Recent and Saved rows, which the demo never
         * touches. `bring` knows which edge it is on and scrolls targets into
         * whatever is left.
         */
        const pad = 8;
        box.style.width = `${Math.max(0, root.width - pad * 2)}px`;
        box.style.left = `${root.left + pad}px`;
        box.style.top = `${Math.max(8, window.innerHeight - box.offsetHeight - pad)}px`;
        setTail(`${box.offsetHeight + 48}px`);
      }
    };

    const frame = () => {
      const dx = target.x - shown.x;
      const dy = target.y - shown.y;
      shown = target;
      /*
       * Smoothed px-per-frame. The path is already eased, so the position
       * itself is taken exactly and only the lean is filtered.
       *
       * A longer filter than it had (0.6/0.4). What the lean is meant to show
       * is which way the hand is going, and at one frame's resolution that
       * question has a twitchy answer - a sweep reversing, a bezier crossing
       * its own bow. Four frames of memory answers the question that was
       * actually being asked.
       */
      vx = vx * 0.75 + dx * 0.25;
      vy = vy * 0.75 + dy * 0.25;
      if (!reduced) {
        const goal = clamp((vx - vy * TILT_FROM_VERTICAL) * TILT_PER_PX, -TILT_MAX, TILT_MAX);
        tiltV = (tiltV + (goal - tilt) * TILT_SPRING) * TILT_DAMP;
        tilt = clamp(tilt + tiltV, -TILT_LIMIT, TILT_LIMIT);
      }
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
          // Out fast and gone slow, so the ring reads as something leaving the
          // press rather than an object arriving at it.
          const eased = 1 - Math.pow(1 - t, 3);
          const size = RIPPLE_FROM + (RIPPLE_TO - RIPPLE_FROM) * eased;
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.left = `${ring.x - size / 2}px`;
          dot.style.top = `${ring.y - size / 2}px`;
          dot.style.opacity = `${(1 - eased) * 0.85}`;
        }
      }

      const head = playhead.current;
      const fill = head ? tickFills.current[head.index] : null;
      if (head && fill) {
        const p = clamp((performance.now() - head.start) / head.ms, 0, 1);
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
      }
      placeCaption();
      /*
       * The handover, once, on the first frame that has a real position to fly
       * to. Translate only - the welcome card is 560x318 and this is 670x90,
       * and scaling between those two would stretch the type for half a second
       * on the way. The shared card surface and the travel do the work.
       */
      if (!entered) {
        entered = true;
        const box = captionRef.current;
        if (box && from && !reduced) {
          const r = box.getBoundingClientRect();
          const dx = from.x - (r.left + r.width / 2);
          const dy = from.y - (r.top + r.height / 2);
          box.style.transition = 'none';
          box.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            box.style.transition = `transform ${MORPH_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
            box.style.transform = 'translate(0px, 0px)';
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    driverRef.current = new Driver(stage, { reduced, speed: demoSpeed() }, target);

    return () => {
      cancelAnimationFrame(raf);
      setTail('');
      driverRef.current?.stop();
    };
    // All three are read once at mount and never written after it.
  }, [kind, reduced, from]);

  /*
   * The player. Each index runs one step and, if it gets to the end without
   * being interrupted, advances itself. The cleanup interrupts, so changing
   * the index mid-step abandons it at its next await - that is Back and Next.
   */
  useEffect(() => {
    const d = driverRef.current;
    if (!d || d.aborted) return;
    let live = true;

    const play = async () => {
      const ctx = { d, host: hostRef.current };
      if (!staged.current) {
        staged.current = true;
        await openingPose(ctx);
      }
      if (index >= STEPS.length) {
        /*
         * The sign-off's clock starts with the sign-off, not after it.
         *
         * "Have fun!" goes up the moment this branch is entered - the caption
         * reads the index, not the choreography - so running the walk home
         * first and only then starting the five seconds left the last tick
         * sitting empty for nearly three seconds while a finished line stood
         * on screen. The hold and the goodbye are the same span now: the ghost
         * takes the colour home inside it, and the tick counts the whole thing
         * down. Both are cancellable, so Back or Skip still takes it apart.
         */
        playhead.current = { index: STEPS.length, start: performance.now(), ms: SIGN_OFF_MS };
        // Real seconds however fast the rest ran; `?demospeed` does not shorten
        // the time it takes to read a line.
        const hold = d.linger(SIGN_OFF_MS);
        // Not the throw that matters - the awaits below reject first and the
        // caller handles it - but an abort would otherwise be reported twice.
        hold.catch(() => {});

        /*
         * Home first, so the colour tweens back under the ghost rather than
         * somewhere it is not looking - but only when there is a colour to
         * take home. The demo lands on the app's default, so a visitor who
         * had not changed theirs is being restored to what is already on
         * screen, and the walk is then a cursor crossing the tool to stand
         * over a hexagon and watch nothing happen.
         */
        if (ctx.host.restoreMovesColour()) {
          await closingPose(ctx);
          restoreRef.current();
          // Riding the tip while the colour tweens back, so the ending reads
          // as the cursor putting the colour where it found it.
          await carryHome(ctx);
        } else {
          // Still restores the sections, the banks and the blend.
          restoreRef.current();
        }
        // The whole tool back in view before the ghost goes. After the walk
        // home this is a no-op on a desktop and the difference between a
        // goodbye and a screenful of sliders on a phone.
        await d.toTop();
        setGhostLeaving(true);
        await exitPose(ctx);

        // The demo is over; it should not sit on the screen waiting to be
        // dismissed.
        await hold;
        setLeaving(true);
        await d.linger(SIGN_OFF_FADE_MS);
        exitRef.current();
        return;
      }
      playhead.current = { index, start: performance.now(), ms: STEPS[index].duration / d.speed };
      await Promise.all([STEPS[index].run(ctx), narrationFor(index, narrate)]);
      if (live) setIndex((i) => (i === index ? i + 1 : i));
    };

    play().catch((err: unknown) => {
      if (err instanceof DemoAborted) return;
      // A missing target or a control that changed shape should end the demo
      // quietly and hand the colour back, not leave a ghost on screen.
      console.error('[demo]', err);
      d.stop();
      restoreRef.current();
      exitRef.current();
    });

    return () => {
      live = false;
      stopNarration();
      d.interrupt();
    };
  }, [index, narrate]);

  // Any real press or key ends the demo. The demo's own events are untrusted,
  // which is exactly what separates them; the bar is chrome and does not count.
  useEffect(() => {
    const onDown = (e: Event) => {
      if (!e.isTrusted) return;
      const t = e.target;
      if (t instanceof Element && t.closest('[data-demo-chrome]')) return;
      skip();
    };
    window.addEventListener('pointerdown', onDown, { capture: true });
    window.addEventListener('keydown', onDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', onDown, { capture: true } as EventListenerOptions);
      window.removeEventListener('keydown', onDown, { capture: true } as EventListenerOptions);
    };
  }, [skip]);

  const hot = hotspotOf(kind);
  const caption = done ? SIGN_OFF : STEPS[index].caption;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/*
        The whole demo in one panel: what to watch, where you are, and the
        controls, in the header's empty span. Starts off screen because its
        place is measured on the first frame, not written into the class.

        The hairline is the chain's three channels, which is the only border
        in the app that could only belong to this one - and it drifts, slowly
        enough to be noticed rather than watched.
      */}
      <div
        ref={captionRef}
        data-demo-chrome=""
        data-testid="demo-bar"
        className={`speaks pointer-events-auto fixed rounded-xl bg-card/95 backdrop-blur-sm transition-opacity ${leaving ? 'opacity-0' : 'opacity-100'}`}
        style={{
          left: 0,
          top: -400,
          boxShadow: PANEL_SHADOW,
          transitionDuration: `${SIGN_OFF_FADE_MS}ms`,
        }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div role="status" aria-live="polite" className="grid min-w-[15rem] flex-1">
            {CAPTIONS.map((text) => (
              <p
                key={text}
                // visibility, not display: the hidden lines still take their
                // space, which is the whole point, and are still out of the
                // accessibility tree, which is the other one.
                style={{ visibility: text === caption ? 'visible' : 'hidden' }}
                className="col-start-1 row-start-1 self-center text-pretty text-xl font-medium leading-snug sm:text-2xl"
              >
                {text}
              </p>
            ))}
          </div>

          {/*
            The controls are a column: progress on top, buttons under it. Side
            by side they took about 280px of a 430px header slot and the
            caption wrapped to three lines in what was left; stacked, the
            column is only as wide as the button row and the text gets the
            difference.
          */}
          <div className="flex shrink-0 flex-col items-stretch gap-2 max-sm:w-full">
            <span className="flex gap-1" data-testid="demo-ticks" aria-hidden="true">
              {/*
                One track per step, and a longer one on the end for the
                sign-off - which is a countdown rather than a step, so it gets
                a tick of its own to run down rather than borrowing the last
                step's. Each is a track with a fill, so the one being played
                reads as a playhead rather than a state. Weight tells a played
                step from a coming one - the tick you are on is not wider than
                the rest, because that moved everything right of it by 2px
                each time it changed.
              */}
              {Array.from({ length: STEPS.length + 1 }, (_, i) => {
                const last = i === STEPS.length;
                return (
                  <span
                    key={last ? 'sign-off' : STEPS[i].audio}
                    // Proportional rather than fixed: the row spans the column
                    // above the buttons, so it reads as one progress bar and
                    // its total width cannot change as steps are added.
                    className={`h-1 overflow-hidden rounded-full bg-border ${last ? 'flex-[1.6]' : 'flex-1'}`}
                  >
                    <i
                      ref={(node) => { tickFills.current[i] = node; }}
                      data-on={i <= index ? '' : undefined}
                      data-testid={i === index ? 'demo-playhead' : undefined}
                      className={`block h-full w-full origin-left rounded-full ${i === index ? 'bg-foreground' : 'bg-foreground/70'}`}
                      // The tick being played is driven by the frame loop from
                      // here; the others are simply full or empty.
                      style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
                    />
                  </span>
                );
              })}
            </span>
            {/* Where the controls have a row to themselves - a phone, where
                the panel is a band the width of the tool - they take all of
                it rather than huddling at one end of it. */}
            <div className="flex items-center gap-1.5 max-sm:w-full">
              {NARRATION_READY && (
                <button
                  type="button"
                  onClick={() => setNarrate((v) => !v)}
                  className="ctl-quiet-icon"
                  aria-label={narrate ? 'Turn narration off' : 'Turn narration on'}
                  aria-pressed={narrate}
                >
                  {narrate ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </button>
              )}
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index === 0}
              className="ctl-quiet-icon disabled:opacity-35 max-sm:w-auto max-sm:flex-1"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={done}
              className="ctl-quiet-icon disabled:opacity-35 max-sm:w-auto max-sm:flex-1"
              aria-label="Next step"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              data-testid="demo-primary"
              onClick={skip}
              className={`ml-1 grid place-items-center whitespace-nowrap rounded-md border px-3 py-1.5 text-sm max-sm:flex-1 ${done
                ? 'border-transparent bg-primary font-medium text-primary-foreground'
                : 'border-input bg-muted text-foreground'}`}
            >
              {/* Holds the longer label's width from the start, so the panel
                  does not grow by 60px when the demo reaches its end. */}
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                Start exploring
              </span>
              <span data-testid="demo-primary-label" className="col-start-1 row-start-1">
                {done ? 'Start exploring' : 'Skip'}
              </span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawn under the arrow, so the ring reads as coming out from the point
          rather than sitting on top of it. */}
      <div
        ref={rippleRef}
        aria-hidden="true"
        className="pointer-events-none fixed rounded-full border-2 border-foreground"
        style={{ opacity: 0, boxShadow: '0 0 0 1px rgba(0,0,0,0.35)' }}
      />

      <div
        ref={cursorRef}
        aria-hidden="true"
        data-testid="demo-cursor"
        className="pointer-events-none fixed transition-opacity"
        style={{
          width: CURSOR_BOX,
          height: CURSOR_BOX,
          marginLeft: -hot.x,
          marginTop: -hot.y,
          transformOrigin: `${hot.x}px ${hot.y}px`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
          opacity: ghostLeaving ? 0 : 1,
          transitionDuration: `${EXIT_MS}ms`,
        }}
      >
        <DemoCursor kind={kind} />
      </div>

    </div>,
    document.body,
  );
}

/*
 * Narration.
 *
 * One element at a time, held outside React because it belongs to the step
 * rather than to a render. A step waits for its line to finish before moving
 * on, so the pacing follows the voice when there is one; with no recordings
 * (or none for this step) the promise resolves at once and the choreography
 * sets the pace on its own. A file that will not load is not an error worth
 * ending a demo over - it just goes quiet.
 */
let narration: HTMLAudioElement | null = null;

function narrationFor(index: number, enabled: boolean): Promise<void> {
  stopNarration();
  const step = STEPS[index];
  if (!NARRATION_READY || !enabled || !step?.audio) return Promise.resolve();
  const el = new Audio(`${import.meta.env.BASE_URL}demo/${step.audio}`);
  narration = el;
  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    el.addEventListener('ended', finish, { once: true });
    el.addEventListener('error', finish, { once: true });
    el.play().catch(finish);
  });
}

function stopNarration() {
  if (!narration) return;
  narration.pause();
  narration = null;
}

/**
 * `?demospeed=N` divides every duration, for the Playwright spec. Same shape
 * as `?fps`: a query param, so it works on the deployed site and needs no
 * stored state.
 */
function demoSpeed(): number {
  try {
    const raw = new URLSearchParams(window.location.search).get('demospeed');
    const n = raw ? Number(raw) : 1;
    return Number.isFinite(n) && n >= 1 && n <= 20 ? n : 1;
  } catch {
    return 1;
  }
}
