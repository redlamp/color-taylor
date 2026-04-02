import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl } from '../utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import { PANEL_W, PANEL_H } from './slides/MonitorPanel';
import AnimatedGrid from './slides/AnimatedGrid';
import ColorSlider from '../components/ColorSlider';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import EquationsPanel from '../components/EquationsPanel';
import ColorOperations from '../components/ColorOperations';
import ColorHexagon from '../components/ColorHexagon';
import NarrativeSlide from './slides/NarrativeSlide';

export default function PresentationStage({ slide, slideIndex }) {
  // ── Color state (persists across all slides) ──────────────────────
  const [hsb, setHsb] = useState({ h: 0, s: 100, b: 100 });
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;
  const animRef = useRef(null);
  const rgbOverride = useRef(null);

  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  const rgb = rgbOverride.current || rgbFromHsb;
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  const animateToHsb = useCallback((target) => {
    rgbOverride.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const duration = 1000;
    const from = { ...hsbRef.current };
    let start = null;
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const tick = (ts) => {
      if (!start) start = ts;
      const t = easeInOut(Math.min((ts - start) / duration, 1));
      let dh = target.h - from.h;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      setHsb({
        h: Math.round(((from.h + dh * t) % 360 + 360) % 360),
        s: Math.round(from.s + (target.s - from.s) * t),
        b: Math.round(from.b + (target.b - from.b) * t),
      });
      rgbOverride.current = null;
      if ((ts - start) < duration) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const setHsbClear = useCallback((valOrFn) => {
    rgbOverride.current = null;
    setHsb(valOrFn);
  }, []);

  const handleRgbChange = useCallback((channel, value) => {
    setHsb((prev) => {
      const cur = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const next = { ...cur, [channel]: value };
      rgbOverride.current = next;
      return rgbToHsb(next.r, next.g, next.b);
    });
  }, []);

  // ── Slide classification ──────────────────────────────────────────
  const isStatic = slide.type === 'static';
  const isNarrative = slide.type === 'narrative';
  const panels = slide.props?.visiblePanels || [];
  const has = (p) => panels.includes(p);
  const hasLargePreview = has('large-preview');
  const hasHexagon = has('hexagon');
  const usesPanel = isStatic || hasLargePreview;
  const locked = slide.props?.lockedChannels || [];
  const hasSliders = has('rgb-sliders') || has('hsb-sliders') || has('hex-input') || has('equations') || has('conversions');

  // ── Set color when entering a new interactive slide ────────────────
  const prevIdx = useRef(slideIndex);
  const prevWasStatic = useRef(isStatic);
  useEffect(() => {
    if (slideIndex !== prevIdx.current) {
      const comingFromStatic = prevWasStatic.current;
      prevIdx.current = slideIndex;
      prevWasStatic.current = isStatic;
      if (slide.props?.initialHsb) {
        if (comingFromStatic) {
          // Coming from a grid slide — set color instantly so the swatch
          // expands with the correct color (no mid-animation color shift)
          rgbOverride.current = null;
          setHsb(slide.props.initialHsb);
        } else {
          animateToHsb(slide.props.initialHsb);
        }
      }
    } else {
      prevWasStatic.current = isStatic;
    }
  }, [slideIndex, slide.props?.initialHsb, animateToHsb, isStatic]);

  // ── Entrance animation for sliders ────────────────────────────────
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, [slideIndex]);

  // ── Sine wave animation (Finding HSB slide) ───────────────────────
  const [sineActive, setSineActive] = useState(false);
  const [sinePeriods, setSinePeriods] = useState({ h: 15000, s: 11000, b: 9000 });
  const sinePeriodsRef = useRef(sinePeriods);
  sinePeriodsRef.current = sinePeriods;
  const sineRaf = useRef(null);

  // Reset sine wave when leaving the slide
  useEffect(() => {
    if (!slide.props?.showSineWave) setSineActive(false);
  }, [slideIndex, slide.props?.showSineWave]);

  useEffect(() => {
    if (!sineActive) {
      if (sineRaf.current) cancelAnimationFrame(sineRaf.current);
      sineRaf.current = null;
      return;
    }
    const start = performance.now();
    const tick = (ts) => {
      const elapsed = ts - start;
      const p = sinePeriodsRef.current;
      const h = Math.round(((elapsed % p.h) / p.h) * 360);
      const s = Math.round(((Math.sin(elapsed * 2 * Math.PI / p.s) + 1) / 2) * 100);
      const b = Math.round(Math.pow((Math.sin(elapsed * 2 * Math.PI / p.b) + 1) / 2, 0.4) * 100);
      rgbOverride.current = null;
      setHsb({ h, s, b });
      sineRaf.current = requestAnimationFrame(tick);
    };
    sineRaf.current = requestAnimationFrame(tick);
    return () => {
      if (sineRaf.current) cancelAnimationFrame(sineRaf.current);
    };
  }, [sineActive]);

  // ── RGB keyframe animation (slides 4-7) ────────────────────────────
  // Cycles through keyframe colors with sine-eased transitions and holds.
  // Slide 4: red only. Slides 5-7: R,G,B → Y,C,M sequence.
  const [rgbAnimActive, setRgbAnimActive] = useState(false);
  const rgbAnimRaf = useRef(null);

  useEffect(() => {
    if (!slide.props?.showRgbAnimate) setRgbAnimActive(false);
    else if (slide.props?.rgbAnimAutoStart) setRgbAnimActive(true);
  }, [slideIndex, slide.props?.showRgbAnimate, slide.props?.rgbAnimAutoStart]);

  useEffect(() => {
    if (!rgbAnimActive) {
      if (rgbAnimRaf.current) cancelAnimationFrame(rgbAnimRaf.current);
      rgbAnimRaf.current = null;
      return;
    }

    // Red-only for slide with locked G/B, full sequence otherwise
    const redOnly = slide.props?.lockedChannels?.includes('g');
    const keyframes = redOnly
      ? [
          { r: 0,   g: 0,   b: 0   }, // Black
          { r: 255, g: 0,   b: 0   }, // Red
        ]
      : [
          { r: 0,   g: 0,   b: 0   }, // Black
          { r: 255, g: 0,   b: 0   }, // Red
          { r: 0,   g: 255, b: 0   }, // Green
          { r: 0,   g: 0,   b: 255 }, // Blue
          { r: 255, g: 255, b: 0   }, // Yellow
          { r: 0,   g: 255, b: 255 }, // Cyan
          { r: 255, g: 0,   b: 255 }, // Magenta
          { r: 255, g: 255, b: 255 }, // White
        ];

    const TRANSITION_DUR = 800; // ms for sine transition between keyframes
    const HOLD_DUR = 600;       // ms to hold at each keyframe
    const STEP_DUR = TRANSITION_DUR + HOLD_DUR;
    const CYCLE_DUR = keyframes.length * STEP_DUR;

    const start = performance.now();
    const tick = (ts) => {
      const elapsed = ts - start;
      const t = elapsed % CYCLE_DUR;
      const frameIdx = Math.floor(t / STEP_DUR);
      const frameT = t - frameIdx * STEP_DUR;

      let r, g, b;
      if (frameT < HOLD_DUR) {
        // Hold at current keyframe
        ({ r, g, b } = keyframes[frameIdx]);
      } else {
        // Sine-ease transition to next keyframe
        const p = Math.sin(((frameT - HOLD_DUR) / TRANSITION_DUR) * Math.PI / 2);
        const from = keyframes[frameIdx];
        const to = keyframes[(frameIdx + 1) % keyframes.length];
        r = Math.round(from.r + (to.r - from.r) * p);
        g = Math.round(from.g + (to.g - from.g) * p);
        b = Math.round(from.b + (to.b - from.b) * p);
      }

      rgbOverride.current = { r, g, b };
      setHsb(rgbToHsb(r, g, b));
      rgbAnimRaf.current = requestAnimationFrame(tick);
    };
    rgbAnimRaf.current = requestAnimationFrame(tick);
    return () => {
      if (rgbAnimRaf.current) cancelAnimationFrame(rgbAnimRaf.current);
    };
  }, [rgbAnimActive]);

  // ── Derived values (must be above early returns to keep hook order stable) ──
  const enterColor = useMemo(() => {
    if (!slide.props?.initialHsb) return null;
    const { h, s, b: bv } = slide.props.initialHsb;
    const result = hsbToRgb(h, s, bv);
    return rgbToHex(result.r, result.g, result.b);
  }, [slide.props?.initialHsb]);

  const textColor = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 150 ? '#000' : '#fff';

  // ── Narrative slides ──────────────────────────────────────────────
  if (isNarrative) return <NarrativeSlide {...(slide.props || {})} />;

  // ── Hexagon slides (different layout entirely) ────────────────────
  if (hasHexagon) {
    return (
      <div className="flex gap-6 items-start">
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb} hue={hsb.h} brightness={hsb.b} saturation={hsb.s} hsl={hsl}
            onHueChange={(h) => setHsbClear(p => ({ ...p, h }))}
            onRgbChange={handleRgbChange}
            onHsbChange={(v) => setHsbClear(p => ({ ...p, ...v }))}
            onHslChange={() => {}} onAnimateToHsb={animateToHsb}
            blMode="brightness" onBlModeChange={() => {}}
            colorSpace="srgb" onColorSpaceChange={() => {}}
            hoverMatchRgb={null} showHtmlOnHex={false} onHoverHtmlColor={() => {}}
          />
        </div>
        {has('preview') && (
          <div className="flex flex-col gap-4 min-w-[360px]">
            <div className="flex gap-3 items-stretch">
              <PreviewSwatch hex={hex} />
              <div className="flex-1 font-mono text-lg flex items-center">{hex.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Panel slides (static grids + interactive color swatch) ────────

  return (
    <div className="flex flex-col items-center">
      {/* ── THE PERSISTENT PANEL ── */}
      <div
        style={{
          width: PANEL_W,
          height: PANEL_H,
          backgroundColor: '#1F2C33',
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated grid — tweens between grid layouts and full swatch */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <AnimatedGrid
            mode={isStatic ? slide.props?.mode || 'bw' : 'swatch'}
            swatchColor={hex}
            enterColor={enterColor}
          />
        </div>

        {/* Hex label inside swatch */}
        {slide.props?.showHexInPreview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isStatic ? 0 : 1,
              transition: 'opacity 0.7s ease-in-out',
              zIndex: 2,
              color: textColor,
            }}
          >
            <span className="font-mono text-4xl font-bold tracking-wider">{hex.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* ── SLIDERS (always in DOM, tween in/out) ── */}
      <div
        className="transition-all duration-700 ease-out"
        style={{
          width: PANEL_W,
          opacity: hasSliders && visible ? 1 : 0,
          transform: hasSliders && visible ? 'translateY(0)' : 'translateY(24px)',
          marginTop: 12,
          pointerEvents: hasSliders ? 'auto' : 'none',
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {has('rgb-sliders') && (
            <div className="border border-input rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">RGB</h3>
              <div className="flex flex-col gap-2">
                <ColorSlider label="R" value={rgb.r} max={255} gradient={redChannelGradient} onChange={(v) => handleRgbChange('r', v)} />
                {!locked.includes('g') && <ColorSlider label="G" value={rgb.g} max={255} gradient={greenChannelGradient} onChange={(v) => handleRgbChange('g', v)} />}
                {!locked.includes('b') && <ColorSlider label="B" value={rgb.b} max={255} gradient={blueChannelGradient} onChange={(v) => handleRgbChange('b', v)} />}
              </div>
            </div>
          )}
          {has('hsb-sliders') && (
            <div className="border border-input rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">HSB</h3>
              <div className="flex flex-col gap-2">
                <ColorSlider label="H" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, h: v }))} />
                <ColorSlider label="S" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, s: v }))} />
                <ColorSlider label="B" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, b: v }))} />
              </div>
            </div>
          )}
          {has('hex-input') && (
            <div className="border border-input rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">Hex</h3>
              <div className="flex gap-3 items-stretch">
                <PreviewSwatch hex={hex} />
                <div className="flex-1 min-w-0">
                  <HexInput hex={hex} onChange={(parsed) => setHsbClear(rgbToHsb(parsed.r, parsed.g, parsed.b))} />
                </div>
              </div>
            </div>
          )}
          {has('equations') && (
            <div className="border border-input rounded-lg p-3 col-span-2">
              <h3 className="text-sm font-semibold mb-2">Equations</h3>
              <EquationsPanel rgb={rgb} hue={hsb.h} saturation={hsb.s} brightness={hsb.b} hsl={hsl} blMode="brightness" />
            </div>
          )}
          {has('conversions') && (
            <div className="col-span-2">
              <ColorOperations hsb={hsb} onAnimateToHsb={animateToHsb} />
            </div>
          )}
        </div>
        {slide.props?.showRgbAnimate && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rgbAnimActive}
              onChange={(e) => setRgbAnimActive(e.target.checked)}
              className="w-4 h-4 rounded accent-current cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">Animate Colors</span>
          </label>
        )}
        {slide.props?.showSineWave && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sineActive}
                onChange={(e) => setSineActive(e.target.checked)}
                className="w-4 h-4 rounded accent-current cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">Animate HSB</span>
            </label>
            {/* Period sliders — hidden for now
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'h', label: 'H', color: 'hsl(0,70%,60%)' },
                { key: 's', label: 'S', color: 'hsl(120,70%,60%)' },
                { key: 'b', label: 'B', color: 'hsl(240,70%,60%)' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold" style={{ color }}>{label}</span>
                    <span className="tabular-nums">{(sinePeriods[key] / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={100}
                    value={sinePeriods[key]}
                    onChange={(e) => setSinePeriods(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>
            */}
          </div>
        )}
      </div>
    </div>
  );
}
