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

export default function ColorPicker() {
  const [hsb, setHsb] = useState(() => {
    try {
      const saved = localStorage.getItem('color-taylor-hsb');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { h: 164, s: 94, b: 93 };
  });
  const [hslMode, setHslMode] = useState('hsb');
  const [rgbGradientMode, setRgbGradientMode] = useState('mixed');
  const [blMode, setBlMode] = useState('brightness');
  const [colorSpace, setColorSpace] = useState('srgb');
  const [hoverMatchRgb, setHoverMatchRgb] = useState(null);
  const [showHtmlOnHex, setShowHtmlOnHex] = useState(false);
  const [hoveredHtmlColor, setHoveredHtmlColor] = useState(null);
  const animRef = useRef(null);
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;
  const rgbOverride = useRef(null);

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

  const setHsbAndClearOverride = useCallback((valOrFn) => {
    rgbOverride.current = null;
    setHsb(valOrFn);
  }, []);

  const animateToHsb = useCallback((target) => {
    rgbOverride.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
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
    setHsb((prev) => {
      const currentRgb = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const newRgb = { ...currentRgb, [channel]: value };
      rgbOverride.current = newRgb;
      return rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
    });
  }, []);

  const handleHslChange = useCallback((channel, value) => {
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

  return (
    <div id="color-picker-root" className="mx-auto max-w-[1400px] p-6">
      <h1 id="color-picker-title" className="text-2xl font-semibold tracking-tight text-primary mb-4">Color Taylor 🧵</h1>

      <div className="inline-flex flex-col">
      <div className="flex gap-4 items-start">
        {/* Left column: Color Hexagon */}
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={(h) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, h })); }}
            onRgbChange={handleRgbChange}
            onHsbChange={(newHsb) => { rgbOverride.current = null; setHsb((prev) => ({ ...prev, ...newHsb })); }}
            onHslChange={handleHslChange}
            onAnimateToHsb={animateToHsb}
            blMode={blMode}
            onBlModeChange={setBlMode}
            colorSpace={colorSpace}
            onColorSpaceChange={setColorSpace}
            hoverMatchRgb={hoverMatchRgb}
            showHtmlOnHex={showHtmlOnHex}
            onHoverHtmlColor={setHoveredHtmlColor}
          />
        </div>

        {/* Right column: Controls */}
        <div id="picker-layout" className="w-[420px] shrink-0 border border-input rounded-lg p-3">
        <CollapsibleSection id="sliders-group" title="Sliders" level="h2">
          <div className="flex flex-col gap-4">
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

        {/* RGB sliders */}
        <CollapsibleSection
          id="rgb-group"
          title="RGB"
          headerRight={
            <Tabs value={rgbGradientMode} onValueChange={setRgbGradientMode}>
              <TabsList>
                <TabsTrigger value="mixed" className="w-16">Mixed</TabsTrigger>
                <TabsTrigger value="channel" className="w-16">Channel</TabsTrigger>
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

        {/* Hex */}
        <CollapsibleSection id="hex-group" title="Hex">
          <div className="flex gap-3 items-stretch">
            <PreviewSwatch hex={hex} />
            <div className="flex-1 min-w-0">
              <HexInput
                hex={hex}
                onChange={(parsed) => { rgbOverride.current = null; setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b)); }}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* HTML Colors */}
        <CollapsibleSection
          id="html-colors-group"
          title="HTML Colors"
          headerRight={
            <Tabs value={showHtmlOnHex ? 'show' : 'hide'} onValueChange={(v) => setShowHtmlOnHex(v === 'show')}>
              <TabsList>
                <TabsTrigger value="show" className="w-12">Show</TabsTrigger>
                <TabsTrigger value="hide" className="w-12">Hide</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {showHtmlOnHex && (
            <p className="text-xs text-muted-foreground italic">
              💡 Colored dots on the hexagon show nearby CSS named colors. Hover to see their names, click to select.
            </p>
          )}
          <NamedColorMatch
            rgb={rgb}
            onAnimateToHsb={animateToHsb}
            onHoverMatch={setHoverMatchRgb}
            hoveredHtmlColor={hoveredHtmlColor}
          />
        </CollapsibleSection>
          </div>
        </CollapsibleSection>
      </div>
      </div>

      {/* Equations panel */}
      <div className="mt-4 border border-input rounded-lg p-3 w-full">
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

      {/* Learn section */}
      <div className="mt-4 border border-input rounded-lg p-3 w-full">
        <CollapsibleSection id="learn-group" title="Learn" level="h2" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2 border border-input rounded-lg p-2.5">
              <h3 className="text-sm font-semibold text-foreground">RGB Color Model</h3>
              <hr className="border-input" />
              <p>Colors are made by mixing <span className="text-red-500 font-semibold">Red</span>, <span className="text-green-500 font-semibold">Green</span>, and <span className="font-semibold" style={{color: 'rgb(96,96,255)'}}>Blue</span> light (0-255 each).</p>
              <p>The hexagon shows how these three channels combine as vectors, starting from the center and adding each channel's contribution.</p>
              <p className="text-xs">All three at 0 = black. All at 255 = white. Equal values = gray.</p>
            </div>
            <div className="flex flex-col gap-2 border border-input rounded-lg p-2.5">
              <h3 className="text-sm font-semibold text-foreground">HSB vs HSL</h3>
              <hr className="border-input" />
              <p><span className="font-semibold">HSB</span> (Hue, Saturation, Brightness): Brightness controls how much light is emitted. B=0 is always black, B=100 is the brightest version of the color.</p>
              <p><span className="font-semibold">HSL</span> (Hue, Saturation, Lightness): Lightness is symmetric — L=0 is black, L=50 is the most vivid, L=100 is white.</p>
              <p className="text-xs">HSB is used in design tools (Photoshop, Figma). HSL is used in CSS.</p>
            </div>
            <div className="flex flex-col gap-2 border border-input rounded-lg p-2.5">
              <h3 className="text-sm font-semibold text-foreground">The Color Hexagon</h3>
              <hr className="border-input" />
              <p><span className="font-semibold">Angle</span> = Hue (0-360°). Red at 0°, Green at 120°, Blue at 240°, with Yellow, Cyan, Magenta between.</p>
              <p><span className="font-semibold">Distance from center</span> = Saturation. Center is desaturated (gray/white), edges are fully saturated.</p>
              <p className="text-xs">The dashed inner hexagon shows the brightness limit — vectors can't extend beyond it at the current brightness.</p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
      </div>
    </div>
  );
}
