import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';
import { RADIUS, CENTER, BL_BAR_X, BL_BAR_TOP, BL_BAR_HEIGHT, BL_BAR_WIDTH, BL_ARROW_SIZE } from './hexConstants';

export default function BrightnessBar({ hue, saturation, brightness, hsl, blMode, blPointerDown, draggingBL, animateBLToValue }) {
  const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
  const arrowY = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;

  return (
    <>
      <defs>
        <linearGradient id="bl-gradient" x1="0" y1="0" x2="0" y2="1">
          {blMode === 'brightness' ? (
            <>
              <stop offset="0%" stopColor={rgbToHex(...Object.values(hsbToRgb(hue, saturation, 100)))} />
              <stop offset="100%" stopColor="#000" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#fff" />
              <stop offset="50%" stopColor={rgbToHex(...Object.values(hsbToRgb(hue, 100, 100)))} />
              <stop offset="100%" stopColor="#000" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect
        id="bl-bar"
        x={BL_BAR_X}
        y={BL_BAR_TOP}
        width={BL_BAR_WIDTH}
        height={BL_BAR_HEIGHT}
        fill="url(#bl-gradient)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
        className="cursor-pointer"
        onMouseDown={(e) => {
          e.stopPropagation();
          blPointerDown.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            time: Date.now(),
            isDragging: false,
          };
        }}
      />
      <polygon
        id="bl-bar-arrow"
        points={`${BL_BAR_X - 2},${arrowY} ${BL_BAR_X - BL_ARROW_SIZE - 2},${arrowY - 5} ${BL_BAR_X - BL_ARROW_SIZE - 2},${arrowY + 5}`}
        fill="var(--foreground)"
        className="cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          draggingBL.current = true;
        }}
      />

      {/* BL bar markers */}
      {[
        { label: '100', value: 100, y: BL_BAR_TOP },
        { label: '50', value: 50, y: BL_BAR_TOP + BL_BAR_HEIGHT / 2 },
        { label: '0', value: 0, y: BL_BAR_TOP + BL_BAR_HEIGHT },
      ].map(({ label, value, y }) => (
        <g
          key={value}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            animateBLToValue(value);
          }}
        >
          <line
            x1={BL_BAR_X + BL_BAR_WIDTH}
            y1={y}
            x2={BL_BAR_X + BL_BAR_WIDTH + 4}
            y2={y}
            stroke="var(--foreground)"
            strokeWidth={1}
            opacity={0.5}
          />
          <text
            x={BL_BAR_X + BL_BAR_WIDTH + 8}
            y={y}
            dominantBaseline="central"
            className="text-xs font-mono select-none"
            fill="var(--muted-foreground)"
          >
            {label}
          </text>
        </g>
      ))}
    </>
  );
}
