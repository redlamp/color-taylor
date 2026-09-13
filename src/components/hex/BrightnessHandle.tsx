import type { MouseEventHandler } from 'react';
import { hsbToRgb, rgbToHex, type HSL } from '../../utils/colorConversions';
import { BL_BAR_X, BL_BAR_TOP, BL_BAR_WIDTH, BL_BAR_HEIGHT, BL_PILL_OVERHANG, SIZE } from './hexConstants';

interface BrightnessHandleProps {
  hue: number;
  saturation: number;
  brightness: number;
  hsl: HSL;
  blMode: 'brightness' | 'lightness';
  /** The live viewBox height. Taller than HEX_SIZE while the saturation bar
   *  is on, and this pill's `top` is a percentage of it. */
  svgHeight: number;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
}

export default function BrightnessHandle({ hue, saturation, brightness, hsl, blMode, svgHeight, onMouseDown }: BrightnessHandleProps) {
  const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
  const y = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
  const x = BL_BAR_X + BL_BAR_WIDTH;

  const bgRgb = hsbToRgb(hue, saturation, brightness);
  const bgColor = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
  const textColor = (brightness > 60 && saturation < 50) || brightness > 70 ? '#000' : '#fff';

  // The pill is px-sized at a %-positioned left, so as the stage narrows its
  // right edge outruns the card. Slide the whole handle left by whatever it
  // overshoots the stage edge plus BL_PILL_OVERHANG, and not at all where it
  // fits. Written in CSS rather than measured: the stage is an inline-size
  // container, so its width is `100cqw` from here, and in `translate` a
  // percentage is the handle's own width - the text width the pill takes
  // varies between "0%" and "100%", and this tracks it without a resize
  // observer. The arrow rides along, so it lands on the bar, not away from it.
  const gutter = `${((SIZE - x) / SIZE) * 100}cqw + ${BL_PILL_OVERHANG}px`;

  return (
    <div
      id="bl-handle"
      className="absolute z-10 flex items-center cursor-pointer select-none touch-none"
      style={{
        left: `${(x / SIZE) * 100}%`,
        top: `${(y / svgHeight) * 100}%`,
        translate: `min(0px, calc(${gutter} - 100%)) -50%`,
      }}
      data-hold="bl"
      onPointerDown={onMouseDown}
    >
      {/* Left-pointing arrow */}
      <div
        className="w-0 h-0 -mr-1 relative z-10"
        style={{
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: `6px solid ${bgColor}`,
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
          {Math.round(blValue)}%
        </span>
      </div>
    </div>
  );
}
