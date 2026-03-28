import { useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

export default function ColorSlider({ label, value, max, gradient, suffix, wrap, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const clamp = (v) => Math.max(0, Math.min(max, v));

  const updateValue = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;

    if (wrap) {
      // Modulo wrap: going past either edge loops to the other side
      const wrapped = ((rawX % rect.width) + rect.width) % rect.width;
      const newValue = Math.round((wrapped / rect.width) * max);
      onChange(Math.min(newValue, max));
    } else {
      const x = Math.max(0, Math.min(rawX, rect.width));
      const newValue = Math.round((x / rect.width) * max);
      onChange(Math.min(newValue, max));
    }
  }, [max, wrap, onChange]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragging.current) updateValue(e.clientX);
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    const onMouseLeave = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [updateValue]);

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
      <div id={`${sliderId}-body`} className="flex-1 min-w-0 pb-3 relative">
        <div
          id={`${sliderId}-track`}
          ref={trackRef}
          className="h-4 w-full rounded cursor-pointer select-none"
          style={{ background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onMouseDown={(e) => {
            dragging.current = true;
            updateValue(e.clientX);
          }}
        />
        <div
          id={`${sliderId}-arrow`}
          className="absolute top-4 -translate-x-1/2 cursor-grab active:cursor-grabbing px-1 py-0.5"
          style={{ left: `${pct}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = true;
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
        <div className="flex items-center border border-input rounded-md overflow-hidden h-6 w-[72px]">
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-5 rounded-none border-none"
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
            className="h-6 w-full border-none rounded-none text-right text-xs px-1 font-mono tabular-nums focus-visible:ring-0 focus-visible:border-transparent"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-5 rounded-none border-none"
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
