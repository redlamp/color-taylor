import { BL_BAR_X, BL_BAR_TOP, BL_BAR_WIDTH, BL_BAR_HEIGHT, SIZE, HEX_SIZE } from './hexConstants';

const MARKS = [
  { label: '100', value: 100, y: BL_BAR_TOP },
  { label: '50', value: 50, y: BL_BAR_TOP + BL_BAR_HEIGHT / 2 },
  { label: '0', value: 0, y: BL_BAR_TOP + BL_BAR_HEIGHT },
];

/**
 * The 100/50/0 labels beside the brightness bar, as HTML rather than SVG.
 *
 * They used to be <text> inside the hexagon's viewBox, which means they scaled
 * with it - legible in the app's 614px column, unreadably small in a narrow
 * Figma panel. Positioned in percentages here so they track the bar exactly
 * while keeping a fixed type size. The tick lines stay in the SVG; scaling
 * those is fine, and desirable.
 */
export default function BrightnessMarkers({ onPick }: { onPick: (value: number) => void }) {
  return (
    <>
      {MARKS.map(({ label, value, y }) => (
        <button
          key={value}
          type="button"
          // No `font-mono`: this project's CSS groups `.font-mono` with
          // `code, pre` and gives it `font-size: 1em`, which lands after the
          // text-size utilities and silently overrides them. tabular-nums gets
          // the digit alignment without the trap.
          className="absolute -translate-y-1/2 cursor-pointer select-none text-[10px] leading-none tabular-nums text-muted-foreground hover:text-foreground"
          style={{
            left: `${((BL_BAR_X + BL_BAR_WIDTH + 8) / SIZE) * 100}%`,
            top: `${(y / HEX_SIZE) * 100}%`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onPick(value);
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
