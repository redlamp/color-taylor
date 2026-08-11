import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb, type HSB, type RGB } from '../utils/colorConversions';
import type { ColorSpace } from '../utils/sliderGradients';
import { HSB_TWEEN_MS, hsbAtProgress } from '../utils/colorTween';
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
import { HEX_PANEL_WIDTH } from './hex/hexConstants';

// Top-row layout constants — root max-width and shrink behavior derive from these
const SLIDERS_PANEL_WIDTH = 420;          // px, target width of the right column on md+
const SLIDERS_PANEL_MIN_WIDTH = 280;      // px, floor before sliders content gets too tight
const TOP_ROW_GAP_PX = 16;                // Tailwind gap-4
const TOP_ROW_MAX_WIDTH = HEX_PANEL_WIDTH + SLIDERS_PANEL_WIDTH + TOP_ROW_GAP_PX;
import SBBox from './SBBox';
import HSlider from './HSlider';
import HexInput from './HexInput';
import EquationsPanel from './EquationsPanel';
import PreviewSwatch from './PreviewSwatch';
import CollapsibleSection from './CollapsibleSection';
import NamedColorMatch from './NamedColorMatch';
import ThemeToggle from './ThemeToggle';
import { SettingsPanel } from './SettingsPanel';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { VolumeControl } from './VolumeControl';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import useColorEffects from '@/hooks/useColorEffects';
import { toneController } from '@/utils/toneControllerLazy';
import { Play, Pause, Settings, Music, Slash } from 'lucide-react';

type HslMode = 'hsb' | 'hsl' | 'both';
type RgbGradientMode = 'channel' | 'mixed';
type BlMode = 'brightness' | 'lightness';

// Color-cycle animation constants (mirror DEFAULT_RECENT in ColorHexagon)
const COLOR_KEYFRAMES = [
  { r: 255, g: 0,   b: 0   },
  { r: 255, g: 255, b: 0   },
  { r: 0,   g: 255, b: 0   },
  { r: 0,   g: 255, b: 255 },
  { r: 0,   g: 0,   b: 255 },
  { r: 255, g: 0,   b: 255 },
  { r: 255, g: 255, b: 255 },
  { r: 128, g: 128, b: 128 },
  { r: 0,   g: 0,   b: 0   },
];
const ANIM_TRANSITION_DUR = 1200;
const ANIM_HOLD_DUR = 800;
const ANIM_STEP_DUR = ANIM_TRANSITION_DUR + ANIM_HOLD_DUR;
const ANIM_CYCLE_DUR = COLOR_KEYFRAMES.length * ANIM_STEP_DUR;

export default function ColorPicker() {
  const [hsb, setHsb] = useState<HSB>(() => {
    try {
      const saved = localStorage.getItem('color-taylor-hsb');
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage unavailable */ }
    return { h: 327, s: 12, b: 98 };
  });
  const [hslMode, setHslMode] = useState<HslMode>('hsb');
  const [rgbGradientMode, setRgbGradientMode] = useState<RgbGradientMode>('channel');
  const [blMode, setBlMode] = useState<BlMode>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [hoverMatchRgb, setHoverMatchRgb] = useState<RGB | null>(null);
  const [showHtmlOnHex, setShowHtmlOnHex] = useState(false);
  const [hoveredHtmlColor, setHoveredHtmlColor] = useState<{ hex: string; name: string } | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('color-taylor-muted') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('color-taylor-muted', muted ? '1' : '0'); } catch { /* localStorage unavailable */ }
  }, [muted]);
  useEffect(() => { toneController.setMuted(muted); }, [muted]);

  // Colour-reactive panel chrome, on by default. It sits on the outer frames
  // only, so nothing tinted ends up adjacent to a swatch - which is what kept
  // this off before, since a tinted surround shifts how the colour beside it
  // reads. Read as "not explicitly off" so an existing opt-out is honoured.
  const [colorFx, setColorFx] = useState<boolean>(() => {
    try { return localStorage.getItem('color-taylor-effects') !== '0'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('color-taylor-effects', colorFx ? '1' : '0'); } catch { /* localStorage unavailable */ }
  }, [colorFx]);
  const { isDark } = useTheme();
  useColorEffects({ enabled: colorFx, hsb, isDark });
  const { settings, updateSynth } = useSettings();
  const prevSynthEnabledRef = useRef(settings.synth.synthEnabled);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isPointerDownRef = useRef(false);
  const pulseTone = useCallback((target: HSB) => {
    toneController.pulse(target, isPointerDownRef.current);
  }, []);

  useEffect(() => {
    const onDown = () => { isPointerDownRef.current = true; };
    const onUp = () => {
      isPointerDownRef.current = false;
      toneController.notifyPointerUp();
    };
    window.addEventListener('pointerdown', onDown, { capture: true });
    window.addEventListener('pointerup', onUp, { capture: true });
    window.addEventListener('pointercancel', onUp, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', onDown, { capture: true } as EventListenerOptions);
      window.removeEventListener('pointerup', onUp, { capture: true } as EventListenerOptions);
      window.removeEventListener('pointercancel', onUp, { capture: true } as EventListenerOptions);
    };
  }, []);
  const animRef = useRef<number | null>(null);
  const hsbRef = useRef(hsb);
  useEffect(() => { hsbRef.current = hsb; }, [hsb]);
  const rgbOverride = useRef<RGB | null>(null);
  const topRowRef = useRef<HTMLDivElement | null>(null);
  const [topRowWidth, setTopRowWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!topRowRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setTopRowWidth(entry.contentRect.width);
    });
    observer.observe(topRowRef.current);
    return () => observer.disconnect();
  }, []);

  // Undo/redo history
  const undoStack = useRef<HSB[]>([]);
  const redoStack = useRef<HSB[]>([]);
  const lastPushed = useRef<string | null>(null);
  const isUndoRedoing = useRef(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.current.length > 0) {
          if (navigator.vibrate) navigator.vibrate(10);
          redoStack.current.push({ ...hsbRef.current });
          const prev = undoStack.current.pop();
          lastPushed.current = `${prev.h},${prev.s},${prev.b}`;
          rgbOverride.current = null;
          isUndoRedoing.current = true;
          // Tween to previous color
          if (animRef.current) cancelAnimationFrame(animRef.current);
          const from = { ...hsbRef.current };
          const duration = 400;
          let start: number | null = null;
          const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          toneController.start(from);
          const tick = (ts: number) => {
            if (start === null) start = ts;
            const t = easeInOut(Math.min((ts - start) / duration, 1));
            let dh = prev.h - from.h;
            if (dh > 180) dh -= 360;
            if (dh < -180) dh += 360;
            const h = Math.round(((from.h + dh * t) % 360 + 360) % 360);
            const s = Math.round(from.s + (prev.s - from.s) * t);
            const b = Math.round(from.b + (prev.b - from.b) * t);
            rgbOverride.current = null;
            setHsb({ h, s, b });
            toneController.update({ h, s, b });
            if ((ts - start) < duration) {
              animRef.current = requestAnimationFrame(tick);
            } else {
              animRef.current = null;
              isUndoRedoing.current = false;
              toneController.release();
            }
          };
          animRef.current = requestAnimationFrame(tick);
        }
      } else if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        if (redoStack.current.length > 0) {
          if (navigator.vibrate) navigator.vibrate(10);
          undoStack.current.push({ ...hsbRef.current });
          const next = redoStack.current.pop();
          lastPushed.current = `${next.h},${next.s},${next.b}`;
          rgbOverride.current = null;
          isUndoRedoing.current = true;
          if (animRef.current) cancelAnimationFrame(animRef.current);
          const from = { ...hsbRef.current };
          const duration = 400;
          let start: number | null = null;
          const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          toneController.start(from);
          const tick = (ts: number) => {
            if (start === null) start = ts;
            const t = easeInOut(Math.min((ts - start) / duration, 1));
            let dh = next.h - from.h;
            if (dh > 180) dh -= 360;
            if (dh < -180) dh += 360;
            const h = Math.round(((from.h + dh * t) % 360 + 360) % 360);
            const s = Math.round(from.s + (next.s - from.s) * t);
            const b = Math.round(from.b + (next.b - from.b) * t);
            rgbOverride.current = null;
            setHsb({ h, s, b });
            toneController.update({ h, s, b });
            if ((ts - start) < duration) {
              animRef.current = requestAnimationFrame(tick);
            } else {
              animRef.current = null;
              isUndoRedoing.current = false;
              toneController.release();
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
  const colorAnimActiveRef = useRef<boolean | 'stop'>(false);

  const animateToHsb = useCallback((target: HSB) => {
    rgbOverride.current = null;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      isUndoRedoing.current = false;
    }
    const from = { ...hsbRef.current };
    let start: number | null = null;

    toneController.start(from);

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / HSB_TWEEN_MS, 1);
      // Duration, easing, hue wrap and rounding live in utils/colorTween so the
      // Figma plugin animates identically.
      const { h, s, b } = hsbAtProgress(from, target, progress);

      rgbOverride.current = null;
      setHsb({ h, s, b });
      toneController.update({ h, s, b });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
        toneController.release();
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);
  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  // Read of rgbOverride.current during render is intentional — see CLAUDE.md
  // "HSB is canonical, RGB has an override ref" pattern. Lifting to state would
  // double-render every slider input. Refs are safe to read during render for
  // values that don't drive re-renders themselves.
  // eslint-disable-next-line react-hooks/refs
  const rgb = rgbOverride.current || rgbFromHsb;
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Persist HSB to localStorage
  useEffect(() => {
    localStorage.setItem('color-taylor-hsb', JSON.stringify(hsb));
  }, [hsb]);

  const handleRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    setHsb((prev) => {
      const currentRgb = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const newRgb = { ...currentRgb, [channel]: value };
      rgbOverride.current = newRgb;
      const next = rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
      pulseTone(next);
      return next;
    });
  }, [pulseTone]);

  const handleHslChange = useCallback((channel: 'h' | 's' | 'l', value: number) => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    rgbOverride.current = null;
    setHsb((prev) => {
      const currentRgb = hsbToRgb(prev.h, prev.s, prev.b);
      const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      const newHsl = { ...currentHsl, [channel]: value };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const next = rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
      pulseTone(next);
      return next;
    });
  }, [pulseTone]);

  const showHsb = hslMode === 'hsb' || hslMode === 'both';
  const showHsl = hslMode === 'hsl' || hslMode === 'both';

  // Stable per-channel onChange handlers so memoized ColorSlider children
  // can skip re-renders when their channel value hasn't changed.
  const handleRChange = useCallback((v: number) => handleRgbChange('r', v), [handleRgbChange]);
  const handleGChange = useCallback((v: number) => handleRgbChange('g', v), [handleRgbChange]);
  const handleBChange = useCallback((v: number) => handleRgbChange('b', v), [handleRgbChange]);

  const handleHsbHChange = useCallback((v: number) => {
    rgbOverride.current = null;
    setHsb((prev) => { const next = { ...prev, h: v }; pulseTone(next); return next; });
  }, [pulseTone]);
  const handleHsbSChange = useCallback((v: number) => {
    rgbOverride.current = null;
    setHsb((prev) => { const next = { ...prev, s: v }; pulseTone(next); return next; });
  }, [pulseTone]);
  const handleHsbBChange = useCallback((v: number) => {
    rgbOverride.current = null;
    setHsb((prev) => { const next = { ...prev, b: v }; pulseTone(next); return next; });
  }, [pulseTone]);

  const handleHslHChange = useCallback((v: number) => handleHslChange('h', v), [handleHslChange]);
  const handleHslSChange = useCallback((v: number) => handleHslChange('s', v), [handleHslChange]);
  const handleHslLChange = useCallback((v: number) => handleHslChange('l', v), [handleHslChange]);

  // ── Color cycle animation (same as presentation intro) ────────────
  const [colorAnimActive, setColorAnimActive] = useState(false);
  const colorAnimActiveStateRef = useRef(colorAnimActive);
  useEffect(() => { colorAnimActiveStateRef.current = colorAnimActive; }, [colorAnimActive]);
  useEffect(() => {
    const wasOn = prevSynthEnabledRef.current;
    const nowOn = settings.synth.synthEnabled;
    prevSynthEnabledRef.current = nowOn;
    if (!wasOn && nowOn && colorAnimActiveStateRef.current && !toneController.isActive()) {
      toneController.start(hsbRef.current);
    }
  }, [settings.synth.synthEnabled]);
  const [colorAnimHolding, setColorAnimHolding] = useState(false);
  const colorAnimRaf = useRef<number | null>(null);
  useEffect(() => { colorAnimActiveRef.current = colorAnimActive; }, [colorAnimActive]);

  useEffect(() => {
    if (!colorAnimActive) {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
      colorAnimRaf.current = null;
      setColorAnimHolding(false);
      toneController.release();
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
    let wasHolding: boolean | null = null;
    toneController.start(hsbRef.current);
    const tick = (ts: number) => {
      // Check if user interaction requested a stop
      if (colorAnimActiveRef.current === 'stop') {
        colorAnimActiveRef.current = false;
        setColorAnimActive(false);
        toneController.stop(120);
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
      const nextHsb = rgbToHsb(r, g, b);
      setHsb(nextHsb);
      toneController.update(nextHsb);
      colorAnimRaf.current = requestAnimationFrame(tick);
    };
    colorAnimRaf.current = requestAnimationFrame(tick);
    return () => {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
      toneController.release();
    };
  }, [colorAnimActive]);

  return (
    <div id="color-picker-root" className="mx-auto w-full px-0.5 py-1 sm:p-6" style={{ maxWidth: TOP_ROW_MAX_WIDTH }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 id="color-picker-title" className="text-2xl font-semibold tracking-tight text-primary">Color Taylor 🎨🧵</h1>
        <div className="flex items-center justify-end gap-2">
          {import.meta.env.VITE_INTRO_ENABLED === 'true' && (
            <button
              className="ctl-quiet"
              onClick={() => { window.location.hash = '#/presentation'; }}
            >
              Intro
            </button>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="ctl-quiet-icon"
                  onClick={() => setColorAnimActive(a => !a)}
                  aria-label={colorAnimActive ? 'Pause color animation' : 'Play color animation'}
                >
                  {colorAnimActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
              }
            />
            <TooltipContent>Cycle Colors</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="ctl-quiet-icon"
                  onClick={() => updateSynth({ synthEnabled: !settings.synth.synthEnabled })}
                  aria-label={settings.synth.synthEnabled ? 'Disable color synth' : 'Enable color synth'}
                  aria-pressed={settings.synth.synthEnabled}
                >
                  <span className="relative inline-flex items-center justify-center size-4">
                    <Music className="size-4" />
                    {!settings.synth.synthEnabled && (
                      <Slash className="size-4 absolute inset-0 -scale-x-100" />
                    )}
                  </span>
                </button>
              }
            />
            <TooltipContent>Color Synth</TooltipContent>
          </Tooltip>
          <VolumeControl
            muted={muted}
            onToggleMute={() => setMuted(m => !m)}
            masterGain={settings.synth.masterGain}
            onMasterGainChange={(v) => updateSynth({ masterGain: v })}
          />
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="ctl-quiet-icon"
                  onClick={() => setSettingsOpen(o => !o)}
                  aria-label="Open settings"
                  aria-expanded={settingsOpen}
                >
                  <Settings className="size-4" />
                </button>
              }
            />
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col">
      <div ref={topRowRef} className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
        {/* Left column: Color Hexagon — basis matches HEX_PANEL_WIDTH (614), shrinks alongside the sliders col.
            Tailwind arbitrary values below must stay in sync with HEX_PANEL_WIDTH. */}
        <div className="w-full md:w-auto md:basis-[614px] md:max-w-[614px] md:min-w-0 md:shrink md:grow-0">
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
            muted={muted}
          />
        </div>

        {/* Right column: Controls — sized to SLIDERS_PANEL_WIDTH (420), shrinks to SLIDERS_PANEL_MIN_WIDTH (280).
            Tailwind arbitrary values below must stay in sync with the JS constants above. */}
        <div id="picker-layout" className="w-full md:w-auto md:basis-[420px] md:max-w-[420px] md:min-w-[280px] md:shrink md:grow-0 panel-frame border border-input rounded-lg p-2.5">
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
              onChange={(s, b) => { rgbOverride.current = null; setHsb((prev) => { const next = { ...prev, s, b }; pulseTone(next); return next; }); }}
            />
            <HSlider
              hue={hsb.h}
              onChange={(h) => { rgbOverride.current = null; setHsb((prev) => { const next = { ...prev, h }; pulseTone(next); return next; }); }}
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
              group='rgb'
              value={rgb.r}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? redGradient(rgb.g, rgb.b) : redChannelGradient}
              onChange={handleRChange}
            />
            <ColorSlider
              label="G"
              group='rgb'
              value={rgb.g}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? greenGradient(rgb.r, rgb.b) : greenChannelGradient}
              onChange={handleGChange}
            />
            <ColorSlider
              label="B"
              group='rgb'
              value={rgb.b}
              max={255}
              gradient={rgbGradientMode === 'mixed' ? blueGradient(rgb.r, rgb.g) : blueChannelGradient}
              onChange={handleBChange}
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
            {/* Labelled groups: the section header says "HSB / HSL", so without
                these a screen reader hits two "Saturation channel" sliders in a
                row holding different values with nothing to tell them apart. */}
            {showHsb && (
              <div className="flex flex-col gap-2" role="group" aria-label="HSB">
                {hslMode === 'both' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSB</span>
                )}
                <ColorSlider
                  label="H"
                  group='hsb'
                  value={hsb.h}
                  max={360}
                  wrap
                  gradient={hueGradient(hsb.s, hsb.b, colorSpace)}
                  onChange={handleHsbHChange}
                />
                <ColorSlider
                  label="S"
                  group='hsb'
                  value={hsb.s}
                  max={100}
                  gradient={saturationGradient(hsb.h, hsb.b, colorSpace)}
                  onChange={handleHsbSChange}
                />
                <ColorSlider
                  label="B"
                  group='hsb'
                  value={hsb.b}
                  max={100}
                  gradient={brightnessGradient(hsb.h, hsb.s, colorSpace)}
                  onChange={handleHsbBChange}
                />
              </div>
            )}
            {showHsl && (
              <div className="flex flex-col gap-2" role="group" aria-label="HSL">
                {hslMode === 'both' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HSL</span>
                )}
                <ColorSlider
                  label="H"
                  group='hsl'
                  value={hsl.h}
                  max={360}
                  wrap
                  gradient={hslHueGradient(hsl.s, hsl.l, colorSpace)}
                  onChange={handleHslHChange}
                />
                <ColorSlider
                  label="S"
                  group='hsl'
                  value={hsl.s}
                  max={100}
                  gradient={hslSaturationGradient(hsl.h, hsl.l, colorSpace)}
                  onChange={handleHslSChange}
                />
                <ColorSlider
                  label="L"
                  group='hsl'
                  value={hsl.l}
                  max={100}
                  gradient={lightnessGradient(hsl.h, hsl.s, colorSpace)}
                  onChange={handleHslLChange}
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
                  onChange={(parsed) => { rgbOverride.current = null; const next = rgbToHsb(parsed.r, parsed.g, parsed.b); pulseTone(next); setHsb(next); }}
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
      <div className="mt-3 panel-frame border border-input rounded-lg p-2.5" style={{ width: topRowWidth || 'auto' }}>
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
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
        colorFx={colorFx}
        onToggleColorFx={() => setColorFx(v => !v)}
      />
    </div>
  );
}
