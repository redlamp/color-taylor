import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import { BL_BAR_X, BL_BAR_TOP, BL_BAR_WIDTH, BL_BAR_HEIGHT } from './hexConstants';

export default function BrightnessHandle({ hue, saturation, brightness, hsl, blMode, onMouseDown }) {
  const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
  const y = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
  const x = BL_BAR_X + BL_BAR_WIDTH + 4;

  const bgColor = rgbToHex(...Object.values(hsbToRgb(hue, saturation, brightness)));
  const textColor = (brightness > 60 && saturation < 50) || brightness > 70 ? '#000' : '#fff';

  return (
    <div
      id="bl-handle"
      className="absolute z-10 -translate-y-1/2 flex items-center cursor-pointer select-none"
      style={{ left: x, top: y }}
      onMouseDown={onMouseDown}
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
          {blValue}%
        </span>
      </div>
    </div>
  );
}
