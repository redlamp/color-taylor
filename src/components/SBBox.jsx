import { useRef, useEffect, useCallback } from 'react';

export default function SBBox({ hue, saturation, brightness, onChange }) {
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX, clientY) => {
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const b = Math.round((1 - y / rect.height) * 100);
    onChange(s, b);
  }, [onChange]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragging.current) update(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [update]);

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div
      id="sb-area"
      className="relative flex-1 aspect-square overflow-hidden cursor-crosshair select-none"
      ref={ref}
      style={{ backgroundColor: hueColor }}
      onMouseDown={(e) => {
        dragging.current = true;
        update(e.clientX, e.clientY);
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
