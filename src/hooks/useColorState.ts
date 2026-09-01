import { useState, useRef, useCallback, useMemo, useEffect, type MutableRefObject } from 'react';
import {
  hsbToRgb, rgbToHsb, rgbToHsl, hslToRgb, type HSB, type RGB, type HSL,
} from '../utils/colorConversions';
import { writeHslChannel, type HslOrigin } from '../utils/hslWrite';
import { HSB_TWEEN_MS, hsbAtProgress } from '../utils/colorTween';

/**
 * The colour state every host shares - the app, the Figma plugin, the deck.
 *
 * This is decision-hsb-canonical-rgb-override, implemented once. HSB is the
 * state. The exact RGB the user typed, dragged or was handed rides in a ref
 * beside it and is read in preference to the derived value, because an 8-bit
 * colour pushed through rounded HSB and back comes out different 86.4% of the
 * time. The three hosts used to carry their own copy of this; the deck's had
 * quietly lost the HSL gesture origin and drifted on every lightness drag.
 *
 * The contract the setters enforce, so a host cannot get it wrong:
 *
 * - **HSB-driven** writes (`setHsbClear`, a tween frame) null the override
 *   first, or stale RGB paints over the new colour.
 * - **RGB-driven** writes (`setRgb`, `setRgbChannel`) stash the exact RGB and
 *   derive HSB *from* it, so the number the user set is the number that shows.
 * - **HSL-driven** writes (`setHslChannel`) go through `writeHslChannel` with a
 *   gesture origin frozen at the first write and cleared at pointer up/down,
 *   and hold the requested HSL as *intent* for as long as it still converts to
 *   the colour on screen - see decision-hsl-gesture-origin.
 *
 * What stays outside, attached through the callbacks: the app's audio pulses
 * and undo stack, the plugin's alpha tween and Figma commit, the deck's
 * pause-on-interaction. Those are host behaviour, not colour state.
 */
export interface ColorStateOptions {
  initial: HSB;
  /** Fired for every user-driven write, before the state updates. */
  onEdit?: (next: HSB) => void;
  /** Tween lifecycle. `progress` is raw 0..1; ease it yourself to match the colour. */
  onTweenStart?: (from: HSB) => void;
  onTweenFrame?: (hsb: HSB, progress: number) => void;
  onTweenEnd?: () => void;
}

export interface ColorState {
  hsb: HSB;
  /** Read in preference to the derived value. The exact RGB, or the conversion. */
  rgb: RGB;
  /** The HSL to show: the live gesture's intent while it still matches, else derived. */
  hsl: HSL;
  hslIntent: HSL | null;

  /** Latest values, for handlers that must not close over a stale render. */
  hsbRef: MutableRefObject<HSB>;
  hslRef: MutableRefObject<HSL>;
  rgbOverride: MutableRefObject<RGB | null>;
  hslOrigin: MutableRefObject<HslOrigin | null>;
  /** The running tween's frame handle, for hosts that run their own alongside. */
  animRef: MutableRefObject<number | null>;

  /** Raw state setter. Prefer the typed writers below; this does not touch the override. */
  setHsb: React.Dispatch<React.SetStateAction<HSB>>;
  /** HSB-driven: nulls the override, then sets. */
  setHsbClear: (next: HSB | ((prev: HSB) => HSB)) => void;
  /**
   * Null the override without writing. For a host that then calls the raw
   * setter itself - to skip `onEdit`, say - so the ref is only ever mutated
   * here, by its owner.
   */
  clearOverride: () => void;
  /** RGB-driven: stashes the exact RGB and derives HSB from it. */
  setRgb: (rgb: RGB) => void;
  /** One channel of the exact RGB. */
  setRgbChannel: (channel: 'r' | 'g' | 'b', value: number) => void;
  /** One channel of HSL, through the gesture origin. */
  setHslChannel: (channel: 'h' | 's' | 'l', value: number) => void;
  setHslIntent: React.Dispatch<React.SetStateAction<HSL | null>>;

  /** Tween to a target with the shared duration, easing and hue wrap. */
  animateToHsb: (target: HSB) => void;
  /** Stop a running tween. Returns whether one was running. */
  cancelTween: () => boolean;
}

export function useColorState({ initial, onEdit, onTweenStart, onTweenFrame, onTweenEnd }: ColorStateOptions): ColorState {
  const [hsb, setHsb] = useState<HSB>(initial);
  const hsbRef = useRef(hsb);
  useEffect(() => { hsbRef.current = hsb; }, [hsb]);
  const rgbOverride = useRef<RGB | null>(null);

  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  // Reading the ref during render is the pattern, not an accident: the
  // override exists to avoid a derivation, and lifting it to state would double
  // every colour render to carry a value that only matters when it is set.
  // eslint-disable-next-line react-hooks/refs
  const rgb = rgbOverride.current || rgbFromHsb;

  /*
   * What the live HSL gesture asked for, shown in place of the derived value.
   *
   * The colour is 8-bit, so re-deriving HSL from it lands a point or two either
   * side of what was set, and re-deriving every frame turns that into visible
   * stutter in the two fields not being dragged. Only ever set by a gesture, and
   * only shown while converting it reproduces the current RGB exactly - so
   * anything else that moves the colour silently retires it, with no
   * invalidation to remember to write. Holding it past the gesture is what lets
   * a saturation set at L=0 or L=100 come back when lightness leaves the end:
   * CSS Color 4 calls it *powerless* there, not gone.
   */
  const [hslIntent, setHslIntent] = useState<HSL | null>(null);
  const derivedHsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => {
    if (hslIntent) {
      const c = hslToRgb(hslIntent.h, hslIntent.s, hslIntent.l);
      if (c.r === rgb.r && c.g === rgb.g && c.b === rgb.b) return hslIntent;
    }
    return derivedHsl;
  }, [hslIntent, derivedHsl, rgb.r, rgb.g, rgb.b]);
  const hslRef = useRef(hsl);
  useEffect(() => { hslRef.current = hsl; }, [hsl]);

  /*
   * The HSL a gesture began from. Seeded on the first write of a gesture and
   * cleared at both ends of a pointer press, so a drag holds the channels it is
   * not touching at what they were - drift of exactly zero rather than merely
   * small. Window-level so it clears even when the pointer lifts elsewhere.
   */
  const hslOrigin = useRef<HslOrigin | null>(null);
  useEffect(() => {
    const clear = () => { hslOrigin.current = null; };
    window.addEventListener('pointerdown', clear);
    window.addEventListener('pointerup', clear);
    document.documentElement.addEventListener('pointerleave', clear);
    return () => {
      window.removeEventListener('pointerdown', clear);
      window.removeEventListener('pointerup', clear);
      document.documentElement.removeEventListener('pointerleave', clear);
    };
  }, []);

  // The callbacks are read through refs so the writers and the tween stay
  // referentially stable while a host passes fresh closures every render.
  const edit = useRef(onEdit);
  const tweenStart = useRef(onTweenStart);
  const tweenFrame = useRef(onTweenFrame);
  const tweenEnd = useRef(onTweenEnd);
  useEffect(() => {
    edit.current = onEdit;
    tweenStart.current = onTweenStart;
    tweenFrame.current = onTweenFrame;
    tweenEnd.current = onTweenEnd;
  });

  const clearOverride = useCallback(() => { rgbOverride.current = null; }, []);

  const setHsbClear = useCallback((next: HSB | ((prev: HSB) => HSB)) => {
    rgbOverride.current = null;
    setHsb((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      edit.current?.(value);
      return value;
    });
  }, []);

  const setRgb = useCallback((next: RGB) => {
    rgbOverride.current = next;
    const asHsb = rgbToHsb(next.r, next.g, next.b);
    edit.current?.(asHsb);
    setHsb(asHsb);
  }, []);

  const setRgbChannel = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    setHsb((prev) => {
      const current = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const next = { ...current, [channel]: value };
      rgbOverride.current = next;
      const asHsb = rgbToHsb(next.r, next.g, next.b);
      edit.current?.(asHsb);
      return asHsb;
    });
  }, []);

  const setHslChannel = useCallback((channel: 'h' | 's' | 'l', value: number) => {
    setHsb((prev) => {
      if (!hslOrigin.current) {
        // Straight off what is on screen, so a remembered saturation carries
        // into the new gesture. Hue falls back to HSB only when the displayed
        // colour is achromatic and so has none of its own to give.
        const shown = hslRef.current;
        hslOrigin.current = { h: shown.s <= 0 ? prev.h : shown.h, s: shown.s, l: shown.l };
      }
      const { rgb: exact, hsb: next, hsl: intent } = writeHslChannel(channel, value, hslOrigin.current);
      rgbOverride.current = exact;
      setHslIntent(intent);
      edit.current?.(next);
      return next;
    });
  }, []);

  const animRef = useRef<number | null>(null);
  const cancelTween = useCallback(() => {
    if (animRef.current === null) return false;
    cancelAnimationFrame(animRef.current);
    animRef.current = null;
    return true;
  }, []);

  const animateToHsb = useCallback((target: HSB) => {
    rgbOverride.current = null;
    cancelTween();
    const from = { ...hsbRef.current };
    let start: number | null = null;
    tweenStart.current?.(from);
    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / HSB_TWEEN_MS, 1);
      // Duration, easing, hue wrap and rounding come from utils/colorTween, so
      // every host animates identically.
      const next = hsbAtProgress(from, target, progress);
      rgbOverride.current = null;
      setHsb(next);
      tweenFrame.current?.(next, progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
        tweenEnd.current?.();
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [cancelTween]);

  useEffect(() => () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); }, []);

  // rgb carries the render-time ref read from above; same intent, same disable.
  // eslint-disable-next-line react-hooks/refs
  return {
    hsb, rgb, hsl, hslIntent,
    hsbRef, hslRef, rgbOverride, hslOrigin, animRef,
    setHsb, setHsbClear, clearOverride, setRgb, setRgbChannel, setHslChannel, setHslIntent,
    animateToHsb, cancelTween,
  };
}
