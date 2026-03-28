import { useState, useRef, useCallback } from 'react';
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

export default function ColorPicker() {
  const [hsb, setHsb] = useState({ h: 200, s: 70, b: 90 });
  const [hslMode, setHslMode] = useState('hsb');
  const [rgbGradientMode, setRgbGradientMode] = useState('mixed');
  const [blMode, setBlMode] = useState('brightness');
  const animRef = useRef(null);
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;

  const animateToHsb = useCallback((target) => {
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

      setHsb({ h, s, b });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);
  const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const handleRgbChange = (channel, value) => {
    const newRgb = { ...rgb, [channel]: value };
    setHsb(rgbToHsb(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel, value) => {
    const newHsl = { ...hsl, [channel]: value };
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setHsb(rgbToHsb(newRgb.r, newRgb.g, newRgb.b));
  };

  const showHsb = hslMode === 'hsb' || hslMode === 'both';
  const showHsl = hslMode === 'hsl' || hslMode === 'both';

  return (
    <div id="color-picker-root" className="mx-auto max-w-[1400px] p-6">
      <h1 id="color-picker-title" className="text-2xl font-semibold tracking-tight text-primary mb-4">Wright Colors</h1>

      <div className="flex gap-4 items-stretch">
        {/* Left column: Color Hexagon */}
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={(h) => setHsb((prev) => ({ ...prev, h }))}
            onRgbChange={handleRgbChange}
            onHsbChange={(newHsb) => setHsb((prev) => ({ ...prev, ...newHsb }))}
            onHslChange={handleHslChange}
            onAnimateToHsb={animateToHsb}
            blMode={blMode}
            onBlModeChange={setBlMode}
          />
        </div>

        {/* Right column: Controls */}
        <div id="picker-layout" className="flex-1 min-w-0 border border-input rounded-lg p-3">
        <CollapsibleSection id="sliders-group" title="Sliders" level="h2">
          <div className="flex flex-col gap-4">
          {/* Hex input */}
          <CollapsibleSection id="hex-group" title="Hex">
          <HexInput
            hex={hex}
            onChange={(parsed) => setHsb(rgbToHsb(parsed.r, parsed.g, parsed.b))}
          />
        </CollapsibleSection>

        {/* Color Editor: Swatch + SB Box + H Slider */}
        <CollapsibleSection id="color-editor-group" title="Color Editor">
          <div id="sb-wrapper" className="flex gap-3 min-w-0">
            <PreviewSwatch hex={hex} />
            <SBBox
              hue={hsb.h}
              saturation={hsb.s}
              brightness={hsb.b}
              onChange={(s, b) => setHsb((prev) => ({ ...prev, s, b }))}
            />
            <HSlider
              hue={hsb.h}
              onChange={(h) => setHsb((prev) => ({ ...prev, h }))}
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
                  gradient={hueGradient(hsb.s, hsb.b)}
                  onChange={(v) => setHsb((prev) => ({ ...prev, h: v }))}
                />
                <ColorSlider
                  label="S"
                  value={hsb.s}
                  max={100}
                  gradient={saturationGradient(hsb.h, hsb.b)}
                  onChange={(v) => setHsb((prev) => ({ ...prev, s: v }))}
                />
                <ColorSlider
                  label="B"
                  value={hsb.b}
                  max={100}
                  gradient={brightnessGradient(hsb.h, hsb.s)}
                  onChange={(v) => setHsb((prev) => ({ ...prev, b: v }))}
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
                  gradient={hslHueGradient(hsl.s, hsl.l)}
                  onChange={(v) => handleHslChange('h', v)}
                />
                <ColorSlider
                  label="S"
                  value={hsl.s}
                  max={100}
                  gradient={hslSaturationGradient(hsl.h, hsl.l)}
                  onChange={(v) => handleHslChange('s', v)}
                />
                <ColorSlider
                  label="L"
                  value={hsl.l}
                  max={100}
                  gradient={lightnessGradient(hsl.h, hsl.s)}
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
          </div>
        </CollapsibleSection>
      </div>
      </div>

      {/* Equations panel */}
      <div className="mt-4 border border-input rounded-lg p-3 w-full">
        <CollapsibleSection id="equations-group" title="Equations" level="h2">
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
