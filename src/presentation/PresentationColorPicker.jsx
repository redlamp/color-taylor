import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import ColorSlider from '../components/ColorSlider';
import ColorHexagon from '../components/ColorHexagon';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import EquationsPanel from '../components/EquationsPanel';
import ColorOperations from '../components/ColorOperations';

export default function PresentationColorPicker({
  visiblePanels = [],
  initialHsb = { h: 200, s: 80, b: 90 },
  lockedChannels = [],
}) {
  const [hsb, setHsb] = useState(initialHsb);
  const animRef = useRef(null);
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;
  const rgbOverride = useRef(null);

  // Reset color when slide changes
  useEffect(() => {
    rgbOverride.current = null;
    setHsb(initialHsb);
  }, [initialHsb.h, initialHsb.s, initialHsb.b]);

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

  const handleRgbChange = useCallback((channel, value) => {
    if (lockedChannels.includes(channel)) return;
    setHsb((prev) => {
      const currentRgb = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const newRgb = { ...currentRgb, [channel]: value };
      rgbOverride.current = newRgb;
      return rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
    });
  }, [lockedChannels]);

  const has = (panel) => visiblePanels.includes(panel);

  const textColor = (() => {
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 150 ? '#000' : '#fff';
  })();

  return (
    <div className="flex gap-6 items-start">
      {/* Left: Hexagon */}
      {has('hexagon') && (
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={(h) => setHsbAndClearOverride((prev) => ({ ...prev, h }))}
            onRgbChange={handleRgbChange}
            onHsbChange={(newHsb) => setHsbAndClearOverride((prev) => ({ ...prev, ...newHsb }))}
            onHslChange={() => {}}
            onAnimateToHsb={animateToHsb}
            blMode="brightness"
            onBlModeChange={() => {}}
            colorSpace="srgb"
            onColorSpaceChange={() => {}}
            hoverMatchRgb={null}
            showHtmlOnHex={false}
            onHoverHtmlColor={() => {}}
          />
        </div>
      )}

      {/* Large color preview */}
      {has('large-preview') && (
        <div
          className="shrink-0 rounded-xl flex flex-col items-center justify-center transition-colors duration-200"
          style={{
            width: 280,
            height: 280,
            backgroundColor: hex,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
            color: textColor,
          }}
        >
          <span className="font-mono text-3xl font-bold tracking-wider">{hex.toUpperCase()}</span>
          <span className="font-mono text-sm mt-1 opacity-60">
            {rgb.r}, {rgb.g}, {rgb.b}
          </span>
        </div>
      )}

      {/* Right: Sliders and panels */}
      <div className="flex flex-col gap-4 min-w-[360px]">
        {/* Preview swatch */}
        {has('preview') && (
          <div className="flex gap-3 items-stretch">
            <PreviewSwatch hex={hex} />
            <div className="flex-1 font-mono text-lg flex items-center">{hex.toUpperCase()}</div>
          </div>
        )}

        {/* RGB sliders */}
        {has('rgb-sliders') && (
          <div className="border border-input rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">RGB</h3>
            <div className="flex flex-col gap-2">
              <ColorSlider
                label="R" value={rgb.r} max={255}
                gradient={redChannelGradient}
                onChange={(v) => handleRgbChange('r', v)}
              />
              {!lockedChannels.includes('g') && (
                <ColorSlider
                  label="G" value={rgb.g} max={255}
                  gradient={greenChannelGradient}
                  onChange={(v) => handleRgbChange('g', v)}
                />
              )}
              {!lockedChannels.includes('b') && (
                <ColorSlider
                  label="B" value={rgb.b} max={255}
                  gradient={blueChannelGradient}
                  onChange={(v) => handleRgbChange('b', v)}
                />
              )}
            </div>
          </div>
        )}

        {/* HSB sliders */}
        {has('hsb-sliders') && (
          <div className="border border-input rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">HSB</h3>
            <div className="flex flex-col gap-2">
              <ColorSlider
                label="H" value={hsb.h} max={360} wrap
                gradient={hueGradient(hsb.s, hsb.b, 'srgb')}
                onChange={(v) => setHsbAndClearOverride((prev) => ({ ...prev, h: v }))}
              />
              <ColorSlider
                label="S" value={hsb.s} max={100}
                gradient={saturationGradient(hsb.h, hsb.b, 'srgb')}
                onChange={(v) => setHsbAndClearOverride((prev) => ({ ...prev, s: v }))}
              />
              <ColorSlider
                label="B" value={hsb.b} max={100}
                gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')}
                onChange={(v) => setHsbAndClearOverride((prev) => ({ ...prev, b: v }))}
              />
            </div>
          </div>
        )}

        {/* Hex input */}
        {has('hex-input') && (
          <div className="border border-input rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Hex</h3>
            <div className="flex gap-3 items-stretch">
              <PreviewSwatch hex={hex} />
              <div className="flex-1 min-w-0">
                <HexInput
                  hex={hex}
                  onChange={(parsed) => setHsbAndClearOverride(rgbToHsb(parsed.r, parsed.g, parsed.b))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Equations */}
        {has('equations') && (
          <div className="border border-input rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Equations</h3>
            <EquationsPanel
              rgb={rgb}
              hue={hsb.h}
              saturation={hsb.s}
              brightness={hsb.b}
              hsl={hsl}
              blMode="brightness"
            />
          </div>
        )}

        {/* Conversions */}
        {has('conversions') && (
          <ColorOperations
            hsb={hsb}
            onAnimateToHsb={animateToHsb}
          />
        )}
      </div>
    </div>
  );
}
