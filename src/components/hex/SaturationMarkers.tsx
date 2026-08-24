import {
  SAT_BAR_LEFT, SAT_BAR_TOP, SAT_BAR_WIDTH, SAT_BAR_HEIGHT, SAT_ARROW_SIZE,
} from './hexConstants';

const MARKS = [
  { label: '0', value: 0, x: SAT_BAR_LEFT },
  { label: '50', value: 50, x: SAT_BAR_LEFT + SAT_BAR_WIDTH / 2 },
  { label: '100', value: 100, x: SAT_BAR_LEFT + SAT_BAR_WIDTH },
];

/** Top of the label row, just past the bar and its ticks. */
const gutterTopPct = (svgHeight: number) => ((SAT_BAR_TOP + SAT_BAR_HEIGHT + 6) / svgHeight) * 100;
/** The band above the arrow, which is where the axis title goes. */
const arrowTailTopPct = (svgHeight: number) => ((SAT_BAR_TOP - SAT_ARROW_SIZE - 2) / svgHeight) * 100;

export default function SaturationMarkers({
  extent,
  svgHeight,
  onPick,
}: {
  extent: number;
  svgHeight: number;
  onPick: (value: number) => void;
}) {
  const barLeftPct = (SAT_BAR_LEFT / extent) * 100;
  const GUTTER_TOP = gutterTopPct(svgHeight);
  const ARROW_TAIL_TOP = arrowTailTopPct(svgHeight);

  return (
    <>
      {/*
        Names the axis, left-aligned with the bar and sitting in the band
        between the hexagon and the arrow - the horizontal reading of where
        BrightnessMarkers puts its vertical title.

        bg-card for the same reason that one has it: the dashed connector runs
        from the arrow's tail up into the hexagon and sweeps this strip as the
        value changes, and a label over a rule should break the rule.
      */}
      <div
        className="absolute z-[6] select-none whitespace-nowrap bg-card px-1 text-sm leading-none text-muted-foreground pointer-events-none"
        style={{ left: `calc(${barLeftPct}% - 4px)`, top: `calc(${ARROW_TAIL_TOP}% - 18px)` }}
      >
        Saturation
      </div>

      {MARKS.map(({ label, value, x }) => (
        <button
          key={value}
          type="button"
          // z-[6] clears #hex-svg's z-[5]; a root <svg> takes the hit over its
          // whole box, so without it these are unclickable. Below the value
          // pill's z-10, which should stay on top of this row.
          //
          // No `font-mono`: this project's CSS groups `.font-mono` with
          // `code, pre` at `font-size: 1em`, which lands after the text-size
          // utilities and silently overrides them. tabular-nums instead.
          className="absolute z-[6] -translate-x-1/2 cursor-pointer select-none px-1 py-1 text-center text-sm leading-none tabular-nums text-muted-foreground hover:text-foreground"
          style={{ left: `${(x / extent) * 100}%`, top: `calc(${GUTTER_TOP}% - 4px)` }}
          aria-label={`Set saturation to ${label}`}
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
