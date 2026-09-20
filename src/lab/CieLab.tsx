/**
 * CIE lab: one colour, three projections of one solid.
 *
 * The three panels are not a gallery. They are the RGB cube seen three ways,
 * and the page exists to make the difference between the ways legible:
 *
 * - **The hexagon** is the cube in *parallel* projection along the black-to-
 *   white diagonal. Every geometric constant in `ColorHexagon` follows from
 *   that - see wiki/notes/hexagon-is-the-cube-down-its-diagonal.md.
 * - **The chromaticity diagram** is the same cube in *central* projection from
 *   black. Dividing XYZ by X+Y+Z is that projection: it maps each ray out of
 *   the origin onto the plane X+Y+Z=1, and the origin in linear RGB is black.
 * - **The xyY solid** is what central projection threw away, put back. Its
 *   floor is the diagram; its height is the luminance the divide cancelled.
 *
 * Two things separate the hexagon from the diagram, and each is separately
 * visible here. Parallel keeps the scale of a colour and central does not, so
 * brightness has a bar on one and nowhere to go on the other. And the
 * hexagon's geometry is computed on gamma-encoded channels while chromaticity
 * is linear, which is why a constant-saturation ring is not a shrunken
 * triangle.
 *
 * HOW THE PAGE IS LAID OUT, AND WHY IT IS A FIXED HEIGHT.
 *
 * The four figures are an argument made by comparison, so they have to be on
 * screen together: the page is one viewport tall and the panels shrink to fit
 * rather than the page growing to hold them. That costs the captions, which
 * have moved into `?` tooltips, and the reading matter, which has moved to the
 * second tab. What is left under each title is one line.
 *
 * Every row of the grid is `minmax(<floor>, 1fr)`, so a figure has a size it
 * will not go below; when the viewport cannot hold four of those the grid
 * scrolls instead of crushing them. Each figure then sits in a `Fit` box,
 * which reads the row's height through `container-type: size` and takes the
 * width its aspect asks for - the one arrangement that works whether the cell
 * is limited by its height or by its width.
 *
 * Every number in the copy below is asserted in src/utils/cie.test.ts,
 * src/utils/gamuts.test.ts and src/utils/gamutMorph.test.ts.
 */
import {
  memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  rgbToHsb, rgbToHex, type HSB, type RGB,
} from '@/utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient, type ColorSpace,
} from '@/utils/sliderGradients';
import {
  D65_WHITE, circleFractionOutsideGamut, type Xy,
} from '@/utils/cie';
import {
  GAMUTS, gamutById, locusAreaShare, gamutLuminance, gamutRgbToXyY, cssColorIn,
  type GamutId,
} from '@/utils/gamuts';
import { useColorState } from '@/hooks/useColorState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from '@/components/ui/popover';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ColorSlider from '@/components/ColorSlider';
import ColorHexagon from '@/components/ColorHexagon';
import PreviewSwatch from '@/components/PreviewSwatch';
import HexInput from '@/components/HexInput';
import { cornerGaps, cornerReadings, rimShape, type MorphTarget } from '@/utils/gamutMorph';
import { ChevronDown } from 'lucide-react';
import type { CubeStep } from './cubeRenderer';
import CieDiagram, { GAMUT_TINT } from './CieDiagram';
import CieSolid from './CieSolid';
import HexMorph, { MorphReadings, type MorphFrame } from './HexMorph';
import HelpTip from './HelpTip';
import { Reserved, Stack } from './Reserved';
import { DISPLAY_IS_P3 } from './wideGamut';

const CIRCLE_R = 0.20;
/** 57.3%, computed rather than quoted - see circleFractionOutsideGamut. */
const CIRCLE_OUT = circleFractionOutsideGamut(CIRCLE_R);

/**
 * Everything the four figures quote, measured for one gamut.
 *
 * All of it used to be module-level constants, because there was one space.
 * Now the chromaticity panel's reading gamut decides what the picker's three
 * numbers *mean*, so every one of these is a different number in a different
 * space and the prose has to follow. Measured by src/utils/gamutMorph.ts and
 * asserted in gamutMorph.test.ts; nothing below is a quoted number.
 *
 * Memoised per gamut because `rimShape` traces 1,440 colours through the
 * whole transform twice, which is not a thing to do on every render.
 */
interface GamutFigures {
  /** The red-to-green side: the yardstick the standstill readout uses. */
  side: number;
  xyGaps: number[];
  okGaps: number[];
  xyRim: ReturnType<typeof rimShape>;
  okRim: ReturnType<typeof rimShape>;
  xySpread: number;
  okSpread: number;
  /** Cyan's angle from red: exactly 180 in xy, and nothing like it in Oklab. */
  okCyan: number;
  xyCyan: number;
}

const figuresCache = new Map<GamutId, GamutFigures>();

function figuresFor(gamut: GamutId): GamutFigures {
  const hit = figuresCache.get(gamut);
  if (hit) return hit;
  const spread = (t: MorphTarget) => {
    const reaches = cornerReadings(t, gamut).map((c) => c.reach);
    return Math.max(...reaches) / Math.min(...reaches);
  };
  const tri = gamutById(gamut).primaries;
  const f: GamutFigures = {
    side: Math.hypot(tri[0].x - tri[1].x, tri[0].y - tri[1].y),
    xyGaps: cornerGaps('xy', gamut),
    okGaps: cornerGaps('oklab', gamut),
    xyRim: rimShape('xy', 1440, gamut),
    okRim: rimShape('oklab', 1440, gamut),
    xySpread: spread('xy'),
    okSpread: spread('oklab'),
    okCyan: cornerReadings('oklab', gamut)[3].angle,
    xyCyan: cornerReadings('xy', gamut)[3].angle,
  };
  figuresCache.set(gamut, f);
  return f;
}

/**
 * How wide each figure wants to be, given the height of the cell it is in.
 *
 * `Fit` puts a figure in a box whose height comes from the grid row, turns
 * that height into a CSS container unit, and hands it to the expression
 * below - so a figure asks for the width its own proportions need instead of
 * being stretched to the cell and clipped.
 *
 * The chromaticity diagram and the two square figures are plain ratios: their
 * height is proportional to their width and nothing else.
 *
 * THE HEXAGON HAS TWO LAYOUTS AND ONLY ONE OF THEM IS THE PICKER'S.
 *
 * `ColorHexagon` stands its brightness bar beside the hexagon while the card
 * is wider than `HEX_STACKED_BARS_MAX`, and lays it down under the saturation
 * bar below that. The two are different shapes and different controls: the
 * wide one carries the value *pills* - the draggable chips the app's own
 * picker has - and the narrow one replaces them with title readouts, because
 * a pill needs a gutter the narrow card has already spent.
 *
 * Measured in a real browser at settled widths, both regimes:
 *
 *     stacked   200 -> 352,  440 -> 572   (h = 0.917w + 169)
 *     with pill 480 -> 486,  560 -> 555   (h = 0.863w + 73)
 *
 * The wide one is *shorter* for the same width, because the bar beside the
 * hexagon costs width rather than height. So the panel asks for at least the
 * width that keeps it there, and the grid gives its row the height that
 * width needs. The alternative - a narrower hexagon in a shorter row - buys
 * about 90px of page and costs the pills, and the pills are half the control.
 */
const FIT_DIAGRAM = 0.885 / 0.95;
const FIT_SQUARE = 1;

/**
 * THE THRESHOLD, AND WHY THERE IS A GAP EITHER SIDE OF IT.
 *
 * `HEX_STACKED_BARS_MAX` is 468: at or below that width `ColorHexagon` flips
 * `stacked`, lays its brightness bar down and *unmounts the value pills*. The
 * flip is a React state change driven by a ResizeObserver, so a card that
 * crosses the line while a pill is being dragged destroys the element under
 * the pointer - a drag with nothing left to release.
 *
 * The first version of this sizing put the card at 470, two pixels clear.
 * Nothing observed actually crossed it, but two pixels is not a margin; it is
 * a coincidence, and the next change to this panel would have spent it.
 *
 * So the widths are arranged so that nothing near the line is reachable:
 *
 * - Wide cells pin the card at `HEX_PILL_MIN` - 32px clear - and it can only
 *   grow from there, because the only other term in that expression is a
 *   height-derived width that makes the card *wider*.
 * - Cells under `HEX_PILL_MIN` take the stacked expression instead, which
 *   lands far below 468 rather than just under it.
 *
 * Between 468 and 500 no width is ever chosen. That is the structural part:
 * the card cannot arrive near the threshold by any route, so it cannot cross
 * it by jitter, by a scrollbar appearing, or by a reserved slot resolving to
 * a different height. tests/cie-lab-hexagon.spec.ts holds it there.
 */
const HEX_PILL_MIN = 500;
/** Height per px of width in that layout, and the fixed part on top. */
const HEX_PILL_SLOPE = 0.863;
const HEX_PILL_FIXED = 73;

/**
 * Height per px of width in the *stacked* layout, and its fixed part. The
 * fixed part carries 6px more than measured, as a cushion: this expression
 * decides a height that has to fit, and being a little short costs slack
 * while being a little long clips the saturation bar.
 */
const HEX_STACK_SLOPE = 0.917;
const HEX_STACK_FIXED = 175;

/** A width expression for a figure whose height is a fixed multiple of it. */
const fitRatio = (ratio: number) => `min(100%, calc(100cqh * ${ratio}))`;

/**
 * The hexagon, twice: the layout it gets depends on how wide its cell is, and
 * each layout has its own affine height.
 *
 * Narrow cells get the stacked one and must be sized for it, or the
 * saturation bar is clipped off the bottom - which is how this went wrong the
 * first time. Cells wide enough for the bars to stand side by side get that
 * one, floored at the width that keeps them there.
 */
const FIT_HEX_STACKED = `min(100%, (100cqh - ${HEX_STACK_FIXED}px) / ${HEX_STACK_SLOPE})`;
const FIT_HEX_WIDE = `min(100%, max(${HEX_PILL_MIN}px, (100cqh - ${HEX_PILL_FIXED}px) / ${HEX_PILL_SLOPE}))`;

/** What the wide layout costs the row it sits in: the height its floor implies. */
const HEX_ROW_MIN = Math.ceil(HEX_PILL_MIN * HEX_PILL_SLOPE + HEX_PILL_FIXED);
/** Card padding, title row, caption row and the gap under them. */
const PANEL_CHROME = 80;

/**
 * Hold a figure inside a cell whose height is known.
 *
 * `container-type: size` is what makes this work: the cell's height comes
 * from the grid row, so `100cqh` is a real number and the figure can ask for
 * the width its own shape needs. Capped at the cell's own width, so a cell
 * that is short and wide and a cell that is tall and narrow both end up with
 * the whole figure in them and neither ends up with a clipped one.
 *
 * `wideWidth` is a second expression, used once the cell is at least 500px
 * across - the hexagon's case, where the layout itself changes at a threshold
 * and one expression cannot describe both sides of it. 500 is `HEX_PILL_MIN`
 * and the two have to stay equal: the switch and the floor are the same line,
 * which is what keeps every reachable width clear of `HEX_STACKED_BARS_MAX`.
 *
 * The container is named and typed inline rather than through
 * `@container/fig`, because that utility sets `container-type: inline-size`
 * and `100cqh` needs `size`.
 */
function Fit({ width, wideWidth, children }: {
  width: string;
  wideWidth?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 items-center justify-center"
      style={{ containerType: 'size', containerName: 'fig' }}
    >
      <div
        className={wideWidth ? 'min-w-0 w-(--fit-narrow) @min-[500px]/fig:w-(--fit-wide)' : 'min-w-0 w-(--fit-narrow)'}
        style={{ '--fit-narrow': width, '--fit-wide': wideWidth ?? width } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A panel: a titled card with a `?` for the explanation and one line of
 * caption under the title. One shape for all four.
 */
function Panel({ n, title, help, caption, children, aside }: {
  n: number;
  title: string;
  help: ReactNode;
  /** The one line that stays visible. Everything longer belongs in `help`. */
  caption: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card p-3">
      {/* Never wraps, and both lines are single lines: the header's height is
          the same in every panel and in every state, so a longer title or a
          changing readout cannot move the figure under it. */}
      <header className="flex shrink-0 flex-nowrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
            <span className="text-muted-foreground tabular-nums">{n}</span>
            <span className="truncate">{title}</span>
            <HelpTip label={`What panel ${n} shows`}>{help}</HelpTip>
          </h2>
          <p className="truncate text-base leading-snug tabular-nums text-muted-foreground">{caption}</p>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">{aside}</div>
      </header>
      {children}
    </section>
  );
}

/**
 * The line under the two swatches, and the three things it can be saying.
 *
 * Kept as a function of the name rather than written out three times, so the
 * invisible copies that reserve the height are word for word the visible one
 * with a longer name in them. See GAMUT_NOTE_SIZERS.
 */
type GamutNote = 'same' | 'wide' | 'narrow';

function gamutNote(name: string, kind: GamutNote): ReactNode {
  if (kind === 'same') {
    return (
      <>
        Left sRGB, right {name} &mdash; the same space, so the same colour. Pick
        a wider one and the two squares part company exactly as far as this
        screen allows.
      </>
    );
  }
  if (kind === 'wide') {
    return (
      <>
        Left sRGB, right {name}. This display
        reports <strong className="font-semibold text-foreground">wide gamut</strong>, so
        the right square is the real thing and the gap between them is what
        sRGB cannot reach.
      </>
    );
  }
  return (
    <>
      Left sRGB, right {name}. This display
      reports <strong className="font-semibold text-foreground">sRGB only</strong>, so
      the right square is clamped and the two look the same. The positions on
      the diagrams are still exact.
    </>
  );
}

/** The longest name any gamut here has, which is what the box is sized for. */
const LONGEST_GAMUT_NAME = GAMUTS.reduce((a, g) => (g.name.length > a.length ? g.name : a), '');

/**
 * One invisible copy of each wording, at the longest name, so the box is as
 * tall as the worst case at whatever width the column happens to be - rather
 * than as tall as whatever happens to be selected.
 */
const GAMUT_NOTE_SIZERS = (['same', 'wide', 'narrow'] as const).map((kind) => ({
  key: `sizer-${kind}`,
  node: <p>{gamutNote(LONGEST_GAMUT_NAME, kind)}</p>,
}));

const INITIAL: HSB = { h: 212, s: 78, b: 92 };

/** The dropdown: which gamuts are drawn, and which one the readings are about. */
const GamutPicker = memo(function GamutPicker({ visible, active, onToggle, onActivate }: {
  visible: ReadonlySet<GamutId>;
  active: GamutId;
  onToggle: (id: GamutId) => void;
  onActivate: (id: GamutId) => void;
}) {
  const activeName = gamutById(active).name;
  const extra = visible.size - (visible.has(active) ? 1 : 0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="text-base">
          {activeName}{extra > 0 ? ` +${extra}` : ''}
          <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] text-base">
        <PopoverHeader className="text-base">
          <PopoverTitle>Gamuts</PopoverTitle>
          <PopoverDescription className="text-base leading-snug">
            Tick any number to draw them. Pick one to read from &mdash; the
            solid outline, the corner letters and the figures below are its.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col">
          {GAMUTS.map((g) => {
            const on = visible.has(g.id);
            const isActive = g.id === active;
            return (
              <div key={g.id} className="flex items-center gap-2.5 py-1">
                <Checkbox
                  id={`gamut-${g.id}`}
                  checked={on}
                  // The active gamut is what the readings are about, so it
                  // cannot be the one that is not drawn.
                  disabled={isActive}
                  onCheckedChange={() => onToggle(g.id)}
                />
                <label
                  htmlFor={`gamut-${g.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-base"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: `rgb(${GAMUT_TINT[g.id].map((v) => Math.round(v * 255)).join(' ')})` }}
                  />
                  <span className="truncate">{g.name}</span>
                  {g.whiteName !== 'D65' && (
                    <span className="shrink-0 text-muted-foreground">{g.whiteName}</span>
                  )}
                </label>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`Read from ${g.name}`}
                  onClick={() => onActivate(g.id)}
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-base transition-colors ${isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input text-muted-foreground hover:text-foreground'}`}
                >
                  Read
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default function CieLab() {
  /*
   * The page's sharpest moment, caught rather than captioned.
   *
   * While an edit moves brightness and leaves hue and saturation alone, a
   * ghost ring stays where the dot was when the run started and the
   * chromaticity panel says
   * so out loud. Central projection has no room for the scale of a colour, so
   * the dot has nothing to do - and a non-event has to be pointed at, or it
   * reads as the diagram being broken.
   *
   * Hung off the colour hook's `onEdit`, which fires on every user-driven
   * write before the state updates - so `lastHsb` and `lastXy` are still the
   * values on screen, which is exactly what the ghost wants. An effect
   * comparing renders would do the same job and cascade a render per frame of
   * a drag.
   *
   * The residual is reported rather than hidden. It is never quite zero,
   * because an 8-bit colour is a *quantised* scale: at b = 100 the channels
   * are exact and the dot is still to the last decimal, and by b = 20 rounding
   * has moved it a few thousandths. That is the limit
   * decision-hsb-canonical-rgb-override exists for, shown on a diagram.
   */
  const lastHsb = useRef<HSB>(INITIAL);
  const lastXy = useRef<Xy | null>(null);
  const [run, setRun] = useState<{ from: Xy; fromB: number; toB: number } | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEdit = useCallback((next: HSB) => {
    const prev = lastHsb.current, from = lastXy.current;
    const onlyBrightness = prev.h === next.h && prev.s === next.s && prev.b !== next.b;
    if (clearRef.current) clearTimeout(clearRef.current);
    if (!onlyBrightness || !from) { setRun(null); return; }
    setRun((r) => (r ? { ...r, toB: next.b } : { from, fromB: prev.b, toB: next.b }));
    clearRef.current = setTimeout(() => setRun(null), 4000);
  }, []);
  useEffect(() => () => { if (clearRef.current) clearTimeout(clearRef.current); }, []);

  const {
    hsb, rgb, hsl, setHsb, setHsbClear, setRgbChannel, setHslChannel, clearOverride,
  } = useColorState({ initial: INITIAL, onEdit });
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  const [tab, setTab] = useState<'figures' | 'disagree'>('figures');
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  /*
   * Visibility is a set and the reading is one of them. Multi-select for what
   * is drawn, single-select for what the numbers are about: an outline is a
   * boundary and several can be compared at once, but "57.3% of the circle is
   * outside" has to be outside *something*.
   */
  const [visible, setVisible] = useState<ReadonlySet<GamutId>>(() => new Set<GamutId>(['srgb', 'p3']));
  const [activeGamut, setActiveGamut] = useState<GamutId>('srgb');
  const [showCircle, setShowCircle] = useState(false);
  const [shape, setShape] = useState<'xyY' | 'cube'>('xyY');
  const [step, setStep] = useState<CubeStep>(1);
  /*
   * The morph opens on xy rather than on Oklab, although Oklab is the one the
   * rest of the work is about: the shape the hexagon bends into at t = 1 is
   * the triangle drawn in the panel above, so the first reading of the figure has
   * somewhere to land. Oklab is one click away and is where it ends up.
   */
  const [morphTarget, setMorphTarget] = useState<MorphTarget>('xy');
  const [morphFrame, setMorphFrame] = useState<MorphFrame>('hex');

  const toggleGamut = useCallback((id: GamutId) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const activateGamut = useCallback((id: GamutId) => {
    setActiveGamut(id);
    setVisible((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const drawn = useMemo(() => GAMUTS.filter((g) => visible.has(g.id)), [visible]);
  const active = gamutById(activeGamut);
  /*
   * The two numbers the active choice actually buys, both computed against its
   * own triangle rather than sRGB's. The circle figure is the page's oldest
   * claim - the shape a colour wheel implies - and it is a different number
   * for every gamut, which is the most direct way of saying that "the wheel is
   * not the gamut" was never a fact about sRGB in particular.
   */
  const activeCircleOut = useMemo(
    () => circleFractionOutsideGamut(CIRCLE_R, active.primaries, D65_WHITE),
    [active],
  );
  const activeShare = useMemo(() => locusAreaShare(active), [active]);
  /** Everything the prose quotes, for the gamut the panels are reading from. */
  const fig = useMemo(() => figuresFor(activeGamut), [activeGamut]);
  const lum = useMemo(() => gamutLuminance(activeGamut), [activeGamut]);

  /*
   * The picker's three numbers, read as a colour in the gamut the panels are
   * reading from. With Display P3 active, #FF0000 means P3's red - a colour
   * outside the sRGB triangle - and every readout on this page says so.
   */
  const here = gamutRgbToXyY(activeGamut, rgb.r, rgb.g, rgb.b);
  const hx = here?.x ?? null, hy = here?.y ?? null;
  // Written after the paint, so during the next edit they still hold what is
  // on screen. Refs, not state: nothing renders off them.
  useEffect(() => {
    lastHsb.current = hsb;
    lastXy.current = hx === null || hy === null ? null : { x: hx, y: hy };
  }, [hsb, hx, hy]);

  const drift = run && here ? Math.hypot(here.x - run.from.x, here.y - run.from.y) : 0;

  /*
   * ALL FOUR PANELS READ THE LIVE COLOUR.
   *
   * Panels 3 and 4 used to get a `useDeferredValue` copy, from when a colour
   * change redrew a solid of up to 16.7 million points and a pointer move cost
   * 2.2s. That cost is gone - a colour change now moves the solid's marker in
   * about 0.2ms - and what the deferral left behind was worse than what it
   * fixed: under a real mouse every move is urgent, React only reached the
   * deferred render in a gap, and the figures froze for up to half a second
   * mid-drag. So they are live again. What keeps them off panel 1's bill now
   * is that each figure is `memo`'d and coalesces its own draw to one per
   * animation frame. If a figure ever gets expensive again, throttle *its*
   * draw; do not starve its props.
   *
   * Memoised through a *key* rather than the object: `rgb` and `hsb` are
   * rebuilt every render, and handing them straight to a memo'd figure would
   * defeat the memo on the renders where the colour did not change.
   */
  const rgbKey = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  const hsbKey = `${hsb.h}|${hsb.s}|${hsb.b}`;
  const figRgb = useMemo<RGB>(
    () => ({ r: (rgbKey >> 16) & 255, g: (rgbKey >> 8) & 255, b: rgbKey & 255 }),
    [rgbKey],
  );
  const figHsb = useMemo<HSB>(() => {
    const [h, sat, b] = hsbKey.split('|').map(Number);
    return { h, s: sat, b };
  }, [hsbKey]);

  // The picker's own handlers, wired exactly as ColorPicker wires them.
  const handleH = useCallback((v: number) => setHsbClear((p) => ({ ...p, h: v })), [setHsbClear]);
  const handleS = useCallback((v: number) => setHsbClear((p) => ({ ...p, s: v })), [setHsbClear]);
  const handleB = useCallback((v: number) => setHsbClear((p) => ({ ...p, b: v })), [setHsbClear]);
  const handleHsb = useCallback((patch: Partial<HSB>) => setHsbClear((p) => ({ ...p, ...patch })), [setHsbClear]);
  const handleHex = useCallback((parsed: RGB) => {
    clearOverride();
    setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b));
  }, [clearOverride, setHsb]);

  const reach = useMemo(() => {
    if (!here) return null;
    // From that space's own white, which is D50 for ProPhoto and D65 for the
    // rest - the same datum the diagram draws its cross on.
    return Math.hypot(here.x - active.white.x, here.y - active.white.y);
  }, [here, active]);

  return (
    <TooltipProvider delay={0}>
      <Toaster />
      <div className="flex h-svh flex-col overflow-hidden bg-background px-3 pb-3 pt-2 text-base text-foreground">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'figures' | 'disagree')}
          className="min-h-0 flex-1"
        >
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              One colour, three projections
              <HelpTip label="What this page is" className="max-w-[56ch]">
                All four figures show the same RGB cube. The hexagon is the cube
                in <strong className="font-semibold">parallel</strong> projection,
                looking straight down the line from black to white. The
                chromaticity diagram is the same cube
                in <strong className="font-semibold">central</strong> projection,
                from a point &mdash; and the point is black. Dividing XYZ by
                X+Y+Z <em>is</em> that projection: it drops every ray out of the
                origin onto one plane, and a ray out of the origin is a colour
                together with all its dimmer copies. So the difference between
                the hexagon and the chromaticity diagram is the difference
                between the two kinds of projection: parallel keeps the scale of
                a colour, central divides it out. That is why the hexagon needs
                a brightness bar and the diagram has nowhere to put one. The
                morph bends one into the other, and the solid puts the scale
                back as a third dimension, which is what xyY is.
              </HelpTip>
            </h1>
            <TabsList>
              {/* text-base: the page's size. The primitive's own text-sm is
                  for a dense panel, and this is the page's top-level switch. */}
              <TabsTrigger value="figures" className="px-3 text-base">The four figures</TabsTrigger>
              <TabsTrigger value="disagree" className="px-3 text-base">What they disagree about</TabsTrigger>
            </TabsList>
          </header>

          {/* ── tab 1: the 2x2 and the editor beside it ─────────────────── */}
          <TabsContent
            value="figures"
            keepMounted
            // Kept mounted: three WebGL contexts and a 7,380-vertex mesh live
            // in here, and rebuilding them on every visit to the prose tab
            // would cost a visible stall for no gain.
            className="@container/page min-h-0 flex-1 overflow-y-auto text-base data-[hidden]:hidden"
          >
            {/*
              * `min-h-full` rather than `h-full` below the breakpoint: once
              * the editor stops being a column beside the grid and becomes a
              * row under it, forcing the pair into one viewport made the
              * four-panel row overflow its track and paint straight over the
              * editor. Wide, the height is fixed and nothing scrolls; narrow,
              * it grows and the tab scrolls.
              */}
            <div className="grid min-h-full gap-3 @[1180px]/page:h-full @[1180px]/page:min-h-0 @[1180px]/page:grid-cols-[minmax(0,1fr)_330px]">
              <div className="@container/grid min-h-0">
                {/*
                  * The top row is taller than the bottom one, and the floor on
                  * it is the hexagon's: the two flat figures are the ones that
                  * need height, and the morph and the solid are square and do
                  * not. At a viewport about 1000px tall the whole grid fits;
                  * below that it scrolls rather than crushing a figure, which
                  * is the trade the hexagon's pills are worth.
                  */}
                <div
                  className="grid h-full min-h-0 grid-cols-1 gap-3 [grid-template-rows:repeat(4,minmax(360px,1fr))] @[780px]/grid:grid-cols-2 @[780px]/grid:[grid-template-rows:var(--cie-rows)]"
                  style={{ '--cie-rows': `minmax(${HEX_ROW_MIN + PANEL_CHROME}px,1.15fr) minmax(330px,1fr)` } as React.CSSProperties}
                >
                  <Panel
                    n={1}
                    title="The hexagon"
                    caption="The cube down its black-to-white diagonal."
                    help={<>The cube seen down its black-to-white diagonal. Three
                      mutually perpendicular axes project 120&deg; apart, so the six
                      remaining corners land on a regular hexagon. The projection loses
                      exactly one dimension &mdash; the neutral one &mdash; which is the
                      brightness bar beside it.</>}
                  >
                    <Fit width={FIT_HEX_STACKED} wideWidth={FIT_HEX_WIDE}>
                      <ColorHexagon
                        rgb={rgb}
                        hue={hsb.h}
                        brightness={hsb.b}
                        saturation={hsb.s}
                        hsl={hsl}
                        onHueChange={handleH}
                        onRgbChange={setRgbChannel}
                        onHsbChange={handleHsb}
                        onHslChange={setHslChannel}
                        // Snap rather than tween: animateToHsb lives in ColorPicker and
                        // is tied to its undo bookkeeping, none of which this page asks
                        // about. Without the prop the bar markers would not respond.
                        onAnimateToHsb={handleHsb}
                        blMode={blMode}
                        onBlModeChange={setBlMode}
                        colorSpace={colorSpace}
                        onColorSpaceChange={setColorSpace}
                        bare
                      />
                    </Fit>
                  </Panel>

                  <Panel
                    n={2}
                    title="CIE 1931 chromaticity"
                    caption={`x ${here ? here.x.toFixed(4) : '-'}  y ${here ? here.y.toFixed(4) : '-'}`}
                    help={<>The horseshoe is the spectral locus, drawn from the CIE 1931
                      2&deg; colour-matching functions at 5&nbsp;nm &mdash; measured data,
                      not a curve fitted here. Inside the sRGB triangle each point is
                      painted the brightest sRGB colour of that chromaticity. Outside it
                      there is no such colour, so it is a flat wash rather than a clamped
                      rainbow &mdash; and that stays true whichever gamut is outlined,
                      because the paint is made of pixels on this screen.</>}
                    aside={
                      <GamutPicker
                        visible={visible}
                        active={activeGamut}
                        onToggle={toggleGamut}
                        onActivate={activateGamut}
                      />
                    }
                  >
                    <Fit width={fitRatio(FIT_DIAGRAM)}>
                      <CieDiagram
                        // Live, not deferred. The bisection put this panel's
                        // cost at zero - mounting it moved a pointer move from
                        // 36ms to 36ms - and it is the one panel whose whole
                        // argument is what the dot does while you drag. A dot
                        // that lagged would undercut the standstill it exists
                        // to show.
                        rgb={rgb}
                        gamuts={drawn}
                        activeId={activeGamut}
                        showCircle={showCircle}
                        circleRadius={CIRCLE_R}
                        ghost={run?.from ?? null}
                      />
                    </Fit>
                    {/*
                      * Three rows, each exactly one line, in every state.
                      *
                      * This is the readout that changes most often on the page
                      * - it updates on every frame of a brightness drag - and
                      * it sits directly under the figure it is about. So it is
                      * a fixed grid of truncating rows rather than a
                      * paragraph: no wording can rewrap, the numbers are
                      * tabular at a fixed number of decimals, and the last
                      * line is the same sentence whatever is happening.
                      */}
                    <Reserved data-testid="standstill" aria-live="polite" lit={!!run}>
                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 tabular-nums">
                        <dt className="truncate opacity-70">Brightness</dt>
                        <dd className="truncate">{run ? `${run.fromB} \u2192 ${run.toB}` : '\u2014'}</dd>
                        <dt className="truncate opacity-70">Dot moved</dt>
                        <dd className="truncate">
                          {run
                            ? `${drift.toFixed(4)} \u00b7 ${(100 * drift / fig.side).toFixed(1)}% of a ${fig.side.toFixed(3)} side`
                            : `\u2014 \u00b7 the triangle is ${fig.side.toFixed(3)} on a side`}
                        </dd>
                        <dd className="col-span-2 truncate">
                          Scaling a colour does not move it off its ray.
                        </dd>
                      </dl>
                    </Reserved>
                  </Panel>

                  <Panel
                    n={3}
                    title="The hexagon, told the truth"
                    caption="Nothing is recoloured; every pixel moves to where the space puts it."
                    help={<>Nothing is recoloured &mdash; every pixel keeps the colour it had
                      and moves to where the space puts it, so every difference between the
                      two ends is a claim the hexagon makes that is not true. Two points are
                      pinned and no more: white at the centre, which both spaces put there
                      anyway, and red at its corner, which fixes the rotation and the scale.
                      Two points is exactly what a rotation-and-scale has room for. In
                      the <strong className="font-semibold">CIE</strong> frame the same morph
                      is drawn inside the spectral locus, so you can watch the whole wheel
                      land on the gamut triangle &mdash; and watch what the rest of the plane
                      has to do to let it. <strong className="font-semibold">The horseshoe
                      outside the triangle is an extrapolation, not a measurement:</strong> a
                      monochromatic stimulus is not a colour this gamut holds, so it has no
                      place on the hexagon at all. It is carried along its own ray by the
                      same angle and the same ratio the gamut boundary takes in that
                      direction &mdash; continuous, and exact on the boundary, but a
                      consequence of that rule rather than a fact about colour. The frame is
                      offered for CIE&nbsp;xy only: Oklab&rsquo;s a/b shrink with luminance,
                      so a chromaticity is a line there rather than a point and there is no
                      horseshoe to carry.
                      <br /><br />
                      Wheel to zoom, drag to pan, shift-drag to turn, double-click to come
                      back. The <strong className="font-semibold">CIE</strong> frame starts
                      turned by red&rsquo;s own angle from white, so at t&nbsp;=&nbsp;1 it is
                      the same way up as the chromaticity panel &mdash; a fifth of a degree
                      for sRGB and 13.5&deg; for ProPhoto, whose red is far round and whose
                      white is D50.</>}
                    aside={
                      // Two switches on one line that cannot wrap: a second
                      // row here would change the header's height and move the
                      // figure under it. Short labels are what buy that.
                      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
                        <Tabs value={morphTarget} onValueChange={(v) => setMorphTarget(v as MorphTarget)}>
                          <TabsList>
                            <TabsTrigger value="xy" className="px-2.5 text-base">xy</TabsTrigger>
                            <TabsTrigger value="oklab" className="px-2.5 text-base">Oklab</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <Tabs value={morphFrame} onValueChange={(v) => setMorphFrame(v as MorphFrame)}>
                          <TabsList>
                            <TabsTrigger value="hex" className="px-2.5 text-base">Hex</TabsTrigger>
                            <TabsTrigger
                              value="cie"
                              className="px-2.5 text-base"
                              // A chromaticity names a whole ray, and Oklab's
                              // a/b shrink with luminance - so the horseshoe is
                              // a line rather than a point in that plane and
                              // there is nothing honest to draw. See
                              // xyToMorphPoint in gamutMorph.ts.
                              disabled={morphTarget !== 'xy'}
                            >CIE</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    }
                  >
                    <HexMorph
                      rgb={figRgb}
                      hsb={figHsb}
                      target={morphTarget}
                      frame={morphTarget === 'xy' ? morphFrame : 'hex'}
                      gamuts={drawn}
                      activeId={activeGamut}
                      compact
                    />
                  </Panel>
                  <Panel
                    n={4}
                    title="The xyY solid"
                    caption={<>Green reaches Y&nbsp;{lum.g.toFixed(4)}, blue only Y&nbsp;{lum.b.toFixed(4)}.</>}
                    help={<>The gamut as a solid: the diagram as a floor, luminance rising
                      above it. The roof is the most luminance sRGB holds over each
                      chromaticity, and it is wildly uneven &mdash; green
                      reaches Y&nbsp;=&nbsp;{lum.g.toFixed(4)} and blue
                      only Y&nbsp;=&nbsp;{lum.b.toFixed(4)}, {(lum.g / lum.b).toFixed(1)}&times; lower.
                      That is why blue is dark. <strong className="font-semibold">Top</strong> looks
                      straight down, and the silhouette is the chromaticity diagram
                      above, the same way up &mdash; the same axes, the same
                      rotation, asserted in cieSolid.test.ts rather than eyeballed. Drag to orbit &mdash; which is what <strong className="font-semibold">Camera</strong> means
                      &mdash; and double-click to come back.</>}
                    aside={
                      <Tabs value={shape} onValueChange={(v) => setShape(v as 'xyY' | 'cube')}>
                        <TabsList>
                          <TabsTrigger value="xyY" className="px-2.5 text-base">xyY</TabsTrigger>
                          <TabsTrigger value="cube" className="px-2.5 text-base">Cube</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    }
                  >
                    <Fit width={fitRatio(FIT_SQUARE)}>
                      <div className="aspect-square overflow-hidden rounded-md">
                        <CieSolid rgb={figRgb} shape={shape} gamuts={drawn} activeId={activeGamut} step={step} />
                      </div>
                    </Fit>
                  </Panel>

                </div>
              </div>

              {/* ── the editor ───────────────────────────────────────────── */}
              <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-3">
                <div className="flex items-stretch gap-3">
                  <PreviewSwatch hex={hex} className="w-[76px] min-h-20" />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <HexInput hex={hex} onChange={handleHex} />
                    <div className="flex flex-col gap-0.5 text-base tabular-nums text-muted-foreground">
                      <span className="truncate">x {here ? here.x.toFixed(4) : '-'} &nbsp; y {here ? here.y.toFixed(4) : '-'}</span>
                      <span className="truncate">Y {here ? here.Y.toFixed(4) : '-'} &nbsp; reach {reach !== null ? reach.toFixed(3) : '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <ColorSlider label="H" group="hsb" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, colorSpace)} onChange={handleH} />
                  <ColorSlider label="S" group="hsb" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, colorSpace)} onChange={handleS} />
                  <ColorSlider label="B" group="hsb" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, colorSpace)} onChange={handleB} />
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  {/* One line, whatever the name: "ProPhoto RGB" wrapped where
                      "sRGB" did not, and picking a different gamut moved
                      everything below this heading down by a line. */}
                  <div className="flex flex-nowrap items-center justify-between gap-2">
                    <h2 className="flex min-w-0 items-center gap-1.5 text-lg font-semibold">
                      <span className="truncate">{active.name}</span>
                      <HelpTip label="What the reading gamut decides">
                        A gamut is three chromaticities and a white point, and
                        nothing else about a colour space changes the triangle.
                        Ticking one draws it; reading from it moves the solid
                        outline, the corner letters and the two figures here.
                        The paint inside does not follow: it is made of pixels
                        on this screen, and this screen is sRGB.
                        <br /><br />
                        Primaries are typed from
                        &nbsp;<span className="font-mono">{active.source}</span>
                        &nbsp;and checked against culori
                        in <span className="font-mono">gamuts.test.ts</span>.
                      </HelpTip>
                    </h2>
                    <GamutPicker
                      visible={visible}
                      active={activeGamut}
                      onToggle={toggleGamut}
                      onActivate={activateGamut}
                    />
                  </div>
                  {/* Three rows, one line each: every value is a fixed number
                      of decimals and every row truncates, so switching gamuts
                      changes the digits and nothing else. */}
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-base">
                    <dt className="truncate text-muted-foreground">White</dt>
                    <dd className="truncate tabular-nums">{active.whiteName} &nbsp;{active.white.x.toFixed(4)}, {active.white.y.toFixed(4)}</dd>
                    <dt className="truncate text-muted-foreground">xy area</dt>
                    <dd className="truncate tabular-nums">{(activeShare * 100).toFixed(1)}% of the horseshoe</dd>
                    <dt className="truncate text-muted-foreground">Wheel outside</dt>
                    <dd className="truncate tabular-nums">{(activeCircleOut * 100).toFixed(1)}% of an r&nbsp;=&nbsp;{CIRCLE_R.toFixed(2)} circle</dd>
                  </dl>
                  {/*
                    * THE EXHIBIT, AND IT IS ALSO THE TEST.
                    *
                    * The same three numbers, spelled twice: once as a hex -
                    * which every browser reads as sRGB - and once as
                    * `color(<space> ...)`, which a browser on a wide-gamut
                    * display renders at that space's full width. On a screen
                    * that has the width the right square is visibly the more
                    * saturated of the two; on an sRGB screen they are
                    * identical, because the second one is clamped back to the
                    * first. With sRGB itself selected they are the same
                    * colour by definition, and the line below says so.
                    *
                    * Two squares against each other, rather than a claim in
                    * prose, because this is the one thing on the page that
                    * cannot be settled by arithmetic: it depends on the
                    * reader's monitor.
                    */}
                  <div className="flex items-stretch gap-2">
                    <div
                      className="h-11 min-w-0 flex-1 rounded-md"
                      style={{ background: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}
                      aria-label={`The same numbers as sRGB, ${hex.toUpperCase()}`}
                    />
                    <div
                      className="h-11 min-w-0 flex-1 rounded-md"
                      style={{ background: cssColorIn(activeGamut, rgb.r, rgb.g, rgb.b), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}
                      aria-label={`The same numbers as ${active.name}`}
                    />
                  </div>
                  {/*
                    * Three wordings and a name that changes length, so the
                    * box is sized against the worst case of both: the same
                    * three sentences are laid out invisibly with the longest
                    * gamut name in them, and the real one goes on top. Sized
                    * to the current content alone, picking Adobe RGB (1998)
                    * over sRGB grew this by a line and moved the controls
                    * under it.
                    */}
                  <Stack
                    className="text-base leading-snug text-muted-foreground"
                    show="now"
                    states={[
                      ...GAMUT_NOTE_SIZERS,
                      { key: 'now', node: <p>{gamutNote(active.name, activeGamut === 'srgb' ? 'same' : DISPLAY_IS_P3 ? 'wide' : 'narrow')}</p> },
                    ]}
                  />

                  {/* A Stack rather than a guessed height: both wordings are
                      laid out and the box takes the taller of them at whatever
                      width the column currently has. */}
                  <Reserved lit={active.imaginary}>
                    <Stack
                      show={active.imaginary ? 'imaginary' : 'real'}
                      states={[
                        {
                          key: 'imaginary',
                          node: (
                            <><strong className="font-semibold">Imaginary primaries.</strong>{' '}
                              Two of this gamut&rsquo;s corners are outside the horseshoe &mdash; no
                              light of any spectrum has that chromaticity. By design, not by
                              mistake: an encoding big enough for every real surface colour has
                              to spend part of itself on colours that do not exist.</>
                          ),
                        },
                        {
                          key: 'real',
                          node: (
                            <><strong className="font-semibold">Real primaries.</strong>{' '}
                              Every corner is a colour some light really has, so the whole
                              triangle sits inside the horseshoe.</>
                          ),
                        },
                      ]}
                    />
                  </Reserved>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <label className="flex items-center gap-2.5 text-base">
                    <Checkbox checked={showCircle} onCheckedChange={() => setShowCircle((v) => !v)} />
                    <span>Circle of radius {CIRCLE_R.toFixed(2)} about white</span>
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base text-muted-foreground">Solid detail</span>
                    <Tabs value={String(step)} onValueChange={(v) => setStep(Number(v) as CubeStep)}>
                      <TabsList>
                        <TabsTrigger value="1" className="px-2.5 text-base">256</TabsTrigger>
                        <TabsTrigger value="17" className="px-2.5 text-base">16</TabsTrigger>
                        <TabsTrigger value="51" className="px-2.5 text-base">6</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([['Red', { h: 0, s: 100, b: 100 }], ['Green', { h: 120, s: 100, b: 100 }],
                      ['Blue', { h: 240, s: 100, b: 100 }], ['Dark blue', { h: 240, s: 100, b: 20 }],
                      ['White', { h: 0, s: 0, b: 100 }]] as const).map(([label, v]) => (
                        <Button key={label} size="sm" variant="outline" className="text-base" onClick={() => setHsbClear({ ...v })}>{label}</Button>
                      ))}
                  </div>
                </div>
              </aside>
            </div>
          </TabsContent>

          {/* ── tab 2: what the figures disagree about ──────────────────── */}
          <TabsContent
            value="disagree"
            className="min-h-0 flex-1 overflow-y-auto text-base data-[hidden]:hidden"
          >
            <div className="mx-auto flex max-w-[1400px] flex-col gap-4 pb-4">
              <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                <h2 className="text-lg font-semibold">What the three disagree about</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">Parallel against central</h3>
                    <p className="text-muted-foreground">
                      Under central projection, scaling a colour does not move it, so
                      brightness vanishes: HSB(240,&nbsp;100,&nbsp;100) and
                      HSB(240,&nbsp;100,&nbsp;10) both land at exactly x&nbsp;0.1500,
                      y&nbsp;0.0600. The hexagon keeps the scale, which is the only
                      reason it needs a brightness bar at all.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">Gamma-encoded against linear</h3>
                    <p className="text-muted-foreground">
                      The hexagon&rsquo;s geometry is computed on gamma-encoded
                      channels; chromaticity is computed after the transfer function
                      is undone. So a constant-saturation ring is not a shrunken
                      triangle: S&nbsp;=&nbsp;50 sits anywhere from 39% to 74% of the
                      way out to the rim depending on the hue.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">What both agree about</h3>
                    <p className="text-muted-foreground">
                      The fully saturated rim <em>is</em> the triangle&rsquo;s perimeter,
                      exactly. A colour with min(R,G,B)&nbsp;=&nbsp;0 is a mix of two
                      primaries, and a mix of two primaries lies on the line between
                      them. Traced every half-degree, the distance to the nearest edge
                      is floating-point zero.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">The wheel is not the gamut</h3>
                    <p className="text-muted-foreground">
                      Reach from white varies 3.72&times; over the six corners: red
                      0.327, blue 0.314, green 0.271, yellow 0.206, magenta 0.175,
                      cyan 0.088. A circle of radius {CIRCLE_R.toFixed(2)} about white &mdash;
                      the shape a colour wheel implies &mdash; has {(CIRCLE_OUT * 100).toFixed(1)}%
                      of its circumference outside sRGB{activeGamut === 'srgb' ? '' : `, and ${(activeCircleOut * 100).toFixed(1)}% outside ${active.name}`}.
                      Turn it on and look. Those six reaches are sRGB&rsquo;s; the reading
                      gamut changes every one of them, which is the point of being able to
                      change it.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">Hue is not an angle</h3>
                    <p className="text-muted-foreground">
                      HSB hue against the true angle about white: red 0&nbsp;&rarr;&nbsp;0.2&deg;,
                      yellow 60&nbsp;&rarr;&nbsp;58.8&deg;, green 120&nbsp;&rarr;&nbsp;<strong className="font-semibold text-foreground">92.7&deg;</strong>,
                      cyan 180&nbsp;&rarr;&nbsp;180.2&deg;, blue 240&nbsp;&rarr;&nbsp;238.8&deg;,
                      magenta 300&nbsp;&rarr;&nbsp;<strong className="font-semibold text-foreground">272.7&deg;</strong>.
                      The gaps run 58.7&deg;, 33.9&deg;, 87.5&deg; and then repeat, because
                      the triangle has three corners and three edge-points.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold">Y is not lightness</h3>
                    <p className="text-muted-foreground">
                      The solid&rsquo;s vertical axis is <em>linear luminance</em>. A colour
                      at Y&nbsp;=&nbsp;0.5 does not look half as light as one at
                      Y&nbsp;=&nbsp;1.0 &mdash; perceptual lightness is roughly a cube root of
                      it, which is what Oklab&rsquo;s L is. So the solid looks bottom-heavy
                      in a way perception does not agree with, and that gap is the reason
                      Oklab exists.
                    </p>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                <h2 className="text-lg font-semibold">
                  What the morph measures, in {morphTarget === 'xy' ? 'CIE xy' : 'Oklab a/b'}
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                  <MorphReadings rgb={rgb} hsb={hsb} target={morphTarget} gamut={activeGamut} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold">Six spokes become three</h3>
                      <p className="text-base text-muted-foreground">
                        In xy the gaps between neighbouring corners run {fig.xyGaps[0].toFixed(1)}&deg;,
                        {' '}{fig.xyGaps[1].toFixed(1)}&deg;, {fig.xyGaps[2].toFixed(1)}&deg; and then repeat
                        &mdash; exactly, to better than a billionth of a degree. A colour and its
                        complement sum to white in linear RGB, so white lies on the segment between
                        them and the two are precisely opposite: cyan is at {fig.xyCyan.toFixed(1)}&deg;
                        from red. Three corners and three points stranded on the edges between them,
                        where the hexagon promised six of one kind.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold">Oklab is not three-fold either</h3>
                      <p className="text-base text-muted-foreground">
                        That repeat is a fact about a <em>linear</em> map, and Oklab is not one: the
                        cube root between LMS and Oklab does not carry a straight line to a straight
                        line, so white stops lying between a colour and its complement. Cyan lands at
                        {' '}{fig.okCyan.toFixed(1)}&deg; from red rather than 180&deg;, and the six gaps
                        are six different numbers from {Math.min(...fig.okGaps).toFixed(1)}&deg; to
                        {' '}{Math.max(...fig.okGaps).toFixed(1)}&deg;. Neither space agrees with the
                        hexagon, and they do not agree with each other.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold">White slides out from under it</h3>
                      <p className="text-base text-muted-foreground">
                        The hexagon pins white dead centre by construction. Take the rim&rsquo;s own
                        area centroid and it is {(100 * Math.hypot(fig.xyRim.centroid.x, fig.xyRim.centroid.y)).toFixed(0)}% of
                        a radius away in xy and {(100 * Math.hypot(fig.okRim.centroid.x, fig.okRim.centroid.y)).toFixed(0)}% away
                        in Oklab, in different directions. Reach from white varies
                        {' '}{fig.xySpread.toFixed(2)}&times; over the six in xy and {fig.okSpread.toFixed(2)}&times; in
                        Oklab. The Oklab shape keeps {(fig.okRim.area * 100).toFixed(0)}% of the
                        hexagon&rsquo;s area while doing it, which is why it reads as a distortion
                        rather than a resize; the xy triangle keeps {(fig.xyRim.area * 100).toFixed(0)}%.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold">The wheel inside everything visible</h3>
                      <p className="text-base text-muted-foreground">
                        The morph panel&rsquo;s <strong className="font-semibold text-foreground">CIE</strong> frame
                        pulls the camera back until the spectral locus is in shot. The horseshoe
                        does not move, and that is not a shortcut: the remap is a map of sRGB
                        colours, and monochromatic light is not an sRGB colour, so it has nothing
                        to say about the curve. What it has something to say about is the wheel,
                        which at t&nbsp;=&nbsp;1 sits exactly on the {active.name} triangle
                        &mdash; {(activeShare * 100).toFixed(1)}% of the horseshoe&rsquo;s xy area,
                        and no part of the diagram outside it.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <p className="rounded-lg border border-border bg-card p-4 text-base text-muted-foreground">
                Colour-matching functions from CVRL (CIE 1931 2&deg;, 5&nbsp;nm),
                committed as <code className="font-mono">src/utils/cieCmf1931.ts</code> with
                the source URL. Gamut primaries are typed from their standards
                in <code className="font-mono">src/utils/gamuts.ts</code>, each with
                its citation. Every figure on this page is asserted
                in <code className="font-mono">cie.test.ts</code>, <code className="font-mono">gamuts.test.ts</code> and
                <code className="font-mono"> gamutMorph.test.ts</code>, with culori as an
                independent second opinion on the transforms.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
