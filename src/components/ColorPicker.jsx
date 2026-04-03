import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/colorConversions';
import {
  hueGradient,
  saturationGradient,
  brightnessGradient,
  hslHueGradient,
  hslSaturationGradient,
  lightnessGradient,
  redGradient,
  greenGradient,
  blueGradient,
  redChannelGradient,
  greenChannelGradient,
  blueChannelGradient,
} from '../utils/sliderGradients';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ColorSlider from './ColorSlider';
import ColorHexagon from './ColorHexagon';
import SBBox from './SBBox';
import HSlider from './HSlider';
import HexInput from './HexInput';
import EquationsPanel from './EquationsPanel';
import PreviewSwatch from './PreviewSwatch';
import CollapsibleSection from './CollapsibleSection';
import NamedColorMatch from './NamedColorMatch';
import ThemeToggle from './ThemeToggle';
import { Play, Pause } from 'lucide-react';

export default function ColorPicker() {
  const [hsb, setHsb] = useState(() => {
    try {
      const saved = localStorage.getItem('color-taylor-hsb');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { h: 327, s: 12, b: 98 };
  });
  const [hslMode, setHslMode] = useState('hsb');
  const [rgbGradientMode, setRgbGradientMode] = useState('channel');
  const [blMode, setBlMode] = useState('brightness');
  const [colorSpace, setColorSpace] = useState('srgb');
  const [hoverMatchRgb, setHoverMatchRgb] = useState(null);
  const [showHtmlOnHex, setShowHtmlOnHex] = useState(false);
  const [hoveredHtmlColor, setHoveredHtmlColor] = useState(null);
  const animRef = useRef(null);
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;
  const rgbOverride = useRef(null);
  const topRowRef = useRef(null);
  const [topRowWidth, setTopRowWidth] = useState(null);

  useEffect(() => {
    if (!topRowRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setTopRowWidth(entry.contentRect.width);
    });
    observer.observe(topRowRef.current);
    return () => observer.disconnect();
  }, []);

  // Undo/redo history
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const lastPushed = useRef(null);

  // Push to undo stack (debounced — only if value changed significantly)
  useEffect(() => {
    if (isUndoRedoing.current) return;
    const key = `${hsb.h},${hsb.s},${hsb.b}`;
    if (key === lastPushed.current) return;
    const timeout = setTimeout(() => {
      if (lastPushed.current !== null) {
        const [h, s, b] = lastPushed.current.split(',').map(Number);
        undoStack.current.push({ h, s, b });
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
      }
      lastPushed.current = key;
    }, 500);
    return () => clearTimeout(timeout);
  }, [hsb.h, hsb.s, hsb.b]);

  const isUndoRedoing = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.current.length > 0) {
          redoStack.current.push({ ...hsbRef.current });
          const prev = undoStack.current.pop();
          lastPushed.current = `${prev.h},${prev.s},${prev.b}`;
          rgbOverride.current = null;
          isUndoRedoing.current = true;
          // Tween to previous color
          if (animRef.current) cancelAnimationFrame(animRef.current);
          const from = { ...hsbRef.current };
          const duration = 400;
          let start = null;
          const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const tick = (ts) => {
            if (!start) start = ts;
            const t = easeInOut(Math.min((ts - start) / duration, 1));
            let dh = prev.h - from.h;
            if (dh > 180) dh -= 360;
            if (dh < -180) dh += 360;
            const h = Math.round(((from.h + dh * t) % 360 + 360) % 360);
            const s = Math.round(from.s + (prev.s - from.s) * t);
            const b = Math.round(from.b + (prev.b - from.b) * t);
            rgbOverride.current = null;
            setHsb({ h, s, b });
            if ((ts - start) < duration) {
              animRef.current = requestAnimationFrame(tick);
            } else {
              animRef.current = null;
              isUndoRedoing.current = false;
            }
          };
          animRef.current = requestAnimationFrame(tick);
        }
      } else if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        if (redoStack.current.length > 0) {
          undoStack.current.push({ ...hsbRef.current });
          const next = redoStack.current.pop();
          lastPushed.current = `${next.h},${next.s},${next.b}`;
          rgbOverride.current = null;
          isUndoRedoing.current = true;
          if (animRef.current) cancelAnimationFrame(animRef.current);
          const from = { ...hsbRef.current };
          const duration = 400;
          let start = null;
          const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const tick = (ts) => {
            if (!start) start = ts;
            const t = easeInOut(Math.min((ts - start) / duration, 1));
            let dh = next.h - from.h;
            if (dh > 180) dh -= 360;
            if (dh < -180) dh += 360;
            const h = Math.round(((from.h + dh * t) % 360 + 360) % 360);
            const s = Math.round(from.s + (next.s - from.s) * t);
            const b = Math.round(from.b + (next.b - from.b) * t);
            rgbOverride.current = null;
            setHsb({ h, s, b });
            if ((ts - start) < duration) {
              animRef.current = requestAnimationFrame(tick);
            } else {
              animRef.current = null;
              isUndoRedoing.current = false;
            }
          };
          animRef.current = requestAnimationFrame(tick);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ref-based animation stopper — called from user interaction handlers only
  const colorAnimActiveRef = useRef(false);

  const setHsbAndClearOverride = useCallback((valOrFn) => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    rgbOverride.current = null;
    setHsb(valOrFn);
  }, []);

  const animateToHsb = useCallback((target) => {
    rgbOverride.current = null;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      isUndoRedoing.current = false;
    }
    const duration = 1000;
    const from = { ...hsbRef.current };
    let start = null;

    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const t = easeInOut(progress);

      // Handle hue wrap — take the shortest path
      let dh = target.h - from.h;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;

      const h = Math.round(((from.h + dh * t) % 360 + 360) % 360);
      const s = Math.round(from.s + (target.s - from.s) * t);
      const b = Math.round(from.b + (target.b - from.b) * t);

      rgbOverride.current = null;
      setHsb({ h, s, b });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);
  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  const rgb = rgbOverride.current || rgbFromHsb;
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Persist HSB to localStorage
  useEffect(() => {
    localStorage.setItem('color-taylor-hsb', JSON.stringify(hsb));
  }, [hsb.h, hsb.s, hsb.b]);

  const handleRgbChange = useCallback((channel, value) => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    setHsb((prev) => {
      const currentRgb = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const newRgb = { ...currentRgb, [channel]: value };
      rgbOverride.current = newRgb;
      return rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
    });
  }, []);

  const handleHslChange = useCallback((channel, value) => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    rgbOverride.current = null;
    setHsb((prev) => {
      const currentRgb = hsbToRgb(prev.h, prev.s, prev.b);
      const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      const newHsl = { ...currentHsl, [channel]: value };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      return rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
    });
  }, []);

  const showHsb = hslMode === 'hsb' || hslMode === 'both';
  const showHsl = hslMode === 'hsl' || hslMode === 'both';

  // ── Color cycle animation (same as presentation intro) ────────────
  const [colorAnimActive, setColorAnimActive] = useState(false);
  const [colorAnimHolding, setColorAnimHolding] = useState(false);
  const colorAnimRaf = useRef(null);
  colorAnimActiveRef.current = colorAnimActive;

  // Matches the DEFAULT_RECENT colors from ColorHexagon
  const COLOR_KEYFRAMES = [
    { r: 255, g: 0,   b: 0   }, // #ff0000
    { r: 255, g: 255, b: 0   }, // #ffff00
    { r: 0,   g: 255, b: 0   }, // #00ff00
    { r: 0,   g: 255, b: 255 }, // #00ffff
    { r: 0,   g: 0,   b: 255 }, // #0000ff
    { r: 255, g: 0,   b: 255 }, // #ff00ff
    { r: 255, g: 255, b: 255 }, // #ffffff
    { r: 128, g: 128, b: 128 }, // #808080
    { r: 0,   g: 0,   b: 0   }, // #000000
  ];
  const ANIM_TRANSITION_DUR = 1200;
  const ANIM_HOLD_DUR = 800;
  const ANIM_STEP_DUR = ANIM_TRANSITION_DUR + ANIM_HOLD_DUR;
  const ANIM_CYCLE_DUR = COLOR_KEYFRAMES.length * ANIM_STEP_DUR;

  useEffect(() => {
    if (!colorAnimActive) {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
      colorAnimRaf.current = null;
      setColorAnimHolding(false);
      return;
    }

    // Find nearest keyframe to current color
    const curRgb = rgbOverride.current || hsbToRgb(hsbRef.current.h, hsbRef.current.s, hsbRef.current.b);
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < COLOR_KEYFRAMES.length; i++) {
      const kf = COLOR_KEYFRAMES[i];
      const d = Math.abs(curRgb.r - kf.r) + Math.abs(curRgb.g - kf.g) + Math.abs(curRgb.b - kf.b);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const timeOffset = bestIdx * ANIM_STEP_DUR;

    const start = performance.now() - timeOffset;
    let wasHolding = null;
    const tick = (ts) => {
      // Check if user interaction requested a stop
      if (colorAnimActiveRef.current === 'stop') {
        colorAnimActiveRef.current = false;
        setColorAnimActive(false);
        return;
      }

      const elapsed = ts - start;
      const t = elapsed % ANIM_CYCLE_DUR;
      const frameIdx = Math.floor(t / ANIM_STEP_DUR);
      const frameT = t - frameIdx * ANIM_STEP_DUR;

      const isHolding = frameT < ANIM_HOLD_DUR;
      let r, g, b;
      if (isHolding) {
        ({ r, g, b } = COLOR_KEYFRAMES[frameIdx]);
      } else {
        const p = Math.sin(((frameT - ANIM_HOLD_DUR) / ANIM_TRANSITION_DUR) * Math.PI / 2);
        const from = COLOR_KEYFRAMES[frameIdx];
        const to = COLOR_KEYFRAMES[(frameIdx + 1) % COLOR_KEYFRAMES.length];
        r = Math.round(from.r + (to.r - from.r) * p);
        g = Math.round(from.g + (to.g - from.g) * p);
        b = Math.round(from.b + (to.b - from.b) * p);
      }

      if (isHolding !== wasHolding) {
        wasHolding = isHolding;
        setColorAnimHolding(isHolding);
      }

      rgbOverride.current = { r, g, b };
      setHsb(rgbToHsb(r, g, b));
      colorAnimRaf.current = requestAnimationFrame(tick);
    };
    colorAnimRaf.current = requestAnimationFrame(tick);
    return () => {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
    };
  }, [colorAnimActive]);

  return (
    <div id="color-picker-root" className="mx-auto min-w-[1200px] max-w-[1400px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 id="color-picker-title" className="text-2xl font-semibold tracking-tight text-primary">Color Taylor 🧵</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none"
            onClick={() => { window.location.hash = '#/presentation'; }}
          >
            Intro
          </button>
          <button
            className="px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none"
            onClick={() => setColorAnimActive(a => !a)}
            aria-label={colorAnimActive ? 'Pause color animation' : 'Play color animation'}
          >
            {colorAnimActive ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col">
      <div ref={topRowRef} className="flex gap-4 items-start">
        {/* Left column: Color Hexagon */}
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={(h) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; rgbOverride.current = null; setHsb((prev) => ({ ...prev, h })); }}
            onRgbChange={handleRgbChange}
            onHsbChange={(newHsb) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; rgbOverride.current = null; setHsb((prev) => ({ ...prev, ...newHsb })); }}
            onHslChange={handleHslChange}
            onAnimateToHsb={(target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); }}
            blMode={blMode}
            onBlModeChange={setBlMode}
            colorSpace={colorSpace}
            onColorSpaceChange={setColorSpace}
            hoverMatchRgb={hoverMatchRgb}
            showHtmlOnHex={showHtmlOnHex}
            animHolding={colorAnimHolding}
            onHoverHtmlColor={setHoveredHtmlColor}
          />
        </div>

        {/* Right column: Controls */}
        <div id="picker-layout" className="w-[420px] shrink-0 border border-input rounded-lg p-2.5">
        <CollapsibleSection id="sliders-group" title="Sliders" level="h2">
          <div className="flex flex-col gap-3">
        {/* Color Editor: Swatch + SB Box + H Slider */}
        <CollapsibleSection id="color-editor-group" title="Color Editor">
          <div id="sb-wrapper" className="flex gap-3 min-w-0 overflow-hidden">
            <PreviewSwatch hex={hex} />
            <SBBox
              hue={hsb.h}
              saturation={hsb.s}
              brightness={hsb.b}
              onChange={(s, b) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, s, b })); }}
            />
            <HSlider
              hue={hsb.h}
              onChange={(h) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, h })); }}
            />
          </div>
        </CollapsibleSection>

        {/* RGB sliders */}
        <CollapsibleSection
          id="rgb-group"
          title="RGB"
          headerRight={
            <Tabs value={rgbGradientMode} onValueChange={setRgbGradientMode}>
              <TabsList>
                <TabsTrigger value="channel" className="w-16">Channel</TabsTrigger>
                <TabsTrigger value="mixed" className="w-16">Mixed</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <div className="flex flex-col gap-2">
            <ColorSlider
              label="R"
              value={rgb.r}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? redGradient(rgb.g, rgb.b) : redChannelGradient}
              onChange={(v) => handleRgbChange('r', v)}
            />
            <ColorSlider
              label="G"
              value={rgb.g}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? greenGradient(rgb.r, rgb.b) : greenChannelGradient}
              onChange={(v) => handleRgbChange('g', v)}
            />
            <ColorSlider
              label="B"
              value={rgb.b}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? blueGradient(rgb.r, rgb.g) : blueChannelGradient}
              onChange={(v) => handleRgbChange('b', v)}
            />
          </div>
        </CollapsibleSection>

        {/* HSB / HSL section with tabs */}
        <CollapsibleSection
          id="hsb-hsl-group"
          title="HSB / HSL"
          headerRight={
            <Tabs value={hslMode} onValueChange={setHslMode}>
              <TabsList>
                <TabsTrigger value="hsb" className="w-12">HSB</TabsTrigger>
                <TabsTrigger value="hsl" className="w-12">HSL</TabsTrigger>
                <TabsTrigger value="both" className="w-12">Both</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <div className="flex flex-col gap-3">
            {showHsb && (
              <div className="flex flex-col gap-2">
                {hslMode === 'both' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSB</span>
                )}
                <ColorSlider
                  label="H"
                  value={hsb.h}
                  max={360}
                  wrap
                  gradient={hueGradient(hsb.s, hsb.b, colorSpace)}
                  onChange={(v) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, h: v })); }}
                />
                <ColorSlider
                  label="S"
                  value={hsb.s}
                  max={100}
                  gradient={saturationGradient(hsb.h, hsb.b, colorSpace)}
                  onChange={(v) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, s: v })); }}
                />
                <ColorSlider
                  label="B"
                  value={hsb.b}
                  max={100}
                  gradient={brightnessGradient(hsb.h, hsb.s, colorSpace)}
                  onChange={(v) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, b: v })); }}
                />
              </div>
            )}
            {showHsl && (
              <div className="flex flex-col gap-2">
                {hslMode === 'both' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSL</span>
                )}
                <ColorSlider
                  label="H"
                  value={hsl.h}
                  max={360}
                  wrap
                  gradient={hslHueGradient(hsl.s, hsl.l, colorSpace)}
                  onChange={(v) => handleHslChange('h', v)}
                />
                <ColorSlider
                  label="S"
                  value={hsl.s}
                  max={100}
                  gradient={hslSaturationGradient(hsl.h, hsl.l, colorSpace)}
                  onChange={(v) => handleHslChange('s', v)}
                />
                <ColorSlider
                  label="L"
                  value={hsl.l}
                  max={100}
                  gradient={lightnessGradient(hsl.h, hsl.s, colorSpace)}
                  onChange={(v) => handleHslChange('l', v)}
                />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Hex & HTML Colors */}
        <CollapsibleSection id="hex-group" title="Hex and HTML Colors">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-stretch">
              <PreviewSwatch hex={hex} />
              <div className="flex-1 min-w-0">
                <HexInput
                  hex={hex}
                  onChange={(parsed) => { rgbOverride.current = null; setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b)); }}
                />
              </div>
            </div>
            <NamedColorMatch
              rgb={rgb}
              onAnimateToHsb={animateToHsb}
              onHoverMatch={setHoverMatchRgb}
              hoveredHtmlColor={hoveredHtmlColor}
              showOnHex={showHtmlOnHex}
              onShowOnHexChange={setShowHtmlOnHex}
            />
          </div>
        </CollapsibleSection>
          </div>
        </CollapsibleSection>
      </div>
      </div>

      {/* Equations panel */}
      <div className="mt-3 border border-input rounded-lg p-2.5" style={{ width: topRowWidth || 'auto' }}>
        <CollapsibleSection id="equations-group" title="Equations" level="h2" defaultOpen={false}>
          <EquationsPanel
            rgb={rgb}
            hue={hsb.h}
            saturation={hsb.s}
            brightness={hsb.b}
            hsl={hsl}
            blMode={blMode}
          />
        </CollapsibleSection>
      </div>

      {/* Learn section — hidden for now */}
      </div>
    </div>
  );
}
