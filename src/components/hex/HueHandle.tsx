import type { PointerEventHandler } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import { HEX_HIGHLIGHT_COLOR } from '../../utils/highlight';

interface HueHandleProps {
  hue: number;
  /** The badge's centre in the stage, as CSS lengths. */
  at: { left: string; top: string };
  onMouseDown: PointerEventHandler<HTMLDivElement>;
  /**
   * Hue is being moved from somewhere else. The pill's own border turns white
   * rather than gaining a second ring outside it - a white ring around a
   * background-coloured border read as a dark gap inside the highlight.
   */
  lit?: boolean;
  /**
   * Draw the "Hue" caption above the badge.
   *
   * Off where the badge has left the field behind it. The caption sits a fixed
   * 18px above a badge whose own distance from the centre scales with the
   * card, so below about a 430px card it is inside the drawn hexagon at hue
   * 270 - up to the whole of it at 240, where there is no room to move it to
   * either. Hidden rather than unmounted: #hue-label is a stable target.
   */
  caption?: boolean;
}

/**
 * The badge is the hexagon's, but it is laid out by the stage.
 *
 * Fixed-size chrome on a shrinking hexagon: at low widths it reaches past the
 * field's own box and, near hue 0, as far as the brightness bar. Sitting at the
 * stage's level is what keeps it over the bar rather than under it, the same
 * reason the value pills sit where they do.
 */
export default function HueHandle({ hue, at, onMouseDown, lit = false, caption = true }: HueHandleProps) {
  const rgb = hsbToRgb(hue, 100, 100);
  return (<>
    {/* The axis label, above the badge, in the treatment the Saturation and
        Brightness labels use. No chip behind it: it rides over the field's
        corners, where a card-coloured block would read as a hole. */}
    <div
      id="hue-label"
      hidden={!caption}
      className="absolute z-10 -translate-x-1/2 -translate-y-full select-none whitespace-nowrap text-sm leading-none text-muted-foreground pointer-events-none"
      style={{ left: at.left, top: `calc(${at.top} - 18px)` }}
    >
      Hue
    </div>
    <div
      id="hue-handle"
      data-hold="hue"
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none touch-none motion-reduce:transition-none ${lit ? 'duration-150' : 'duration-500'} ease-out transition-[border-color,box-shadow]`}
      style={{
        left: at.left,
        top: at.top,
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
