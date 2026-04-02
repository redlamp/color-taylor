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
    </div>
  );
}
