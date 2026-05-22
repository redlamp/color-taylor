import type { PointerEventHandler } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import { SIZE, HEX_SIZE } from './hexConstants';

interface HueHandleProps {
  hue: number;
  hueLabel: { x: number; y: number };
  onMouseDown: PointerEventHandler<HTMLDivElement>;
}

export default function HueHandle({ hue, hueLabel, onMouseDown }: HueHandleProps) {
  const rgb = hsbToRgb(hue, 100, 100);
  return (
    <div
      id="hue-handle"
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none shadow-md touch-none"
      style={{
        left: `${(hueLabel.x / SIZE) * 100}%`,
        top: `${(hueLabel.y / HEX_SIZE) * 100}%`,
        backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
        border: '2px solid var(--background)',
      }}
      onPointerDown={onMouseDown}
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
