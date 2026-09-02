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
  redGradient, greenGradient, blueGradient,
} from '../utils/sliderGradients';
import { useColorState } from '../hooks/useColorState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ColorSlider from '../components/ColorSlider';
import SBBox from '../components/SBBox';
import HSlider from '../components/HSlider';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import CollapsibleSection from '../components/CollapsibleSection';
import {
  createCubeRenderer, DEFAULT_PARAMS, VIEWS, FRAG,
  type CubeParams, type CubeRenderer, type CubeStep, type UpAxis,
} from './cubeRenderer';

type Num = { [K in keyof CubeParams]: CubeParams[K] extends number ? K : never }[keyof CubeParams];

function Field({ label, id, value, min, max, step, onChange, fmt }: {
  label: string; id: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div className="grid grid-cols-[5.2rem_1fr_3.4rem] items-center gap-2">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="h-1.5 w-full cursor-pointer accent-foreground"
      />
      <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">{(fmt ?? ((v) => v.toFixed(2)))(value)}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-foreground" />
      {label}
    </label>
  );
}

const STEP_NAMES: Record<CubeStep, string> = { 51: '#33', 17: '#11', 1: '#01' };

export default function CubeBench() {
  const {
    hsb, rgb, hex: _hex, setHsb, setHsbClear, setRgb, setRgbChannel, clearOverride,
  } = useColorStateWithHex();

  const [p, setP] = useState<CubeParams>(DEFAULT_PARAMS);
  const set = useCallback(<K extends keyof CubeParams>(k: K, v: CubeParams[K]) => setP((prev) => ({ ...prev, [k]: v })), []);
  const num = useCallback((k: Num) => (v: number) => set(k, v), [set]);
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

  useEffect(() => {
    if (!spin) return;
    let raf = 0;
    const tick = () => { setP((prev) => ({ ...prev, theta: prev.theta + 0.006 })); raf = requestAnimationFrame(tick); };
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

  // Double-click the canvas: tween back to the home view, lightness up.
  const homeRaf = useRef(0);
  const goHome = useCallback(() => {
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
        zoom: from.zoom + (1 - from.zoom) * e,
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
  const handleHex = useCallback((parsed: RGB) => { clearOverride(); setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b)); }, [clearOverride, setHsb]);

  const recipe = useMemo(() => JSON.stringify({
    colour: _hex,
    cubes: p.cubes ? { step: STEP_NAMES[p.cubeStep], gap: p.gap, edge: p.edge, edgeDark: p.edgeDark, outline: p.outline ? p.outlineW : false } : false,
    camera: { up: p.up, guides: p.axes, theta: +p.theta.toFixed(3), phi: +p.phi.toFixed(3), zoom: +p.zoom.toFixed(2) },
  }, null, 2), [p, _hex]);
  const [copied, setCopied] = useState('');
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(() => setCopied(`${what} copied`), () => setCopied('clipboard blocked'));
    setTimeout(() => setCopied(''), 1800);
  };

  const seg = (v: string, on: string, cb: (x: string) => void) => (
    <Tabs value={v} onValueChange={(x) => cb(x as string)}><TabsList className="w-full">{on.split('|').map((o) => {
      const [val, label] = o.split(':'); return <TabsTrigger key={val} value={val} className="flex-1">{label}</TabsTrigger>;
    })}</TabsList></Tabs>
  );
  const perSide = 255 / p.cubeStep + 1;

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
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-[11px] leading-snug text-muted-foreground">
          <div className="text-foreground/80">orthographic · {{ neutral: 'lightness', r: 'red', g: 'green', b: 'blue' }[p.up]} up</div>
          <div>{p.cubes ? `${perSide} cubes a side, #00 to #FF in ${STEP_NAMES[p.cubeStep]} steps` : 'no cubes'}</div>
          <div>drag to orbit · wheel to zoom · double-click for lightness up</div>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setP((prev) => ({ ...prev, theta: VIEWS.hex[0], phi: VIEWS.hex[1] }))}>Hexagon</Button>
          <Button size="sm" variant="outline" onClick={() => setP((prev) => ({ ...prev, theta: VIEWS.corner[0], phi: VIEWS.corner[1] }))}>Corner</Button>
          <Button size="sm" variant="outline" onClick={() => setP((prev) => ({ ...prev, theta: VIEWS.front[0], phi: VIEWS.front[1] }))}>Front</Button>
          <Button size="sm" variant={spin ? 'default' : 'outline'} aria-pressed={spin} onClick={() => setSpin((s) => !s)}>Spin</Button>
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
              <CollapsibleSection id="lab-rgb" title="RGB">
                <div className="flex flex-col gap-2">
                  <ColorSlider label="R" group="rgb" value={rgb.r} max={255} gradient={redGradient(rgb.g, rgb.b)} onChange={handleR} />
                  <ColorSlider label="G" group="rgb" value={rgb.g} max={255} gradient={greenGradient(rgb.r, rgb.b)} onChange={handleG} />
                  <ColorSlider label="B" group="rgb" value={rgb.b} max={255} gradient={blueGradient(rgb.r, rgb.g)} onChange={handleB} />
                </div>
              </CollapsibleSection>
              <CollapsibleSection id="lab-hsb" title="HSB">
                <div className="flex flex-col gap-2">
                  <ColorSlider label="H" group="hsb" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={handleH} />
                  <ColorSlider label="S" group="hsb" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={handleS} />
                  <ColorSlider label="B" group="hsb" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={handleBr} />
                </div>
              </CollapsibleSection>
              <CollapsibleSection id="lab-hex" title="Hex">
                <HexInput hex={_hex} onChange={handleHex} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        </div>

        <div className="panel-frame flex flex-col rounded-lg border border-border p-2.5">
          <CollapsibleSection id="lab-cube" title="Cube" level="h2">
            <div className="flex flex-col gap-3">
              <CollapsibleSection id="lab-cubes" title="Cubes" headerRight={
                <Toggle label="" checked={p.cubes} onChange={(v) => set('cubes', v)} />
              }>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">Cubes per axis</div>
                  {seg(String(p.cubeStep), '51:6|17:16|1:256', (x) => set('cubeStep', +x as CubeStep))}
                  <Toggle label="Outline the selected cube (black on light colours, white on dark)" checked={p.outline} onChange={(v) => set('outline', v)} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="lab-camera" title="Camera" defaultOpen={false}>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">Up axis</div>
                  {seg(p.up, 'neutral:Lightness|r:Red|g:Green|b:Blue', (x) => setP((prev) => ({
                    ...prev, up: x as UpAxis,
                    // lightness: from the white corner looking down to black, the hexagon;
                    // a channel: side-on, so that channel runs straight up the screen
                    theta: Math.PI / 2, phi: x === 'neutral' ? Math.PI / 2 : 0,
                  })))}
                  <div className="text-[11px] text-muted-foreground">Orthographic only. The hexagon is a property of a parallel projection; under perspective the near corner swells.</div>
                  <Toggle label="Guides: the three axes, in their colours" checked={p.axes} onChange={(v) => set('axes', v)} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="lab-recipe" title="Recipe" defaultOpen={false}>
                <div className="flex flex-col gap-2">
                  <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted p-2 font-mono text-[11px] leading-snug text-muted-foreground">{recipe}</pre>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => copy(recipe, 'recipe')}>Copy recipe</Button>
                    <Button size="sm" variant="outline" onClick={() => copy(FRAG, 'shader')}>Copy fragment shader</Button>
                    <span className="font-mono text-[11px] text-muted-foreground">{copied}</span>
                  </div>
                </div>
              </CollapsibleSection>
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
