import { BL_BAR_X, BL_BAR_TOP, BL_BAR_WIDTH, BL_BAR_HEIGHT, BL_ARROW_SIZE, SIZE } from './hexConstants';

const MARKS = [
  { label: '100', value: 100, y: BL_BAR_TOP },
  { label: '50', value: 50, y: BL_BAR_TOP + BL_BAR_HEIGHT / 2 },
  { label: '0', value: 0, y: BL_BAR_TOP + BL_BAR_HEIGHT },
];

/** Left edge of the number gutter, past the bar and its tick marks. */
const GUTTER_LEFT = ((BL_BAR_X + BL_BAR_WIDTH + 8) / SIZE) * 100;
/**
 * Where the vertical title's right edge goes: clear of the value arrow, not
 * just clear of the bar. The arrow hangs off the bar's left edge back to
 * BL_BAR_X - BL_ARROW_SIZE - 2 and rides up to the top at high values, so a
 * title set against the bar itself has its chip eat half the arrowhead. In the
 * percentage rather than as fixed px because the arrow is drawn in user units
 * and scales with the panel.
 */
const ARROW_TAIL_INSET = 100 - ((BL_BAR_X - BL_ARROW_SIZE - 2) / SIZE) * 100;
/** The bar's top edge, which the vertical title's top is aligned to. As a
 *  percentage of the live viewBox height, which grows with the saturation bar. */
const barTopPct = (svgHeight: number) => (BL_BAR_TOP / svgHeight) * 100;

/**
 * The brightness bar's furniture: its axis title, and the 100/50/0 labels -
 * both as HTML rather than SVG.
 *
 * The numbers used to be <text> inside the hexagon's viewBox, which means they
 * scaled with it - legible in the app's 614px column, unreadably small in a
 * narrow Figma panel. Positioned in percentages here so they track the bar
 * exactly while keeping a fixed type size. The tick lines stay in the SVG;
 * scaling those is fine, and desirable.
 */
export default function BrightnessMarkers({
  blMode,
  svgHeight,
  onPick,
}: {
  blMode: 'brightness' | 'lightness';
  svgHeight: number;
  onPick: (value: number) => void;
}) {
  const BAR_TOP = barTopPct(svgHeight);
  return (
    <>
      {/*
        Names what the bar drives, and which of the two models is live. Set
        vertically down the bar's left side, top-aligned with the bar and
        reading bottom-to-top - so the word ends where the bar begins.

        vertical-rl + rotate-180 rather than a plain rotate(-90deg): it gives
        the element a layout box that is already narrow and tall, so `right`
        and `top` place it directly. Rotating a horizontal box about its centre
        instead leaves the footprint offset by half the difference between its
        width and its height - which is to say, by however long the word is.

        bg-card because the dashed limit-hex connector ends at the bar's arrow,
        so it sweeps this strip as the value changes and crosses the word - most
        of the time up here, where the arrow sits at high values. The chip breaks
        the line instead, which is what a label over a rule should do. Nothing
        else reaches this far out: the hexagon and its circumscribed circle both
        stop at CENTER_X + RADIUS.

        px-1, not py-1, for the padding at the two ends of the word: Tailwind v4
        maps px/py to padding-inline/padding-block, which are logical, and this
        element's inline axis runs vertically. py-1 here pads the sides instead
        and widens the chip. The -4px then cancels that padding so the glyphs,
        not the invisible chip, are what lines up with the top of the bar.
      */}
      <div
        className="absolute z-[6] rotate-180 select-none whitespace-nowrap bg-card px-1 text-sm leading-none text-muted-foreground pointer-events-none [writing-mode:vertical-rl]"
        style={{ right: `calc(${ARROW_TAIL_INSET}% + 4px)`, top: `calc(${BAR_TOP}% - 4px)` }}
      >
        {blMode === 'brightness' ? 'Brightness' : 'Lightness'}
      </div>

      {MARKS.map(({ label, value, y }) => (
        <button
          key={value}
          type="button"
          // z-[6] clears #hex-svg's z-[5]. Without it these sit under the SVG,
          // which - being a root <svg>, not a shape - takes the hit over its
          // whole box, so all three labels were unclickable and did not even
          // light up on hover. Below the value pill's z-10 deliberately: the
          // pill is the one thing that should stay on top of this gutter.
          //
          // No `font-mono`: this project's CSS groups `.font-mono` with
          // `code, pre` and gives it `font-size: 1em`, which lands after the
          // text-size utilities and silently overrides them. tabular-nums gets
          // the digit alignment without the trap.
          // text-sm rather than the old text-[10px]: 10px made these read as
          // tick annotations instead of the targets they are. A named step also
          // lets figma.css catch them with its text-xs/sm/base rule, which an
          // arbitrary literal escaped - so the panel keeps its 11px chrome.
          className="absolute z-[6] -translate-y-1/2 cursor-pointer select-none px-1 py-1 text-left text-sm leading-none tabular-nums text-muted-foreground hover:text-foreground"
          // px-1/py-1 turn a 5x10px target into a 13x18px one; the -4px pulls
          // the padding back off the left so the digits stay where they were.
          style={{ left: `calc(${GUTTER_LEFT}% - 4px)`, top: `${(y / svgHeight) * 100}%` }}
          aria-label={`Set ${blMode} to ${label}`}
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
