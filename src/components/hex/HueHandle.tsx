import type { PointerEventHandler } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import { SIZE, HEX_SIZE } from './hexConstants';
import { HEX_HIGHLIGHT_COLOR } from '../../utils/highlight';

interface HueHandleProps {
  hue: number;
  hueLabel: { x: number; y: number };
  /** Horizontal extent of the coordinate space; narrows when the BL bar is off. */
  extent?: number;
  /** Vertical extent of the same space; grows when the saturation bar is on. */
  svgHeight?: number;
  onMouseDown: PointerEventHandler<HTMLDivElement>;
  /**
   * Hue is being moved from somewhere else. The pill's own border turns white
   * rather than gaining a second ring outside it - a white ring around a
   * background-coloured border read as a dark gap inside the highlight.
   */
  lit?: boolean;
}

export default function HueHandle({ hue, hueLabel, extent = SIZE, svgHeight = HEX_SIZE, onMouseDown, lit = false }: HueHandleProps) {
  const rgb = hsbToRgb(hue, 100, 100);
  return (<>
    {/* The axis label, above the badge, in the treatment the Saturation and
        Brightness labels use. No chip behind it: it rides over the field's
        corners, where a card-coloured block would read as a hole. */}
    <div
      id="hue-label"
      className="absolute z-10 -translate-x-1/2 -translate-y-full select-none whitespace-nowrap text-sm leading-none text-muted-foreground pointer-events-none"
      style={{ left: `${(hueLabel.x / extent) * 100}%`, top: `calc(${(hueLabel.y / svgHeight) * 100}% - 18px)` }}
    >
      Hue
    </div>
    <div
      id="hue-handle"
      data-hold="hue"
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none touch-none motion-reduce:transition-none ${lit ? 'duration-150' : 'duration-500'} ease-out transition-[border-color,box-shadow]`}
      style={{
        left: `${(hueLabel.x / extent) * 100}%`,
        top: `${(hueLabel.y / svgHeight) * 100}%`,
        backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
        border: `2px solid ${lit ? HEX_HIGHLIGHT_COLOR : 'var(--background)'}`,
        boxShadow: lit ? '0 1px 3px 1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.2)',
      }}
      onPointerDown={onMouseDown}
    >
      <span
        className="text-sm font-mono font-normal pointer-events-none"
        style={{ color: hue > 30 && hue < 200 ? '#000' : '#fff' }}
      >
        {Math.round(hue)}°
      </span>
    </div>
  </>);
}
