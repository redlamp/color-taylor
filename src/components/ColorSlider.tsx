import { useRef, useState, useCallback, useEffect, memo } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import useDrag from '../hooks/useDrag';
import { HANDLE_SIZE, HANDLE_SHADOW } from '../utils/handleStyle';
import { HIGHLIGHT_IN, HIGHLIGHT_OUT, CALLOUT_BOX_SHADOW } from '../utils/highlight';

/**
 * Spoken names, keyed `${group}-${label}`.
 *
 * The single letter on the track is not enough on its own: B is Blue under RGB
 * and Brightness under HSB, and a screen reader reading both as "B channel"
 * gives no way to tell them apart. Oklch makes that worse rather than better -
 * its L is Lightness in a third sense, neither HSB's B nor HSL's L - so its
 * three names are spelled out here with the rest.
 */
const CHANNEL_NAMES: Record<string, string> = {
  'rgb-r': 'Red',
  'rgb-g': 'Green',
  'rgb-b': 'Blue',
  'hsb-h': 'Hue',
  'hsb-s': 'Saturation',
  'hsb-b': 'Brightness',
  'hsl-h': 'Hue',
  'hsl-s': 'Saturation',
  'hsl-l': 'Lightness',
  'oklch-l': 'Lightness',
  'oklch-c': 'Chroma',
  // The Oklch lab's relative track: chroma as a share of what the gamut holds
  // at this L and H, which is the thing people mean by saturation. Without the
  // entry the lookup falls through to the letter and it reads as "S channel".
  'oklch-s': 'Saturation',
  'oklch-h': 'Hue',
  // A second Oklch bank on the same page - the Oklch lab's readback panel -
  // needs its own ids; the letters and names are the same.
  'lch-l': 'Lightness',
  'lch-c': 'Chroma',
  'lch-h': 'Hue',
  'oklab-l': 'Lightness',
  'oklab-a': 'Green to red',
  'oklab-b': 'Blue to yellow',
  'okhsl-h': 'Hue',
  'okhsl-s': 'Saturation',
  'okhsl-l': 'Lightness',
  'alpha-a': 'Alpha',
};

/**
 * Digits after the point in a step, so a caller giving `step={0.001}` normally
 * does not also have to give `decimals`. A step written in exponent notation
 * (1e-3) reads as 0 here and should pass `decimals` itself.
 */
function decimalsOf(step: number): number {
  const s = String(step);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

interface ColorSliderProps {
  label: string;
  /**
   * Color model this slider belongs to. Namespaces the DOM id, because `label`
   * alone is not unique across models - RGB's B and HSB's B both rendered as
   * `slider-b`, which is invalid HTML the moment both groups are on screen (in
   * the app, that is always).
   */
  group: 'rgb' | 'hsb' | 'hsl' | 'oklch' | 'lch' | 'oklab' | 'okhsl' | 'alpha';
  value: number;
  max: number;
  /**
   * Bottom of the range. Defaults to 0, which every channel but Oklab's a and
   * b lives at; those run about -0.4..0.4 and are the reason this exists. Not
   * honoured by `wrap`, whose domain is 0..max by definition.
   */
  min?: number;
  /**
   * Quantisation of the value, in the value's own units. Defaults to 1 - the
   * integer domain every channel but Oklch's lives in - and while it is 1 with
   * no `decimals` beside it, every path below takes the exact integer
   * arithmetic it always took, so RGB, HSB, HSL and alpha are untouched.
   *
   * Oklch is the reason this exists: L runs 0..1 and C about 0..0.4, so a
   * whole number is the entire channel. Both want `step={0.001}`.
   */
  step?: number;
  /**
   * Digits the stepper shows, and the precision a value is rounded to.
   * Defaults to however many `step` carries - 0.001 gives 3 - so a caller
   * normally names only the step.
   */
  decimals?: number;
  gradient: string;
  suffix?: string;
  /**
   * Cyclic domain (hue). Dragging past either end keeps going and wraps round
   * instead of stopping, and the drag tracks pointer *movement* rather than
   * pointer position, so it is not bounded by the width of the track.
   */
  wrap?: boolean;
  onChange: (v: number) => void;
  hideStepper?: boolean;
  /**
   * 'triangle' points at the track from below and never covers it - right when
   * a stepper beside the slider already shows the value. 'ring' sits on the
   * track and shows the color itself, which is what you want when there is no
   * numeric readout to fall back on.
   */
  handle?: 'triangle' | 'ring';
  /** Background for a ring handle's core. Defaults to the track's gradient. */
  handleFill?: string;
  /** Fully rounded track, the way Figma draws its sliders. */
  round?: boolean;
  /**
   * 'full' is the app's -/+ pair around an input. 'value' is the input alone,
   * for panels where the buttons cost more width than they earn. 'none' drops
   * the readout entirely. Defaults to hideStepper's meaning.
   */
  stepper?: 'full' | 'value' | 'none';
  /**
   * Use the fractional stepper's width whatever the step, so a column that
   * mixes integer and decimal sliders keeps one stepper column. Off, an
   * integer slider keeps the narrower pair it always had.
   */
  wideStepper?: boolean;
  /**
   * Another control is moving this value. Draws the shared keyline on the
   * track edge; the host decides when from useImpact. The slider never lights
   * for its own drag - that is the pointer's job.
   */
  lit?: boolean;
}

function ColorSlider({ label, group, value, max, min = 0, step = 1, decimals, gradient, suffix, wrap, onChange, hideStepper, handle = 'triangle', handleFill, round, stepper, wideStepper = false, lit = false }: ColorSliderProps) {
  const stepperMode = stepper ?? (hideStepper ? 'none' : 'full');
  const places = decimals ?? decimalsOf(step);
  /**
   * Is this anything other than the integer slider every caller before Oklch
   * asked for? Each arithmetic site below branches on this and takes its
   * original expression when it is false, so the existing sliders behave
   * identically rather than merely equivalently.
   */
  const stepped = step !== 1 || places !== 0;
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Figma keeps its thumb within the track rather than letting it hang off each
  // end. That means the usable span is inset by the handle's radius, and both
  // the rendered position and the click mapping have to use the same inset or
  // the handle lands somewhere other than where you pressed.
  const inset = handle === 'ring' ? HANDLE_SIZE / 2 : 0;


  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max]);
  const range = max - min;

  /**
   * Round to the step. On the integer default this *is* `Math.round`, which is
   * what stood at each of these sites before. The `toFixed` is only there to
   * cut the float dust a fractional step leaves - 0.123 - 0.001 is
   * 0.12200000000000001 otherwise, and that reaches the stepper's field.
   */
  const quantise = useCallback(
    (v: number) => (stepped ? Number((Math.round(v / step) * step).toFixed(places)) : Math.round(v)),
    [stepped, step, places],
  );

  /**
   * Unrounded value carried across a wrapping drag, plus the last pointer x.
   *
   * The float matters: rounding to whole degrees every frame and feeding that
   * back in would swallow any movement smaller than one step, so a slow drag
   * would stall completely. The accumulator keeps the fraction and only the
   * emitted value is rounded.
   */
  const accum = useRef(0);
  const lastX = useRef(0);
  const locked = useRef(false);

  /** Absolute mapping: where you pressed is the value. Bounded by the track. */
  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const span = Math.max(1, rect.width - inset * 2);
    const x = Math.max(0, Math.min(clientX - rect.left - inset, span));
    const newValue = clamp(quantise(min + (x / span) * range));
    onChange(newValue);
    accum.current = newValue;
    lastX.current = clientX;
  }, [min, range, onChange, inset, quantise, clamp]);

  /**
   * Relative mapping, for cyclic channels: the value follows how far the
   * pointer moved, not where it is. Run off the end of the track and it simply
   * keeps counting, wrapping through 0.
   *
   * Under pointer lock clientX stops changing, so movementX is the only signal;
   * unlocked, a clientX delta is the more reliable of the two (movementX is
   * scaled inconsistently across platforms at fractional DPI).
   */
  const advance = useCallback((e: PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const dx = locked.current ? e.movementX : e.clientX - lastX.current;
    lastX.current = e.clientX;
    if (!dx) return;
    const span = Math.max(1, rect.width - inset * 2);
    const next = accum.current + (dx / span) * max;
    // max, not max+1: hue's 0 and 360 are the same color, so the cycle is
    // max wide and landing on either end is landing on the same place.
    accum.current = ((next % max) + max) % max;
    onChange(quantise(accum.current) % max);
  }, [max, onChange, inset, quantise]);

  const { startDrag } = useDrag(useCallback((e: PointerEvent) => {
    if (wrap) advance(e);
    else updateValue(e.clientX);
  }, [wrap, advance, updateValue]));

  /**
   * Seed a drag that starts on the handle: no jump, just take the current value
   * as the origin. On a wrapping slider, ask for pointer lock so the drag is
   * not capped by the edge of the screen - Figma's plugin iframe may not carry
   * `allow="pointer-lock"`, so treat it as a bonus and carry on without it.
   */
  const beginRelative = useCallback((clientX: number, trusted = true) => {
    accum.current = value;
    lastX.current = clientX;
    locked.current = false;
    // Not for a synthetic press. A dispatched pointerdown arrives on a page
    // that already has the sticky activation pointer lock asks for, so the
    // lock would be granted: the real cursor would vanish, and `advance`
    // would then read a movementX that a synthetic event does not carry.
    // An untrusted press keeps the clientX path.
    if (wrap && trusted) {
      const el = trackRef.current;
      try {
        const req = el?.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions);
        void Promise.resolve(req).then(
          () => { locked.current = document.pointerLockElement === el; },
          () => { locked.current = false; },
        );
      } catch {
        locked.current = false;
      }
    }
    startDrag();
  }, [value, wrap, startDrag]);

  useEffect(() => {
    const release = () => {
      if (locked.current && document.pointerLockElement) document.exitPointerLock?.();
      locked.current = false;
    };
    window.addEventListener('pointerup', release);
    return () => window.removeEventListener('pointerup', release);
  }, []);

  // Stepper drag-to-adjust
  const stepperDragStart = useRef<{ x: number; y: number; value: number } | null>(null);
  const { startDrag: startStepperDrag } = useDrag(useCallback((e: PointerEvent) => {
    if (!stepperDragStart.current) return;
    const dx = e.clientX - stepperDragStart.current.x;
    const dy = stepperDragStart.current.y - e.clientY;
    // One pixel of drag is one step, whatever a step is worth.
    const delta = Math.round((dx + dy) / 2) * step;
    const next = stepperDragStart.current.value + delta;
    const newVal = clamp(stepped ? quantise(next) : next);
    onChange(newVal);
  }, [clamp, onChange, step, stepped, quantise]));

  /**
   * What a fractional field is showing mid-edit, or null when it is not being
   * typed into. "0." and "0.10" are both on the way to a value, and echoing
   * `value.toFixed(3)` back on every keystroke would rewrite them under the
   * cursor. An integer slider never sets this and takes the controlled path
   * it always had.
   */
  const [draft, setDraft] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (stepped) setDraft(raw);
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = stepped ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(num)) onChange(clamp(num));
  };

  /** One press of -/+, and the arrow keys' nudge. `steps`, not units. */
  const nudge = (steps: number) => {
    const next = value + steps * step;
    onChange(clamp(stepped ? quantise(next) : next));
  };

  const pct = ((value - min) / range) * 100;
  const channel = `${group}-${label.toLowerCase()}`;
  const sliderId = `slider-${channel}`;
  const channelName = CHANNEL_NAMES[channel] ?? label;

  // Beside a stepper the row is the stepper's h-8, and the track and letter
  // centre on it. The arrow marker needs no padding for its room then: it
  // hangs 16px under a track that starts 8px down, so it ends on the row's
  // bottom edge, inside the row. The rows used to be items-start with pb-3 on
  // the body, which put the track 8px above the stepper's centre.
  //
  // Without a stepper nothing sets that height, so the arrow keeps its pb-3
  // and the row stays top-aligned - that is the presentation's bare sliders.
  const topAligned = handle !== 'ring' && stepperMode === 'none';

  return (
    <div id={sliderId} className={`flex gap-2 ${topAligned ? 'items-start' : 'items-center'}`}>
      <span id={`${sliderId}-label`} className={`w-3 shrink-0 text-right text-xs font-semibold text-muted-foreground ${topAligned ? 'pt-0.5' : ''}`}>
        {label}
      </span>

      {/* Track + arrow */}
      <div id={`${sliderId}-body`} className={`flex-1 min-w-0 ${topAligned ? 'pb-3' : ''}`}>
        {/* The positioning context is this inner box, not the padded body.
            An absolutely positioned child resolves against the padding box,
            so with padding on the body the handle's 0-100% ran 10px wider
            than the track at each end - it rendered offset from the value
            you had just clicked. */}
        <div className="relative">
        <div
          id={`${sliderId}-track`}
          ref={trackRef}
          role="slider"
          aria-label={`${channelName} channel`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={stepped ? Number(value.toFixed(places)) : value}
          // Only on a fractional track. A screen reader reading "0.123" off
          // valuenow alone is fine; reading a raw 0.12299999999999999 is not.
          // Undefined on an integer slider, so the attribute is absent as
          // before.
          aria-valuetext={stepped ? value.toFixed(places) : undefined}
          data-hold={`sl:${channel}`}
          className={`h-4 w-full cursor-pointer select-none touch-none ${round ? 'rounded-full' : 'rounded'}`}
          style={{ background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onPointerDown={(e) => {
            // Pressing the track always jumps to that spot, wrapping or not -
            // what continues afterwards is what differs.
            updateValue(e.clientX);
            startDrag();
          }}
        />
        {/* The impact keyline, on the track's own edge with no gap - a gap
            read as a dark ring between track and line. Always mounted so the
            fade out has something to fade. */}
        <div
          id={`${sliderId}-keyline`}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 h-4 ${round ? 'rounded-full' : 'rounded'} ${lit ? HIGHLIGHT_IN : HIGHLIGHT_OUT}`}
          style={{ boxShadow: CALLOUT_BOX_SHADOW, opacity: lit ? 1 : 0 }}
        />
        {handle === 'ring' ? (
          <div
            id={`${sliderId}-handle`}
            data-hold={`sl:${channel}`}
            className="absolute top-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none rounded-full"
            style={{
              left: `calc(${inset}px + ${(value - min) / range} * (100% - ${inset * 2}px))`,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              border: '3px solid #fff',
              boxShadow: HANDLE_SHADOW,
              background: handleFill ?? gradient,
              backgroundPosition: 'center',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              beginRelative(e.clientX, e.isTrusted);
            }}
          />
        ) : (
          <div
            id={`${sliderId}-arrow`}
            data-hold={`sl:${channel}`}
            className="absolute top-4 -translate-x-1/2 cursor-pointer px-1 py-0.5 touch-none"
            style={{ left: `${pct}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              beginRelative(e.clientX, e.isTrusted);
            }}
          >
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '6px solid var(--foreground)',
              }}
            />
          </div>
        )}
        </div>
      </div>

      {/* Stepper */}
      {/* h-8, the app's one control height. This was h-6 while the segmented
          controls beside it were h-8, so a row mixed two sizes. Widths grow with
          it to keep the plus/minus targets from going narrow and tall. */}
      {/* Tagged like the track: a drag on the number field is still this
          slider being held, and a control never lights itself. */}
      {/* Below a 230px editor card - the same width at which the swatch moves
          above the SB box - the stepper leaves the row and the track takes the
          whole width. Hidden rather than unmounted: the ids and the `data-hold`
          stay in the DOM, so useImpact's keyline bookkeeping and anything else
          that queries a stepper by id behaves the same at every width, and the
          control is whole again the moment the card grows back.

          The variant resolves only against the container *named* `editor`, so
          the presentation, which renders ColorSlider outside any such
          container, is untouched. */}
      {stepperMode !== 'none' && <div id={`${sliderId}-stepper`} data-hold={`sl:${channel}`} className="flex items-center h-8 shrink-0 @max-[230px]/editor:hidden">
        {/* A fractional channel needs room for "0.623" where an integer one
            needed room for "255", and 92px leaves the field about 42: enough
            for three digits in this face, not for five. The wider pair is
            reached only through `step`/`decimals`, so every existing caller
            keeps the width it had. */}
        <div className={`flex items-center border border-input rounded-md overflow-hidden h-8 ${stepperMode === 'value' ? (stepped || wideStepper ? 'w-[68px]' : 'w-[52px]') : (stepped || wideStepper ? 'w-[108px]' : 'w-[92px]')}`}>
          {stepperMode === 'full' && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-6 rounded-none border-none"
              tabIndex={-1}
              onClick={() => nudge(-1)}
              aria-label={`Decrease ${channelName}`}
            >
              <Minus className="!size-3" />
            </Button>
          )}
          <Input
            type="text"
            inputMode={stepped ? 'decimal' : 'numeric'}
            aria-label={channelName}
            value={stepped ? (draft ?? value.toFixed(places)) : value}
            onChange={handleInputChange}
            onFocus={(e) => { if (stepped) setDraft(null); e.target.select(); }}
            onBlur={() => { if (stepped) setDraft(null); }}
            onKeyDown={(e) => {
              const steps = e.shiftKey ? 10 : 1;
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                e.preventDefault();
                nudge(steps);
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                e.preventDefault();
                nudge(-steps);
              }
            }}
            onMouseDown={(e) => {
              stepperDragStart.current = { x: e.clientX, y: e.clientY, value };
              startStepperDrag();
            }}
            className="h-8 w-full border-none rounded-none text-right text-sm px-1 font-mono tabular-nums focus-visible:ring-0 focus-visible:border-transparent cursor-ew-resize"
          />
          {stepperMode === 'full' && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-6 rounded-none border-none"
              tabIndex={-1}
              onClick={() => nudge(1)}
              aria-label={`Increase ${channelName}`}
            >
              <Plus className="!size-3" />
            </Button>
          )}
        </div>
        {/* An empty string still reserves the column, so a unitless row (R/G/B)
            keeps its track the same length as one that carries a unit. */}
        {suffix !== undefined && (
          <span className="text-xs text-muted-foreground ml-1 w-3">{suffix}</span>
        )}
      </div>}
    </div>
  );
}

export default memo(ColorSlider);
