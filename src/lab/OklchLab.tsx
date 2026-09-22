/**
 * Oklch lab: one color, held as Oklch, shown every way at once.
 *
 * The question the page exists to answer is what an Oklch bank should do at
 * the edge of sRGB. Unlike RGB, HSB and HSL, Oklch can name colors the screen
 * cannot show - and the C channel is where that bites, because how far C may
 * go depends on the L and H beside it. The "Stop chroma at the gamut edge"
 * switch puts the two candidate answers side by side: a handle that stops at
 * the cusp, or a handle that runs the whole track while the page says plainly
 * that the color is out of reach.
 *
 * The Absolute/Relative switch asks a harder version of the same question:
 * whether C should be a number the user sets at all. Relative spends the track
 * on 0-100% of whatever fits at this L and H, so no gesture can leave the
 * gamut and neither the wash nor the hairline has anything to mark. What it
 * costs is that a percentage is not an amount: at L 0.70, 70% is C 0.083 at
 * cyan and C 0.225 at magenta, measured. The page shows that rather than
 * hiding it - see the landmark row at the foot of the bank.
 *
 * The Safe zone switch is the answer both of those were circling. It holds C
 * at or under the chroma *every* hue can carry at this L - the lowest valley
 * of oklch.com's Chroma graph - so L and C together name a zone, and inside
 * it hue is free: turn H, turn the hexagon, and the color never leaves sRGB
 * and never changes its perceived lightness or chroma. With it on, the
 * hexagon becomes a hue dial and keeps L and C where they were.
 *
 * Nothing here is wired to the picker. See lab/oklch.html for how to run it.
 */
import { useCallback, useState } from 'react';
import {
  oklchToRgb, rgbToOklch, rgbToHex, rgbToHsb, rgbToHsl, hsbToRgb, hslToRgb, oklchToOklab, oklabToOklch,
  type HSB, type Oklab, type Oklch, type RGB,
} from '@/utils/colorConversions';
import {
  maxChromaForLH, nearestInGamut, safeChromaAtL, lightnessBoundsAtC, lightnessRangeForCH, validHueSpans,
} from '@/utils/oklchGamut';
import { CENTER_X, CENTER_Y, RADIUS, FIELD_SIZE, hexPoints, hexEdgeDist, pointForColor } from '@/components/hex/hexConstants';
import HexCanvas from '@/components/hex/HexCanvas';
import {
  hueGradient, saturationGradient, brightnessGradient, hslHueGradient, hslSaturationGradient, lightnessGradient,
  redGradient, greenGradient, blueGradient, redChannelGradient, greenChannelGradient, blueChannelGradient,
  type ColorSpace,
} from '@/utils/sliderGradients';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ColorSlider from '@/components/ColorSlider';
import ColorHexagon from '@/components/ColorHexagon';
import HexInput from '@/components/HexInput';
import PreviewSwatch from '@/components/PreviewSwatch';
import HelpTip from './HelpTip';
import LabPanel from './LabPanel';
import {
  CHROMA_MAX, CEILING_INK, FLOOR_INK, OUT_OF_GAMUT_WASH, hairline, lightnessRamp, chromaRamp, hueRamp, saturationRamp,
  lightnessColors, chromaColors, hueColors, lightnessSourceColors, chromaSourceColors, hueSourceColors,
  OKLAB_MAX, oklabAColors, oklabBColors, oklabASourceColors, oklabBSourceColors,
  hueWash, oklabAxisRange, oklabAxisMarks,
} from './oklchRamps';

/** Oklch's L and C both step by a thousandth; a whole number is the channel. */
const FINE = 0.001;
/**
 * H is an angle and could be integral, but `rgbToOklch` hands back a float and
 * a tenth is what the CSS line spells, so the bank and the value you copy
 * agree. It is also the honest resolution: a degree of Oklch hue is a visible
 * step at high chroma.
 */
const HUE_STEP = 0.1;

/**
 * The largest chroma the bank can actually *hold* at this lightness and hue:
 * the analytic cusp, floored to the slider's own step.
 *
 * Not the cusp itself, for two reasons. The handle can only land on a step, so
 * a value between two of them is not reachable by any gesture. And a color
 * sitting exactly on the boundary reads as outside sRGB - `oklchToRgb` finds a
 * linear channel a float hair past 1 and says so, correctly - so clamping to
 * the cusp would leave the page announcing that the color it had just forced
 * into gamut was out of it. One step in is both reachable and true.
 *
 * The track's marker still sits on the cusp: that is where the gamut ends,
 * whatever the bank can address, and the difference is a quarter of a pixel.
 */
type Limit = (l: number, h: number) => number;

/** The gamut's own edge at this hue - the limit every mode used before Safe zone. */
const gamutLimit: Limit = (l, h) => maxChromaForLH(l, h);
/** The edge every hue shares at this L. Ignores H, which is the point. */
const safeLimit: Limit = (l) => safeChromaAtL(l);

const holdChroma = (c: number, l: number, h: number, limitAt: Limit) => Math.min(
  c,
  Number((Math.floor(limitAt(l, h) / FINE) * FINE).toFixed(3)),
);

/** How the middle track counts. See `switchMode` for what moving between them means. */
type ChromaMode = 'absolute' | 'relative';

/**
 * S counts in whole percent, where C counts in thousandths.
 *
 * The step is the mode's main practical argument, so it is worth the numbers.
 * Absolute C runs 0..0.400 in thousandths: 400 presses of + to cross it, and
 * the far half of those presses is usually spent outside the gamut, which is
 * how a stepper button becomes a control nobody uses. Relative S runs 0..100 in
 * ones: 100 presses to cross the whole *reachable* range, 10 with Shift held,
 * and every one of them lands on a color.
 *
 * A finer step would buy little. Measured over (L, h) on a 0.01 x 2deg grid,
 * one percent of S moves the rendered color by 2 bytes or less in 61% of
 * places and by 4 or less in 74%; the worst 5% - the steep run into a cusp at
 * high L, where absolute C moves up to 14 bytes per thousandth anyway - reach
 * 20. Halves would double the press count to buy resolution in a twentieth of
 * the space, and "70.5%" reads worse than "70%".
 */
const SAT_STEP = 1;

/**
 * The relative model's one equation: C = S/100 of whatever fits here.
 *
 * Floored to the bank's thousandth grid rather than rounded, for the two
 * reasons `holdChroma` gives - the CSS chip spells C to three places and has to
 * be exactly what the swatch is, and rounding is the one direction that can
 * push the top of the track a hair past the cusp.
 */
const chromaFromSat = (s: number, l: number, h: number, limitAt: Limit) => Number(
  (Math.floor(((s / 100) * limitAt(l, h)) / FINE) * FINE).toFixed(3),
);

/**
 * The other direction: what percentage an absolute C already is. Null where
 * there is no ratio to take - black and white hold no chroma at all, so 0/0 is
 * not an answer and the caller keeps the percentage it had.
 *
 * A C past the cusp reads as 100 rather than as the 130-odd percent it is. The
 * handle cannot show more than its track, and 100 is the true statement about
 * where it is: hard against the end.
 */
const satFromChroma = (c: number, l: number, h: number, limitAt: Limit): number | null => {
  const max = limitAt(l, h);
  if (!(max > 0)) return null;
  return Math.max(0, Math.min(100, Math.round((c / max) * 100)));
};

/**
 * The six corners of the sRGB cube, measured rather than quoted, and named the
 * way a person names them. They are where the gamut is widest and narrowest in
 * turn, so a single S read across them is the honest cost of the relative
 * model: at L 0.70 the cusp is C 0.120 at cyan and C 0.322 at magenta, so the
 * same 70% is C 0.083 there and C 0.225 here - nearly three times the color
 * for one number.
 */
const LANDMARKS: ReadonlyArray<{ name: string; h: number }> = [
  { name: 'Red', h: rgbToOklch(255, 0, 0).h },
  { name: 'Yellow', h: rgbToOklch(255, 255, 0).h },
  { name: 'Green', h: rgbToOklch(0, 255, 0).h },
  { name: 'Cyan', h: rgbToOklch(0, 255, 255).h },
  { name: 'Blue', h: rgbToOklch(0, 0, 255).h },
  { name: 'Magenta', h: rgbToOklch(255, 0, 255).h },
];

/** Where the page opens: Tailwind's Blue 500, an ordinary color to arrive on. */
const START: Oklch = rgbToOklch(59, 130, 246);

/**
 * Places to read Oklch from. Blue is the wiki note's own example - the sRGB
 * gamut is not star-shaped there - and the last one asks for a chroma no
 * screen can deliver, which is the state this page is for.
 */
const PRESETS: ReadonlyArray<{ name: string; oklch: Oklch }> = [
  { name: 'sRGB blue', oklch: rgbToOklch(0, 0, 255) },
  { name: 'Blue 500', oklch: START },
  { name: 'Mid gray', oklch: { l: 0.6, c: 0, h: 0 } },
  { name: 'Past the edge', oklch: { l: 0.65, c: 0.32, h: 150 } },
];

/**
 * A result worn as a chip of the color itself, the way the Equations panel's
 * `equations-hex` cell wears its hex. Both spellings sit in the same grid
 * cell, so the chip is always as wide as the wider of the two and the swap to
 * "Copied" moves nothing beside it.
 */
function CopyChip({ text, color, textColor }: { text: string; color: string; textColor: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => { /* clipboard blocked or unavailable: leave the text as is, no error UI */ });
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            aria-label={`Copy ${text}`}
            className="inline-grid cursor-pointer place-items-center whitespace-nowrap rounded border-0 px-2 py-1 text-center font-mono tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            style={{ backgroundColor: color, color: textColor }}
          >
            <span style={{ gridArea: '1 / 1' }} className={copied ? 'invisible' : undefined}>{text}</span>
            <span style={{ gridArea: '1 / 1' }} className={copied ? undefined : 'invisible'}>Copied</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4} className="text-base font-semibold">
          Click to copy
        </TooltipContent>
      </Tooltip>
      {copied && <span aria-live="polite" className="sr-only">Copied</span>}
    </>
  );
}

/**
 * One chroma setting, read across the six landmark hues at the current L.
 *
 * This is the page's counterweight, and it earns its space in either mode
 * because each mode pays for what it holds fixed. Relative holds the
 * percentage: every swatch exists, and no two of them carry the same amount of
 * color. Absolute holds the number: the swatches that exist are strictly
 * comparable, and the rest are shown as the nearest color that does exist at
 * that hue, with the L and C it took to get there. Neither is free, and the
 * row is where you see which price you are paying.
 *
 * Each swatch is a button on its own hue, so the row is also the fastest way to
 * put the claim to the test: click cyan, click magenta, watch C.
 */
function LandmarkRow({ l, chromaAt, onPick }: {
  l: number;
  /** The chroma this mode would use at a hue - S of what fits, or the flat C. */
  chromaAt: (h: number) => number;
  onPick: (h: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {LANDMARKS.map(({ name, h }) => {
        const c = chromaAt(h);
        const { inGamut } = oklchToRgb(l, c, h);
        // Where the setting names no color at this hue, show the nearest one
        // that exists - L and C both move, H does not - rather than the
        // clamped bytes under a wash. A dimmed swatch reads as a dimmer color,
        // which is a claim about the hue that is not true; the nearest real
        // color is at least a color.
        const shown = inGamut ? { l, c } : nearestInGamut(l, c, h);
        const { rgb } = oklchToRgb(shown.l, shown.c, h);
        const swatch = rgbToHex(rgb.r, rgb.g, rgb.b);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onPick(h)}
            aria-label={`${name}, hue ${h.toFixed(1)}, chroma ${c.toFixed(3)}${inGamut ? '' : ` - outside sRGB, shown as L ${shown.l.toFixed(3)} C ${shown.c.toFixed(3)}`}`}
            className="flex cursor-pointer flex-col gap-1 rounded border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden="true"
              className="block h-10 w-full rounded border border-border"
              style={{ background: swatch }}
            />
            <span className="truncate">{name}</span>
            {/* The swatch's own C and L, always both, so the row's height
                never changes. A value the pin moved reads red: it is not the
                setting any more, and the red says which one gave way. */}
            <span className={`font-mono tabular-nums ${shown.c === c ? 'text-muted-foreground' : 'text-destructive'}`}>
              C {shown.c.toFixed(3)}
            </span>
            <span className={`font-mono tabular-nums ${shown.l === l ? 'text-muted-foreground' : 'text-destructive'}`}>
              L {shown.l.toFixed(3)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The slider panel's groups, the app's Color Editor set plus the Oklch and Oklab banks. */
type SliderGroup = 'RGB' | 'HSB' | 'HSL' | 'OKLCH' | 'OKLAB';
const SLIDER_GROUPS: ReadonlyArray<SliderGroup> = ['RGB', 'HSB', 'HSL', 'OKLCH', 'OKLAB'];

/**
 * oklch.com's Hue graph on the hexagon: hue as the field's own angle, L as
 * radius, scaled to the hexagon's edge so L 1 is the rim and L 0 the center.
 *
 * At each hue there is a lightest color with the current chroma and a darkest
 * one - the top and bottom edges of the graph's colored band. The red loop
 * joins the lightest ones and the blue loop the darkest, each drawn at its
 * color's real HSB hue angle and at its Oklch L along that ray. Both loops are
 * lightness, so red is always outside blue, and the band between them narrows
 * as C rises and breaks at hues that cannot hold the chroma - the same
 * behavior as the red and blue marks on the L track.
 *
 * Radius is not the field's own coordinate, which is saturation. Plotting by
 * position on the field was tried and put the lightest color at its saturation
 * and the darkest at its brightness, two different quantities that crossed
 * freely; the hexagon has no lightness axis, so this is a graph laid over it,
 * not a map of it. The bars beside the field carry the exact positions.
 *
 * The two dots are the current hue on each loop - the colors the bar marks
 * beside the field stand for - so a hue change moves something here too.
 * Takes primitives so the compiler memoises the loops on C and the dots on H.
 */
function LightnessLoops({ c, h }: { c: number; h: number }) {
  const STEP = 3;
  const at = (l: number, h: number) => {
    // The color's own hue angle on the field, from where the picker would put
    // it; then L along that ray, out to the hexagon's edge at L 1.
    const { rgb } = oklchToRgb(l, c, h);
    const p = pointForColor(rgb, 'brightness', 1);
    const angle = Math.atan2(CENTER_Y - p.y, p.x - CENTER_X);
    const r = l * hexEdgeDist(angle, RADIUS);
    return `${(CENTER_X + r * Math.cos(angle)).toFixed(1)},${(CENTER_Y - r * Math.sin(angle)).toFixed(1)}`;
  };
  let ceiling = '';
  let floor = '';
  let pen = false;
  for (let deg = 0; deg <= 360; deg += STEP) {
    const range = lightnessRangeForCH(c, deg % 360);
    if (!range) { pen = false; continue; }
    const cmd = pen ? 'L' : 'M';
    ceiling += ` ${cmd} ${at(range.max, deg % 360)}`;
    floor += ` ${cmd} ${at(range.min, deg % 360)}`;
    pen = true;
  }
  // The current hue on each loop: the two colors the bar marks stand for.
  const here = lightnessRangeForCH(c, h);
  const dot = (l: number, ink: string) => {
    const [x, y] = at(l, h).split(',').map(Number);
    return (
      <>
        <circle cx={x} cy={y} r={5.5} fill={ink} stroke="#000" strokeOpacity={0.6} strokeWidth={3} />
        <circle cx={x} cy={y} r={5.5} fill={ink} stroke="#fff" strokeWidth={1.5} />
      </>
    );
  };
  return (
    <>
      <path d={ceiling} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={5} strokeLinejoin="round" />
      <path d={floor} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={5} strokeLinejoin="round" />
      <path d={ceiling} fill="none" stroke={CEILING_INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={floor} fill="none" stroke={FLOOR_INK} strokeWidth={2.5} strokeLinejoin="round" />
      {here && dot(here.max, CEILING_INK)}
      {here && dot(here.min, FLOOR_INK)}
    </>
  );
}

/**
 * The hexagon under the landmark row: the field itself at the current color's
 * brightness, the current color on it with panel 1's own marker, and the six
 * landmark colors each on its hue ray. The picker's `pointForColor` places a
 * color at its own brightness, so a pinned yellow - lighter and less chromatic
 * than the setting - slides inward along the Y ray, and a magenta that holds
 * the full chroma sits out near the rim. Watching the six move as C and L
 * change is the whole point: it shows what "the same setting" does to a hue's
 * position on the hexagon, which the swatches alone cannot.
 *
 * A pinned color's ring is red, matching its red figures in the row above.
 * Same colors as the row, computed the same way, so the two cannot disagree.
 */
function LandmarkMap({ l, chromaAt, rgb, colorSpace }: {
  l: number; chromaAt: (h: number) => number; rgb: RGB; colorSpace: ColorSpace;
}) {
  const dots = LANDMARKS.map(({ name, h }) => {
    const c = chromaAt(h);
    const { inGamut } = oklchToRgb(l, c, h);
    const shown = inGamut ? { l, c } : nearestInGamut(l, c, h);
    const { rgb: own } = oklchToRgb(shown.l, shown.c, h);
    const at = pointForColor(own, 'brightness', 1);
    return { name, inGamut, ...at };
  });
  const here = pointForColor(rgb, 'brightness', 1);
  const brightness = rgbToHsb(rgb.r, rgb.g, rgb.b).b;
  /*
   * The field is a FIELD_SIZE square with the hexagon off-center in it, and a
   * square box would carry that dead margin. So the box is the hexagon's own
   * bounding box plus a hair for the rings at the rim, and the canvas is
   * oversized and offset inside it so that exactly that window shows. The SVG
   * takes the same window as its viewBox, so field coordinates still land.
   */
  const pad = 12;
  const halfH = RADIUS * Math.sin(Math.PI / 3);
  const win = { x: CENTER_X - RADIUS - pad, y: CENTER_Y - halfH - pad, w: (RADIUS + pad) * 2, h: (halfH + pad) * 2 };
  return (
    <div
      // Sized by the height the row leaves, not by the panel's width, so the
      // page fits the viewport rather than growing to hold the map; the width
      // follows from the aspect ratio. Capped at the width panel 1's hexagon
      // has at its stage's max width - 2 * RADIUS of the stage's EXTENT,
      // scaled to 500px - and floored so a short viewport still shows a map.
      className="relative h-full min-h-[160px] w-auto max-w-[356px] overflow-hidden"
      style={{ aspectRatio: `${win.w} / ${win.h}` }}
    >
      <div
        className="absolute"
        style={{
          width: `${(FIELD_SIZE / win.w) * 100}%`,
          height: `${(FIELD_SIZE / win.h) * 100}%`,
          left: `${(-win.x / win.w) * 100}%`,
          top: `${(-win.y / win.h) * 100}%`,
        }}
      >
        <HexCanvas id="landmark-canvas" brightness={brightness} colorSpace={colorSpace} />
      </div>
      <svg
        viewBox={`${win.x} ${win.y} ${win.w} ${win.h}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Where the six landmark colors sit on the hexagon: ${dots.map((d) => `${d.name} at ${Math.round(Math.hypot(d.x - CENTER_X, d.y - CENTER_Y) / RADIUS * 100)}%${d.inGamut ? '' : ', pinned'}`).join(', ')}`}
      >
        <polygon points={hexPoints(CENTER_X, CENTER_Y, RADIUS)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        {/* The six hue rays, center to corner. */}
        {LANDMARKS.map((_, i) => {
          const a = (i * Math.PI) / 3;
          return (
            <line
              key={i}
              x1={CENTER_X} y1={CENTER_Y}
              x2={CENTER_X + RADIUS * Math.cos(a)} y2={CENTER_Y - RADIUS * Math.sin(a)}
              stroke="#000" strokeOpacity={0.25} strokeWidth={1.5}
            />
          );
        })}
        {/* Rings, not filled dots. A landmark color is placed at its own
            brightness while the field is painted at the current one, so a
            fill would sit on paint that is not that color and read as a
            mismatch. The ring leaves the field to speak, and the swatch row
            above carries the color itself. */}
        {dots.map((d) => (
          <g key={d.name}>
            <circle cx={d.x} cy={d.y} r={9} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={4} />
            <circle cx={d.x} cy={d.y} r={9} fill="none" stroke={d.inGamut ? '#fff' : CEILING_INK} strokeWidth={2} />
          </g>
        ))}
        {/* The current color, with panel 1's marker. */}
        <circle cx={here.x} cy={here.y} r={5} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={4} />
        <circle cx={here.x} cy={here.y} r={5} fill="none" stroke="#fff" strokeWidth={2} />
      </svg>
    </div>
  );
}

export default function OklchLab() {
  /**
   * The page's color, held as Oklch and as nothing else.
   *
   * The app's `useColorState` is deliberately not used here. It keeps HSB
   * canonical with an exact-RGB override ref, and routes HSL writes through a
   * hue frozen at the start of the gesture - two contracts every caller has to
   * honour (wiki/notes/decision-hsb-canonical-rgb-override.md). This lab is
   * asking what an Oklch bank feels like when it is the only source of truth,
   * so L, C and H are the state and RGB and HSB are derived from them on every
   * render. Nothing here writes back into the picker, so neither contract is
   * at risk from the shortcut.
   */
  const [oklch, setOklch] = useState<Oklch>(() => START);
  /**
   * How the middle track counts - and only that. C stays the state in both
   * modes, because C is what the page publishes; relative mode is a second way
   * of setting it, not a second thing to remember.
   */
  const [mode, setMode] = useState<ChromaMode>('absolute');
  /**
   * The relative track's position, 0..100, and in relative mode the quantity
   * that actually survives a move: L and H recompute C from *this*, which is
   * the whole reason the mode cannot leave the gamut. Kept up to date in
   * absolute mode too, so the switch has nothing to work out on arrival.
   */
  const [sat, setSat] = useState<number>(() => satFromChroma(START.c, START.l, START.h, gamutLimit) ?? 0);
  /** The open design question, as a switch. See the file comment. */
  const [hold, setHold] = useState(false);
  /**
   * Safe zone: C is held at or under the chroma every hue can carry at this
   * L, so hue is free. Implies hold. Works in both chroma modes - in Relative,
   * 100% becomes the safe edge rather than this hue's.
   */
  const [safe, setSafe] = useState(false);
  /** The hexagon's own two host settings, which it expects to be controlled. */
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  /**
   * The readback bars' colors, the picker's own Source / Mixed pair. Mixed
   * draws the color a change to that channel would land on; Source draws the
   * channel by itself, the same ramps the picker's toolbar droplet switches
   * to, extended to Oklch.
   */
  const [blend, setBlend] = useState(true);
  /**
   * Which slider groups panel 2 shows - the app's Color Editor toggle, with
   * the Oklch bank as a fourth. HSL starts off, as it does in the app.
   */
  const [groups, setGroups] = useState<ReadonlyArray<SliderGroup>>(['RGB', 'HSB', 'OKLCH']);
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');

  /** Which edge C is measured against: the gamut's at this hue, or the one every hue shares. */
  const limitAt: Limit = safe ? safeLimit : gamutLimit;
  const clamp = hold || safe;
  const limit = limitAt(oklch.l, oklch.h);
  /**
   * The Hue graph's two lines, for the L track: the L band every hue holds at
   * this C. And the hues this L and C hold, for the H track and the hexagon.
   */
  const lBounds = lightnessBoundsAtC(oklch.c);
  const hueSpans = validHueSpans(oklch.l, oklch.c);
  /**
   * The lightest and darkest color with this chroma at this hue, as HSB, for
   * the saturation and brightness bars: red at the lightest, blue at the
   * darkest, the same pair the loops draw. The lightest always has a channel
   * at 255, so its brightness mark sits at 100 and its saturation mark says
   * how pale a light color at this chroma has to be; the darkest always has a
   * channel at 0, so its saturation mark sits at 100 and its brightness mark
   * says how dark this hue can go and still carry the chroma. Nothing when
   * the hue cannot hold the chroma at all.
   */
  const lab = oklchToOklab(oklch.l, oklch.c, oklch.h);
  const lRange = lightnessRangeForCH(oklch.c, oklch.h);
  const edgeHsb = lRange
    ? {
        top: (() => { const { rgb: r } = oklchToRgb(lRange.max, oklch.c, oklch.h); return rgbToHsb(r.r, r.g, r.b); })(),
        bottom: (() => { const { rgb: r } = oklchToRgb(lRange.min, oklch.c, oklch.h); return rgbToHsb(r.r, r.g, r.b); })(),
      }
    : null;
  const satMarks = edgeHsb ? [{ at: edgeHsb.top.s, ink: CEILING_INK }, { at: edgeHsb.bottom.s, ink: FLOOR_INK }] : [];
  const briMarks = edgeHsb ? [{ at: edgeHsb.top.b, ink: CEILING_INK }, { at: edgeHsb.bottom.b, ink: FLOOR_INK }] : [];
  /** The same two colors read as HSL, for the HSL S and L rows. */
  const edgeHsl = lRange
    ? {
        top: (() => { const { rgb: r } = oklchToRgb(lRange.max, oklch.c, oklch.h); return rgbToHsl(r.r, r.g, r.b); })(),
        bottom: (() => { const { rgb: r } = oklchToRgb(lRange.min, oklch.c, oklch.h); return rgbToHsl(r.r, r.g, r.b); })(),
      }
    : null;
  const hslSatMarks = edgeHsl ? [{ at: edgeHsl.top.s, ink: CEILING_INK }, { at: edgeHsl.bottom.s, ink: FLOOR_INK }] : [];
  const hslLightMarks = edgeHsl ? [{ at: edgeHsl.top.l, ink: CEILING_INK }, { at: edgeHsl.bottom.l, ink: FLOOR_INK }] : [];
  /** Panel 4's L and C marks, for panel 2's OKLCH and OKLAB L rows: fractions of the track. */
  const oklchLMarks = Number.isFinite(lBounds.floor) && Number.isFinite(lBounds.ceiling) && lBounds.floor <= lBounds.ceiling
    ? [{ at: lBounds.ceiling * 100, ink: CEILING_INK }, { at: lBounds.floor * 100, ink: FLOOR_INK }]
    : [];
  const hueEdge = maxChromaForLH(oklch.l, oklch.h);
  const oklchCMarks = [
    { at: (safeChromaAtL(oklch.l) / CHROMA_MAX) * 100, ink: CEILING_INK },
    { at: (hueEdge / CHROMA_MAX) * 100, ink: 'var(--foreground)' },
  ];
  const withMarks = (gradient: string, marks: ReadonlyArray<{ at: number; ink: string }>) =>
    [...marks.map((m) => hairline(m.at / 100, m.ink)), gradient].join(', ');
  const withLayers = (gradient: string, layers: ReadonlyArray<string | null>) =>
    [...layers.filter((x): x is string => x !== null), gradient].join(', ');
  /** The Oklab axes' in-gamut runs at this L and the other axis. */
  const labA = oklabAxisRange(lab.l, lab.b, 'a');
  const labB = oklabAxisRange(lab.l, lab.a, 'b');
  const relative = mode === 'relative';

  /**
   * What C becomes when L or H moves the cusp out from under it. Every path
   * that changes L or H goes through this, and it is the whole difference
   * between the two modes:
   *
   *   relative - C is re-derived from the percentage, so the handle keeps its
   *              *share* and the color stays inside the gamut by construction.
   *   absolute - C is a number the user set, so it either gets dragged back to
   *              the edge or is left stranded past it, as the switch says.
   */
  const reChroma = useCallback((held: number, l: number, h: number) => {
    if (mode === 'relative') return chromaFromSat(sat, l, h, limitAt);
    return clamp ? holdChroma(held, l, h, limitAt) : held;
  }, [mode, sat, clamp, limitAt]);

  const setL = useCallback((l: number) => setOklch((p) => (
    { ...p, l, c: reChroma(p.c, l, p.h) }
  )), [reChroma]);
  const setC = useCallback((c: number) => setOklch((p) => (
    { ...p, c: clamp ? holdChroma(c, p.l, p.h, limitAt) : c }
  )), [clamp, limitAt]);
  const setH = useCallback((h: number) => setOklch((p) => (
    { ...p, h, c: reChroma(p.c, p.l, h) }
  )), [reChroma]);

  /** The relative track. S is the state; C is what it resolves to, right now. */
  const setSaturation = useCallback((s: number) => {
    setSat(s);
    setOklch((p) => ({ ...p, c: chromaFromSat(s, p.l, p.h, limitAt) }));
  }, [limitAt]);

  const toggleHold = useCallback(() => {
    setHold((on) => !on);
    // Turning it on pulls a stranded C back to the cusp. Turning it off is a
    // no-op here, since C is already inside the limit.
    setOklch((p) => ({ ...p, c: holdChroma(p.c, p.l, p.h, limitAt) }));
  }, [limitAt]);

  /**
   * Turning Safe zone on pulls C under the safe edge at once and re-reads S
   * against it, so the relative handle is a share of the new edge. Turning it
   * off leaves the color where it is - it is inside every limit already - and
   * re-reads S against this hue's own edge.
   */
  const toggleSafe = useCallback(() => {
    const next = !safe;
    const nextLimit: Limit = next ? safeLimit : gamutLimit;
    setSafe(next);
    setOklch((p) => {
      const c = next ? holdChroma(p.c, p.l, p.h, nextLimit) : p.c;
      const s = satFromChroma(c, p.l, p.h, nextLimit);
      if (s !== null) setSat(s);
      return { ...p, c };
    });
  }, [safe]);

  /**
   * The mode switch changes how C is addressed and never what color is on
   * screen. Neither direction writes to `oklch`, so the swatch and the hex are
   * bit-identical across the switch and across a round trip through it.
   *
   * Absolute -> relative has one thing to do: read the current C as a
   * percentage of what fits. Relative -> absolute has none at all, because C
   * was the state the whole time and S was only ever a way of setting it.
   *
   * The one case worth knowing: arriving in relative mode with a C already past
   * the cusp parks the handle at 100% while the color stays where it was and
   * the page goes on saying it is out of gamut. The alternative is to snap the
   * color on a switch nobody asked a color change of. The next touch of any
   * track resolves it - inward, which is the mode's point.
   */
  const switchMode = useCallback((next: ChromaMode) => {
    setMode(next);
    if (next !== 'relative') return;
    const s = satFromChroma(oklch.c, oklch.l, oklch.h, limitAt);
    if (s !== null) setSat(s);
  }, [oklch, limitAt]);

  /**
   * A color arriving whole, from a preset or from sRGB. It is taken as given
   * and S is re-read from it, so in relative mode the percentage follows the
   * hexagon rather than fighting it - drag the wheel and watch the S handle
   * move with it.
   */
  const applyOklch = useCallback((next: Oklch) => {
    setOklch(next);
    const s = satFromChroma(next.c, next.l, next.h, limitAt);
    if (s !== null) setSat(s);
  }, [limitAt]);

  const jumpTo = useCallback((target: Oklch) => applyOklch(
    (mode === 'absolute' && hold) || safe
      ? { ...target, c: holdChroma(target.c, target.l, target.h, limitAt) }
      : target,
  ), [applyOklch, mode, hold, safe, limitAt]);

  const { rgb, inGamut } = oklchToRgb(oklch.l, oklch.c, oklch.h);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  /**
   * The color as Oklab, for the OKLAB sliders. Written back through the same
   * door presets use, so hold and Safe zone apply to a and b as to anything.
   */
  const setFromOklab = (next: Oklab) => jumpTo(oklabToOklch(next.l, next.a, next.b));
  /** Where the clamped color actually landed - the evidence the clamp destroys. */
  const landed = rgbToOklch(rgb.r, rgb.g, rgb.b);

  /**
   * The other direction: a color arriving as sRGB - from the hexagon, or
   * typed into the hex field - measured back into Oklch.
   *
   * `rgbToOklch` is exact in this direction; every sRGB color has an Oklch
   * address, and `oklchToRgb` returns the same bytes. So a hex typed in comes
   * back out of the readouts unchanged. That is deliberately *not* how #117
   * fails in the app: nothing here routes an RGB edit through HSB, whose
   * whole-number S and B cannot carry the byte you typed.
   *
   * Anything the hexagon sends is in gamut by construction, so the Oklch bank
   * lands inside the limit whatever the switch says - which is itself worth
   * watching: drive the hexagon and C snaps back into the reachable range.
   */
  const setFromRgb = (next: RGB) => applyOklch(rgbToOklch(next.r, next.g, next.b));
  /**
   * The hexagon's gestures. With Safe zone off they arrive whole, as above.
   * With it on the hexagon is a hue dial: the gesture's color contributes its
   * Oklch hue and nothing else, so L and C stay in the zone and every
   * gesture on the field lands on a real color at the same perceived
   * lightness and chroma. The handle then sits where *that* color is, which
   * is not where the pointer went - the honest thing, since the field's
   * radius is saturation and the zone is not.
   */
  const fromHexagon = (next: RGB) => {
    if (!safe) { setFromRgb(next); return; }
    const { h } = rgbToOklch(next.r, next.g, next.b);
    setOklch((p) => ({ ...p, h }));
  };
  const applyHsb = (patch: Partial<HSB>) => {
    const n = { ...hsb, ...patch };
    fromHexagon(hsbToRgb(n.h, n.s, n.b));
  };
  const applyHsl = (channel: 'h' | 's' | 'l', value: number) => {
    const n = { ...hsl, [channel]: value };
    fromHexagon(hslToRgb(n.h, n.s, n.l));
  };

  const spell = (v: Oklch) => `oklch(${v.l.toFixed(3)} ${v.c.toFixed(3)} ${v.h.toFixed(1)})`;
  const asked = spell(oklch);
  // The chip wears the color, so its text has to clear it. Oklch says which
  // way round: light text under L 0.6, dark text over it.
  const chipInk = landed.l > 0.6 ? '#000' : '#fff';

  return (
    <TooltipProvider delay={0}>
      {/*
        * One screen, the way the CIE lab is one screen. This page used to be a
        * 1100px column of five sections with a paragraph over each, so moving
        * a slider meant scrolling away from the hexagon it moved. The panels
        * are now side by side at full width and the paragraphs are behind a
        * `?` on the panel they explain. Below the xl breakpoint the columns
        * stack and the page scrolls.
        */}
      <div className="flex min-h-svh flex-col bg-background px-3 pb-3 pt-2 text-base text-foreground">
        <header className="flex shrink-0 items-center gap-2 pb-2">
          <h1 className="text-2xl font-semibold">Oklch Lab</h1>
          <HelpTip label="What this page is" className="max-w-[56ch]">
            <p>One color, held as Oklch. L, C and H drive everything else on
            the page; RGB and HSB are read back out of the result.</p>
            <p>Oklch is bigger than sRGB, so some of what you can name here has
            no color on this screen &mdash; the C track shows where that
            starts. The <strong className="font-semibold">Absolute C / Relative
            S</strong> switch is the other answer to that: a track that spends
            all of itself on the colors that do exist here.</p>
          </HelpTip>
        </header>

        {/* The CIE lab's shape: a 2x2 of numbered panels, and one column of
            details about the color beside it. */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:[grid-template-rows:auto_minmax(0,1fr)]">
          {/*
           * The app's real hexagon, not a copy of it - the same component
           * the picker and the plugin render. It speaks sRGB, so every
           * gesture on it arrives here as bytes and is measured back into
           * Oklch, and the bank beside it moves with it.
           */}
          <LabPanel
            n={1}
            title="Hexagon"
            help={<><p>The app&rsquo;s own hexagon. It speaks sRGB, so every gesture
              on it arrives as bytes and is measured back into Oklch &mdash; the
              sliders beside it move with it.</p>
              <p>Watch C while you drag: everything the hexagon can reach is
              inside the gamut, so the handle never leaves the in-gamut part of
              its track. With Safe zone on in panel 4, a gesture here changes
              hue only.</p>
              <p>The two loops are oklch.com&rsquo;s Hue graph laid over the
              field: hue as angle, Oklch L as radius, center L 0 and the
              hexagon&rsquo;s edge L 1, at the current C. At each hue,{' '}
              <span style={{ color: CEILING_INK }} className="font-semibold">red</span> is
              the lightest color that has this chroma and{' '}
              <span style={{ color: FLOOR_INK }} className="font-semibold">blue</span> the
              darkest, so red is always outside blue and the band between them
              narrows as C rises. The dots are the current hue on each loop,
              the same two colors the bar marks show. A hue that cannot hold
              the chroma breaks both loops. The field&rsquo;s own radius is saturation, not lightness,
              so this is a graph over the field; the marks on the two bars are
              the exact positions.</p></>}
          >
            <div className="mx-auto w-full max-w-[500px]">
              <ColorHexagon
                rgb={rgb}
                hue={hsb.h}
                brightness={hsb.b}
                saturation={hsb.s}
                hsl={hsl}
                onHueChange={(h) => applyHsb({ h })}
                onRgbChange={(channel, value) => fromHexagon({ ...rgb, [channel]: value })}
                onHsbChange={applyHsb}
                onHslChange={applyHsl}
                // Snap rather than tween. The picker's animateToHsb is a rAF
                // loop in ColorPicker tied to its undo bookkeeping, and none
                // of that is what this page is asking about; without the prop
                // the bar markers would simply not respond.
                onAnimateToHsb={applyHsb}
                blMode={blMode}
                onBlModeChange={setBlMode}
                colorSpace={colorSpace}
                onColorSpaceChange={setColorSpace}
                overlay={<LightnessLoops c={oklch.c} h={oklch.h} />}
                // Only in brightness mode: the marks are HSB positions, and
                // the lightness bar is a different axis.
                blBarMarks={blMode === 'brightness' ? briMarks : undefined}
                satBarMarks={blMode === 'brightness' ? satMarks : undefined}
                // The loops' key, in the header slot beside the HSB / HSL
                // tabs. Left aligned, on the row the tabs already own.
                headerLeft={(
                  <div className="flex h-8 items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: CEILING_INK }} />
                      Lightest Chroma
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: FLOOR_INK }} />
                      Darkest Chroma
                    </span>
                  </div>
                )}
                // The host frames it, and this host has no swatch library, so
                // `onRecordColor` is left out the way the prop says a host
                // without one should.
                bare
              />
            </div>
          </LabPanel>

            <LabPanel
              n={2}
              title="Sliders"
              help={<><p>The app&rsquo;s slider banks, plus Oklch and Oklab; the
                toggle picks which are shown. Oklab&rsquo;s a runs green to red
                and b blue to yellow, either side of zero, and both write back
                through the same door presets use, so the hold and Safe zone
                switches apply to them. RGB, HSB and HSL are
                read back out of the clamped 8-bit color and write the whole
                color when moved, so out of gamut they describe the swatch
                rather than the Oklch that was asked for, and a nudge lands the
                color on what the screen can show. OKLCH is the same bank as
                panel 4.</p>
                <p><strong className="font-semibold">Mixed</strong> colors the
                tracks with what a change to that channel would land on, the
                other channels held. <strong className="font-semibold">Source</strong> shows
                each channel by itself, as the picker&rsquo;s droplet does: R, G
                and B from black; H at full saturation and brightness; S at full
                brightness; B and HSL&rsquo;s L with saturation at zero, so they
                run black to white; Oklch L neutral, C at the hue&rsquo;s most
                vivid lightness, and H every hue at its most vivid; a and b at
                L 0.7 with the other axis at zero.</p></>}
            >
              {/* One column, so the tracks share a width and the steppers a
                  column. The toggle above picks the groups, as the app's Color
                  Editor does; a rule between the shown ones tells them apart.
                  No unit suffixes, for the reason panel 4 gives. */}
              <div className="flex flex-col gap-3">
                {/* The toolbar, as the Color Editor lays it out: color models
                    at the left, Source / Mixed at the right. */}
                <div className="flex items-center justify-between gap-3">
                  <ToggleGroup
                    multiple
                    value={[...groups]}
                    onValueChange={(v) => setGroups(SLIDER_GROUPS.filter((g) => (v as SliderGroup[]).includes(g)))}
                    aria-label="Slider groups"
                  >
                    {SLIDER_GROUPS.map((g) => (
                      <ToggleGroupItem key={g} value={g} className="px-2.5 text-base">{g}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <Tabs value={blend ? 'mixed' : 'source'} onValueChange={(v) => setBlend(v === 'mixed')}>
                    <TabsList>
                      <TabsTrigger value="source" className="px-3 text-base">Source</TabsTrigger>
                      <TabsTrigger value="mixed" className="px-3 text-base">Mixed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {groups.includes('RGB') && (
                  <div className="mt-1 flex flex-col gap-3 border-t border-foreground/20 pt-4">
                <div className="flex flex-col gap-3">
                  <ColorSlider
                    label="R" group="rgb" value={rgb.r} max={255} wideStepper
                    gradient={blend ? redGradient(rgb.g, rgb.b) : redChannelGradient}
                    onChange={(v) => setFromRgb({ ...rgb, r: v })}
                  />
                  <ColorSlider
                    label="G" group="rgb" value={rgb.g} max={255} wideStepper
                    gradient={blend ? greenGradient(rgb.r, rgb.b) : greenChannelGradient}
                    onChange={(v) => setFromRgb({ ...rgb, g: v })}
                  />
                  <ColorSlider
                    label="B" group="rgb" value={rgb.b} max={255} wideStepper
                    gradient={blend ? blueGradient(rgb.r, rgb.g) : blueChannelGradient}
                    onChange={(v) => setFromRgb({ ...rgb, b: v })}
                  />
                </div>
                  </div>
                )}
                {groups.includes('HSB') && (
                  <div className="mt-1 flex flex-col gap-3 border-t border-foreground/20 pt-4">
                <div className="flex flex-col gap-3">
                  <ColorSlider
                    label="H" group="hsb" value={hsb.h} max={360} wrap wideStepper
                    gradient={hueGradient(blend ? hsb.s : 100, blend ? hsb.b : 100, colorSpace)}
                    onChange={(v) => setFromRgb(hsbToRgb(v, hsb.s, hsb.b))}
                  />
                  <ColorSlider
                    label="S" group="hsb" value={hsb.s} max={100} wideStepper
                    gradient={withMarks(saturationGradient(hsb.h, blend ? hsb.b : 100, colorSpace), satMarks)}
                    onChange={(v) => setFromRgb(hsbToRgb(hsb.h, v, hsb.b))}
                  />
                  <ColorSlider
                    label="B" group="hsb" value={hsb.b} max={100} wideStepper
                    gradient={withMarks(brightnessGradient(hsb.h, blend ? hsb.s : 0, colorSpace), briMarks)}
                    onChange={(v) => setFromRgb(hsbToRgb(hsb.h, hsb.s, v))}
                  />
                </div>
                  </div>
                )}
                {groups.includes('HSL') && (
                  <div className="mt-1 flex flex-col gap-3 border-t border-foreground/20 pt-4">
                <div className="flex flex-col gap-3">
                  <ColorSlider
                    label="H" group="hsl" value={hsl.h} max={360} wrap wideStepper
                    gradient={hslHueGradient(blend ? hsl.s : 100, blend ? hsl.l : 50, colorSpace)}
                    onChange={(v) => setFromRgb(hslToRgb(v, hsl.s, hsl.l))}
                  />
                  <ColorSlider
                    label="S" group="hsl" value={hsl.s} max={100} wideStepper
                    gradient={withMarks(hslSaturationGradient(hsl.h, blend ? hsl.l : 50, colorSpace), hslSatMarks)}
                    onChange={(v) => setFromRgb(hslToRgb(hsl.h, v, hsl.l))}
                  />
                  <ColorSlider
                    label="L" group="hsl" value={hsl.l} max={100} wideStepper
                    gradient={withMarks(lightnessGradient(hsl.h, blend ? hsl.s : 0, colorSpace), hslLightMarks)}
                    onChange={(v) => setFromRgb(hslToRgb(hsl.h, hsl.s, v))}
                  />
                </div>
                  </div>
                )}
                {groups.includes('OKLCH') && (
                  <div className="mt-1 flex flex-col gap-3 border-t border-foreground/20 pt-4">
                <div className="flex flex-col gap-3">
                  <ColorSlider
                    label="L" group="lch" value={oklch.l} max={1} step={FINE}
                    gradient={withMarks(blend ? lightnessColors(oklch.c, oklch.h) : lightnessSourceColors(), oklchLMarks)}
                    onChange={setL}
                  />
                  <ColorSlider
                    label="C" group="lch" value={oklch.c} max={CHROMA_MAX} step={FINE}
                    gradient={withMarks(blend ? chromaColors(oklch.l, oklch.h) : chromaSourceColors(oklch.h), oklchCMarks)}
                    onChange={setC}
                  />
                  <ColorSlider
                    label="H" group="lch" value={oklch.h} max={360} step={HUE_STEP} wrap
                    gradient={withLayers(blend ? hueColors(oklch.l, oklch.c) : hueSourceColors(), [hueWash(hueSpans)])}
                    onChange={setH}
                  />
                </div>
                  </div>
                )}
                {groups.includes('OKLAB') && (
                  <div className="mt-1 flex flex-col gap-3 border-t border-foreground/20 pt-4">
                  <ColorSlider
                    label="L" group="oklab" value={oklch.l} max={1} step={FINE}
                    gradient={withMarks(blend ? lightnessColors(oklch.c, oklch.h) : lightnessSourceColors(), oklchLMarks)}
                    onChange={setL}
                  />
                  <ColorSlider
                    label="a" group="oklab" value={lab.a} min={-OKLAB_MAX} max={OKLAB_MAX} step={FINE}
                    gradient={withLayers(blend ? oklabAColors(lab.l, lab.b) : oklabASourceColors(), oklabAxisMarks(labA))}
                    onChange={(v) => setFromOklab({ ...lab, a: v })}
                  />
                  <ColorSlider
                    label="b" group="oklab" value={lab.b} min={-OKLAB_MAX} max={OKLAB_MAX} step={FINE}
                    gradient={withLayers(blend ? oklabBColors(lab.l, lab.a) : oklabBSourceColors(), oklabAxisMarks(labB))}
                    onChange={(v) => setFromOklab({ ...lab, b: v })}
                  />
                  </div>
                )}
              </div>
            </LabPanel>

            <LabPanel
              n={3}
              title="One setting, six hues"
              caption={relative
                ? <>Every swatch is <span className="font-mono tabular-nums text-foreground">{sat}%</span> at this L.</>
                : <>Every swatch is <span className="font-mono tabular-nums text-foreground">C {oklch.c.toFixed(3)}</span> at this L.</>}
              help={<><p>The current chroma setting, read across six landmark hues
                at the current L. Click a swatch to go to that hue.</p>
                <p><strong className="font-semibold">Relative</strong> holds the
                percentage: every swatch exists, and no two carry the same
                amount of color. That is what the relative track costs, and it
                does not go away by not being shown.</p>
                <p><strong className="font-semibold">Absolute</strong> holds the
                number: the swatches that exist are strictly comparable. Where
                a hue has no color at this setting, the swatch is the nearest
                one it does have &mdash; same hue, L and C moved to the closest
                point of the gamut &mdash; and the red figures are where it
                landed.</p>
                <p>The hexagon below is the field at this color&rsquo;s
                brightness, with this color marked as panel 1 marks it and the
                six landmark colors each on its hue ray at its own brightness,
                as rings, since the field is painted at this color&rsquo;s
                brightness and theirs may differ. A pinned color wears a red
                ring. Move C or L and watch them slide.</p></>}
            >
              <LandmarkRow
                l={oklch.l}
                chromaAt={(h) => (relative ? chromaFromSat(sat, oklch.l, h, limitAt) : oklch.c)}
                onPick={setH}
              />
              {/* Centered in whatever height the row leaves the panel. */}
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <LandmarkMap
                  l={oklch.l}
                  chromaAt={(h) => (relative ? chromaFromSat(sat, oklch.l, h, limitAt) : oklch.c)}
                  rgb={rgb}
                  colorSpace={colorSpace}
                />
              </div>
            </LabPanel>

            <LabPanel
              n={4}
              title="Oklch"
              help={<><p><strong className="font-semibold">Absolute C</strong> is the
                number CSS takes. The track runs to {CHROMA_MAX} at every L and H, and
                the part of it past the gamut edge names colors this screen
                does not have.</p>
                <p><strong className="font-semibold">Relative S</strong> is a share
                of what fits: 100% is the gamut edge at this L and H, so every
                position is a real color &mdash; and the same percentage is a
                different amount of color at every hue.</p>
                <p>The <span style={{ color: CEILING_INK }} className="font-semibold">red</span> and{' '}
                <span style={{ color: FLOOR_INK }} className="font-semibold">blue</span> hairlines
                on the L track are the lowest of the per-hue maximums and the
                highest of the per-hue minimums at this C: between them every
                hue is a real color. The red line on the C track is the same
                idea for chroma, the C every hue holds at this L. Hues this L
                and C cannot hold are washed on the H track.</p>
                <p><strong className="font-semibold">Safe zone</strong> holds C
                at or under the red line: the chroma every hue can carry at
                this L. L and C then name a zone, and inside it hue is free
                &mdash; turn H or turn the hexagon and the color stays in sRGB
                at the same perceived lightness and chroma. With it on, the
                hexagon is a hue dial and keeps L and C where they were. In
                Relative mode, 100% becomes the safe edge.</p>
                <p><strong className="font-semibold">Stop chroma at the gamut
                edge</strong> is an Absolute-mode question. On, C cannot leave
                sRGB: moving L or H pulls it back to the line, so the color is
                always real and the value you set changes under you. Off, C runs
                the whole track; past the line the color stops changing and the
                page says so. In Relative mode there is nothing to stop &mdash;
                the edge is 100% and the track ends there.</p>
                <p><strong className="font-semibold">Asked for / got back:</strong> inside
                sRGB the swatch is the color named, to the nearest 8-bit step,
                and the two lines say the same thing twice on purpose. Outside,
                no color on this screen has that address, and the swatch is
                what the clamp gives instead &mdash; a different color, and
                above all a duller one. <strong className="font-semibold">C stops
                at</strong> is the most chroma sRGB holds at this L and H.</p></>}
              helpWide
              aside={
                <Tabs value={mode} onValueChange={(v) => switchMode(v as ChromaMode)}>
                  <TabsList>
                    {/* text-base: the page's size. The primitive's own text-sm
                        is right inside a dense panel and wrong out here. */}
                    <TabsTrigger value="absolute" className="px-3 text-base">Absolute (C)</TabsTrigger>
                    <TabsTrigger value="relative" className="px-3 text-base">Relative (S)</TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            >
              {/* The tracks' key, under the title in panel 1's legend style.
                  Red is the highest value every hue reaches - the lowest of
                  the maximums - blue the lowest every hue reaches, white this
                  hue's own gamut edge, where the wash begins. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-0.5" style={{ background: CEILING_INK }} />
                  Highest Hue
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-0.5" style={{ background: FLOOR_INK }} />
                  Lowest Hue
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-0.5 bg-foreground" />
                  Hue Edge
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-border" style={{ background: OUT_OF_GAMUT_WASH }} />
                  Outside sRGB
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {/* No unit suffix on any row: ColorSlider hangs a unit box
                    after the stepper, which would push H (and S) out of
                    line with L and C. The line under C and the details
                    column carry the units instead. */}
                <ColorSlider
                  label="L" group="oklch" value={oklch.l} max={1} step={FINE}
                  gradient={lightnessRamp(oklch.c, oklch.h, lBounds)} onChange={setL}
                />
                {/* Keyed, so the switch mounts a fresh slider rather than
                    handing S the C instance. Reused, the instance kept C's
                    drag closure - range 0..0.4, C's writer - and a drag on the
                    S track moved nothing while a press, which takes a fresh
                    handler, worked. */}
                {relative ? (
                  <ColorSlider
                    key="s"
                    label="S" group="oklch" value={sat} max={100} step={SAT_STEP} wideStepper
                    gradient={saturationRamp(oklch.l, oklch.h, limit)} onChange={setSaturation}
                  />
                ) : (
                  <ColorSlider
                    key="c"
                    label="C" group="oklch" value={oklch.c} max={CHROMA_MAX} step={FINE}
                    gradient={chromaRamp(oklch.l, oklch.h, hueEdge, limit, safeChromaAtL(oklch.l))} onChange={setC}
                  />
                )}
                {/*
                  * Indented past the channel letter, so it reads as a line
                  * belonging to the track above it rather than a fourth row.
                  * One line in either mode, truncating rather than wrapping,
                  * so switching modes - or dragging S from 9% to 100% - cannot
                  * move the slider under it. The percentage is boxed to a
                  * fixed 4ch so 9% and 100% are the same width.
                  */}
                <p className="-mt-1 truncate pl-5 text-muted-foreground">
                  {relative && (
                    <>
                      <span className="inline-block w-[4ch] text-right font-mono tabular-nums text-foreground">{sat}%</span>
                      {' = '}
                      <span className="font-mono tabular-nums text-foreground">C {oklch.c.toFixed(3)}</span>
                      {' · '}
                    </>
                  )}
                  {safe
                    ? <>safe C <span className="font-mono tabular-nums">{limit.toFixed(3)}</span> at this L, every hue</>
                    : <>max C <span className="font-mono tabular-nums">{limit.toFixed(3)}</span> at this L and H</>}
                </p>
                <ColorSlider
                  label="H" group="oklch" value={oklch.h} max={360} step={HUE_STEP} wrap
                  gradient={hueRamp(oklch.l, oklch.c, hueSpans)} onChange={setH}
                />
              </div>
              {/*
                * One row in both modes, so the switch cannot change the
                * panel's height. In Relative the question has no meaning -
                * 100% is the cusp - and the row says that in the space the
                * switch held, rather than leaving a grayed control that still
                * puts the question.
                */}
              <div className="flex min-h-10 items-center border-t border-border pt-2">
                <div className="w-full">
                  <SwitchRow
                    label="Safe zone: hold C where every hue fits"
                    checked={safe}
                    onToggle={toggleSafe}
                    ariaLabel="Safe zone"
                  />
                </div>
              </div>
              <div className="flex min-h-10 items-center">
                {safe ? (
                  <p className="truncate text-muted-foreground">
                    <span className="font-semibold text-foreground">Held.</span>{' '}
                    Safe zone stops C at the shared edge.
                  </p>
                ) : relative ? (
                  <p className="truncate text-muted-foreground">
                    <span className="font-semibold text-foreground">Nothing to stop.</span>{' '}
                    Here the edge is 100%.
                  </p>
                ) : (
                  <div className="w-full">
                    <SwitchRow
                      label="Stop chroma at the gamut edge"
                      checked={hold}
                      onToggle={toggleHold}
                      ariaLabel="Stop chroma at the gamut edge"
                    />
                  </div>
                )}
              </div>
            </LabPanel>
        </div>

          <LabPanel
            title="Color details"
            help={<><p>The swatch, and two ways to take the color away: click a
              chip to copy it, or type a hex into the field.</p>
              <p>The CSS chip always spells C as a number, never as a
              percentage. CSS Color 4 has a percentage for chroma too and it
              is not the Relative S on this page: the spec fixes 100% at 0.4
              flat, so <span className="font-mono">oklch(0.7 50% 264)</span> means
              C 0.200 whether or not 0.2 fits there.</p></>}
          >
              <div className="flex items-stretch gap-3">
              <PreviewSwatch hex={hex} className="w-[72px] min-h-20" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <CopyChip text={asked} color={hex} textColor={chipInk} />
                <div className="flex items-center gap-2">
                  <CopyChip text={hex.toUpperCase()} color={hex} textColor={chipInk} />
                  {/* The app's own field, typed as well as read. Its bytes
                      reach the state through rgbToOklch and come back out
                      unchanged - see setFromRgb. */}
                  <div className="w-[104px]">
                    <HexInput hex={hex} onChange={setFromRgb} />
                  </div>
                </div>
              </div>
            </div>

            {/* Every row one line at fixed decimals, so a drag changes digits
                and never the panel's height. */}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-border pt-3">
              <dt className="text-muted-foreground">Lightness</dt>
              <dd className="truncate font-mono tabular-nums">{oklch.l.toFixed(3)}</dd>
              <dt className="text-muted-foreground">Chroma</dt>
              <dd className="truncate font-mono tabular-nums">{oklch.c.toFixed(3)} of {limit.toFixed(3)}</dd>
              <dt className="text-muted-foreground">Relative S</dt>
              <dd className="truncate font-mono tabular-nums">{limit > 0 ? Math.round((oklch.c / limit) * 100) : 0}%</dd>
              <dt className="text-muted-foreground">Hue</dt>
              <dd className="truncate font-mono tabular-nums">{oklch.h.toFixed(1)}°</dd>
              <dt className="text-muted-foreground">Gamut</dt>
              <dd className="truncate" style={inGamut ? undefined : { color: 'var(--destructive)' }}>{inGamut ? 'Inside sRGB' : 'Outside sRGB'}</dd>
              <dt className="text-muted-foreground">RGB</dt>
              <dd className="truncate font-mono tabular-nums">{rgb.r}, {rgb.g}, {rgb.b}</dd>
              <dt className="text-muted-foreground">HSB</dt>
              <dd className="truncate font-mono tabular-nums">{hsb.h}°, {hsb.s}%, {hsb.b}%</dd>
            </dl>
              {/*
            * The page's most interesting state, said in the same shape
            * either way. The rows are always drawn, so crossing the
            * boundary during a drag changes a word and a border and moves
            * nothing. In gamut that is not padding: "asked for" and "got
            * back" being the same line is the fact.
            */}
            <div
             id="oklch-gamut"
             className="flex flex-col gap-1.5 rounded-md border border-border p-2.5"
             aria-live="polite"
             style={inGamut ? undefined : { borderColor: 'var(--destructive)' }}
            >
             <p className="font-semibold" style={inGamut ? undefined : { color: 'var(--destructive)' }}>
               {inGamut ? 'Inside sRGB' : 'Outside sRGB'}
             </p>
             <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono tabular-nums">
               {/* Fixed formats at fixed decimals: one line each, and they
                   truncate rather than wrap. */}
               <dt className="font-sans text-muted-foreground">Asked for</dt>
               <dd className="min-w-0 truncate">{asked}</dd>
               <dt className="font-sans text-muted-foreground">Got back</dt>
               <dd className="min-w-0 truncate">{spell(landed)}</dd>
               <dt className="font-sans text-muted-foreground">As hex</dt>
               <dd className="min-w-0 truncate">{hex.toUpperCase()}</dd>
               <dt className="font-sans text-muted-foreground">C stops at</dt>
               <dd className="min-w-0 truncate">{limit.toFixed(3)}</dd>
             </dl>
            </div>
            <hr className="border-border" />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <Button key={p.name} size="sm" variant="outline" className="text-base" onClick={() => jumpTo(p.oklch)}>
                  {p.name}
                </Button>
              ))}
            </div>
          </LabPanel>
        </div>
      </div>
      <Toaster position="top-center" />
    </TooltipProvider>
  );
}
