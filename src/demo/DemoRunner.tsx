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

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import DemoCursor, { CURSOR_BOX, cursorKind, hotspotOf, type CursorKind } from './DemoCursor';
import { Driver, DemoAborted, type Point, type Stage } from './drive';
import {
  STEPS, SIGN_OFF, SIGN_OFF_MS, SIGN_OFF_FADE_MS, EXIT_MS, RESTORE_WATCH_MS,
  NARRATION_READY, closingPose, exitPose, openingPose, type DemoHost,
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
 * pivoting on the hotspot, so the body trails the point and swings past
 * centre once when the cursor stops. It is the one piece of the demo that is
 * there purely to be fun.
 */
const TILT_MAX = 18;        // degrees, before the spring's overshoot
const TILT_PER_PX = 1.5;    // degrees per px-per-frame of travel
const TILT_SPRING = 0.16;
const TILT_DAMP = 0.82;

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

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export interface DemoRunnerProps {
  /** Put the colour, the slider groups and blend back the way the demo found them. */
  onRestore: () => void;
  /** Take the overlay down. */
  onExit: () => void;
  host: DemoHost;
}

/** Below this, the header slot is too narrow to read a sentence in. */
const CAPTION_MIN_WIDTH = 420;
const CAPTION_MAX_WIDTH = 720;

export default function DemoRunner({ onRestore, onExit, host }: DemoRunnerProps) {
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

  const skip = useCallback(() => {
    driverRef.current?.stop();
    restoreRef.current();
    exitRef.current();
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(clamp(next, 0, STEPS.length));
  }, []);

  /* The ghost: one rAF for the life of the overlay, driving position and lean. */
  useEffect(() => {
    const hot = hotspotOf(kind);
    let target: Point = { x: window.innerWidth * 0.5, y: window.innerHeight + 80 };
    let shown: Point = { ...target };
    let vx = 0;
    let tilt = 0;
    let tiltV = 0;
    let pressed = false;
    let raf = 0;

    let ring: { x: number; y: number; start: number } | null = null;

    const stage: Stage = {
      setCursor(p) { target = p; },
      setPressed(v) { pressed = v; },
      ripple(p) { ring = reduced ? null : { x: p.x, y: p.y, start: performance.now() }; },
    };

    /*
     * The panel rides the header, but the header scrolls: `bring` pushes a
     * target into view and on a phone that takes the whole row off the top of
     * the screen. The caption is the one thing that must not go with it.
     */
    const stickyTop = (top: number) => Math.max(8, top);

    /*
     * The caption goes where the header has room for it: the span between the
     * title and the tool buttons when they share a row, and a band across the
     * picker just under the header when that row has wrapped. Measured every
     * frame rather than on a breakpoint, so a resize, a scroll or the plugin
     * banner appearing all move it without anything else being told.
     */
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
      } else {
        const pad = 8;
        box.style.width = `${Math.max(0, root.width - pad * 2)}px`;
        box.style.left = `${root.left + pad}px`;
        box.style.top = `${stickyTop(header.bottom + 6)}px`;
      }
    };

    const frame = () => {
      const dx = target.x - shown.x;
      shown = target;
      // Smoothed px-per-frame. The bezier is already eased, so the position
      // itself is taken exactly and only the lean is filtered.
      vx = vx * 0.6 + dx * 0.4;
      if (!reduced) {
        const goal = clamp(vx * TILT_PER_PX, -TILT_MAX, TILT_MAX);
        tiltV = (tiltV + (goal - tilt) * TILT_SPRING) * TILT_DAMP;
        tilt += tiltV;
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
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    driverRef.current = new Driver(stage, { reduced, speed: demoSpeed() }, target);

    return () => {
      cancelAnimationFrame(raf);
      driverRef.current?.stop();
    };
    // Both deps are state read once at mount and never written.
  }, [kind, reduced]);

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
        playhead.current = null;
        // Home first, so the colour tweens back under the ghost rather than
        // somewhere it is not looking; then off the bottom of the screen,
        // fading as it goes, rather than blinking out where it stood.
        await closingPose(ctx);
        restoreRef.current();
        await d.wait(RESTORE_WATCH_MS);
        setGhostLeaving(true);
        await exitPose(ctx);
        // The demo is over; it should not sit on the screen waiting to be
        // dismissed. Through the driver so Back or Skip cancels it, and
        // through `linger` so it is five seconds however fast the rest ran.
        playhead.current = { index: STEPS.length, start: performance.now(), ms: SIGN_OFF_MS };
        await d.linger(SIGN_OFF_MS);
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
        className={`demo-panel pointer-events-auto fixed rounded-xl bg-card/95 shadow-xl backdrop-blur-sm transition-opacity ${leaving ? 'opacity-0' : 'opacity-100'}`}
        style={{ left: 0, top: -400, transitionDuration: `${SIGN_OFF_FADE_MS}ms` }}
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

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="mr-1 flex gap-1" data-testid="demo-ticks" aria-hidden="true">
              {/*
                One track per step, and a longer one on the end for the
                sign-off - which is a countdown rather than a step, so it gets
                a tick of its own to run down rather than borrowing the last
                step's. Each is a track with a fill, so the one being played
                reads as a playhead rather than a state, and all are a fixed
                width: widening the current tick moved everything right of it
                by 2px each time it changed. Weight tells a played step from a
                coming one.
              */}
              {Array.from({ length: STEPS.length + 1 }, (_, i) => {
                const last = i === STEPS.length;
                return (
                  <span
                    key={last ? 'sign-off' : STEPS[i].audio}
                    className={`h-1 overflow-hidden rounded-full bg-border ${last ? 'w-8' : 'w-5'}`}
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
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="ctl-quiet-icon disabled:opacity-35"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={done}
              className="ctl-quiet-icon disabled:opacity-35"
              aria-label="Next step"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              data-testid="demo-primary"
              onClick={skip}
              className={`ml-1 grid place-items-center whitespace-nowrap rounded-md border px-3 py-1.5 text-sm ${done
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
