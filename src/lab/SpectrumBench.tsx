/**
 * Spectrum bench: red, green and blue drawn across the hue circle, over
 * Channel Surfer's linear rainbow, beside the app's own Color Editor.
 *
 * Sweep a colour's hue round and its three channels trace one wave, 120
 * degrees apart. Its top is the colour's largest channel, its bottom the
 * smallest, and nothing else shapes it - which is the whole of HSB and HSL
 * (rgbWaves.ts):
 *
 *   max               Brightness
 *   max - min         what Saturation measures, over max (HSB) or over the
 *                     room to the nearer end (HSL)
 *   (max + min) / 2   Lightness
 *
 * So the graph is also a picker. Drag sideways for hue, drag the top rail for
 * brightness and the bottom rail for saturation, and every slider in the
 * editor moves with it. The rainbow behind is the same axis: hue left to
 * right, white above the pure hue, black below.
 *
 * The editor is the picker's, assembled from the same primitives on the same
 * colour-state hook as the cube bench. Nothing in src/components is changed.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { hsbToRgb, hslToRgb, rgbToHsb, rgbToHex, rgbToHsl, type RGB } from '../utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient,
  hslHueGradient, hslSaturationGradient, lightnessGradient,
  redGradient, greenGradient, blueGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import { useColorState } from '../hooks/useColorState';
import useDrag from '../hooks/useDrag';
import { HANDLE } from '../utils/handleStyle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { SettingsSwitch, SwitchRow } from '@/components/settings/SettingsSwitch';
import ColorSlider from '../components/ColorSlider';
import SBBox from '../components/SBBox';
import HSlider from '../components/HSlider';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import CollapsibleSection from '../components/CollapsibleSection';
import FlatSection from './FlatSection';
import { CHANNEL_OFFSET, exactHue, rails, rgbAtHue } from './rgbWaves';
import spectrum from './linear-rainbow.webp';

type Model = 'hsb' | 'hsl' | 'both';
type Channel = 'r' | 'g' | 'b';
const CHANNELS: readonly Channel[] = ['r', 'g', 'b'];
const CHANNEL_NAME: Record<Channel, string> = { r: 'red', g: 'green', b: 'blue' };
type Shown = Record<Channel, boolean>;

/** The three inks, as the exploration drew them. */
const INK: Record<Channel, string> = { r: '#e74c4c', g: '#008000', b: '#3385ff' };
/** The same inks as text on the dark ground: the wave's green is too dark to read there. */
const TEXT_INK: Record<Channel, string> = { r: INK.r, g: '#3ddc3d', b: INK.b };

/**
 * The plot is the rainbow: hue across its width, so the waves line up with
 * the bands behind them, and the top edge is 255, the bottom edge 0. The
 * band above is one row - the title, the channel checkboxes and the column
 * headings - and the band below holds the hue readout.
 *
 * The band is as tall as its tallest heading. At 45 degrees a heading of
 * width w and height h rises (w + h) over root two: 68 for "S 100%", 98 for
 * Both's "S 100%·100%". Sized to the mode, so HSB and HSL do not carry
 * Both's headroom as dead space above the title.
 */
const padTopFor = (model: Model) => (model === 'both' ? 112 : 84);
const PAD_BOTTOM = 48;
/** Room for the marker's dots at hue 0, which would otherwise sit half off the stage. */
const PAD_LEFT = 12;
/**
 * The Y columns, right of the plot: an axis strip beside the plot where the
 * rails' values sit, then one bar per reading, the span it measures drawn to
 * the same scale as the waves, so S is visibly min to max and B is visibly 0
 * to max. The rails run through them, which is what ties the two.
 */
const GUTTER = 208;
const AXIS_W = 48;
const BAR_X0 = AXIS_W + 16;
/**
 * Wide enough that the angled headings clear one another: parallel at 45
 * degrees, their spacing across is the gap over root two, and that has to
 * beat a heading's height.
 */
const TRACK_GAP = 40;
const BAR_W = 10;
/** A one-line readout is this tall. */
const PILL_H = 28;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * A hue drag on the graph snaps to the six corners - red, yellow, green,
 * cyan, blue, magenta - within three degrees or four pixels, whichever is
 * the smaller at the plot's width. The drag's own position is never snapped,
 * only what it emits, so it slides off a corner as freely as it settled on
 * it.
 */
const SNAP_DEG = 3;
const SNAP_PX = 4;
const snapHue = (deg: number, plotW: number) => {
  const within = Math.min(SNAP_DEG, (SNAP_PX / Math.max(1, plotW)) * 360);
  const corner = Math.round(deg / 60) * 60;
  return (Math.abs(deg - corner) <= within ? corner : Math.round(deg)) % 360;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
/** Axis values are 8-bit levels, so the midline of an odd span rounds rather than showing a half. */
const num = (v: number) => String(Math.round(v));

/**
 * A readout over the picture: mono, on a dark pill, legible on any band.
 * text-base, as all UI text is - see ~/.claude/memory/domain/ui-typography-defaults.
 */
function Pill({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute whitespace-nowrap rounded bg-black/60 px-2 py-0.5 font-mono text-base leading-6 tabular-nums text-white backdrop-blur-[2px]"
      style={style}
    >
      {children}
    </div>
  );
}

/** A rail: a dark keel under a dashed white line, so it reads on any band. */
function Rail({ y, w, thin }: { y: number; w: number; thin?: boolean }) {
  return (
    <g>
      <line x1={0} x2={w} y1={y} y2={y} stroke="rgba(0,0,0,.3)" strokeWidth={thin ? 2 : 3} />
      <line x1={0} x2={w} y1={y} y2={y} stroke="rgba(255,255,255,.95)" strokeWidth={thin ? 1 : 1.5} strokeDasharray="6 6" />
    </g>
  );
}

/** The picker's handle, in SVG: an ink core in a white ring over a soft shadow. */
function Dot({ x, y, ink }: { x: number; y: number; ink: string }) {
  const r = HANDLE.core + HANDLE.ring / 2;
  return (
    <g>
      <circle cx={x} cy={y + HANDLE.shadowY} r={r + HANDLE.ring / 2 + 1} fill={HANDLE.shadowColor} />
      <circle cx={x} cy={y} r={r} fill={ink} stroke="#fff" strokeWidth={HANDLE.ring} />
    </g>
  );
}

type Grab = 'hue' | 'max' | 'min';

interface StageProps {
  rgb: RGB;
  /** The hue to mark: the colour's own when it has one, else the slider's. */
  hue: number;
  model: Model;
  /** Which channels draw. A hidden one loses its wave and its dot; the rails stay. */
  shown: Shown;
  showSpectrum: boolean;
  showGuides: boolean;
  onHue: (h: number) => void;
  /** The top rail, 0-255. */
  onMax: (v: number) => void;
  /** The bottom rail, 0-255. */
  onMin: (v: number) => void;
}

function WaveStage({ rgb, hue, model, shown, showSpectrum, showGuides, onHue, onMax, onMin }: StageProps) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const padTop = padTopFor(model);
  const plotH = Math.max(1, h - padTop - PAD_BOTTOM);
  const plotW = Math.max(1, w - GUTTER - PAD_LEFT);
  /** Where the columns start. */
  const gx = PAD_LEFT + plotW;
  const xAt = (deg: number) => PAD_LEFT + (deg / 360) * plotW;
  const barX = (i: number) => gx + BAR_X0 + i * TRACK_GAP;
  const yAt = (v: number) => padTop + (1 - v / 255) * plotH;
  const R = rails(rgb);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  // The wave is linear between the six corners of the hue circle, so those
  // seven points draw it exactly.
  const waves = useMemo(() => {
    const corners = [0, 60, 120, 180, 240, 300, 360];
    return CHANNELS.map((ch) => ({
      ch,
      points: corners.map((deg) => {
        const v = rgbAtHue(deg, R.max, R.min)[ch];
        return `${PAD_LEFT + (deg / 360) * plotW},${padTop + (1 - v / 255) * plotH}`;
      }).join(' '),
    }));
  }, [plotW, plotH, padTop, R.max, R.min]);

  // The columns' bars, in the sliders' order, all three whichever model the
  // editor shows. Each is a span on the 0-255 scale: S from min to max, B
  // and L from 0 up to the rail they read.
  // Brightness and lightness are greyscale, black up the scale to the grey at
  // their rail; saturation is that same grey pulled out to the colour. So the
  // top of the B bar is the bottom of the S bar: brightness gets you to a
  // grey, saturation takes it from there.
  // Each bar carries its own reading as a heading above it; the raw max,
  // min and midline sit on the axis at their rails. In Both, S reads twice,
  // HSB then HSL, kept short so the angled heading stays inside the band.
  const bars = useMemo(() => {
    const sReading = model === 'hsb' ? pct(R.hsbS)
      : model === 'hsl' ? pct(R.hslS)
      : `${pct(R.hsbS)}·${pct(R.hslS)}`;
    const all = {
      S: { top: R.max, bottom: R.min, fill: 'url(#bar-saturation)', reading: sReading },
      B: { top: R.max, bottom: 0, fill: 'url(#bar-grey)', reading: pct(R.hsbB) },
      L: { top: R.mid, bottom: 0, fill: 'url(#bar-grey)', reading: pct(R.hslL) },
    } as const;
    return (['S', 'B', 'L'] as const).map((k) => ({ key: k, ...all[k] }));
  }, [model, R.max, R.min, R.mid, R.hsbS, R.hslS, R.hsbB, R.hslL]);

  const ready = w > 0;

  // ── Picking on the graph ──────────────────────────────────────────
  const grab = useRef<Grab | null>(null);
  // A hue drag is relative, as the hue slider's is: the value follows how far
  // the pointer moved, not where it is, so running off either edge of the
  // plot keeps counting round through 0. The float carries the fraction and
  // only the emitted value is rounded, or a slow drag would stall.
  const accum = useRef(0);
  const lastX = useRef(0);
  const apply = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el || !grab.current) return;
    const rect = el.getBoundingClientRect();
    if (grab.current === 'hue') {
      const dx = clientX - lastX.current;
      lastX.current = clientX;
      if (!dx) return;
      const next = accum.current + (dx / Math.max(1, rect.width - GUTTER - PAD_LEFT)) * 360;
      accum.current = ((next % 360) + 360) % 360;
      onHue(snapHue(accum.current, rect.width - GUTTER - PAD_LEFT));
    } else {
      const span = Math.max(1, rect.height - padTop - PAD_BOTTOM);
      const v = Math.max(0, Math.min(255, (1 - (clientY - rect.top - padTop) / span) * 255));
      (grab.current === 'max' ? onMax : onMin)(v);
    }
  }, [ref, padTop, onHue, onMax, onMin]);
  const { startDrag } = useDrag(useCallback((e: PointerEvent) => apply(e.clientX, e.clientY), [apply]));
  // A press on the field jumps hue to the pressed hue and the drag goes on
  // from there - a press in the columns is a press at hue 360. A press on a rail
  // only takes hold of it, so the rail does not hop by however far off it you
  // pressed.
  const begin = (which: Grab, e: React.PointerEvent) => {
    e.preventDefault();
    grab.current = which;
    if (which === 'hue') {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const deg = ((e.clientX - rect.left - PAD_LEFT) / Math.max(1, rect.width - GUTTER - PAD_LEFT)) * 360;
      accum.current = Math.max(0, Math.min(360, deg)) % 360;
      lastX.current = e.clientX;
      onHue(snapHue(accum.current, rect.width - GUTTER - PAD_LEFT));
    }
    startDrag();
  };

  const railKeys = (value: number, set: (v: number) => void) => (e: React.KeyboardEvent) => {
    // three units is one percent of brightness, which is the step that shows
    const step = e.shiftKey ? 26 : 3;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(Math.min(255, value + step)); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(Math.max(0, value - step)); }
  };

  // The axis numbers sit centred on their rails until the rails close up,
  // then max steps above its rail and min below; the midline's goes when
  // there is no room for it between them.
  const spanPx = yAt(R.min) - yAt(R.max);
  const tight = spanPx < PILL_H + 4;
  const axis: React.CSSProperties = { left: gx + 4, width: AXIS_W - 8, textAlign: 'right' };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Hue, across the graph"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(hue) % 360}
      tabIndex={0}
      className="absolute inset-0 cursor-ew-resize touch-none select-none outline-none"
      onPointerDown={(e) => begin('hue', e)}
      onKeyDown={(e) => {
        // The rails are children with keys of their own; theirs bubble here
        // and must not also turn the hue.
        if (e.target !== e.currentTarget) return;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onHue((Math.round(hue) + step) % 360); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onHue(((Math.round(hue) - step) % 360 + 360) % 360); }
      }}
    >
      <img
        src={spectrum}
        alt=""
        draggable={false}
        className="pointer-events-none absolute select-none"
        style={{ left: PAD_LEFT, top: padTop, width: plotW, height: plotH, objectFit: 'fill', opacity: showSpectrum ? 1 : 0, transition: 'opacity 300ms' }}
      />

      {ready && (
        <svg className="pointer-events-none absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <defs>
            {/* Pinned to the scale, so a bar clipped at its rail ends on that rail's grey. */}
            <linearGradient id="bar-grey" gradientUnits="userSpaceOnUse" x1={0} y1={yAt(0)} x2={0} y2={yAt(255)}>
              <stop offset={0} stopColor="#000" />
              <stop offset={1} stopColor="#fff" />
            </linearGradient>
            {/* The grey a colour of this brightness has with no saturation, out to the colour. */}
            <linearGradient id="bar-saturation" x1={0} y1={1} x2={0} y2={0}>
              <stop offset={0} stopColor={`rgb(${R.max},${R.max},${R.max})`} />
              <stop offset={1} stopColor={hex} />
            </linearGradient>
          </defs>

          {/* 255 and 0: the edges of the picture, kept when the picture is off */}
          <line x1={0} x2={w} y1={yAt(255)} y2={yAt(255)} stroke="rgba(160,160,160,.6)" />
          <line x1={0} x2={w} y1={yAt(0)} y2={yAt(0)} stroke="rgba(160,160,160,.6)" />

          {/* The Y columns: a faint full-range track, and the span each reading measures */}
          {bars.map(({ key, top, bottom, fill }, i) => {
            const x = barX(i);
            return (
            <g key={key}>
              <line x1={x} x2={x} y1={yAt(255)} y2={yAt(0)} stroke="rgba(255,255,255,.25)" />
              {top > bottom && (
                <rect
                  x={x - BAR_W / 2} y={yAt(top)} width={BAR_W} height={yAt(bottom) - yAt(top)} rx={2}
                  fill={fill} stroke="rgba(255,255,255,.45)" strokeWidth={1}
                />
              )}
            </g>
            );
          })}

          {waves.filter(({ ch }) => shown[ch]).map(({ ch, points }) => (
            <g key={ch} fill="none" strokeLinejoin="round" strokeLinecap="round">
              <polyline points={points} stroke="rgba(255,255,255,.85)" strokeWidth={7} />
              <polyline points={points} stroke={INK[ch]} strokeWidth={4} />
            </g>
          ))}

          {showGuides && (
            <>
              <Rail y={yAt(R.mid)} w={w} thin />
              <Rail y={yAt(R.min)} w={w} />
              <Rail y={yAt(R.max)} w={w} />
            </>
          )}

          <line x1={xAt(hue)} x2={xAt(hue)} y1={padTop - 8} y2={h - PAD_BOTTOM + 8} stroke="rgba(0,0,0,.35)" strokeWidth={3} />
          <line x1={xAt(hue)} x2={xAt(hue)} y1={padTop - 8} y2={h - PAD_BOTTOM + 8} stroke="rgba(255,255,255,.9)" strokeWidth={1} />
          {CHANNELS.filter((ch) => shown[ch]).map((ch) => <Dot key={ch} x={xAt(hue)} y={yAt(rgb[ch])} ink={INK[ch]} />)}
        </svg>
      )}

      {/* Under the marker, held inside the stage at the ends of the circle */}
      {ready && (
        <Pill style={{ left: Math.max(40, Math.min(w - 40, xAt(hue))), top: h - PAD_BOTTOM + 10, transform: 'translateX(-50%)' }}>
          <b>H</b> {Math.round(hue) % 360}°
        </Pill>
      )}

      {/* Each bar's heading, at 45 degrees above its column the way a
          spreadsheet angles a column head: the pill's foot on the bar's
          left edge, rising to the right over the columns beside it. */}
      {ready && bars.map(({ key, reading }, i) => (
        <Pill key={key} style={{ left: barX(i) - BAR_W / 2, top: padTop - 10 - PILL_H, transformOrigin: 'left bottom', transform: 'rotate(-45deg)' }}>
          <b>{key}</b> {reading}
        </Pill>
      ))}

      {/* The rails' values, on the axis */}
      {ready && showGuides && (
        <>
          <Pill style={{ ...axis, top: yAt(R.max), transform: tight ? 'translateY(-100%)' : 'translateY(-50%)' }}>{num(R.max)}</Pill>
          <Pill style={{ ...axis, top: yAt(R.min), transform: tight ? undefined : 'translateY(-50%)' }}>{num(R.min)}</Pill>
          {spanPx >= PILL_H * 3 && (
            <Pill style={{ ...axis, top: yAt(R.mid), transform: 'translateY(-50%)' }}>{num(R.mid)}</Pill>
          )}
        </>
      )}

      {/* The rails are handles. min first, max on top: when they meet on a
          grey, the one you can take hold of is brightness. */}
      {ready && showGuides && (
        <>
          <div
            role="slider"
            aria-label="Smallest channel: saturation"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={255}
            aria-valuenow={R.min}
            tabIndex={0}
            className="absolute left-0 right-0 h-4 cursor-ns-resize outline-none"
            style={{ top: yAt(R.min) - 8 }}
            onPointerDown={(e) => { e.stopPropagation(); begin('min', e); }}
            onKeyDown={railKeys(R.min, onMin)}
          />
          <div
            role="slider"
            aria-label="Largest channel: brightness"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={255}
            aria-valuenow={R.max}
            tabIndex={0}
            className="absolute left-0 right-0 h-4 cursor-ns-resize outline-none"
            style={{ top: yAt(R.max) - 8 }}
            onPointerDown={(e) => { e.stopPropagation(); begin('max', e); }}
            onKeyDown={railKeys(R.max, onMax)}
          />
        </>
      )}
    </div>
  );
}

const SWEEP_DEFAULT = 15;   // degrees a second: 24 s a lap
const SWEEP_MIN = 3;
const SWEEP_MAX = 120;

export default function SpectrumBench() {
  const [sweep, setSweep] = useState(false);
  const sweepId = useId();
  const [speed, setSpeed] = useState(SWEEP_DEFAULT);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  // Only a hand on the wheel stops the sweep: the hue sliders, a hue press
  // on the graph, the hex field and the RGB channels, which all name a hue.
  // Saturation, brightness, lightness and the rails ride along. It used to
  // be decided by comparing an edit's hue with the one the sweep last wrote,
  // and that reference moves under a slider drag - a drag's update can be
  // applied after the next frame has already advanced it - so an innocent
  // saturation edit read as a hue edit and stopped the sweep.
  const sweepRef = useRef(sweep);
  useEffect(() => { sweepRef.current = sweep; }, [sweep]);
  const stopSweep = useCallback(() => setSweep(false), []);
  const {
    hsb, rgb, hsl, hex, hsbRef, setHsb, setHsbClear, setRgbChannel, setHslChannel, clearOverride,
  } = useColorStateWithHex();
  const [rgbMode, setRgbMode] = useState<'channel' | 'mixed'>('mixed');
  const [model, setModel] = useState<Model>('hsb');
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [shown, setShown] = useState<Shown>({ r: true, g: true, b: true });
  // Solo, as a mixer does it: Ctrl-click a channel and the other two go;
  // Ctrl-click the soloed one again and they come back.
  const solo = useCallback((ch: Channel) => setShown((s) => {
    const alone = CHANNELS.every((c) => s[c] === (c === ch));
    return alone ? { r: true, g: true, b: true } : { r: ch === 'r', g: ch === 'g', b: ch === 'b' };
  }), []);

  // Sweep: hue round the circle at the set speed, clocked rather than
  // stepped so it is the same speed on every display. Not a user edit, so
  // through the raw setter.
  //
  // The hue it writes is fractional, every frame. Writing whole degrees made
  // the marker hop: at 15 degrees a second that is fifteen hops a second, and
  // slower was worse. The fields that show hue round it themselves, and the
  // state is rounded once when the sweep stops, so nothing downstream ever
  // keeps a fraction.
  useEffect(() => {
    if (!sweep) return;
    let raf = 0;
    let last = performance.now();
    let acc = hsbRef.current.h;
    const tick = (now: number) => {
      // capped, so a tab coming back from the background does not leap
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc = (acc + dt * speedRef.current) % 360;
      clearOverride();
      setHsb((prev) => ({ ...prev, h: acc }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setHsb((prev) => (Number.isInteger(prev.h) ? prev : { ...prev, h: Math.round(prev.h) % 360 }));
    };
  }, [sweep, hsbRef, clearOverride, setHsb]);

  // ── The graph as a picker ─────────────────────────────────────────
  const onHue = useCallback((h: number) => { stopSweep(); setHsbClear((prev) => ({ ...prev, h })); }, [stopSweep, setHsbClear]);
  // The top rail is brightness outright. The bottom rail is where min lands
  // with max held, which is saturation.
  const onMax = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, b: Math.round((v / 255) * 100) })), [setHsbClear]);
  const onMin = useCallback((v: number) => setHsbClear((prev) => {
    const max = (prev.b / 100) * 255;
    if (max <= 0) return prev;
    return { ...prev, s: Math.round((1 - Math.min(v, max) / max) * 100) };
  }), [setHsbClear]);

  // ── Colour editor handlers, as the picker wires them ──────────────
  const handleR = useCallback((v: number) => { stopSweep(); setRgbChannel('r', v); }, [stopSweep, setRgbChannel]);
  const handleG = useCallback((v: number) => { stopSweep(); setRgbChannel('g', v); }, [stopSweep, setRgbChannel]);
  const handleB = useCallback((v: number) => { stopSweep(); setRgbChannel('b', v); }, [stopSweep, setRgbChannel]);
  const handleH = useCallback((v: number) => { stopSweep(); setHsbClear((prev) => ({ ...prev, h: v })); }, [stopSweep, setHsbClear]);
  const handleS = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, s: v })), [setHsbClear]);
  const handleBr = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, b: v })), [setHsbClear]);
  const handleSb = useCallback((s: number, b: number) => setHsbClear((prev) => ({ ...prev, s, b })), [setHsbClear]);
  const handleHslH = useCallback((v: number) => { stopSweep(); setHslChannel('h', v); }, [stopSweep, setHslChannel]);
  // An HSL write rebuilds the colour from a hue frozen at the start of the
  // gesture (decision-hsl-gesture-origin), which under a sweep would drag
  // hue back to that origin every move. While the sweep runs, S and L are
  // set through the hue of the moment instead, and only s and b change.
  const hslUnderSweep = useCallback((channel: 's' | 'l', v: number) => setHsbClear((prev) => {
    const c = hsbToRgb(prev.h, prev.s, prev.b);
    const cur = rgbToHsl(c.r, c.g, c.b);
    const want = hslToRgb(prev.h, channel === 's' ? v : cur.s, channel === 'l' ? v : cur.l);
    const next = rgbToHsb(want.r, want.g, want.b);
    return { h: prev.h, s: next.s, b: next.b };
  }), [setHsbClear]);
  const handleHslS = useCallback((v: number) => (sweepRef.current ? hslUnderSweep('s', v) : setHslChannel('s', v)), [hslUnderSweep, setHslChannel]);
  const handleHslL = useCallback((v: number) => (sweepRef.current ? hslUnderSweep('l', v) : setHslChannel('l', v)), [hslUnderSweep, setHslChannel]);
  const handleHex = useCallback((parsed: RGB) => { stopSweep(); clearOverride(); setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b)); }, [stopSweep, clearOverride, setHsb]);

  // While the sweep runs the state's hue is the smooth one: the hue read
  // back off the 8-bit colour steps, coarsely at low saturation. Otherwise
  // the colour's own hue, so the dots sit exactly on the wave after an RGB
  // edit, and the slider's when the colour is a grey and has none.
  const hue = sweep ? hsb.h : (exactHue(rgb) ?? hsb.h);
  const padTop = padTopFor(model);

  return (
    // No fixed height: the row is as tall as the editor and the Graph panel,
    // and the stage fills it, so the graph sits level with the two cards.
    // Capped and centred, so the spectrum stops growing with the window: at
    // the cap the plot is about 770 wide, a little over two pixels a degree.
    <div className="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-[1fr_420px] bg-background text-foreground">
      <div className="p-3">
        <div className="relative h-[60vh] overflow-hidden rounded-lg border border-border md:h-full" style={{ background: '#202020' }}>
          <WaveStage
            rgb={rgb} hue={hue} model={model} shown={shown}
            showSpectrum={showSpectrum} showGuides={showGuides}
            onHue={onHue} onMax={onMax} onMin={onMin}
          />
          {/* text-base, as all UI text is; the title a step up. The band above the plot is sized for these two lines. */}
          {/* Two rows in the band the column headings rise through: the
              title, and under it the channel readouts flush to the top of
              the spectrum. Each name in its ink, and "Hue spectrum" in the
              hue slider's gradient at full brightness and 80 saturation: the
              pure hues go dark in the blue third on this ground, and a little
              white lifts them. */}
          <div className="pointer-events-none absolute text-2xl font-semibold leading-8 text-white" style={{ left: PAD_LEFT, top: padTop - 6 - 24 - 6 - 32 }}>
            <span style={{ color: TEXT_INK.r }}>Red</span>, <span style={{ color: TEXT_INK.g }}>Green</span>, and <span style={{ color: TEXT_INK.b }}>Blue</span> across the{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: hueGradient(80, 100, 'srgb') }}>Hue spectrum</span>
          </div>
          {/* The channel readouts over the plot, each centred on the hue
              where its channel peaks - red at 0, green at 120, blue at 240 -
              so the label stands above its own band of the spectrum. Red's
              peak is the left edge, so it clamps to start there. Each value
              is padded to three figures in the mono face so nothing shifts
              as digits come and go, and each carries a checkbox in its ink
              that shows or hides the channel on the graph - the one live
              control in the band, so the labels alone take the pointer. */}
          <div className="pointer-events-none absolute" style={{ left: PAD_LEFT, right: GUTTER, top: padTop - 6 - 24, height: 24 }}>
            {CHANNELS.map((ch) => (
              <label
                key={ch}
                className="pointer-events-auto absolute flex w-20 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-pre font-mono text-base leading-6 tabular-nums"
                style={{
                  color: TEXT_INK[ch],
                  left: `clamp(0px, calc(${(CHANNEL_OFFSET[ch] / 360) * 100}% - 2.5rem), calc(100% - 5rem))`,
                }}
                title={`Show ${CHANNEL_NAME[ch]} · Ctrl-click to solo`}
                // A modified click on the words solos too. The label's own
                // activation would forward a plain click to the box, so it
                // is stopped here; a click on the box itself is the box's.
                onClick={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.target !== e.currentTarget.querySelector('input')) {
                    e.preventDefault();
                    solo(ch);
                  }
                }}
              >
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer"
                  style={{ accentColor: TEXT_INK[ch] }}
                  checked={shown[ch]}
                  // React drives a checkbox's change from its click, so the
                  // native event carries the modifier keys.
                  onChange={(e) => {
                    const m = e.nativeEvent as MouseEvent;
                    if (m.ctrlKey || m.metaKey) solo(ch);
                    else setShown((s) => ({ ...s, [ch]: !s[ch] }));
                  }}
                  aria-label={`Show ${CHANNEL_NAME[ch]} on the graph`}
                />
                {`${ch.toUpperCase()} ${String(rgb[ch]).padStart(3)}`}
              </label>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-3 border-l border-border p-3">
        <div className="panel-frame flex flex-col rounded-lg border border-border p-2.5">
          <CollapsibleSection id="lab-color-editor" title="Color Editor" level="h2">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3" style={{ height: 160 }}>
                <PreviewSwatch hex={hex} />
                <SBBox hue={hsb.h} saturation={hsb.s} brightness={hsb.b} onChange={handleSb} />
                <HSlider hue={Math.round(hsb.h) % 360} onChange={handleH} />
              </div>
              <HexInput hex={hex} onChange={handleHex} />
              <FlatSection title="RGB" headerRight={
                <Tabs value={rgbMode} onValueChange={(v) => setRgbMode(v as 'channel' | 'mixed')}>
                  <TabsList>
                    <TabsTrigger value="channel" className="w-16">Channel</TabsTrigger>
                    <TabsTrigger value="mixed" className="w-16">Mixed</TabsTrigger>
                  </TabsList>
                </Tabs>
              }>
                <div className="flex flex-col gap-2">
                  <ColorSlider label="R" group="rgb" value={rgb.r} max={255} gradient={rgbMode === 'mixed' ? redGradient(rgb.g, rgb.b) : redChannelGradient} onChange={handleR} />
                  <ColorSlider label="G" group="rgb" value={rgb.g} max={255} gradient={rgbMode === 'mixed' ? greenGradient(rgb.r, rgb.b) : greenChannelGradient} onChange={handleG} />
                  <ColorSlider label="B" group="rgb" value={rgb.b} max={255} gradient={rgbMode === 'mixed' ? blueGradient(rgb.r, rgb.g) : blueChannelGradient} onChange={handleB} />
                </div>
              </FlatSection>
              <FlatSection title="HSB / HSL" headerRight={
                <Tabs value={model} onValueChange={(v) => setModel(v as Model)}>
                  <TabsList>
                    <TabsTrigger value="hsb" className="w-12">HSB</TabsTrigger>
                    <TabsTrigger value="hsl" className="w-12">HSL</TabsTrigger>
                    <TabsTrigger value="both" className="w-12">Both</TabsTrigger>
                  </TabsList>
                </Tabs>
              }>
                <div className="flex flex-col gap-3">
                  {model !== 'hsl' && (
                    <div className="flex flex-col gap-2" role="group" aria-label="HSB">
                      {model === 'both' && <span className="text-base font-semibold text-muted-foreground">HSB</span>}
                      <ColorSlider label="H" group="hsb" value={Math.round(hsb.h) % 360} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={handleH} />
                      <ColorSlider label="S" group="hsb" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={handleS} />
                      <ColorSlider label="B" group="hsb" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={handleBr} />
                    </div>
                  )}
                  {model !== 'hsb' && (
                    <div className="flex flex-col gap-2" role="group" aria-label="HSL">
                      {model === 'both' && <span className="text-base font-semibold text-muted-foreground">HSL</span>}
                      <ColorSlider label="H" group="hsl" value={hsl.h} max={360} wrap gradient={hslHueGradient(hsl.s, hsl.l, 'srgb')} onChange={handleHslH} />
                      <ColorSlider label="S" group="hsl" value={hsl.s} max={100} gradient={hslSaturationGradient(hsl.h, hsl.l, 'srgb')} onChange={handleHslS} />
                      <ColorSlider label="L" group="hsl" value={hsl.l} max={100} gradient={lightnessGradient(hsl.h, hsl.s, 'srgb')} onChange={handleHslL} />
                    </div>
                  )}
                </div>
              </FlatSection>
            </div>
          </CollapsibleSection>
        </div>

        <div className="panel-frame flex flex-col rounded-lg border border-border p-2.5">
          <CollapsibleSection id="lab-graph" title="Graph" level="h2">
            <div className="flex flex-col gap-3">
              {/* The panel's switch row, with the speed slider tucked between
                  the label and the switch. Built from the row's own parts -
                  its Label and SettingsSwitch - so it matches the two below. */}
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={sweepId} className="shrink-0 cursor-pointer select-none text-base text-muted-foreground">Sweep hue</Label>
                <input
                  id="lab-sweep-speed" type="range" min={SWEEP_MIN} max={SWEEP_MAX} step={1} value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-foreground"
                  aria-label="Sweep speed, degrees a second"
                />
                <span className="w-14 shrink-0 text-right text-base tabular-nums text-foreground">{speed}°/s</span>
                <SettingsSwitch id={sweepId} checked={sweep} onToggle={() => setSweep((s) => !s)} ariaLabel="Sweep hue round the circle" />
              </div>
              <SwitchRow label="Spectrum" checked={showSpectrum} onToggle={() => setShowSpectrum((s) => !s)} ariaLabel="Toggle the rainbow behind the graph" />
              <SwitchRow label="Rails" checked={showGuides} onToggle={() => setShowGuides((s) => !s)} ariaLabel="Toggle the max and min rails and their readouts" />
            </div>
          </CollapsibleSection>
        </div>
      </aside>
    </div>
  );
}

/** The shared hook plus the hex the editor primitives want. */
function useColorStateWithHex() {
  const state = useColorState({ initial: { h: 300, s: 100, b: 100 } });
  const hex = rgbToHex(state.rgb.r, state.rgb.g, state.rgb.b);
  return { ...state, hex };
}
