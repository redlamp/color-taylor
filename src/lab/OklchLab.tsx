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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import ColorSlider from '@/components/ColorSlider';
import ColorHexagon from '@/components/ColorHexagon';
import HexInput from '@/components/HexInput';
import PreviewSwatch from '@/components/PreviewSwatch';
import FlatSection from './FlatSection';
import { CHROMA_MAX, lightnessRamp, chromaRamp, hueRamp } from './oklchRamps';

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

/**
 * Places to read Oklch from. Blue is the wiki note's own example - the sRGB
 * gamut is not star-shaped there - and the last one asks for a chroma no
 * screen can deliver, which is the state this page is for.
 */
const PRESETS: ReadonlyArray<{ name: string; oklch: Oklch }> = [
  { name: 'sRGB blue', oklch: rgbToOklch(0, 0, 255) },
  { name: 'Blue 500', oklch: rgbToOklch(59, 130, 246) },
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
  const [oklch, setOklch] = useState<Oklch>(() => rgbToOklch(59, 130, 246));
  /** The open design question, as a switch. See the file comment. */
  const [hold, setHold] = useState(false);
  /** The hexagon's own two host settings, which it expects to be controlled. */
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');

  const limit = maxChromaForLH(oklch.l, oklch.h);

  // L and H move the cusp, so with the switch on they have to bring C with
  // them - otherwise the handle would be left sitting past its own marker.
  const setL = useCallback((l: number) => setOklch((p) => (
    { ...p, l, c: hold ? holdChroma(p.c, l, p.h) : p.c }
  )), [hold]);
  const setC = useCallback((c: number) => setOklch((p) => (
    { ...p, c: hold ? holdChroma(c, p.l, p.h) : c }
  )), [hold]);
  const setH = useCallback((h: number) => setOklch((p) => (
    { ...p, h, c: hold ? holdChroma(p.c, p.l, h) : p.c }
  )), [hold]);

  const toggleHold = useCallback(() => {
    setHold((on) => !on);
    // Turning it on pulls a stranded C back to the cusp. Turning it off is a
    // no-op here, since C is already inside the limit.
    setOklch((p) => ({ ...p, c: holdChroma(p.c, p.l, p.h) }));
  }, []);

  const jumpTo = useCallback((target: Oklch) => setOklch(
    hold ? { ...target, c: holdChroma(target.c, target.l, target.h) } : target,
  ), [hold]);

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
  const setFromRgb = (next: RGB) => setOklch(rgbToOklch(next.r, next.g, next.b));
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
            screen - the C track shows where that starts.
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

              {/* The page's most interesting state, said plainly. */}
              <div
                id="oklch-gamut"
                className="rounded-md border border-border p-3"
                aria-live="polite"
                style={inGamut ? undefined : { borderColor: 'var(--destructive)' }}
              >
                {inGamut ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Inside sRGB.</span>{' '}
                    The swatch is the colour named above, to the nearest 8-bit step.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Outside sRGB.</span>{' '}
                      No colour on this screen has that address. The swatch is
                      what the clamp gives instead - a different colour, and
                      above all a duller one.
                    </p>
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono tabular-nums">
                      <dt className="font-sans text-muted-foreground">Asked for</dt>
                      <dd className="min-w-0 break-words">{asked}</dd>
                      <dt className="font-sans text-muted-foreground">Got back</dt>
                      <dd className="min-w-0 break-words">{spell(landed)} &nbsp;{hex.toUpperCase()}</dd>
                      <dt className="font-sans text-muted-foreground">C stops at</dt>
                      <dd className="min-w-0">
                        {limit.toFixed(3)}{' '}
                        <span className="font-sans text-muted-foreground">at this L and H</span>
                      </dd>
                    </dl>
                  </div>
                )}
              </div>
            </section>

            <FlatSection
              title="Oklch"
              headerRight={
                <span className="font-mono tabular-nums text-muted-foreground">max C {limit.toFixed(3)}</span>
              }
            >
              <div className="flex flex-col gap-3">
                <ColorSlider
                  label="L" group="oklch" value={oklch.l} max={1} step={FINE}
                  gradient={lightnessRamp(oklch.c, oklch.h)} onChange={setL}
                />
                <ColorSlider
                  label="C" group="oklch" value={oklch.c} max={CHROMA_MAX} step={FINE}
                  gradient={chromaRamp(oklch.l, oklch.h, limit)} onChange={setC}
                />
                <ColorSlider
                  label="H" group="oklch" value={oklch.h} max={360} step={HUE_STEP} wrap suffix="°"
                  gradient={hueRamp(oklch.l, oklch.c)} onChange={setH}
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 rounded-md border border-border p-3">
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
