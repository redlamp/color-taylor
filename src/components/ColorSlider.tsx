import { useRef, useCallback, useEffect, memo } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import useDrag from '../hooks/useDrag';
import { HANDLE_SIZE, HANDLE_SHADOW } from '../utils/handleStyle';

/**
 * Spoken names, keyed `${group}-${label}`.
 *
 * The single letter on the track is not enough on its own: B is Blue under RGB
 * and Brightness under HSB, and a screen reader reading both as "B channel"
 * gives no way to tell them apart.
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
  'alpha-a': 'Alpha',
};

interface ColorSliderProps {
  label: string;
  /**
   * Color model this slider belongs to. Namespaces the DOM id, because `label`
   * alone is not unique across models - RGB's B and HSB's B both rendered as
   * `slider-b`, which is invalid HTML the moment both groups are on screen (in
   * the app, that is always).
   */
  group: 'rgb' | 'hsb' | 'hsl' | 'alpha';
  value: number;
  max: number;
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
}

function ColorSlider({ label, group, value, max, gradient, suffix, wrap, onChange, hideStepper, handle = 'triangle', handleFill, round, stepper }: ColorSliderProps) {
  const stepperMode = stepper ?? (hideStepper ? 'none' : 'full');
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Figma keeps its thumb within the track rather than letting it hang off each
  // end. That means the usable span is inset by the handle's radius, and both
  // the rendered position and the click mapping have to use the same inset or
  // the handle lands somewhere other than where you pressed.
  const inset = handle === 'ring' ? HANDLE_SIZE / 2 : 0;


  const clamp = (v: number) => Math.max(0, Math.min(max, v));

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
    const newValue = Math.round((x / span) * max);
    onChange(Math.min(newValue, max));
    accum.current = newValue;
    lastX.current = clientX;
  }, [max, onChange, inset]);

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
    onChange(Math.round(accum.current) % max);
  }, [max, onChange, inset]);

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
  const beginRelative = useCallback((clientX: number) => {
    accum.current = value;
    lastX.current = clientX;
    locked.current = false;
    if (wrap) {
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
    const delta = Math.round((dx + dy) / 2);
    const newVal = Math.max(0, Math.min(max, stepperDragStart.current.value + delta));
    onChange(newVal);
  }, [max, onChange]));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num)) onChange(clamp(num));
  };

  const pct = (value / max) * 100;
  const channel = `${group}-${label.toLowerCase()}`;
  const sliderId = `slider-${channel}`;
  const channelName = CHANNEL_NAMES[channel] ?? label;

  return (
    <div id={sliderId} className={`flex gap-2 ${handle === 'ring' ? 'items-center' : 'items-start'}`}>
      <span id={`${sliderId}-label`} className={`w-3 shrink-0 text-right text-xs font-semibold text-muted-foreground ${handle === 'ring' ? '' : 'pt-0.5'}`}>
        {label}
      </span>

      {/* Track + arrow */}
      <div id={`${sliderId}-body`} className={`flex-1 min-w-0 ${handle === 'ring' ? '' : 'pb-3'}`}>
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
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={`h-4 w-full cursor-pointer select-none touch-none ${round ? 'rounded-full' : 'rounded'}`}
          style={{ background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onPointerDown={(e) => {
            // Pressing the track always jumps to that spot, wrapping or not -
            // what continues afterwards is what differs.
            updateValue(e.clientX);
            startDrag();
          }}
        />
        {handle === 'ring' ? (
          <div
            id={`${sliderId}-handle`}
            className="absolute top-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none rounded-full"
            style={{
              left: `calc(${inset}px + ${value / max} * (100% - ${inset * 2}px))`,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              border: '3px solid #fff',
              boxShadow: HANDLE_SHADOW,
              background: handleFill ?? gradient,
              backgroundPosition: 'center',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              beginRelative(e.clientX);
            }}
          />
        ) : (
          <div
            id={`${sliderId}-arrow`}
            className="absolute top-4 -translate-x-1/2 cursor-pointer px-1 py-0.5 touch-none"
            style={{ left: `${pct}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              beginRelative(e.clientX);
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
      {stepperMode !== 'none' && <div id={`${sliderId}-stepper`} className="flex items-center h-6 shrink-0">
        <div className={`flex items-center border border-input rounded-md overflow-hidden h-6 ${stepperMode === 'value' ? 'w-[46px]' : 'w-[84px]'}`}>
          {stepperMode === 'full' && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-5 rounded-none border-none"
              tabIndex={-1}
              onClick={() => onChange(clamp(value - 1))}
              aria-label={`Decrease ${channelName}`}
            >
              <Minus className="!size-3" />
            </Button>
          )}
          <Input
            type="text"
            inputMode="numeric"
            aria-label={channelName}
            value={value}
            onChange={handleInputChange}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 10 : 1;
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                e.preventDefault();
                onChange(clamp(value + step));
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange(clamp(value - step));
              }
            }}
            onMouseDown={(e) => {
              stepperDragStart.current = { x: e.clientX, y: e.clientY, value };
              startStepperDrag();
            }}
            className="h-6 w-full border-none rounded-none text-right text-xs px-1 font-mono tabular-nums focus-visible:ring-0 focus-visible:border-transparent cursor-ew-resize"
          />
          {stepperMode === 'full' && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-5 rounded-none border-none"
              tabIndex={-1}
              onClick={() => onChange(clamp(value + 1))}
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
