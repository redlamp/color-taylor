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
 * Every number in the copy below is asserted in src/utils/cie.test.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  rgbToHsb, rgbToHex, type HSB, type RGB,
} from '@/utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient, type ColorSpace,
} from '@/utils/sliderGradients';
import {
  rgbToXyY, D65_WHITE, PRIMARY_LUMINANCE, SRGB_TRIANGLE,
  circleFractionOutsideGamut, type Xy,
} from '@/utils/cie';
import { useColorState } from '@/hooks/useColorState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import ColorSlider from '@/components/ColorSlider';
import ColorHexagon from '@/components/ColorHexagon';
import PreviewSwatch from '@/components/PreviewSwatch';
import HexInput from '@/components/HexInput';
import type { CubeStep } from './cubeRenderer';
import CieDiagram from './CieDiagram';
import CieSolid from './CieSolid';

const CIRCLE_R = 0.20;
/** The red-to-green side, the yardstick the standstill readout measures against. */
const SIDE = Math.hypot(SRGB_TRIANGLE[0].x - SRGB_TRIANGLE[1].x, SRGB_TRIANGLE[0].y - SRGB_TRIANGLE[1].y);
/** 57.3%, computed rather than quoted - see circleFractionOutsideGamut. */
const CIRCLE_OUT = circleFractionOutsideGamut(CIRCLE_R);

/** A panel: a titled card with a caption under it. One shape for all three. */
function Panel({ n, title, caption, children, aside }: {
  n: number;
  title: string;
  caption: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            <span className="mr-2 text-muted-foreground tabular-nums">{n}</span>{title}
          </h2>
        </div>
        {aside}
      </header>
      {children}
      <p className="text-base leading-snug text-muted-foreground">{caption}</p>
    </section>
  );
}

const INITIAL: HSB = { h: 212, s: 78, b: 92 };

export default function CieLab() {
  /*
   * The page's sharpest moment, caught rather than captioned.
   *
   * While an edit moves brightness and leaves hue and saturation alone, a
   * ghost ring stays where the dot was when the run started and panel 2 says
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

  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [showP3, setShowP3] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const [shape, setShape] = useState<'xyY' | 'cube'>('xyY');
  const [step, setStep] = useState<CubeStep>(1);

  const here = rgbToXyY(rgb.r, rgb.g, rgb.b);
  const hx = here?.x ?? null, hy = here?.y ?? null;
  // Written after the paint, so during the next edit they still hold what is
  // on screen. Refs, not state: nothing renders off them.
  useEffect(() => {
    lastHsb.current = hsb;
    lastXy.current = hx === null || hy === null ? null : { x: hx, y: hy };
  }, [hsb, hx, hy]);

  const drift = run && here ? Math.hypot(here.x - run.from.x, here.y - run.from.y) : 0;

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
    return Math.hypot(here.x - D65_WHITE.x, here.y - D65_WHITE.y);
  }, [here]);

  return (
    <TooltipProvider delay={0}>
      <Toaster />
      <div className="mx-auto max-w-[1600px] bg-background px-4 py-6 text-base text-foreground">
        <header className="mb-6 flex max-w-[78ch] flex-col gap-3">
          <h1 className="text-3xl font-semibold">One colour, three projections</h1>
          <p className="text-muted-foreground">
            All three panels below show the same RGB cube. The hexagon is the
            cube in <strong className="font-semibold text-foreground">parallel</strong> projection,
            looking straight down the line from black to white. The chromaticity
            diagram is the same cube in <strong className="font-semibold text-foreground">central</strong> projection,
            from a point - and the point is black. Dividing XYZ by X+Y+Z <em>is</em> that
            projection: it drops every ray out of the origin onto one plane, and a
            ray out of the origin is a colour together with all its dimmer copies.
          </p>
          <p className="text-muted-foreground">
            So the difference between panels 1 and 2 is the difference between the
            two kinds of projection: parallel keeps the scale of a colour, central
            divides it out. That is why the hexagon needs a brightness bar and the
            diagram has nowhere to put one. Panel 3 puts the scale back as a third
            dimension, which is what xyY is.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel
            n={1}
            title="The hexagon"
            caption={<>The cube down its black-to-white diagonal. Three mutually perpendicular
              axes project 120&deg; apart, so the six remaining corners land on a regular
              hexagon. The projection loses exactly one dimension - the neutral one -
              which is the brightness bar beside it.</>}
          >
            <div className="-mx-1">
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
            </div>
          </Panel>

          <Panel
            n={2}
            title="CIE 1931 chromaticity"
            caption={<>The horseshoe is the spectral locus, drawn from the CIE 1931
              2&deg; colour-matching functions at 5&nbsp;nm - measured data, not a
              curve fitted here. Inside the triangle each point is painted the
              brightest sRGB colour of that chromaticity. Outside it there is no such
              colour, so it is a flat wash rather than a clamped rainbow.</>}
            aside={
              <div className="flex shrink-0 flex-col gap-1 text-base tabular-nums text-muted-foreground">
                <span>x {here ? here.x.toFixed(4) : '-'}</span>
                <span>y {here ? here.y.toFixed(4) : '-'}</span>
              </div>
            }
          >
            <CieDiagram rgb={rgb} showP3={showP3} showCircle={showCircle} circleRadius={CIRCLE_R} ghost={run?.from ?? null} />
            <div
              data-testid="standstill"
              aria-live="polite"
              className={`rounded-md border px-3 py-2 text-base transition-opacity ${run
                ? 'border-foreground/40 bg-foreground/5 text-foreground opacity-100'
                : 'border-transparent text-muted-foreground opacity-60'}`}
            >
              {run ? (
                <>
                  <strong className="font-semibold">
                    Brightness {run.fromB} &rarr; {run.toB}. The dot has {drift < 0.005 ? 'not moved' : 'barely moved'}.
                  </strong>{' '}
                  {drift < 0.0005
                    ? 'It is on the same point to four decimals'
                    : `It is ${drift.toFixed(4)} away`}, against a
                  triangle {SIDE.toFixed(3)} on a side - {(100 * drift / SIDE).toFixed(1)}% of one.
                  Brightness scales a colour, and scaling a colour does not move it off its ray.
                  {drift >= 0.0005 && ' The residual is 8-bit rounding rather than projection: a quantised scale is not quite a scale.'}
                </>
              ) : (
                <>Drag the brightness bar on panel 1. The handle there and the marker on
                  panel 3 both move; this dot stays where it is.</>
              )}
            </div>
          </Panel>

          <Panel
            n={3}
            title="The xyY solid"
            caption={<>The gamut as a solid: the diagram as a floor, luminance rising
              above it. The roof is the most luminance sRGB holds over each chromaticity,
              and it is wildly uneven - green reaches Y&nbsp;=&nbsp;{PRIMARY_LUMINANCE.g.toFixed(4)} and
              blue only Y&nbsp;=&nbsp;{PRIMARY_LUMINANCE.b.toFixed(4)}, {(PRIMARY_LUMINANCE.g / PRIMARY_LUMINANCE.b).toFixed(1)}&times; lower.
              That is why blue is dark. Drag to orbit, double-click to reset.</>}
            aside={
              <Tabs value={shape} onValueChange={(v) => setShape(v as 'xyY' | 'cube')}>
                <TabsList>
                  <TabsTrigger value="xyY">xyY</TabsTrigger>
                  <TabsTrigger value="cube">Cube</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <div className="min-h-[420px] flex-1 overflow-hidden rounded-md" style={{ aspectRatio: '1 / 1' }}>
              <CieSolid rgb={rgb} shape={shape} showP3={showP3} step={step} />
            </div>
          </Panel>
        </div>

        {/* ── the editor, and what the panels are showing ──────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">The colour</h2>
            <div className="flex items-stretch gap-3">
              <PreviewSwatch hex={hex} className="w-[84px] min-h-20" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <HexInput hex={hex} onChange={handleHex} />
                <div className="flex flex-col gap-0.5 text-base tabular-nums text-muted-foreground">
                  <span>x {here ? here.x.toFixed(4) : '-'} &nbsp; y {here ? here.y.toFixed(4) : '-'}</span>
                  <span>Y {here ? here.Y.toFixed(4) : '-'} &nbsp; reach {reach !== null ? reach.toFixed(3) : '-'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <ColorSlider label="H" group="hsb" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, colorSpace)} onChange={handleH} />
              <ColorSlider label="S" group="hsb" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, colorSpace)} onChange={handleS} />
              <ColorSlider label="B" group="hsb" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, colorSpace)} onChange={handleB} />
            </div>
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <SwitchRow
                label="Display P3 outline"
                checked={showP3}
                onToggle={() => setShowP3((v) => !v)}
                ariaLabel="Show the Display P3 gamut as a second outline"
              />
              <SwitchRow
                label={`Circle of radius ${CIRCLE_R.toFixed(2)} about white`}
                checked={showCircle}
                onToggle={() => setShowCircle((v) => !v)}
                ariaLabel="Overlay a circle of constant radius about the white point"
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-base text-muted-foreground">Solid detail</span>
                <Tabs value={String(step)} onValueChange={(v) => setStep(Number(v) as CubeStep)}>
                  <TabsList>
                    <TabsTrigger value="1">256</TabsTrigger>
                    <TabsTrigger value="17">16</TabsTrigger>
                    <TabsTrigger value="51">6</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {([['Red', { h: 0, s: 100, b: 100 }], ['Green', { h: 120, s: 100, b: 100 }],
                  ['Blue', { h: 240, s: 100, b: 100 }], ['Dark blue', { h: 240, s: 100, b: 20 }],
                  ['White', { h: 0, s: 0, b: 100 }]] as const).map(([label, v]) => (
                    <Button key={label} size="sm" variant="outline" onClick={() => setHsbClear({ ...v })}>{label}</Button>
                  ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">What the three disagree about</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  cyan 0.088. A circle of radius {CIRCLE_R.toFixed(2)} about white -
                  the shape a colour wheel implies - has {(CIRCLE_OUT * 100).toFixed(1)}%
                  of its circumference outside sRGB. Turn it on and look.
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
                  Y&nbsp;=&nbsp;1.0 - perceptual lightness is roughly a cube root of it,
                  which is what Oklab&rsquo;s L is. So the solid looks bottom-heavy in a
                  way perception does not agree with, and that gap is the reason
                  Oklab exists.
                </p>
              </div>
            </div>
            <p className="border-t border-border pt-3 text-base text-muted-foreground">
              Colour-matching functions from CVRL (CIE 1931 2&deg;, 5&nbsp;nm),
              committed as <code className="font-mono">src/utils/cieCmf1931.ts</code> with
              the source URL. Every figure on this page is asserted
              in <code className="font-mono">src/utils/cie.test.ts</code>, with culori as
              an independent second opinion on the transforms.
            </p>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
