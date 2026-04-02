import { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import useDrag from '../hooks/useDrag';

export default function ColorSlider({ label, value, max, gradient, suffix, wrap, onChange }) {
  const trackRef = useRef(null);

  const clamp = (v) => Math.max(0, Math.min(max, v));

  const updateValue = useCallback((clientX) => {
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

  const { dragging, startDrag } = useDrag(useCallback((e) => {
    updateValue(e.clientX);
  }, [updateValue]));

  // Stepper drag-to-adjust
  const stepperDragStart = useRef(null);
  const { startDrag: startStepperDrag } = useDrag(useCallback((e) => {
    if (!stepperDragStart.current) return;
    const dx = e.clientX - stepperDragStart.current.x;
    const dy = stepperDragStart.current.y - e.clientY;
    const delta = Math.round((dx + dy) / 2);
    const newVal = Math.max(0, Math.min(max, stepperDragStart.current.value + delta));
    onChange(newVal);
  }, [max, onChange]));

  const handleInputChange = (e) => {
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
    <div id={sliderId} className="flex items-start gap-2">
      <span id={`${sliderId}-label`} className="w-3 shrink-0 pt-0.5 text-right text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      {/* Track + arrow */}
      <div id={`${sliderId}-body`} className="w-[255px] shrink-0 pb-3 relative">
        <div
          id={`${sliderId}-track`}
          ref={trackRef}
          role="slider"
          aria-label={`${label} channel`}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className="h-4 w-full rounded cursor-pointer select-none"
          style={{ background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onMouseDown={(e) => {
            startDrag();
            updateValue(e.clientX);
          }}
        />
        <div
          id={`${sliderId}-arrow`}
          className="absolute top-4 -translate-x-1/2 cursor-pointer px-1 py-0.5"
          style={{ left: `${pct}%` }}
          onMouseDown={(e) => {
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
      </div>

      {/* Stepper */}
      <div id={`${sliderId}-stepper`} className="flex items-center h-6 shrink-0">
        <div className="flex items-center border border-input rounded-md overflow-hidden h-6 w-[84px]">
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
        </div>
        {suffix && (
          <span className="text-xs text-muted-foreground ml-1 w-3">{suffix}</span>
        )}
      </div>
    </div>
  );
}
