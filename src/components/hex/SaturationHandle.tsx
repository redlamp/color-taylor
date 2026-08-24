import type { MouseEventHandler } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import {
  SAT_BAR_LEFT, SAT_BAR_TOP, SAT_BAR_WIDTH, SAT_BAR_HEIGHT,
} from './hexConstants';

interface SaturationHandleProps {
  hue: number;
  saturation: number;
  brightness: number;
  extent: number;
  svgHeight: number;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
}

/**
 * BrightnessHandle turned a quarter turn: the value pill sits under the bar's
 * outboard edge with its arrow pointing back at the track, instead of beside it.
 *
 * Positioned in percentages of the SVG's own box, not in px, so it tracks the
 * bar through every panel width while its type stays a fixed size.
 */
export default function SaturationHandle({ hue, saturation, brightness, extent, svgHeight, onMouseDown }: SaturationHandleProps) {
  const x = SAT_BAR_LEFT + (saturation / 100) * SAT_BAR_WIDTH;
  const y = SAT_BAR_TOP + SAT_BAR_HEIGHT;

  const bgRgb = hsbToRgb(hue, saturation, brightness);
  const bgColor = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
  const textColor = (brightness > 60 && saturation < 50) || brightness > 70 ? '#000' : '#fff';

  return (
    <div
      id="sat-handle"
      className="absolute z-10 -translate-x-1/2 flex flex-col items-center cursor-pointer select-none touch-none"
      style={{ left: `${(x / extent) * 100}%`, top: `${(y / svgHeight) * 100}%` }}
      onPointerDown={onMouseDown}
    >
      {/* Up-pointing arrow */}
      <div
        className="w-0 h-0 -mb-1 relative z-10"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `6px solid ${bgColor}`,
        }}
      />
      {/* Pill */}
      <div
        className="flex items-center justify-center h-7 px-2 rounded-full shadow-md"
        style={{
          backgroundColor: bgColor,
          border: '2px solid var(--background)',
        }}
      >
        <span
          className="text-sm font-mono font-normal pointer-events-none whitespace-nowrap"
          style={{ color: textColor }}
        >
          {Math.round(saturation)}%
        </span>
      </div>
    </div>
  );
}
