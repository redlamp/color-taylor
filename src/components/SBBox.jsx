import { useRef, useCallback } from 'react';
import useDrag from '../hooks/useDrag';

export default function SBBox({ hue, saturation, brightness, onChange }) {
  const ref = useRef(null);

  const update = useCallback((clientX, clientY) => {
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const b = Math.round((1 - y / rect.height) * 100);
    onChange(s, b);
  }, [onChange]);

  const { startDrag } = useDrag(useCallback((e) => {
    update(e.clientX, e.clientY);
  }, [update]));

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div
      id="sb-area"
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${saturation}%, Brightness ${brightness}%`}
      tabIndex={0}
      className="relative w-[255px] h-[150px] shrink-0 overflow-hidden cursor-crosshair select-none"
      ref={ref}
      style={{ backgroundColor: hueColor }}
      onMouseDown={(e) => {
        startDrag();
        update(e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 5 : 1;
        let s = saturation;
        let b = brightness;
        switch (e.key) {
          case 'ArrowRight': s = Math.min(100, s + step); break;
          case 'ArrowLeft':  s = Math.max(0, s - step);   break;
          case 'ArrowUp':    b = Math.min(100, b + step);  break;
          case 'ArrowDown':  b = Math.max(0, b - step);    break;
          default: return;
        }
        e.preventDefault();
        onChange(s, b);
      }}
    >
      <div id="sb-white-gradient" className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      <div id="sb-black-gradient" className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      <div
        id="sb-cursor"
        className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
        style={{
          left: `${saturation}%`,
          top: `${100 - brightness}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}
