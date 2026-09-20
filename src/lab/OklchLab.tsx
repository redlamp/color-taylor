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
import HelpTip from './HelpTip';
import LabPanel from './LabPanel';
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
 * a value between two of them is not reachable by any gesture. And a color
 * sitting exactly on the boundary reads as outside sRGB - `oklchToRgb` finds a
 * linear channel a float hair past 1 and says so, correctly - so clamping to
 * the cusp would leave the page announcing that the color it had just forced
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
 * color. Absolute holds the number: the swatches that exist are strictly
 * comparable, and the rest are washed out because there is no such color at
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
            {/* Where the color exists, its C. Where it does not, the number
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
   *              *share* and the color stays inside the gamut by construction.
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
    const s = satFromChroma(oklch.c, oklch.l, oklch.h);
    if (s !== null) setSat(s);
  }, [oklch]);

  /**
   * A color arriving whole, from a preset or from sRGB. It is taken as given
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
              its track.</p></>}
          >
            <div className="mx-auto w-full max-w-[500px]">
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
          </LabPanel>

            <LabPanel
              n={2}
              title="Oklch"
              help={<><p><strong className="font-semibold">Absolute C</strong> is the
                number CSS takes. The track runs to {CHROMA_MAX} at every L and H, and
                the part of it past the gamut edge names colors this screen
                does not have.</p>
                <p><strong className="font-semibold">Relative S</strong> is a share
                of what fits: 100% is the gamut edge at this L and H, so every
                position is a real color &mdash; and the same percentage is a
                different amount of color at every hue.</p>
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
                  max C <span className="font-mono tabular-nums">{limit.toFixed(3)}</span> at this L and H
                </p>
                <ColorSlider
                  label="H" group="oklch" value={oklch.h} max={360} step={HUE_STEP} wrap suffix="°"
                  gradient={hueRamp(oklch.l, oklch.c)} onChange={setH}
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
                {relative ? (
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
                number: the swatches that exist are strictly comparable, and at
                some hues there is no color at all.</p></>}
            >
              <LandmarkRow
                l={oklch.l}
                chromaAt={(h) => (relative ? chromaFromSat(sat, oklch.l, h) : oklch.c)}
                onPick={setH}
              />
            </LabPanel>

            <LabPanel
              n={4}
              title="Read back as RGB and HSB"
              caption="What the clamped 8-bit color measures as."
              help={<p>RGB and HSB are read back out of the clamped 8-bit color,
                so out of gamut they describe the swatch rather than the Oklch
                that was asked for. Inside the gamut they are the same color in
                two other coordinate systems.</p>}
            >
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Readout letter="R" name="Red" value={rgb.r} max={255} tint="#e74c4c" />
                  <Readout letter="G" name="Green" value={rgb.g} max={255} tint="#2e9e2e" />
                  <Readout letter="B" name="Blue" value={rgb.b} max={255} tint="#3385ff" />
                </div>
                <div className="flex flex-col gap-2">
                  <Readout letter="H" name="Hue" value={hsb.h} max={360} suffix="°" tint="var(--foreground)" />
                  <Readout letter="S" name="Saturation" value={hsb.s} max={100} suffix="%" tint="var(--foreground)" />
                  <Readout letter="B" name="Brightness" value={hsb.b} max={100} suffix="%" tint="var(--foreground)" />
                </div>
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
