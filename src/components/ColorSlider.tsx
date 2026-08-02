import { useRef, useCallback, memo } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import useDrag from '../hooks/useDrag';
import { HANDLE_SIZE, HANDLE_SHADOW } from '../utils/handleStyle';

interface ColorSliderProps {
  label: string;
  value: number;
  max: number;
  gradient: string;
  suffix?: string;
  wrap?: boolean;
  onChange: (v: number) => void;
  hideStepper?: boolean;
  /**
   * 'triangle' points at the track from below and never covers it - right when
   * a stepper beside the slider already shows the value. 'ring' sits on the
   * track and shows the colour itself, which is what you want when there is no
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

function ColorSlider({ label, value, max, gradient, suffix, wrap, onChange, hideStepper, handle = 'triangle', handleFill, round, stepper }: ColorSliderProps) {
  const stepperMode = stepper ?? (hideStepper ? 'none' : 'full');
  const trackRef = useRef<HTMLDivElement | null>(null);

  const clamp = (v: number) => Math.max(0, Math.min(max, v));

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;

    if (wrap) {
      const wrapped = ((rawX % rect.width) + rect.width) % rect.width;
      const newValue = Math.round((wrapped / rect.width) * max);
      onChange(Math.min(newValue, max));
    } else {
      const x = Math.max(0, Math.min(rawX, rect.width));
      const newValue = Math.round((x / rect.width) * max);
      onChange(Math.min(newValue, max));
    }
  }, [max, wrap, onChange]);

  const { startDrag } = useDrag(useCallback((e: PointerEvent) => {
    updateValue(e.clientX);
  }, [updateValue]));

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
  const sliderId = `slider-${label.toLowerCase()}`;

  return (
    <div id={sliderId} className={`flex gap-2 ${handle === 'ring' ? 'items-center' : 'items-start'}`}>
      <span id={`${sliderId}-label`} className={`w-3 shrink-0 text-right text-xs font-semibold text-muted-foreground ${handle === 'ring' ? '' : 'pt-0.5'}`}>
        {label}
      </span>

      {/* Track + arrow */}
      <div id={`${sliderId}-body`} className={`flex-1 min-w-0 relative ${handle === 'ring' ? '' : 'pb-3'}`}>
        <div
          id={`${sliderId}-track`}
          ref={trackRef}
          role="slider"
          aria-label={`${label} channel`}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={`h-4 w-full cursor-pointer select-none touch-none ${round ? 'rounded-full' : 'rounded'}`}
          style={{ background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onPointerDown={(e) => {
            startDrag();
            updateValue(e.clientX);
          }}
        />
        {handle === 'ring' ? (
          <div
            id={`${sliderId}-handle`}
            className="absolute top-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none rounded-full"
            style={{
              left: `${pct}%`,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              border: '3px solid #fff',
              boxShadow: HANDLE_SHADOW,
              background: handleFill ?? gradient,
              backgroundPosition: 'center',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              startDrag();
            }}
          />
        ) : (
          <div
            id={`${sliderId}-arrow`}
            className="absolute top-4 -translate-x-1/2 cursor-pointer px-1 py-0.5 touch-none"
            style={{ left: `${pct}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              startDrag();
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
              aria-label={`Decrease ${label}`}
            >
              <Minus className="!size-3" />
            </Button>
          )}
          <Input
            type="text"
            inputMode="numeric"
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
              aria-label={`Increase ${label}`}
            >
              <Plus className="!size-3" />
            </Button>
          )}
        </div>
        {suffix && (
          <span className="text-xs text-muted-foreground ml-1 w-3">{suffix}</span>
        )}
      </div>}
    </div>
  );
}

export default memo(ColorSlider);
