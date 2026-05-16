import type { MouseEventHandler } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';

interface HueHandleProps {
  hue: number;
  hueLabel: { x: number; y: number };
  onMouseDown: MouseEventHandler<HTMLDivElement>;
}

export default function HueHandle({ hue, hueLabel, onMouseDown }: HueHandleProps) {
  const rgb = hsbToRgb(hue, 100, 100);
  return (
    <div
      id="hue-handle"
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none shadow-md"
      style={{
        left: hueLabel.x,
        top: hueLabel.y,
        backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
        border: '2px solid var(--background)',
      }}
      onMouseDown={onMouseDown}
    >
      <span
        className="text-sm font-mono font-normal pointer-events-none"
        style={{ color: hue > 30 && hue < 200 ? '#000' : '#fff' }}
      >
        {hue}°
      </span>
    </div>
  );
}
