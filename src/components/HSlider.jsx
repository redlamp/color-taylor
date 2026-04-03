import { useRef, useCallback } from 'react';
import useDrag from '../hooks/useDrag';

export default function HSlider({ hue, onChange }) {
  const ref = useRef(null);

  const update = useCallback((clientY) => {
    const rect = ref.current.getBoundingClientRect();
    const rawY = clientY - rect.top;
    const wrapped = ((rawY % rect.height) + rect.height) % rect.height;
    const h = Math.round((wrapped / rect.height) * 360);
    onChange(Math.min(h, 360));
  }, [onChange]);

  const { startDrag } = useDrag(useCallback((e) => {
    update(e.clientY);
  }, [update]));

  const pct = (hue / 360) * 100;

  return (
    <div
      id="hue-bar-wrapper"
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={hue}
      tabIndex={0}
      className="relative w-8 shrink-0 self-stretch"
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 1;
        let h = hue;
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowDown':
            h = ((h - step) % 360 + 360) % 360;
            break;
          case 'ArrowRight':
          case 'ArrowUp':
            h = (h + step) % 360;
            break;
          default: return;
        }
        e.preventDefault();
        onChange(h);
      }}
    >
      <div
        id="hue-bar-arrow"
        className="absolute -translate-y-1/2 cursor-pointer py-0.5 px-0.5"
        style={{ top: `${pct}%`, left: -10 }}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag();
        }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '6px solid var(--foreground)',
          }}
        />
      </div>
      <div
        id="hue-bar"
        ref={ref}
        className="w-full h-full cursor-pointer select-none"
        style={{
          background: 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
        }}
        onMouseDown={(e) => {
          startDrag();
          update(e.clientY);
        }}
      />
    </div>
  );
}
