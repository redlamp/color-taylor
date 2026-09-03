import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, type HSB, type HSL, type RGB } from '../utils/colorConversions';
import type { ColorSpace } from '../utils/sliderGradients';
import type { HslOrigin } from '../utils/hslWrite';
import { HSB_TWEEN_MS } from '../utils/colorTween';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BlendIcon from './BlendIcon';
import { useImpact, holdKeyOf, type Hold } from '@/hooks/useImpact';
import type { Channel } from './hex/hexConstants';
import ColorSlider from './ColorSlider';
import ColorHexagon from './ColorHexagon';
import { HEX_PANEL_WIDTH } from './hex/hexConstants';

// Top-row layout constants — root max-width and shrink behavior derive from these
const SLIDERS_PANEL_WIDTH = 420;          // px, target width of the right column on md+
const SLIDERS_PANEL_MIN_WIDTH = 280;      // px, floor before sliders content gets too tight
const TOP_ROW_GAP_PX = 16;                // Tailwind gap-4
/*
 * The root's own horizontal padding, which has to be added on top of the two
 * columns rather than eaten out of them.
 *
 * maxWidth is a border-box measurement, so the sm:p-6 on the root came out of
 * the total: the columns only ever had 1002px of the 1050 they ask for, and were
 * 48px short of ever reaching their stated widths. Flex hid that by shrinking
 * both a little; the grid made it visible by holding the sliders column at 420
 * and taking the whole shortfall out of the hexagon.
 */
const ROOT_PADDING_X = 48;                // Tailwind sm:p-6, both sides

/*
 * Resting height of the SB box.
 *
 * It is a flex-basis, not a min-height, so it sets only the size the box starts
 * from. The box shrinks toward min-h-24 in a narrow window and grows when the
 * sections below it are collapsed.
 *
 * This was tuned so the two columns' natural heights matched exactly - 773px at
 * full width - leaving the grid nothing to correct. That number no longer holds:
 * the Color Editor card it sat inside is gone, and both columns absorb slack
 * now, so the box renders about 184px at full width and is stretched off this
 * basis rather than sitting on it. Harmless, because levelling the columns is no
 * longer this constant's job - it is flex's, on both sides. Worth retuning only
 * if the stretch itself ever becomes visible.
 */
const SB_BOX_DEFAULT_HEIGHT = 143;
const TOP_ROW_MAX_WIDTH =
  HEX_PANEL_WIDTH + SLIDERS_PANEL_WIDTH + TOP_ROW_GAP_PX + ROOT_PADDING_X;
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
import { useColorState } from '@/hooks/useColorState';
import { Play, Pause, Settings, Music, Slash, CircleHelp } from 'lucide-react';

type BlMode = 'brightness' | 'lightness';
/**
 * The slider blocks, in the order they stack. The same control as the Figma
 * plugin's, without its alpha row: a multi-select rather than HSB-or-HSL tabs,
 * because each block reads and writes within its own model and any set of
 * them stays self-consistent through the shared colour.
 */
type SliderGroup = 'RGB' | 'HSB' | 'HSL';
const SLIDER_GROUPS: SliderGroup[] = ['RGB', 'HSB', 'HSL'];
/**
 * Where the bank starts and where "Reset all settings" returns it: RGB and
 * HSB showing, flat colours. Named once so the two cannot disagree.
 */
const DEFAULT_GROUPS: SliderGroup[] = ['RGB', 'HSB'];
const DEFAULT_BLEND = false;
const GROUP_TIP: Record<SliderGroup, string> = {
  RGB: 'Red, Green, Blue',
  HSB: 'Hue, Saturation, Brightness',
  HSL: 'Hue, Saturation, Lightness',
};
/** The toolbar's tooltips read at a glance: a step up from the default size, and bold. */
const TOOLBAR_TIP_CLASS = 'text-sm font-semibold';
/** Tailwind for the rule a block draws above itself when it is not first. */
const BLOCK_CLASS = 'flex flex-col gap-2 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3';

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

/**
 * #4F95FF, the blue of the logo and the Community thumbnail, so a first visit
 * opens on the colour the branding leads with.
 *
 * Held as HSB because HSB is canonical here (see the root CLAUDE.md); it
 * converts back to exactly rgb(79, 149, 255), so nothing is lost round-tripping
 * it. Named rather than inlined because "Reset all settings" returns here too,
 * and two copies of the starting colour would be one too many.
 */
const DEFAULT_HSB: HSB = { h: 216, s: 69, b: 100 };

export default function ColorPicker() {
  const [initialHsb] = useState<HSB>(() => {
    try {
      const saved = localStorage.getItem('color-taylor-hsb');
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage unavailable */ }
    return DEFAULT_HSB;
  });
  // pulseTone is declared below, after the audio settings it reads; the hook
  // reaches it through a ref so the state can be declared up here with the rest.
  const pulseToneRef = useRef<(next: HSB) => void>(() => {});
  const {
    hsb, setHsb, rgb, hsl,
    hsbRef, rgbOverride, animRef,
    setHsbClear, clearOverride, setRgbChannel, setHslChannel, animateToHsb: tweenTo, cancelTween,
  } = useColorState({
    initial: initialHsb,
    onEdit: (next) => pulseToneRef.current(next),
    onTweenStart: (from) => toneController.start(from),
    onTweenFrame: (next) => toneController.update(next),
    onTweenEnd: () => toneController.release(),
  });
  const [groups, setGroups] = useState<SliderGroup[]>(DEFAULT_GROUPS);
  // Blended tracks show the colour a drag would land on; flat ones show the
  // channel alone.
  const [blend, setBlend] = useState(DEFAULT_BLEND);
  /*
   * The control under the pointer, for the impact highlights. Set on every
   * pointerdown in the window from the nearest data-hold tag (or 'other'),
   * with the readouts as they stood at the press; cleared on release. The
   * ref carries the latest readouts to the listener, which is registered
   * once. Its key is what the sliders compare against, so it is read below
   * as `held`.
   */
  const [hold, setHold] = useState<Hold | null>(null);
  const shownRef = useRef<Record<string, number>>({});
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
  const audioEnabled = settings.audioEnabled;
  /*
   * The interface sounds on the swatch grids are audio too, so the feature switch
   * has to reach them. They are gated by `muted`, which is already threaded down
   * to ColorHexagon - forcing it true while the feature is off is enough, and
   * useUiSounds returns before it touches an AudioContext when muted.
   */
  const effectiveMuted = muted || !audioEnabled;
  // Below the declaration above, not up with the other mute effect - it reads
  // audioEnabled, which only exists once useSettings has been called.
  useEffect(() => { toneController.setMuted(effectiveMuted); }, [effectiveMuted]);
  const prevSynthEnabledRef = useRef(settings.synth.synthEnabled);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isPointerDownRef = useRef(false);
  const pulseTone = useCallback((target: HSB) => {
    toneController.pulse(target, isPointerDownRef.current);
  }, []);
  useEffect(() => { pulseToneRef.current = pulseTone; }, [pulseTone]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      setHold({ key: holdKeyOf(e.target), base: shownRef.current });
    };
    const onUp = () => {
      isPointerDownRef.current = false;
      setHold(null);
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
          if (!prev) return;
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
          if (!next) return;
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
  }, [animRef, hsbRef, rgbOverride, setHsb]);


  // Ref-based animation stopper — called from user interaction handlers only
  const colorAnimActiveRef = useRef<boolean | 'stop'>(false);

  /**
   * Hand the colour back to the user: stop the play cycle and cancel any tween
   * still in flight.
   *
   * Stopping the cycle was not enough. A tween is a rAF loop calling setHsb every
   * frame, so a handler that only sets state loses the argument - the loop
   * overwrites it on the next frame and still lands on its own target up to a
   * second later. Typing a hex during a tween was discarded that way, and so was
   * dragging a slider; the value would appear, then snap back.
   *
   * isUndoRedoing is cleared for the same reason animateToHsb clears it when it
   * pre-empts itself: the flag suppresses undo pushes for the duration of a
   * tween, and a tween that is cancelled rather than finished would otherwise
   * leave it set and swallow the next few pushes.
   */
  const takeOverFromAnimation = useCallback(() => {
    if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
    if (cancelTween()) isUndoRedoing.current = false;
  }, [cancelTween]);

  const animateToHsb = useCallback((target: HSB) => {
    // A cancelled undo tween has to release the re-push guard, or the next few
    // pushes are swallowed. The tween itself lives in useColorState.
    if (animRef.current !== null) isUndoRedoing.current = false;
    tweenTo(target);
  }, [tweenTo, animRef]);
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Persist HSB to localStorage
  useEffect(() => {
    localStorage.setItem('color-taylor-hsb', JSON.stringify(hsb));
  }, [hsb]);

  /*
   * "Reset all settings" returns the colour to DEFAULT_HSB.
   *
   * Same event SettingsPanel dispatches for the swatches and the plugin
   * banner. It tweens rather than snapping, because every other way the colour
   * moves on its own in this app tweens - undo, a swatch, a vertex letter -
   * and a reset that teleports would be the odd one out.
   *
   * takeOverFromAnimation first: a reset pressed while the play cycle is
   * running has to stop it, or the cycle's own rAF loop would overwrite the
   * tween on its next frame. It also flags the cycle to clear its React state,
   * so the play button does not stay showing Pause with nothing animating.
   *
   * No need to clear the stored colour - the persist effect above writes the
   * new value as soon as the tween starts.
   */
  useEffect(() => {
    const onResetAll = () => {
      takeOverFromAnimation();
      animateToHsb(DEFAULT_HSB);
      setGroups(DEFAULT_GROUPS);
      setBlend(DEFAULT_BLEND);
    };
    window.addEventListener('color-taylor:reset-all', onResetAll);
    return () => window.removeEventListener('color-taylor:reset-all', onResetAll);
  }, [takeOverFromAnimation, animateToHsb]);

  const handleRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    takeOverFromAnimation();
    setRgbChannel(channel, value);
  }, [setRgbChannel, takeOverFromAnimation]);

  const handleHslChange = useCallback((channel: 'h' | 's' | 'l', value: number) => {
    takeOverFromAnimation();
    setHslChannel(channel, value);
  }, [setHslChannel, takeOverFromAnimation]);

  /*
   * What each readout shows, as integers, keyed the way the sliders tag
   * themselves. Rounded because that is the number a slider displays: a hue
   * that moved by a hundredth of a degree has not moved on any track.
   */
  const shown = useMemo(() => ({
    'rgb-r': rgb.r, 'rgb-g': rgb.g, 'rgb-b': rgb.b,
    'hsb-h': Math.round(hsb.h), 'hsb-s': Math.round(hsb.s), 'hsb-b': Math.round(hsb.b),
    'hsl-h': Math.round(hsl.h), 'hsl-s': Math.round(hsl.s), 'hsl-l': Math.round(hsl.l),
  }), [rgb.r, rgb.g, rgb.b, hsb.h, hsb.s, hsb.b, hsl.h, hsl.s, hsl.l]);
  useEffect(() => { shownRef.current = shown; }, [shown]);
  const lit = useImpact(shown, hold);
  const held = hold?.key ?? null;
  /** A slider lights when its value moved and it is not the one being held. */
  const sliderLit = (key: string) => lit.has(key) && held !== `sl:${key}`;
  /*
   * The hexagon lights by channel: a stem and its joint as one unit, for every
   * channel that moved plus every channel the held stem or joint drives. The
   * drives come from the hold key - `hex:rg` is the green joint - so grabbing
   * a joint lights its whole chain before anything has moved.
   */
  const impactChannels = useMemo(() => {
    const set = new Set<Channel>();
    (['r', 'g', 'b'] as Channel[]).forEach((c) => { if (lit.has(`rgb-${c}`)) set.add(c); });
    if (held?.startsWith('hex:')) (held.slice(4).split('') as Channel[]).forEach((c) => set.add(c));
    return set;
  }, [lit, held]);
  const hueBadgeLit = lit.has('hsb-h') && held !== 'hue';
  const hueFillLit = held === 'sl:hsb-s' || held === 'sl:hsl-s';

  // Stable per-channel onChange handlers so memoized ColorSlider children
  // can skip re-renders when their channel value hasn't changed.
  const handleRChange = useCallback((v: number) => handleRgbChange('r', v), [handleRgbChange]);
  const handleGChange = useCallback((v: number) => handleRgbChange('g', v), [handleRgbChange]);
  const handleBChange = useCallback((v: number) => handleRgbChange('b', v), [handleRgbChange]);

  const handleHsbHChange = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, h: v })), [setHsbClear]);
  const handleHsbSChange = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, s: v })), [setHsbClear]);
  const handleHsbBChange = useCallback((v: number) => setHsbClear((prev) => ({ ...prev, b: v })), [setHsbClear]);

  // The hexagon's own writes: no synth pulse, as before - the hexagon's audio is
  // its own concern and goes through `muted`.
  const handleHexHueChange = useCallback((h: number) => {
    takeOverFromAnimation();
    clearOverride();
    setHsb((prev) => ({ ...prev, h }));
  }, [takeOverFromAnimation, clearOverride, setHsb]);
  const handleHexHsbChange = useCallback((next: Partial<HSB>) => {
    takeOverFromAnimation();
    clearOverride();
    setHsb((prev) => ({ ...prev, ...next }));
  }, [takeOverFromAnimation, clearOverride, setHsb]);
  const handleHexInput = useCallback((parsed: RGB) => {
    takeOverFromAnimation();
    clearOverride();
    const next = rgbToHsb(parsed.r, parsed.g, parsed.b);
    pulseTone(next);
    setHsb(next);
  }, [takeOverFromAnimation, clearOverride, setHsb, pulseTone]);
  const handleSbBoxChange = useCallback((s: number, b: number) => setHsbClear((prev) => ({ ...prev, s, b })), [setHsbClear]);
  const handleHSliderChange = useCallback((h: number) => setHsbClear((prev) => ({ ...prev, h })), [setHsbClear]);

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
  }, [settings.synth.synthEnabled, hsbRef]);

  const colorAnimRaf = useRef<number | null>(null);
  useEffect(() => { colorAnimActiveRef.current = colorAnimActive; }, [colorAnimActive]);

  useEffect(() => {
    if (!colorAnimActive) {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
      colorAnimRaf.current = null;
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
  }, [colorAnimActive, hsbRef, rgbOverride, setHsb]);


  return (
    <div id="color-picker-root" className="mx-auto w-full px-0.5 py-1 sm:p-6" style={{ maxWidth: TOP_ROW_MAX_WIDTH }}>
      {/*
        One row wherever it fits, two where it does not - `flex-wrap` decides,
        not a breakpoint.

        This used to be flex-col until `sm`, which stacked the title above the
        buttons on every phone whether or not there was room. At 375 there is:
        the title measures 200px against a 331px container and the three icon
        buttons need 112px, so it lands with room to spare. Wrapping keeps the
        narrow cases honest without a second breakpoint to tune - a 320px
        device, or a dev build where VITE_INTRO_ENABLED adds a fourth control,
        simply falls back to two rows on its own.
      */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        {/* The emoji sit outside .wordmark on purpose: that class paints the
            glyphs with a background clipped to the text, so anything inside it
            loses its own colour - the palette and thread would come out as
            flat grey silhouettes. */}
        <h1 id="color-picker-title" className="text-2xl font-semibold">
          <span className="wordmark">Color Taylor</span> 🎨🧵
        </h1>
        <div className="flex items-center justify-end gap-2">
          {/* The button only. The route itself is always live - see
              useHashRoute - so /intro can be shared while the deck is still
              too rough to advertise on the picker. */}
          {import.meta.env.VITE_INTRO_ENABLED === 'true' && (
            <button
              className="ctl-quiet"
              onClick={() => { window.location.hash = '#/intro'; }}
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
          {/* The synth and volume controls only exist once audio is switched on
              in Settings. Off is the default, so a first visit has no audio
              affordances at all and none of the engine is fetched. */}
          {audioEnabled && (
            <>
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
            </>
          )}
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  id="demo-button"
                  className="ctl-quiet-icon"
                  // The self-running demo lands here; see
                  // wiki/notes/plan-picker-demo.md. The button ships first so
                  // the header settles before the demo does.
                  onClick={() => {}}
                  aria-label="Show the demo"
                >
                  <CircleHelp className="size-4" />
                </button>
              }
            />
            <TooltipContent>Demo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="ctl-quiet-icon"
                  onClick={() => setSettingsOpen(o => !o)}
                  aria-label="Open settings"
                  // aria-haspopup, not aria-expanded: the panel is a modal
                  // dialog now rather than a disclosure region, and it is
                  // portalled out of this button's subtree.
                  aria-haspopup="dialog"
                >
                  <Settings className="size-4" />
                </button>
              }
            />
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/*
        One grid for the whole block, rather than a flex row with the equations
        bar underneath it.

        Two things fall out of that. The columns are tracks, so they share a row
        height and their bottom edges line up whatever is expanded - as a flex
        row they were each their natural height, which ran from 25px apart when
        everything is open to nearly 300px apart when the slider sections are
        closed. And the equations bar spans both tracks natively, which retired
        the ResizeObserver that used to measure this row and copy its width onto
        the bar - about a dozen lines of JS, a state variable and a re-render on
        every resize, replaced by `col-span-2`.

        The tracks carry the same numbers the flex bases did: HEX_PANEL_WIDTH
        (614) and SLIDERS_PANEL_WIDTH (420), with SLIDERS_PANEL_MIN_WIDTH (280)
        as the second one's floor. Keep them in sync with the constants above.

        They are `fr` rather than `px` on purpose. With px maxima the tracks do
        not shrink proportionally - grid holds the second at 420 and takes the
        entire shortfall out of the first, so at the md boundary the hexagon
        collapsed to 244px while the sliders kept full width. As flex factors in
        a 614:420 ratio they divide the space the way the flex bases used to,
        the root's max-width lets them land exactly on 614 and 420 when there is
        room, and the 280px min still stops the sliders going too tight.
      */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,614fr)_minmax(280px,420fr)] gap-x-4 gap-y-3 items-stretch">
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={handleHexHueChange}
            onRgbChange={handleRgbChange}
            onHsbChange={handleHexHsbChange}
            onHslChange={handleHslChange}
            onAnimateToHsb={(target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); }}
            blMode={blMode}
            onBlModeChange={setBlMode}
            colorSpace={colorSpace}
            onColorSpaceChange={setColorSpace}
            hoverMatchRgb={hoverMatchRgb}
            showHtmlOnHex={showHtmlOnHex}
            onHoverHtmlColor={setHoveredHtmlColor}
            muted={effectiveMuted}
            collapsedSections
            impactChannels={impactChannels}
            hueBadgeLit={hueBadgeLit}
            hueFillLit={hueFillLit}
          />

        {/* Right column: Controls. Width comes from the grid track now, so this
            carries only its own surface.

            flex-col here starts a chain of flex-1 down to #sb-wrapper, so the SB
            box absorbs the difference between this column's natural height and
            the hexagon's: it shrinks when this column would be the taller one,
            grows when it would be shorter. The grid gives this element a
            definite height to divide up, which is what makes the chain resolve. */}
        <div id="picker-layout" className="panel-frame flex flex-col border border-border rounded-lg p-2.5">
        {/* Named for the whole panel rather than for one of its parts. It was
            "Sliders", which undersold it: two of the four things below are
            slider banks, but the SB box, the hex field and the colour-name
            search are not. `fill` passes the card's height down the chain. */}
        <CollapsibleSection id="color-editor-group" title="Color Editor" level="h2" fill>
          <div className="flex flex-1 min-h-0 flex-col gap-3">
        {/* Swatch + SB box + hue strip: the panel's subject, so it sits at the
            panel's own level rather than boxed in a card of its own. It was a
            nested "Color Editor" section until that name moved up to the panel,
            which also settled a smaller thing - the column's slack absorber is
            no longer something the user can close.

            It is the one thing in this column that can take up slack. The swatch
            and the hue slider are already self-stretch, so the row's height was
            set purely by the SB box's aspect ratio; with that gone, all three
            follow this height.

            No ceiling: it takes whatever the other sections leave, so closing
            them hands the room to the box rather than pooling it as empty space
            underneath.

            min-h-24 is a floor on how far it will give. It used to be the thing
            that decided how far down the two columns stayed flush - this box was
            the only part of either column that could shrink, so once it hit the
            floor this column overhanged the hexagon, at about 1050px with
            min-h-24 and 1150px with min-h-32.

            That is no longer what binds. #hex-stage absorbs on the hexagon side
            now, so both columns give and they meet in the middle: measured flush
            at every width from 1100px down to the 768px breakpoint where they
            stop being columns at all. Below ~1000px both settle at 715px, the
            hexagon having reached the natural size of its fixed-width card, and
            the box bottoms out at 143px - comfortably above the 96px floor. So
            the floor is a guard now rather than the binding constraint, and it
            stays for the case where something above it grows. */}
        <div
          id="sb-wrapper"
          className="flex flex-1 min-h-24 gap-3 min-w-0 overflow-hidden"
          // Overrides flex-1's `flex-basis: 0%`. Inline because the value is a
          // layout constant shared with the note above, not a magic number.
          style={{ flexBasis: SB_BOX_DEFAULT_HEIGHT }}
        >
          <PreviewSwatch hex={hex} />
          <SBBox
            hue={hsb.h}
            saturation={hsb.s}
            brightness={hsb.b}
            onChange={handleSbBoxChange}
          />
          <HSlider
            hue={hsb.h}
            onChange={handleHSliderChange}
          />
        </div>

        {/* The slider banks, one flat block of the panel rather than two cards:
            the models are the same colour read three ways, and a card each made
            them look like three tools. The toolbar is the plugin's: which
            blocks show, and whether tracks blend. */}
        <div className="flex flex-col gap-3" id="slider-banks">
          <div className="flex items-center justify-between gap-2">
            <ToggleGroup
              multiple
              value={groups}
              onValueChange={(v) => setGroups(SLIDER_GROUPS.filter((g) => (v as SliderGroup[]).includes(g)))}
              aria-label="Slider groups"
            >
              {SLIDER_GROUPS.map((g) => (
                <Tooltip key={g}>
                  <TooltipTrigger render={<ToggleGroupItem value={g} className="w-12">{g}</ToggleGroupItem>} />
                  <TooltipContent className={TOOLBAR_TIP_CLASS}>{GROUP_TIP[g]}</TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
            <ToggleGroup
              multiple
              value={blend ? ['blend'] : []}
              onValueChange={(v) => setBlend(v.length > 0)}
            >
              <Tooltip>
                <TooltipTrigger
                  render={
                    <ToggleGroupItem
                      value="blend"
                      className="px-2"
                      id="blend-toggle"
                      aria-label={blend ? 'Show flat channel ramps' : 'Show blended tracks'}
                    >
                      <BlendIcon filled={blend} />
                    </ToggleGroupItem>
                  }
                />
                <TooltipContent className={TOOLBAR_TIP_CLASS}>{blend ? 'Blend Slider Colors' : 'Flat Slider Colors'}</TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </div>

          {/* A rule between blocks, drawn by the block below: the blocks are
              conditional, and :first-child already knows which is on top. */}
          <div className="flex flex-col">
            {groups.includes('RGB') && (
              <div className={BLOCK_CLASS} role="group" aria-label="RGB">
                <ColorSlider
                  label="R"
                  group='rgb'
                  value={rgb.r}
                  max={255}
                  gradient={blend ? redGradient(rgb.g, rgb.b) : redChannelGradient}
                  onChange={handleRChange}
                  lit={sliderLit('rgb-r')}
                />
                <ColorSlider
                  label="G"
                  group='rgb'
                  value={rgb.g}
                  max={255}
                  gradient={blend ? greenGradient(rgb.r, rgb.b) : greenChannelGradient}
                  onChange={handleGChange}
                  lit={sliderLit('rgb-g')}
                />
                <ColorSlider
                  label="B"
                  group='rgb'
                  value={rgb.b}
                  max={255}
                  gradient={blend ? blueGradient(rgb.r, rgb.g) : blueChannelGradient}
                  onChange={handleBChange}
                  lit={sliderLit('rgb-b')}
                />
              </div>
            )}
            {groups.includes('HSB') && (
              <div className={BLOCK_CLASS} role="group" aria-label="HSB">
                <ColorSlider
                  label="H"
                  group='hsb'
                  value={hsb.h}
                  max={360}
                  wrap
                  gradient={hueGradient(blend ? hsb.s : 100, blend ? hsb.b : 100, colorSpace)}
                  onChange={handleHsbHChange}
                  lit={sliderLit('hsb-h')}
                />
                <ColorSlider
                  label="S"
                  group='hsb'
                  value={hsb.s}
                  max={100}
                  gradient={saturationGradient(hsb.h, blend ? hsb.b : 100, colorSpace)}
                  onChange={handleHsbSChange}
                  lit={sliderLit('hsb-s')}
                />
                <ColorSlider
                  label="B"
                  group='hsb'
                  value={hsb.b}
                  max={100}
                  gradient={brightnessGradient(hsb.h, blend ? hsb.s : 0, colorSpace)}
                  onChange={handleHsbBChange}
                  lit={sliderLit('hsb-b')}
                />
              </div>
            )}
            {groups.includes('HSL') && (
              <div className={BLOCK_CLASS} role="group" aria-label="HSL">
                <ColorSlider
                  label="H"
                  group='hsl'
                  value={hsl.h}
                  max={360}
                  wrap
                  gradient={hslHueGradient(blend ? hsl.s : 100, blend ? hsl.l : 50, colorSpace)}
                  onChange={handleHslHChange}
                  lit={sliderLit('hsl-h')}
                />
                <ColorSlider
                  label="S"
                  group='hsl'
                  value={hsl.s}
                  max={100}
                  gradient={hslSaturationGradient(hsl.h, blend ? hsl.l : 50, colorSpace)}
                  onChange={handleHslSChange}
                  lit={sliderLit('hsl-s')}
                />
                <ColorSlider
                  label="L"
                  group='hsl'
                  value={hsl.l}
                  max={100}
                  gradient={lightnessGradient(hsl.h, blend ? hsl.s : 0, colorSpace)}
                  onChange={handleHslLChange}
                  lit={sliderLit('hsl-l')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Hex & HTML Colors */}
        <CollapsibleSection id="hex-group" title="Hex and HTML Colors" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-stretch">
              <PreviewSwatch hex={hex} />
              <div className="flex-1 min-w-0">
                <HexInput
                  hex={hex}
                  onChange={handleHexInput}
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

      {/* Equations panel. Spanning both tracks is what makes it match the width
          of the row above; nothing measures anything. */}
      <div className="md:col-span-2 panel-frame border border-border rounded-lg p-2.5">
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
        muted={effectiveMuted}
        onToggleMute={() => setMuted(m => !m)}
        colorFx={colorFx}
        onToggleColorFx={() => setColorFx(v => !v)}
      />
    </div>
  );
}
