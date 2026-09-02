/**
 * Cube bench: the RGB cube as little cubes, beside the app's own Color Editor.
 *
 * The editor here is the picker's, assembled from the same primitives on the
 * same colour-state hook - PreviewSwatch, SBBox, HSlider, ColorSlider, HexInput -
 * so what drives the cube is exactly what drives the hexagon. Nothing in
 * src/components is changed to make that happen; this file only composes.
 *
 * Everything on the Cube rail is a renderer parameter. A recipe block at the
 * bottom serialises the lot, so a look that works can be lifted into the intro
 * as data.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rgbToHsb, rgbToHex, type RGB } from '../utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient,
  hslHueGradient, hslSaturationGradient, lightnessGradient,
  redGradient, greenGradient, blueGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import { useColorState } from '../hooks/useColorState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import ColorSlider from '../components/ColorSlider';
import SBBox from '../components/SBBox';
import HSlider from '../components/HSlider';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import CollapsibleSection from '../components/CollapsibleSection';
import {
  createCubeRenderer, DEFAULT_PARAMS,
  type CubeParams, type CubeRenderer, type CubeStep, type UpAxis, type Shape,
} from './cubeRenderer';

/**
 * Notches over a ColorSlider's track, at the cube grid. Drawn from out here
 * rather than by the slider: this lab does not change the app's components.
 * The track is found by the slider's own id and measured against the wrapper.
 */
function Notched({ trackId, ticks, max, children }: { trackId: string; ticks?: number[]; max: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const wrap = ref.current; if (!wrap) return;
    const track = wrap.querySelector<HTMLElement>('#' + trackId); if (!track) return;
    const measure = () => {
      const a = wrap.getBoundingClientRect(), b = track.getBoundingClientRect();
      setBox({ left: b.left - a.left, top: b.top - a.top, width: b.width, height: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(wrap); ro.observe(track);
    return () => ro.disconnect();
  }, [trackId]);
  return (
    <div ref={ref} className="relative">
      {children}
      {ticks && box && (
        <div className="pointer-events-none absolute" style={{ left: box.left, top: box.top + box.height + 1, width: box.width, height: 4 }} aria-hidden="true">
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 h-full w-px -translate-x-1/2 bg-white/90" style={{ left: `${(t / max) * 100}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A section title row without the card: the app's h3 title style, the switch
 * on the right, the content below. The app's CollapsibleSection has a flush
 * variant, but its title is a different size and weight from the card one.
 */
function FlatSection({ title, headerRight, children }: { title: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <h3 className="text-sm font-medium tracking-normal text-foreground/80">{title}</h3>
        {headerRight}
      </div>
      {children}
    </section>
  );
}

const STEP_NAMES: Record<CubeStep, string> = { 51: '#33', 17: '#11', 1: '#01' };

export default function CubeBench() {
  const {
    hsb, rgb, hsl, hex: _hex, setHsb, setHsbClear, setRgb, setRgbChannel, setHslChannel, clearOverride,
  } = useColorStateWithHex();
  const [rgbMode, setRgbMode] = useState<'channel' | 'mixed'>('mixed');
  const [hslMode, setHslMode] = useState<'hsb' | 'hsl' | 'both'>('hsb');

  const [p, setP] = useState<CubeParams>(DEFAULT_PARAMS);
  const set = useCallback(<K extends keyof CubeParams>(k: K, v: CubeParams[K]) => setP((prev) => ({ ...prev, [k]: v })), []);
  const [spin, setSpin] = useState(false);

  const params = useMemo<CubeParams>(() => ({ ...p, rgb: [rgb.r / 255, rgb.g / 255, rgb.b / 255] }), [p, rgb]);

  // The editor snaps to the cube grid: with 6 or 16 cubes per axis every
  // channel rounds to the nearest #33 or #11 step after any edit, and HSB and
  // the hex follow from that RGB. Through setRgb, so the exact value is what
  // is stored. On-grid values pass through unchanged, so this settles at once.
  useEffect(() => {
    const st = p.cubeStep;
    if (st === 1) return;
    const q = (v: number) => Math.min(255, Math.round(v / st) * st);
    const snapped = { r: q(rgb.r), g: q(rgb.g), b: q(rgb.b) };
    if (snapped.r !== rgb.r || snapped.g !== rgb.g || snapped.b !== rgb.b) setRgb(snapped);
  }, [rgb, p.cubeStep, setRgb]);

  // ── WebGL ─────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CubeRenderer | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let r: CubeRenderer | null = null;
    try { r = createCubeRenderer(canvas); } catch (e) { console.error(e); }
    if (!r) { setUnsupported(true); return; }
    rendererRef.current = r;
    // the page ground, so the canvas reads as part of it
    const sync = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      const probe = document.createElement('div');
      probe.style.color = bg; document.body.appendChild(probe);
      const m = getComputedStyle(probe).color.match(/[\d.]+/g);
      probe.remove();
      if (m && m.length >= 3) setP((prev) => ({ ...prev, ground: [+m[0] / 255, +m[1] / 255, +m[2] / 255] }));
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const ro = new ResizeObserver(() => r.render(paramsRef.current));
    ro.observe(canvas);
    return () => { mo.disconnect(); ro.disconnect(); r.destroy(); rendererRef.current = null; };
  }, []);

  useEffect(() => { rendererRef.current?.render(params); }, [params]);

  // Orbit: a slow sweep round the lightness axis while the tilt drifts in and
  // out, so the cube is seen from the side as well as from above. The tilt
  // eases toward its target, so starting from straight down there is no jump.
  useEffect(() => {
    if (!spin) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const target = 0.95 + 0.4 * Math.sin(t * 0.45);
      setP((prev) => ({ ...prev, theta: prev.theta + 0.006, phi: prev.phi + (target - prev.phi) * 0.03 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin]);

  // ── Orbit ─────────────────────────────────────────────────────────
  const drag = useRef<{ x: number; y: number; th: number; ph: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, th: paramsRef.current.theta, ph: paramsRef.current.phi };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current; if (!d) return;
    setP((prev) => ({
      ...prev,
      theta: d.th + (e.clientX - d.x) * 0.008,
      phi: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d.ph + (e.clientY - d.y) * 0.008)),
    }));
  };
  const onPointerUp = () => { drag.current = null; };

  // Shape: tween the three position weights so the grid morphs.
  const [shape, setShape] = useState<Shape>('cube');
  const shapeRaf = useRef(0);
  const goShape = useCallback((next: Shape) => {
    setShape(next);
    cancelAnimationFrame(shapeRaf.current);
    const from = paramsRef.current.shapeW;
    const to: [number, number, number] = next === 'cube' ? [1, 0, 0] : next === 'hsb' ? [0, 1, 0] : [0, 0, 1];
    const start = performance.now(), ms = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // ease in-out cubic
      setP((prev) => ({ ...prev, shapeW: [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * e) as [number, number, number] }));
      if (t < 1) shapeRaf.current = requestAnimationFrame(tick);
    };
    shapeRaf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(shapeRaf.current), []);

  // Double-click the canvas: tween back to the home view, lightness up.
  const homeRaf = useRef(0);
  const goHome = useCallback(() => {
    setSpin(false);
    cancelAnimationFrame(homeRaf.current);
    const from = paramsRef.current;
    const two = Math.PI * 2;
    // shortest way round for the azimuth
    let dTheta = ((Math.PI / 2 - from.theta) % two + two * 1.5) % two - Math.PI;
    if (Math.abs(dTheta) < 1e-6) dTheta = 0;
    const start = performance.now(), ms = 550;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - (1 - t) * (1 - t) * (1 - t);   // ease out cubic
      setP((prev) => ({
        ...prev, up: 'neutral',
        theta: from.theta + dTheta * e,
        phi: from.phi + (Math.PI / 2 - from.phi) * e,
        zoom: from.zoom + (DEFAULT_PARAMS.zoom - from.zoom) * e,
        focus: [0, 1, 2].map((i) => from.focus[i] + (0.5 - from.focus[i]) * e) as [number, number, number],
      }));
      if (t < 1) homeRaf.current = requestAnimationFrame(tick);
    };
    homeRaf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(homeRaf.current), []);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setP((prev) => ({ ...prev, zoom: Math.max(0.4, Math.min(60, prev.zoom * Math.exp(-e.deltaY * 0.0015))) }));
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, []);

  // ── Colour editor handlers, as the picker wires them ──────────────
  const handleR = useCallback((v: number) => setRgbChannel('r', v), [setRgbChannel]);
  const handleG = useCallback((v: number) => setRgbChannel('g', v), [setRgbChannel]);
  const handleB = useCallback((v: number) => setRgbChannel('b', v), [setRgbChannel]);
  const handleH = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, h: v })), [setHsbClear]);
  const handleS = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, s: v })), [setHsbClear]);
  const handleBr = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, b: v })), [setHsbClear]);
  const handleSb = useCallback((s: number, b: number) => setHsbClear((prev) => ({ ...prev, s, b })), [setHsbClear]);
  const handleHslH = useCallback((v: number) => setHslChannel('h', v), [setHslChannel]);
  const handleHslS = useCallback((v: number) => setHslChannel('s', v), [setHslChannel]);
  const handleHslL = useCallback((v: number) => setHslChannel('l', v), [setHslChannel]);
  const handleHex = useCallback((parsed: RGB) => { clearOverride(); setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b)); }, [clearOverride, setHsb]);

  const seg = (v: string, on: string, cb: (x: string) => void) => (
    <Tabs value={v} onValueChange={(x) => cb(x as string)}><TabsList className="w-full">{on.split('|').map((o) => {
      const [val, label] = o.split(':'); return <TabsTrigger key={val} value={val} className="flex-1">{label}</TabsTrigger>;
    })}</TabsList></Tabs>
  );
  const perSide = 255 / p.cubeStep + 1;
  // notches on the RGB sliders at the cube grid; none at 256
  const ticks = useMemo(() => (p.cubeStep === 1 ? undefined : Array.from({ length: perSide }, (_, i) => i * p.cubeStep)), [p.cubeStep, perSide]);

  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-[1fr_420px] bg-background text-foreground">
      <div className="relative min-h-[60vh] md:min-h-0">
        {unsupported ? (
          <p className="p-8 text-muted-foreground">WebGL2 is not available here.</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onDoubleClick={goHome}
          />
        )}
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-0.5 text-xs text-muted-foreground">
          <div className="text-sm font-semibold text-foreground">{perSide} cubes per axis</div>
          <div>#00 to #FF in {STEP_NAMES[p.cubeStep]} steps · {{ cube: 'RGB cube', hsb: 'HSB cone', hsl: 'HSL bicone' }[shape]} · {{ neutral: 'lightness', r: 'red', g: 'green', b: 'blue' }[p.up]} up</div>
          <div>Drag to orbit · wheel to zoom · double-click to reset</div>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={goHome}>Hexagon</Button>
          <Button size="sm" variant={spin ? 'default' : 'outline'} aria-pressed={spin} onClick={() => setSpin((s) => !s)}>Orbit</Button>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-l border-border p-3">
        <div className="panel-frame flex flex-col rounded-lg border border-border p-2.5">
          <CollapsibleSection id="lab-color-editor" title="Color Editor" level="h2">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3" style={{ height: 160 }}>
                <PreviewSwatch hex={_hex} />
                <SBBox hue={hsb.h} saturation={hsb.s} brightness={hsb.b} onChange={handleSb} />
                <HSlider hue={hsb.h} onChange={handleH} />
              </div>
              <HexInput hex={_hex} onChange={handleHex} />
              <FlatSection title="RGB" headerRight={
                <Tabs value={rgbMode} onValueChange={(v) => setRgbMode(v as 'channel' | 'mixed')}>
                  <TabsList>
                    <TabsTrigger value="channel" className="w-16">Channel</TabsTrigger>
                    <TabsTrigger value="mixed" className="w-16">Mixed</TabsTrigger>
                  </TabsList>
                </Tabs>
              }>
                <div className="flex flex-col gap-2">
                  <Notched trackId="slider-rgb-r-track" ticks={ticks} max={255}>
                    <ColorSlider label="R" group="rgb" value={rgb.r} max={255} gradient={rgbMode === 'mixed' ? redGradient(rgb.g, rgb.b) : redChannelGradient} onChange={handleR} />
                  </Notched>
                  <Notched trackId="slider-rgb-g-track" ticks={ticks} max={255}>
                    <ColorSlider label="G" group="rgb" value={rgb.g} max={255} gradient={rgbMode === 'mixed' ? greenGradient(rgb.r, rgb.b) : greenChannelGradient} onChange={handleG} />
                  </Notched>
                  <Notched trackId="slider-rgb-b-track" ticks={ticks} max={255}>
                    <ColorSlider label="B" group="rgb" value={rgb.b} max={255} gradient={rgbMode === 'mixed' ? blueGradient(rgb.r, rgb.g) : blueChannelGradient} onChange={handleB} />
                  </Notched>
                </div>
              </FlatSection>
              <FlatSection title="HSB / HSL" headerRight={
                <Tabs value={hslMode} onValueChange={(v) => setHslMode(v as 'hsb' | 'hsl' | 'both')}>
                  <TabsList>
                    <TabsTrigger value="hsb" className="w-12">HSB</TabsTrigger>
                    <TabsTrigger value="hsl" className="w-12">HSL</TabsTrigger>
                    <TabsTrigger value="both" className="w-12">Both</TabsTrigger>
                  </TabsList>
                </Tabs>
              }>
                <div className="flex flex-col gap-3">
                  {hslMode !== 'hsl' && (
                    <div className="flex flex-col gap-2" role="group" aria-label="HSB">
                      {hslMode === 'both' && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSB</span>}
                      <ColorSlider label="H" group="hsb" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={handleH} />
                      <ColorSlider label="S" group="hsb" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={handleS} />
                      <ColorSlider label="B" group="hsb" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={handleBr} />
                    </div>
                  )}
                  {hslMode !== 'hsb' && (
                    <div className="flex flex-col gap-2" role="group" aria-label="HSL">
                      {hslMode === 'both' && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSL</span>}
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
          <CollapsibleSection id="lab-cube" title="Cube" level="h2">
            <div className="flex flex-col gap-3">
              <Label className="text-sm text-muted-foreground">Cubes per axis</Label>
              {seg(String(p.cubeStep), '51:6|17:16|1:256', (x) => set('cubeStep', +x as CubeStep))}
              <Label className="text-sm text-muted-foreground">Shape</Label>
              {seg(shape, 'cube:Cube|hsb:HSB cone|hsl:HSL bicone', (x) => goShape(x as Shape))}
              <Label className="text-sm text-muted-foreground">Up axis</Label>
              {seg(p.up, 'neutral:Lightness|r:Red|g:Green|b:Blue', (x) => setP((prev) => ({
                ...prev, up: x as UpAxis,
                // lightness: from the white corner looking down to black, the hexagon;
                // a channel: side-on, so that channel runs straight up the screen
                theta: Math.PI / 2, phi: x === 'neutral' ? Math.PI / 2 : 0,
              })))}
              <SwitchRow label="Guides" checked={p.axes} onToggle={() => set('axes', !p.axes)} ariaLabel="Toggle the axis guides" />
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
