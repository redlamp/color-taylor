/**
 * Oklch lab: one colour, held as Oklch, shown every way at once.
 *
 * The question the page exists to answer is what an Oklch bank should do at
 * the edge of sRGB. Unlike RGB, HSB and HSL, Oklch can name colours the screen
 * cannot show - and the C channel is where that bites, because how far C may
 * go depends on the L and H beside it. The "Stop chroma at the gamut edge"
 * switch puts the two candidate answers side by side: a handle that stops at
 * the cusp, or a handle that runs the whole track while the page says plainly
 * that the colour is out of reach.
 *
 * The Absolute/Relative switch asks a harder version of the same question:
 * whether C should be a number the user sets at all. Relative spends the track
 * on 0-100% of whatever fits at this L and H, so no gesture can leave the
 * gamut and neither the wash nor the hairline has anything to mark. What it
 * costs is that a percentage is not an amount: at L 0.70, 70% is C 0.083 at
 * cyan and C 0.225 at magenta, measured. The page shows that rather than
 * hiding it - see the landmark row at the foot of the bank.
 *
 * Nothing here is wired to the picker. See lab/oklch.html for how to run it.
 */
import { useCallback, useState } from 'react';
import {
  oklchToRgb, rgbToOklch, rgbToHex, rgbToHsb, rgbToHsl, hsbToRgb, hslToRgb,
  type HSB, type Oklch, type RGB,
} from '@/utils/colorConversions';
import { maxChromaForLH } from '@/utils/oklchGamut';
import type { ColorSpace } from '@/utils/sliderGradients';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import ColorSlider from '@/components/ColorSlider';
import ColorHexagon from '@/components/ColorHexagon';
import HexInput from '@/components/HexInput';
import PreviewSwatch from '@/components/PreviewSwatch';
import FlatSection from './FlatSection';
import { Stack } from './Reserved';
import {
  CHROMA_MAX, OUT_OF_GAMUT_WASH, lightnessRamp, chromaRamp, hueRamp, saturationRamp,
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
 * a value between two of them is not reachable by any gesture. And a colour
 * sitting exactly on the boundary reads as outside sRGB - `oklchToRgb` finds a
 * linear channel a float hair past 1 and says so, correctly - so clamping to
 * the cusp would leave the page announcing that the colour it had just forced
 * into gamut was out of it. One step in is both reachable and true.
 *
 * The track's marker still sits on the cusp: that is where the gamut ends,
 * whatever the bank can address, and the difference is a quarter of a pixel.
 */
const holdChroma = (c: number, l: number, h: number) => Math.min(
  c,
  Number((Math.floor(maxChromaForLH(l, h) / FINE) * FINE).toFixed(3)),
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
 * and every one of them lands on a colour.
 *
 * A finer step would buy little. Measured over (L, h) on a 0.01 x 2deg grid,
 * one percent of S moves the rendered colour by 2 bytes or less in 61% of
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
const chromaFromSat = (s: number, l: number, h: number) => Number(
  (Math.floor(((s / 100) * maxChromaForLH(l, h)) / FINE) * FINE).toFixed(3),
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
const satFromChroma = (c: number, l: number, h: number): number | null => {
  const max = maxChromaForLH(l, h);
  if (!(max > 0)) return null;
  return Math.max(0, Math.min(100, Math.round((c / max) * 100)));
};

/**
 * The six corners of the sRGB cube, measured rather than quoted, and named the
 * way a person names them. They are where the gamut is widest and narrowest in
 * turn, so a single S read across them is the honest cost of the relative
 * model: at L 0.70 the cusp is C 0.120 at cyan and C 0.322 at magenta, so the
 * same 70% is C 0.083 there and C 0.225 here - nearly three times the colour
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

/** Where the page opens: Tailwind's Blue 500, an ordinary colour to arrive on. */
const START: Oklch = rgbToOklch(59, 130, 246);

/**
 * Places to read Oklch from. Blue is the wiki note's own example - the sRGB
 * gamut is not star-shaped there - and the last one asks for a chroma no
 * screen can deliver, which is the state this page is for.
 */
const PRESETS: ReadonlyArray<{ name: string; oklch: Oklch }> = [
  { name: 'sRGB blue', oklch: rgbToOklch(0, 0, 255) },
  { name: 'Blue 500', oklch: START },
  { name: 'Mid grey', oklch: { l: 0.6, c: 0, h: 0 } },
  { name: 'Past the edge', oklch: { l: 0.65, c: 0.32, h: 150 } },
];

/**
 * A result worn as a chip of the colour itself, the way the Equations panel's
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
            className="inline-grid cursor-pointer place-items-center rounded border-0 px-2 py-1 text-center font-mono tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
 * A derived channel: the letter, the share of its range as a bar, the number.
 *
 * Not a ColorSlider, and the choice is worth stating. ColorSlider has no
 * read-only presentation - its track, handle and stepper all take the pointer
 * unconditionally - and every way of faking one is worse than this:
 * `pointer-events-none` leaves the stepper in the tab order, and `inert` takes
 * the readout out of the accessibility tree, which is the one place a readout
 * has to stay. Giving ColorSlider a `readOnly` prop would be a second change
 * to a shared component for a lab page's sake, so these are plain instead.
 */
function Readout({ letter, name, value, max, suffix = '', tint }: {
  letter: string; name: string; value: number; max: number; suffix?: string; tint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 shrink-0 font-semibold text-muted-foreground" aria-hidden="true">{letter}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: tint }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono tabular-nums">
        <span className="sr-only">{name}: </span>{value}{suffix}
      </span>
    </div>
  );
}

/**
 * One chroma setting, read across the six landmark hues at the current L.
 *
 * This is the page's counterweight, and it earns its space in either mode
 * because each mode pays for what it holds fixed. Relative holds the
 * percentage: every swatch exists, and no two of them carry the same amount of
 * colour. Absolute holds the number: the swatches that exist are strictly
 * comparable, and the rest are washed out because there is no such colour at
 * that hue. Neither is free, and the row is where you see which price you are
 * paying.
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
        const { rgb, inGamut } = oklchToRgb(l, c, h);
        const swatch = rgbToHex(rgb.r, rgb.g, rgb.b);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onPick(h)}
            aria-label={`${name}, hue ${h.toFixed(1)}, chroma ${c.toFixed(3)}${inGamut ? '' : ' - outside sRGB'}`}
            className="flex cursor-pointer flex-col gap-1 rounded border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden="true"
              className="block h-10 w-full rounded border border-border"
              // Two layers, painted last-first, so an unreachable swatch is
              // marked exactly the way the C track marks unreachable track.
              style={{ background: inGamut ? swatch : `linear-gradient(${OUT_OF_GAMUT_WASH}, ${OUT_OF_GAMUT_WASH}), ${swatch}` }}
            />
            <span className="truncate">{name}</span>
            {/* Where the colour exists, its C. Where it does not, the number
                that matters instead: where this hue actually stops. */}
            <span className={`font-mono tabular-nums ${inGamut ? 'text-muted-foreground' : 'text-destructive'}`}>
              {inGamut ? c.toFixed(3) : `max ${maxChromaForLH(l, h).toFixed(3)}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function OklchLab() {
  /**
   * The page's colour, held as Oklch and as nothing else.
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
  const [sat, setSat] = useState<number>(() => satFromChroma(START.c, START.l, START.h) ?? 0);
  /** The open design question, as a switch. See the file comment. */
  const [hold, setHold] = useState(false);
  /** The hexagon's own two host settings, which it expects to be controlled. */
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');

  const limit = maxChromaForLH(oklch.l, oklch.h);
  const relative = mode === 'relative';

  /**
   * What C becomes when L or H moves the cusp out from under it. Every path
   * that changes L or H goes through this, and it is the whole difference
   * between the two modes:
   *
   *   relative - C is re-derived from the percentage, so the handle keeps its
   *              *share* and the colour stays inside the gamut by construction.
   *   absolute - C is a number the user set, so it either gets dragged back to
   *              the edge or is left stranded past it, as the switch says.
   */
  const reChroma = useCallback((held: number, l: number, h: number) => {
    if (mode === 'relative') return chromaFromSat(sat, l, h);
    return hold ? holdChroma(held, l, h) : held;
  }, [mode, sat, hold]);

  const setL = useCallback((l: number) => setOklch((p) => (
    { ...p, l, c: reChroma(p.c, l, p.h) }
  )), [reChroma]);
  const setC = useCallback((c: number) => setOklch((p) => (
    { ...p, c: hold ? holdChroma(c, p.l, p.h) : c }
  )), [hold]);
  const setH = useCallback((h: number) => setOklch((p) => (
    { ...p, h, c: reChroma(p.c, p.l, h) }
  )), [reChroma]);

  /** The relative track. S is the state; C is what it resolves to, right now. */
  const setSaturation = useCallback((s: number) => {
    setSat(s);
    setOklch((p) => ({ ...p, c: chromaFromSat(s, p.l, p.h) }));
  }, []);

  const toggleHold = useCallback(() => {
    setHold((on) => !on);
    // Turning it on pulls a stranded C back to the cusp. Turning it off is a
    // no-op here, since C is already inside the limit.
    setOklch((p) => ({ ...p, c: holdChroma(p.c, p.l, p.h) }));
  }, []);

  /**
   * The mode switch changes how C is addressed and never what colour is on
   * screen. Neither direction writes to `oklch`, so the swatch and the hex are
   * bit-identical across the switch and across a round trip through it.
   *
   * Absolute -> relative has one thing to do: read the current C as a
   * percentage of what fits. Relative -> absolute has none at all, because C
   * was the state the whole time and S was only ever a way of setting it.
   *
   * The one case worth knowing: arriving in relative mode with a C already past
   * the cusp parks the handle at 100% while the colour stays where it was and
   * the page goes on saying it is out of gamut. The alternative is to snap the
   * colour on a switch nobody asked a colour change of. The next touch of any
   * track resolves it - inward, which is the mode's point.
   */
  const switchMode = useCallback((next: ChromaMode) => {
    setMode(next);
    if (next !== 'relative') return;
    const s = satFromChroma(oklch.c, oklch.l, oklch.h);
    if (s !== null) setSat(s);
  }, [oklch]);

  /**
   * A colour arriving whole, from a preset or from sRGB. It is taken as given
   * and S is re-read from it, so in relative mode the percentage follows the
   * hexagon rather than fighting it - drag the wheel and watch the S handle
   * move with it.
   */
  const applyOklch = useCallback((next: Oklch) => {
    setOklch(next);
    const s = satFromChroma(next.c, next.l, next.h);
    if (s !== null) setSat(s);
  }, []);

  const jumpTo = useCallback((target: Oklch) => applyOklch(
    mode === 'absolute' && hold
      ? { ...target, c: holdChroma(target.c, target.l, target.h) }
      : target,
  ), [applyOklch, mode, hold]);

  const { rgb, inGamut } = oklchToRgb(oklch.l, oklch.c, oklch.h);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  /** Where the clamped colour actually landed - the evidence the clamp destroys. */
  const landed = rgbToOklch(rgb.r, rgb.g, rgb.b);

  /**
   * The other direction: a colour arriving as sRGB - from the hexagon, or
   * typed into the hex field - measured back into Oklch.
   *
   * `rgbToOklch` is exact in this direction; every sRGB colour has an Oklch
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
  const applyHsb = (patch: Partial<HSB>) => {
    const n = { ...hsb, ...patch };
    setFromRgb(hsbToRgb(n.h, n.s, n.b));
  };
  const applyHsl = (channel: 'h' | 's' | 'l', value: number) => {
    const n = { ...hsl, [channel]: value };
    setFromRgb(hslToRgb(n.h, n.s, n.l));
  };

  const spell = (v: Oklch) => `oklch(${v.l.toFixed(3)} ${v.c.toFixed(3)} ${v.h.toFixed(1)})`;
  const asked = spell(oklch);
  // The chip wears the colour, so its text has to clear it. Oklch says which
  // way round: light text under L 0.6, dark text over it.
  const chipInk = landed.l > 0.6 ? '#000' : '#fff';

  return (
    <TooltipProvider delay={0}>
      <div className="mx-auto max-w-[1100px] bg-background px-4 py-6 text-base text-foreground">
        <header className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Oklch Lab</h1>
          <p className="max-w-[70ch] text-muted-foreground">
            One colour, held as Oklch. L, C and H drive everything below them;
            RGB and HSB are read back out of the result. Oklch is bigger than
            sRGB, so some of what you can name here has no colour on this
            screen - the C track shows where that starts. The bank's{' '}
            <span className="text-foreground">Absolute C / Relative S</span>{' '}
            switch is the other answer to that: a track that spends all of
            itself on the colours that do exist here.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            {/*
             * The app's real hexagon, not a copy of it - the same component
             * the picker and the plugin render. It speaks sRGB, so every
             * gesture on it arrives here as bytes and is measured back into
             * Oklch, and the bank below moves with it. Watch C while you drag
             * it: everything the hexagon can reach is inside the gamut, so the
             * handle never leaves the in-gamut half of its track.
             */}
            <FlatSection title="Hexagon">
              <div className="rounded-lg border border-border p-4">
                <ColorHexagon
                  rgb={rgb}
                  hue={hsb.h}
                  brightness={hsb.b}
                  saturation={hsb.s}
                  hsl={hsl}
                  onHueChange={(h) => applyHsb({ h })}
                  onRgbChange={(channel, value) => setFromRgb({ ...rgb, [channel]: value })}
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
                  // The host frames it, and this host has no swatch library, so
                  // `onRecordColor` is left out the way the prop says a host
                  // without one should.
                  bare
                />
              </div>
            </FlatSection>

            {/* The colour, and the three ways to take it away with you. */}
            <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="flex items-stretch gap-4">
                <PreviewSwatch hex={hex} className="w-[120px] min-h-24" />
                <div className="flex min-w-0 flex-col justify-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-12 shrink-0 text-muted-foreground">CSS</span>
                    <CopyChip text={asked} color={hex} textColor={chipInk} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-12 shrink-0 text-muted-foreground">Hex</span>
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

              {/*
               * The one thing about this page a reader will otherwise get
               * wrong. CSS Color 4 has a percentage for chroma too and it is
               * not this one: the spec pins 100% to 0.4 flat, at every L and
               * every H, so `oklch(0.7 50% 264)` is C 0.2 whether or not 0.2
               * fits there. A relative S cannot be copied out as a percentage
               * without changing what it means, which is why the chip above
               * spells C in both modes.
               */}
              {/* Reserved rather than conditional: this note comes and goes
                  with the mode switch, and everything under it is what the
                  page is about. An empty twin holds the space, so the height
                  is the note's real height at this width rather than a guess. */}
              <Stack
                show={relative ? 'note' : 'none'}
                states={[
                  {
                    key: 'note',
                    node: (
                      <p className="text-muted-foreground">
                        Copied as C, never as a percentage:{' '}
                        <span className="font-mono">oklch(0.7 50% 264)</span> means C 0.200 in CSS,
                        because the spec fixes 100% at 0.4 flat rather than at what fits.
                      </p>
                    ),
                  },
                  { key: 'none', node: null },
                ]}
              />

              {/*
               * The page's most interesting state, said plainly - and said in
               * the same shape either way.
               *
               * The three rows used to appear only when the colour left the
               * gamut, so crossing the boundary during a drag grew the panel
               * by a third of its height and shoved the figure below it down
               * the screen. They are always drawn now. In gamut that is not
               * padding: "asked for" and "got back" being the same line is the
               * fact, and the C limit is where the boundary is about to be.
               */}
              <div
                id="oklch-gamut"
                className="flex flex-col gap-2 rounded-md border border-border p-3"
                aria-live="polite"
                style={inGamut ? undefined : { borderColor: 'var(--destructive)' }}
              >
                <Stack
                  className="text-muted-foreground"
                  show={inGamut ? 'in' : 'out'}
                  states={[
                    {
                      key: 'in',
                      node: (
                        <p>
                          <span className="font-semibold text-foreground">Inside sRGB.</span>{' '}
                          The swatch is the colour named above, to the nearest 8-bit step,
                          and the two lines below say the same thing twice on purpose.
                        </p>
                      ),
                    },
                    {
                      key: 'out',
                      node: (
                        <p>
                          <span className="font-semibold text-foreground">Outside sRGB.</span>{' '}
                          No colour on this screen has that address. The swatch is
                          what the clamp gives instead - a different colour, and
                          above all a duller one.
                        </p>
                      ),
                    },
                  ]}
                />
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono tabular-nums">
                  {/* `spell` is a fixed format at fixed decimals and the hex
                      is always seven characters, so these are one line each
                      and truncate rather than wrap: a second line here would
                      move the figure below. */}
                  <dt className="font-sans text-muted-foreground">Asked for</dt>
                  <dd className="min-w-0 truncate">{asked}</dd>
                  <dt className="font-sans text-muted-foreground">Got back</dt>
                  <dd className="min-w-0 truncate">{spell(landed)} &nbsp;{hex.toUpperCase()}</dd>
                  <dt className="font-sans text-muted-foreground">C stops at</dt>
                  <dd className="min-w-0">
                    {limit.toFixed(3)}{' '}
                    <span className="font-sans text-muted-foreground">at this L and H</span>
                  </dd>
                </dl>
              </div>
            </section>

            <FlatSection
              title="Oklch"
              headerRight={
                <Tabs value={mode} onValueChange={(v) => switchMode(v as ChromaMode)}>
                  <TabsList>
                    {/* text-base: the page's size. The primitive's own text-sm
                        is right inside a dense panel and wrong out here. */}
                    <TabsTrigger value="absolute" className="px-3 text-base">Absolute C</TabsTrigger>
                    <TabsTrigger value="relative" className="px-3 text-base">Relative S</TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            >
              <div className="flex flex-col gap-3">
                <ColorSlider
                  label="L" group="oklch" value={oklch.l} max={1} step={FINE}
                  gradient={lightnessRamp(oklch.c, oklch.h)} onChange={setL}
                />
                {relative ? (
                  <ColorSlider
                    label="S" group="oklch" value={sat} max={100} step={SAT_STEP} suffix="%"
                    gradient={saturationRamp(oklch.l, oklch.h, limit)} onChange={setSaturation}
                  />
                ) : (
                  <ColorSlider
                    label="C" group="oklch" value={oklch.c} max={CHROMA_MAX} step={FINE}
                    gradient={chromaRamp(oklch.l, oklch.h, limit)} onChange={setC}
                  />
                )}
                {/* Indented past the channel letter, so it reads as a line
                    belonging to the track above it rather than a fourth row.
                    In relative mode this is the page's second promise: you set
                    a share, and the number you publish is always in view. */}
                {/*
                  * A Stack, not a conditional: the relative wording is longer
                  * than the absolute one and wraps to a second line before the
                  * absolute one does, so switching modes - or simply dragging S
                  * from 9% to 100% - used to move both sliders under it. Both
                  * wordings are laid out and the taller decides the height, at
                  * whatever width the column happens to be. The percentage is
                  * boxed to a fixed 4ch so 9% and 100% are the same width.
                  */}
                <Stack
                  className="-mt-1 pl-5 text-muted-foreground"
                  show={relative ? 'relative' : 'absolute'}
                  states={[
                    {
                      key: 'relative',
                      node: (
                        <p>
                          <span className="inline-block w-[4ch] text-right font-mono tabular-nums text-foreground">{sat}%</span>
                          {' resolves to '}
                          <span className="font-mono tabular-nums text-foreground">C {oklch.c.toFixed(3)}</span>
                          {' · max C '}
                          <span className="font-mono tabular-nums">{limit.toFixed(3)}</span> at this L and H
                        </p>
                      ),
                    },
                    {
                      key: 'absolute',
                      node: (
                        <p>
                          max C <span className="font-mono tabular-nums">{limit.toFixed(3)}</span> at this L and H
                        </p>
                      ),
                    },
                  ]}
                />
                <ColorSlider
                  label="H" group="oklch" value={oklch.h} max={360} step={HUE_STEP} wrap suffix="°"
                  gradient={hueRamp(oklch.l, oklch.c)} onChange={setH}
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 rounded-md border border-border p-3">
                {relative ? (
                  /*
                   * Hidden rather than disabled. The switch asks what should
                   * happen when C passes the cusp, and in this mode nothing
                   * can: 100% is the cusp. A greyed-out control would still be
                   * putting the question.
                   */
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Nothing to stop.</span>{' '}
                    Stop chroma at the gamut edge is an Absolute-mode question -
                    here the edge is 100%, and the track ends there.
                  </p>
                ) : (
                  <>
                    <SwitchRow
                      label="Stop chroma at the gamut edge"
                      checked={hold}
                      onToggle={toggleHold}
                      ariaLabel="Stop chroma at the gamut edge"
                    />
                    <p className="text-muted-foreground">
                      {hold
                        ? 'C cannot leave sRGB. Moving L or H pulls it back to the line, so the colour is always real - and the value you set changes under you.'
                        : 'C runs the whole track. Past the line the colour stops changing and the page says so, which is honest but hands you a value the screen cannot keep.'}
                    </p>
                  </>
                )}
              </div>
            </FlatSection>

            <FlatSection title="One setting, six hues">
              <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
                <p className="text-muted-foreground">
                  {relative
                    ? <>Every swatch is <span className="font-mono tabular-nums text-foreground">{sat}%</span> at this L. One number, six different amounts of colour - that is what the relative track costs, and it does not go away by not being shown.</>
                    : <>Every swatch is <span className="font-mono tabular-nums text-foreground">C {oklch.c.toFixed(3)}</span> at this L. One amount of colour, and at some hues no colour at all - that is what the absolute track costs.</>}
                </p>
                <LandmarkRow
                  l={oklch.l}
                  chromaAt={(h) => (relative ? chromaFromSat(sat, oklch.l, h) : oklch.c)}
                  onPick={setH}
                />
              </div>
            </FlatSection>
          </div>

          <div className="flex flex-col gap-6">
            <FlatSection title="Derived">
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold">RGB</h4>
                  <Readout letter="R" name="Red" value={rgb.r} max={255} tint="#e74c4c" />
                  <Readout letter="G" name="Green" value={rgb.g} max={255} tint="#2e9e2e" />
                  <Readout letter="B" name="Blue" value={rgb.b} max={255} tint="#3385ff" />
                </div>
                <hr className="border-border" />
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold">HSB</h4>
                  <Readout letter="H" name="Hue" value={hsb.h} max={360} suffix="°" tint="var(--foreground)" />
                  <Readout letter="S" name="Saturation" value={hsb.s} max={100} suffix="%" tint="var(--foreground)" />
                  <Readout letter="B" name="Brightness" value={hsb.b} max={100} suffix="%" tint="var(--foreground)" />
                </div>
                <p className="text-muted-foreground">
                  Both are read back out of the clamped 8-bit colour, so out of
                  gamut they describe the swatch rather than the Oklch above it.
                </p>
              </div>
            </FlatSection>

            <FlatSection title="Jump to">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button key={p.name} variant="outline" className="text-base" onClick={() => jumpTo(p.oklch)}>
                    {p.name}
                  </Button>
                ))}
              </div>
            </FlatSection>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </TooltipProvider>
  );
}
