import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';

export default function HueHandle({ hue, hueLabel, onMouseDown }) {
  return (
    <div
      id="hue-handle"
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none shadow-md"
      style={{
        left: hueLabel.x,
        top: hueLabel.y,
        backgroundColor: rgbToHex(...Object.values(hsbToRgb(hue, 100, 100))),
        border: '2px solid var(--background)',
      }}
      onMouseDown={onMouseDown}
    >
      <span
        className="text-sm font-mono font-semibold pointer-events-none"
        style={{ color: hue > 30 && hue < 200 ? '#000' : '#fff' }}
      >
        {hue}°
      </span>
    </div>
  );
}
