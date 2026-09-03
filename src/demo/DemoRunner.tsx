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
  STEPS, SIGN_OFF, NARRATION_READY, closingPose, openingPose, type DemoHost,
} from './steps';

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

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export interface DemoRunnerProps {
  /** Put the colour, the slider groups and blend back the way the demo found them. */
  onRestore: () => void;
  /** Take the overlay down. */
  onExit: () => void;
  host: DemoHost;
}

/** Below this, the header slot is too narrow to read a sentence in. */
const CAPTION_MIN_WIDTH = 320;
const CAPTION_MAX_WIDTH = 720;

export default function DemoRunner({ onRestore, onExit, host }: DemoRunnerProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
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

    const stage: Stage = {
      setCursor(p) { target = p; },
      setPressed(v) { pressed = v; },
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
        await closingPose(ctx);
        restoreRef.current();
        return;
      }
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
        className="demo-panel pointer-events-auto fixed rounded-xl bg-card/95 shadow-xl backdrop-blur-sm"
        style={{ left: 0, top: -400 }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <p
            role="status"
            aria-live="polite"
            className="min-w-[15rem] flex-1 text-pretty text-[15px] font-medium leading-snug sm:text-base"
          >
            {caption}
          </p>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="mr-1 flex gap-1" data-testid="demo-ticks" aria-hidden="true">
              {STEPS.map((step, i) => (
                <i
                  key={step.audio}
                  data-on={i <= index ? '' : undefined}
                  className={`h-1 rounded-full transition-all ${i === index ? 'w-6' : 'w-4'} ${i <= index ? 'bg-foreground' : 'bg-border'}`}
                />
              ))}
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
              className={`ml-1 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm ${done
                ? 'border-transparent bg-primary font-medium text-primary-foreground'
                : 'border-input bg-muted text-foreground'}`}
            >
              {done ? 'Start exploring' : 'Skip'}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed transition-opacity duration-300"
        style={{
          width: CURSOR_BOX,
          height: CURSOR_BOX,
          marginLeft: -hot.x,
          marginTop: -hot.y,
          transformOrigin: `${hot.x}px ${hot.y}px`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
          opacity: done ? 0 : 1,
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
