import { useState, useRef, useCallback, useMemo, useEffect, Suspense, lazy, type CSSProperties } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHsl, rgbToHex, type HSB, type HSL, type RGB } from '../utils/colorConversions';
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
import { AboutPanel } from './AboutPanel';
import type { DemoHost } from '@/demo/steps';
import { openDemoSections, restoreDemoSections } from '@/utils/demoSections';
import { handoverPoint, scriptRunnerPresent } from '@/demo/handover';
import { CURRENT_CUT } from '@/demo/currentCut';

/*
 * The self-running demo, lazy like the deck: it is a few hundred lines that
 * only run when the ? button is pressed, and the picker's first paint should
 * not carry them. wiki/notes/plan-picker-demo.md.
 */
const DemoRunner = lazy(() => import('@/demo/DemoRunner'));
const ScriptRunner = lazy(() => import('@/demo/ScriptRunner'));
const PresentationMode = lazy(() => import('@/demo/PresentationMode'));
/*
 * The presenter's camera panel, the same box OBS composites the webcam into.
 * Only under `?script=` or `?present=`: the script drags it off screen and
 * back, and nothing about it belongs to the app.
 */
const WebcamPip = lazy(() => import('@/demo/WebcamPip'));

/**
 * `?script=<name>` (dev builds only) puts the picker under a recorded video
 * script: the runner mounts and the app opens exactly as on a first visit
 * (welcome panel and all) and sits idle at its default color until the script
 * starts. The script closes the panel itself. Recording runs against the dev
 * server, so the production bundle never mounts the runner. See
 * docs/demo-script.md.
 */
function scriptName(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = new URLSearchParams(window.location.search).get('script');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * `?present=<name>` plays the same script against its voice track, with a
 * transport for scrubbing. Unlike `?script=` it ships: a link opens the app
 * with the walkthrough up and *paused*, because nothing about following a
 * link is the user gesture playback needs - the transport's play button is.
 * The dev-only half (notes, the clip editor, every `/__` fetch) is gated by
 * PresentationMode's `mode`, not by this. See docs/demo-script.md.
 */
/**
 * `?intro` (or `?intro=1`) shows the Intro button in the header. The button
 * is hidden by default: the deck's route is always live (useHashRoute), so
 * /intro can be shared, but the picker does not advertise it.
 */
function introRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('intro');
  } catch {
    return false;
  }
}

function presentName(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('present');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

// Top-row layout constants — root max-width and shrink behavior derive from these
const SLIDERS_PANEL_WIDTH = 420;          // px, target width of the right column in two-column layout
const SLIDERS_PANEL_MIN_WIDTH = 320;      // px, floor: the Color Editor's content needs a 317px card
const TOP_ROW_GAP_PX = 16;                // Tailwind gap-4
/*
 * The root's own horizontal padding, which has to be added on top of the two
 * columns rather than eaten out of them.
 *
 * maxWidth is a border-box measurement, so the sm:px-6 on the root came out of
 * the total: the columns only ever had 1002px of the 1050 they ask for, and were
 * 48px short of ever reaching their stated widths. Flex hid that by shrinking
 * both a little; the grid made it visible by holding the sliders column at 420
 * and taking the whole shortfall out of the hexagon.
 *
 * Horizontal only - the root used to carry sm:p-6 on every side, stacking its
 * own 24px of vertical padding on top of #app-stage's, which centres the whole
 * picker and already carries 20px of its own. Vertical stayed at py-1 (4px),
 * so app-stage is the only source of vertical breathing room above sm.
 */
const ROOT_PADDING_X = 48;                // 24px a side, both sides
/*
 * The floor the side padding falls to once the viewport is narrower than the
 * content: 2px a side, the old `px-0.5`. Not zero, so the panel borders never
 * sit flush against the edge of the screen.
 */
const MIN_ROOT_PADDING_X = 4;             // 2px a side, both sides

/*
 * The two files the walkthrough entry has to start inside its click handler.
 *
 * Spelled out here rather than imported from ScriptRunner's `scriptAudioUrl`
 * and the pip manifest: both live in modules that are lazy on purpose, and a
 * static import of either would pull the whole recorded-script runner into the
 * picker's first paint. PresentationMode and WebcamPip both leave an adopted
 * element's `src` alone when it already points at the cut's file, so these two
 * have to agree with theirs to the character.
 */
const walkthroughVoiceUrl = () => `${import.meta.env.BASE_URL}scripts/${CURRENT_CUT}.m4a`;
const walkthroughCameraUrl = () => `${import.meta.env.BASE_URL}scripts/pip/${CURRENT_CUT}/full.mp4`;

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
/*
 * Below the breakpoint there is one column, and Taylor's rule is that the
 * column's width is the hexagon card's width: every panel - hexagon, Color
 * Editor, Swatches, Equations - is edge to edge with the card rather than
 * standing wider than it. The card sets its own `width: HEX_PANEL_WIDTH`, so
 * capping the root at that plus the root's padding makes the grid column land
 * on exactly the same number.
 *
 * The padding is at its full ROOT_PADDING_X wherever this cap binds - see
 * ROOT_PADDING_CLAMP, which is built so that the two agree at every width.
 */
const ONE_COL_MAX_WIDTH = HEX_PANEL_WIDTH + ROOT_PADDING_X;
/*
 * Side padding that never lets the column grow as the window shrinks.
 *
 * The root used to be `px-0.5 sm:px-6`, a step at Tailwind's 640: at a 630
 * viewport the panels came out 586 wide and at 640 they dropped to 552, so the
 * column got *wider* as the window got narrower. Visible, and backwards.
 *
 * The fix is to spend the padding only on width the content cannot use. `100%`
 * in a padding resolves against the containing block - #app-stage's content
 * box - so `(100% - HEX_PANEL_WIDTH) / 2` is exactly the slack either side of a
 * full-width panel. Clamped to [MIN_ROOT_PADDING_X, ROOT_PADDING_X] per side it
 * reads: pay the full 24px wherever there is 24px to spare (which is wherever
 * ONE_COL_MAX_WIDTH binds, so the cap and the padding agree), then give the
 * slack back to the panel as the viewport closes on the content, down to a 2px
 * floor. Panel width is therefore a flat 614 from a 658 viewport up, and
 * viewport minus 4 below - non-increasing throughout, and nothing above 800
 * changes because the clamp is pinned at its maximum there.
 */
const ROOT_PADDING_CLAMP =
  `clamp(${MIN_ROOT_PADDING_X / 2}px, calc((100% - ${HEX_PANEL_WIDTH}px) / 2), ${ROOT_PADDING_X / 2}px)`;
import SBBox from './SBBox';
import HSlider from './HSlider';
import HexInput from './HexInput';
import EquationsPanel from './EquationsPanel';
import PreviewSwatch from './PreviewSwatch';
import CollapsibleSection from './CollapsibleSection';
import NamedColorMatch from './NamedColorMatch';
import SwatchLibrary, { useSwatchLibrary, type PlaySection } from './SwatchLibrary';
import { tipFromPointer, tipFromFocus } from '../utils/hoverTips';
import ThemeToggle from './ThemeToggle';
import { SettingsPanel } from './SettingsPanel';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { VolumeControl } from './VolumeControl';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import useColorEffects from '@/hooks/useColorEffects';
import { toneController } from '@/utils/toneControllerLazy';
import { useColorState } from '@/hooks/useColorState';
import { Menu, Music, Slash, CircleHelp } from 'lucide-react';

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
 * Where the bank starts and where "Default Settings" returns it: RGB and
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
/** How often the colour cycle re-snapshots its readouts; see playHold. */
const PLAY_SNAP_MS = 600;
/** Tailwind for the rule a block draws above itself when it is not first. */
const BLOCK_CLASS = 'flex flex-col gap-2 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3';

/**
 * Playing a list of swatches: each gets the settings' play speed, split so
 * most of it is the travel to the colour and the rest the stand on it - the
 * 1.2s / 0.8s the old fixed keyframe cycle used, as a share so the setting
 * scales both. The list is a snapshot taken at the press; the play buttons
 * in the Swatches panel say which list and where to start.
 */
const PLAY_TRANSITION_SHARE = 0.6;
type PlayRun = { section: PlaySection; colors: RGB[]; start: number };

/**
 * #4F95FF, the blue of the logo and the Community thumbnail, so a first visit
 * opens on the colour the branding leads with.
 *
 * Held as HSB because HSB is canonical here (see the root CLAUDE.md); it
 * converts back to exactly rgb(79, 149, 255), so nothing is lost round-tripping
 * it. Named rather than inlined because "Default Settings" returns here too,
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
  /*
   * Run when a tween lands. The demo's restore uses it to put an exact RGB
   * back: animateToHsb nulls rgbOverride on every frame, so a colour the user
   * typed as R=137 would come back as whatever hsbToRgb makes of it - which
   * differs for 86.4% of 8-bit colours. Through a ref because the callback
   * needs setRgb, which this hook has not returned yet.
   */
  const onTweenLandedRef = useRef<() => void>(() => {});
  const {
    hsb, setHsb, rgb, hsl,
    hsbRef, rgbOverride, animRef,
    setHsbClear, clearOverride, setRgb, setRgbChannel, setHslChannel, animateToHsb: tweenTo, cancelTween,
  } = useColorState({
    initial: initialHsb,
    onEdit: (next) => pulseToneRef.current(next),
    onTweenStart: (from) => toneController.start(from),
    onTweenFrame: (next) => toneController.update(next),
    onTweenEnd: () => {
      toneController.release();
      onTweenLandedRef.current();
    },
  });
  const [groups, setGroups] = useState<SliderGroup[]>(DEFAULT_GROUPS);
  // Blended tracks show the colour a drag would land on; flat ones show the
  // channel alone.
  const [blend, setBlend] = useState(DEFAULT_BLEND);
  // Its tooltip names the state, so it has to survive the press that changes
  // it; see the Tooltip on #blend-toggle.
  const [blendTipOpen, setBlendTipOpen] = useState(false);
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
  /*
   * The colour cycle counts as a hold too, so the sliders it moves light the
   * way they would under a drag. Its snapshot is re-taken every PLAY_SNAP_MS
   * rather than once at the start: a cycle visits every colour, so against a
   * fixed start everything would be lit within a second. Against a rolling
   * one, a slider is lit while its value is actually moving. The dip at each
   * re-snapshot is one frame, well inside the fade. Only the interval writes
   * this; when the cycle stops the value goes stale and is simply not read.
   */
  const [playHold, setPlayHold] = useState<Hold | null>(null);
  // Declared up here because the hold above reads it; the playback itself is below.
  const [play, setPlay] = useState<PlayRun | null>(null);
  const colorAnimActive = play !== null;
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
  /*
   * The impact highlights, on by default and read the same way: "not
   * explicitly off". They are the picker's argument made visible - drag one
   * control and the others that moved light up - but they are also motion on
   * every drag, and someone working rather than learning may want the tool to
   * hold still.
   */
  const [highlights, setHighlights] = useState<boolean>(() => {
    try { return localStorage.getItem('color-taylor-highlights') !== '0'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('color-taylor-highlights', highlights ? '1' : '0'); } catch { /* localStorage unavailable */ }
  }, [highlights]);
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
  /*
   * Tell the page when the menu is pinned open, so the stage can narrow and
   * leave the rail somewhere to be. An attribute on the root rather than props
   * threaded up through App: the element that has to move is the one that
   * centres this component, so it is the parent's layout that changes and not
   * this one's - the same shape as the theme's `dark` class.
   */
  const menuPinned = settingsOpen && settings.keepMenuOpen;
  useEffect(() => {
    document.documentElement.toggleAttribute('data-menu-pinned', menuPinned);
    return () => document.documentElement.removeAttribute('data-menu-pinned');
  }, [menuPinned]);
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
  /*
   * Declared up here rather than beside the rest of the demo's state, because
   * the undo history below reads it: the demo's colours are not the user's
   * edits and must not enter the stack.
   */
  const [demoOpen, setDemoOpen] = useState(false);
  /**
   * Where the demo panel flies in from, when something handed over to it. Null
   * for the ? button, which has no card to come out of.
   */
  const [demoFrom, setDemoFrom] = useState<{ x: number; y: number } | null>(null);
  /*
   * Where the demo's ghost starts, when the video script handed the cursor
   * over rather than the welcome card handing the panel over. See
   * DemoRunner's `cursorFrom`.
   */
  const [demoCursorFrom, setDemoCursorFrom] = useState<{ x: number; y: number } | null>(null);
  /*
   * The about panel, shown once on a first visit and from Settings after that.
   * Eleventh localStorage key, and it holds "seen" rather than "show me",
   * so a browser that cannot store anything simply shows it every time - the
   * harmless failure of the two.
   */
  const [aboutOpen, setAboutOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('color-taylor-about-seen') !== '1'; } catch { return false; }
  });
  /*
   * The narrated walkthrough, mounted by the About panel's Presentation entry
   * the way `demoOpen` mounts the built-in demo. App state and not a route, so
   * nothing collides with `#/presentation` (the colour-history deck).
   *
   * The two elements are the host's because playback needs the click that
   * opened the walkthrough: only a `play()` called synchronously inside that
   * handler counts, and neither lazy component exists yet at that moment.
   */
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentVoice, setPresentVoice] = useState<HTMLAudioElement | undefined>(undefined);
  const [presentCamera, setPresentCamera] = useState<HTMLVideoElement | undefined>(undefined);
  const markAboutSeen = useCallback(() => {
    setAboutOpen(false);
    try { localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* localStorage unavailable */ }
  }, []);

  // Undo/redo history
  const undoStack = useRef<HSB[]>([]);
  const redoStack = useRef<HSB[]>([]);
  const lastPushed = useRef<string | null>(null);
  const isUndoRedoing = useRef(false);

  // Push to undo stack (debounced — only if value changed significantly)
  useEffect(() => {
    if (isUndoRedoing.current) return;
    // The demo's colours are not the user's edits; undo after it should reach
    // back past the whole thing to whatever they were doing before.
    if (demoOpen) return;
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
  }, [hsb.h, hsb.s, hsb.b, demoOpen]);

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
   * "Default Settings" returns the colour to DEFAULT_HSB.
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
      setHighlights(true);
      setColorFx(true);
      /*
       * Forget that the welcome has been seen, but do not put it back on
       * screen: a reset is somebody in the settings sheet adjusting the tool,
       * and answering that with a modal is an interruption they did not ask
       * for. The next visit is greeted, which is what "as a first visit finds
       * it" actually means.
       */
      try { localStorage.removeItem('color-taylor-about-seen'); } catch { /* localStorage unavailable */ }
    };
    window.addEventListener('color-taylor:reset-all', onResetAll);
    return () => window.removeEventListener('color-taylor:reset-all', onResetAll);
  }, [takeOverFromAnimation, animateToHsb]);

  /*
   * The self-running demo, behind the ? button.
   *
   * It works the real controls with synthetic pointer events, so everything
   * it shows - the holds, the impact highlights, the channel tooltips, the
   * tone - is the app's own behaviour rather than a re-staging of it. All
   * this host owes it is the two settings it wants on stage and the colour it
   * borrows.
   *
   * What it found goes back when it ends or is skipped: the colour through
   * the same tween an undo uses, the slider groups, blend and the HTML
   * colours on the hexagon as they were. Teaching a setting by silently
   * changing it is a poor trade.
   */
  const demoSnapshot = useRef<{
    hsb: HSB; rgb: RGB; groups: SliderGroup[]; blend: boolean; showHtmlOnHex: boolean;
  } | null>(null);
  const demoExactRgb = useRef<RGB | null>(null);
  const startDemo = useCallback((
    from: { x: number; y: number } | null = null,
    cursorFrom: { x: number; y: number } | null = null,
  ) => {
    setDemoFrom(from);
    /*
     * The cut opens the demo by pressing the ? button for real, so this runs
     * from the button's own onClick with nothing handed in - and the demo's
     * ghost then walked in from off screen while the script's was still
     * standing on the button it had just pressed. With a script on screen the
     * hand it was using is the hand the demo starts with, whichever mode is
     * driving. See handover.ts.
     */
    setDemoCursorFrom(cursorFrom ?? (scriptRunnerPresent() ? handoverPoint('demo') : null));
    takeOverFromAnimation();
    demoSnapshot.current = { hsb: { ...hsbRef.current }, rgb: { ...rgb }, groups, blend, showHtmlOnHex };
    // Ask any section the script works in to open, before the overlay mounts,
    // so the 200ms collapse has run by the time the first beat measures
    // anything. A section that was already open is not touched.
    openDemoSections();
    setDemoOpen(true);
  }, [takeOverFromAnimation, hsbRef, rgb, groups, blend, showHtmlOnHex]);
  /**
   * The About panel's Presentation entry.
   *
   * Everything here runs synchronously inside the click: the browser only
   * grants playback to a `play()` called in the gesture's own task, and both
   * `PresentationMode` and `WebcamPip` are lazy, so by the time either module
   * has loaded the gesture is long gone. The components adopt whatever they
   * are handed, playing or not, and leave a `src` that already points at the
   * cut's file alone - so starting the pair here and mounting them a tick
   * later is one continuous playback rather than a restart.
   *
   * A rejected `play()` is logged and swallowed: the walkthrough still runs on
   * a paused clock with its transport up, which is a far better failure than a
   * thrown handler that leaves the panel open and nothing mounted.
   */
  const startPresentation = useCallback(() => {
    const voice = new Audio(walkthroughVoiceUrl());
    voice.preload = 'auto';
    voice.play().catch((err: unknown) => console.warn('[walkthrough] voice track did not start', err));
    const camera = document.createElement('video');
    camera.muted = true;
    camera.playsInline = true;
    camera.preload = 'auto';
    camera.src = walkthroughCameraUrl();
    camera.play().catch((err: unknown) => console.warn('[walkthrough] camera panel did not start', err));
    setPresentVoice(voice);
    setPresentCamera(camera);
    setPresentOpen(true);
    // The panel stays open: the cut's first beat underlines the title inside
    // it and the runner closes it itself at the top of beat two. Only the
    // seen flag is set, so the panel does not come back as the welcome.
    try { localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* localStorage unavailable */ }
  }, []);
  const restoreDemo = useCallback(() => {
    const snap = demoSnapshot.current;
    // Null after the first call: the script restores when it reaches the last
    // caption, and "Start exploring" then asks a second time.
    if (!snap) return;
    demoSnapshot.current = null;
    restoreDemoSections();
    setGroups(snap.groups);
    setBlend(snap.blend);
    setShowHtmlOnHex(snap.showHtmlOnHex);
    /*
     * The tween restores HSB, and hsbToRgb(rgbToHsb(rgb)) changes 86.4% of
     * 8-bit colours - so a colour the user typed as R=137 would come back as
     * something else. Only when the two disagree: a colour that came from the
     * hexagon has no exact RGB to put back, and forcing one would pin its hue.
     */
    const derived = hsbToRgb(snap.hsb.h, snap.hsb.s, snap.hsb.b);
    const exact = snap.rgb;
    const drifts = exact.r !== derived.r || exact.g !== derived.g || exact.b !== derived.b;
    demoExactRgb.current = drifts ? exact : null;
    animateToHsb(snap.hsb);
  }, [animateToHsb]);
  useEffect(() => {
    onTweenLandedRef.current = () => {
      const exact = demoExactRgb.current;
      if (!exact) return;
      demoExactRgb.current = null;
      setRgb(exact);
    };
  }, [setRgb]);
  /*
   * `field` is the one thing the demo reads rather than works. A gesture on
   * the hexagon or the colour box is a position, not a delta, so a step that
   * means to land on a chosen colour has to know the one it is starting from.
   * HSB comes through its ref so it is live to the frame; the B/L mode is a
   * dependency instead, because a host rebuilt on a mode change is cheap and
   * the runner reads it through a ref of its own.
   */
  const demoHost = useMemo<DemoHost>(() => ({
    // Only when there is nothing at all to light up; otherwise the user's own
    // arrangement is what the demo runs against. See DemoHost.
    ensureSliders: () => setGroups((g) => (g.length ? g : DEFAULT_GROUPS)),
    field: () => {
      const { h, s, b } = hsbRef.current;
      const c = hsbToRgb(h, s, b);
      return { h, s, b, l: rgbToHsl(c.r, c.g, c.b).l, blMode };
    },
    restoreMovesColour: () => {
      const snap = demoSnapshot.current;
      if (!snap) return false;
      // The displayed colour, which is the override where there is one - the
      // same reading the restore itself puts back.
      const now = rgbOverride.current ?? hsbToRgb(hsbRef.current.h, hsbRef.current.s, hsbRef.current.b);
      return now.r !== snap.rgb.r || now.g !== snap.rgb.g || now.b !== snap.rgb.b;
    },
  }), [hsbRef, rgbOverride, blMode]);

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
  useEffect(() => {
    if (!colorAnimActive) return;
    const snap = () => setPlayHold({ key: 'play', base: shownRef.current });
    const first = setTimeout(snap, 0);
    const id = setInterval(snap, PLAY_SNAP_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [colorAnimActive]);
  /*
   * One gate for the whole feature: every highlight in the picker derives from
   * `lit` and `held`, and both come from here, so a null hold silences the
   * sliders, the hexagon's halos, the bars, the badge and the hue fill at once
   * without any of them being told about the setting.
   */
  const effectiveHold = highlights ? (hold ?? (colorAnimActive ? playHold : null)) : null;
  const lit = useImpact(shown, effectiveHold);
  const held = effectiveHold?.key ?? null;
  /** A slider lights when its value moved and it is not the one being held. */
  const sliderLit = (key: string) => lit.has(key) && held !== `sl:${key}`;
  /*
   * The hexagon lights by channel, a stem and its joint as one unit, for every
   * channel that moved - but not while the pointer is on a stem or joint.
   * The chain moving under the hand is its own feedback there; the halos are
   * for showing what a slider does to it.
   */
  const impactChannels = useMemo(() => {
    const set = new Set<Channel>();
    // Nor during the colour cycle: the chain sweeping the field is the show.
    if (held?.startsWith('hex:') || held === 'play') return set;
    (['r', 'g', 'b'] as Channel[]).forEach((c) => { if (lit.has(`rgb-${c}`)) set.add(c); });
    return set;
  }, [lit, held]);
  const hueBadgeLit = lit.has('hsb-h') && held !== 'hue';
  const hueFillLit = held === 'sl:hsb-s' || held === 'sl:hsl-s';
  // The hexagon's own bars are readouts like the sliders: lit when their value
  // moved and they are not the thing being held. Which value depends on the
  // model the bar is showing.
  const blBarLit = lit.has(blMode === 'lightness' ? 'hsl-l' : 'hsb-b') && held !== 'bl';
  const satBarLit = lit.has(blMode === 'lightness' ? 'hsl-s' : 'hsb-s') && held !== 'sat';

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

  // Read every frame rather than restarting the run, so dragging the setting
  // while a list plays changes the pace and nothing else.
  const playSpeedRef = useRef(settings.playSpeed);
  useEffect(() => { playSpeedRef.current = settings.playSpeed; }, [settings.playSpeed]);
  /**
   * Tells the Swatches panel which swatch the colour is travelling to, so its
   * ring moves as the transition starts rather than on arrival. A ref because
   * the library is created below this loop; it is filled in once it exists.
   */
  const playHeadingRef = useRef<((hex: string, forMs: number) => void) | null>(null);

  useEffect(() => {
    if (!play) {
      if (colorAnimRaf.current) cancelAnimationFrame(colorAnimRaf.current);
      colorAnimRaf.current = null;
      toneController.release();
      return;
    }
    const { colors } = play;
    if (!colors.length) return;

    // Standing on the start colour first, then travelling to the next: the
    // list wraps, so a one-colour list simply holds.
    let idx = play.start % colors.length;
    let phase = 0;
    let last: number | null = null;
    // Which colour the panel has been told is next; one announcement per step.
    let heading = -1;
    const hexOf = (c: RGB) => rgbToHex(c.r, c.g, c.b);
    toneController.start(hsbRef.current);
    const tick = (ts: number) => {
      // Check if user interaction requested a stop
      if (colorAnimActiveRef.current === 'stop') {
        colorAnimActiveRef.current = false;
        setPlay(null);
        toneController.stop(120);
        return;
      }

      const stepMs = playSpeedRef.current * 1000;
      const holdMs = stepMs * (1 - PLAY_TRANSITION_SHARE);
      if (last !== null) phase += ts - last;
      last = ts;
      while (phase >= stepMs) {
        phase -= stepMs;
        idx = (idx + 1) % colors.length;
      }

      // As the transition starts, the ring goes to where the colour is going.
      if (phase >= holdMs && heading !== idx) {
        heading = idx;
        playHeadingRef.current?.(hexOf(colors[(idx + 1) % colors.length]), stepMs - holdMs);
      }

      let { r, g, b } = colors[idx];
      if (phase >= holdMs) {
        const p = Math.sin(((phase - holdMs) / (stepMs - holdMs)) * Math.PI / 2);
        const to = colors[(idx + 1) % colors.length];
        r = Math.round(r + (to.r - r) * p);
        g = Math.round(g + (to.g - g) * p);
        b = Math.round(b + (to.b - b) * p);
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
  }, [play, hsbRef, rgbOverride, setHsb]);

  /**
   * A press on a list's play button: that list plays from where it says, a
   * second press on the same one stops it, and a press on the other list
   * hands over to it. Stopping goes through the same 'stop' flag a user's
   * edit raises, so the tick lands the tone and the state the one way.
   */
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; }, [play]);
  const togglePlay = useCallback((section: PlaySection, colors: RGB[], start: number) => {
    if (playRef.current?.section === section) {
      if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop';
      return;
    }
    setPlay({ section, colors, start });
  }, []);

  /**
   * Recent and Saved. Owned here rather than by the hexagon because they
   * render in a panel of their own now, and the hexagon still needs to record
   * a colour picked outright - so it gets addToRecent handed back down.
   * A row of the panel holds 24, which is also what Recent keeps.
   */
  const swatches = useSwatchLibrary({
    rgb,
    muted: effectiveMuted,
    recordRecent: !demoOpen,
    onAnimateToHsb: (target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); },
    bank: 24,
  });
  const { markPending: markSwatchPending } = swatches;
  useEffect(() => {
    playHeadingRef.current = (hex, forMs) => markSwatchPending(hex, 100, forMs);
  }, [markSwatchPending]);

  /*
   * The root's max-width is responsive, so it travels as two custom properties
   * rather than as an inline `maxWidth`: an inline style cannot carry a media
   * query, and the constants above stay the only place the numbers are written.
   * A wrapper element would have done the same job, but it would have had to be
   * unwrapped again above the breakpoint - this way the two-column layout is
   * untouched, still 1098px.
   */
  return (
    <div
      id="color-picker-root"
      className="mx-auto w-full py-1 px-[var(--picker-padding-x)] max-w-[var(--picker-one-col-max)] min-[800px]:max-w-[var(--picker-two-col-max)]"
      style={{
        '--picker-one-col-max': `${ONE_COL_MAX_WIDTH}px`,
        '--picker-two-col-max': `${TOP_ROW_MAX_WIDTH}px`,
        '--picker-padding-x': ROOT_PADDING_CLAMP,
      } as CSSProperties}
    >
      {/*
        One row wherever it fits, two where it does not - `flex-wrap` decides,
        not a breakpoint.

        This used to be flex-col until `sm`, which stacked the title above the
        buttons on every phone whether or not there was room. At 375 there is:
        the title measures 200px against a 331px container and the three icon
        buttons need 112px, so it lands with room to spare. Wrapping keeps the
        narrow cases honest without a second breakpoint to tune - a 320px
        device, or a `?intro` URL where the Intro button is a fourth control,
        simply falls back to two rows on its own.
      */}
      <div id="picker-header" className="flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* The emoji sit outside .wordmark on purpose: that class paints the
            glyphs with a background clipped to the text, so anything inside it
            loses its own colour - the palette and thread would come out as
            flat grey silhouettes. */}
        <h1 id="color-picker-title" className="text-2xl font-semibold">
          <span className="wordmark">Color Taylor</span> 🎨🧵
        </h1>
        {/* Tagged because the demo's caption sits in the gap between this and
            the title when the header has one, and drops below the header when
            it wraps. src/demo/DemoRunner.tsx. */}
        <div id="picker-tools" className="flex items-center justify-end gap-2">
          {/* The button only, and only under `?intro`. The route itself is
              always live - see useHashRoute - so /intro can be shared while
              the deck is still too rough to advertise on the picker. */}
          {introRequested() && (
            <button
              id="intro-button"
              className="ctl-quiet"
              onClick={() => { window.location.hash = '#/intro'; }}
            >
              Intro
            </button>
          )}
          {/* The play button lived here, cycling nine fixed colours. It is in
              the Swatches panel now, one per list, playing the swatches. */}
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
                      <span className="relative inline-flex items-center justify-center size-5">
                        <Music className="size-5" />
                        {!settings.synth.synthEnabled && (
                          <Slash className="size-5 absolute inset-0 -scale-x-100" />
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
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  id="demo-button"
                  className="ctl-quiet-icon"
                  /* The About panel is the one door to the demo and to the
                     walkthrough, so the ? opens that rather than starting the
                     tour straight away. Settings' "About Color Taylor" opens
                     the same panel. */
                  onClick={() => setAboutOpen(true)}
                  aria-label="About"
                >
                  <CircleHelp className="size-5" />
                </button>
              }
            />
            <TooltipContent>About</TooltipContent>
          </Tooltip>
          {/* Play, Demo, Theme, Menu. The two that do something to the
              colour lead, then the two that are about the app itself - and
              the audio controls stay beside Play, which is what makes them
              audible. */}
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  id="settings-button"
                  className="ctl-quiet-icon"
                  onClick={() => setSettingsOpen(o => !o)}
                  aria-label="Open menu"
                  // aria-haspopup, not aria-expanded: the panel is a modal
                  // dialog now rather than a disclosure region, and it is
                  // portalled out of this button's subtree.
                  aria-haspopup="dialog"
                >
                  {/* A menu, not a gear: the sheet is where everything that
                      is not the picker lives - About included - and a gear
                      promises only preferences. */}
                  <Menu className="size-5" />
                </button>
              }
            />
            <TooltipContent>Menu</TooltipContent>
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
        (614) and SLIDERS_PANEL_WIDTH (420), with SLIDERS_PANEL_MIN_WIDTH (320)
        as the second one's floor. Keep them in sync with the constants above.

        They are `fr` rather than `px` on purpose. With px maxima the tracks do
        not shrink proportionally - grid holds the second at 420 and takes the
        entire shortfall out of the first, so at the md boundary the hexagon
        collapsed to 244px while the sliders kept full width. As flex factors in
        a 614:420 ratio they divide the space the way the flex bases used to,
        the root's max-width lets them land exactly on 614 and 420 when there is
        room, and the 320px min still stops the sliders going too tight.

        The columns start at 800px, not at md's 768. The breakpoint used to be
        900, set by the Color Editor: its content needed a 317px card and the fr
        share only reached that at an 884px window. That is no longer what binds
        - the 320px floor above answers the same question from the other side,
        so the editor column can never be squeezed below its content at any
        width. Measured: from 760 to 880 that column sits pinned at exactly
        320px and nothing in it leaves the card, wraps or scrolls.

        So the hexagon column is what sets the breakpoint now. It keeps
        narrowing, and #hex-stage scales the field with it, but the hue badge
        and the brightness pill do not scale - they are fixed-size chrome riding
        a shrinking hexagon, and eventually they meet. Swept 12 hues x 9
        brightnesses at each width: clean at 796 and above, and at 794 the badge
        and the pill collide by 0.6px at h0/b40, growing to 2.3px at 784 and
        worse below. 800 is that 796 rounded up. md's 768 is 28px the wrong side
        of it, so the natural Tailwind step is not available here. The two
        `col-span-2` panels below use the same breakpoint.
      */}
      <div className="grid grid-cols-1 min-[800px]:grid-cols-[minmax(0,614fr)_minmax(320px,420fr)] gap-x-4 gap-y-3 items-stretch">
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
            onRecordColor={swatches.addToRecent}
            impactChannels={impactChannels}
            hueBadgeLit={hueBadgeLit}
            hueFillLit={hueFillLit}
            blBarLit={blBarLit}
            satBarLit={satBarLit}
          />

        {/* Right column: Controls. Width comes from the grid track now, so this
            carries only its own surface.

            flex-col here starts a chain of flex-1 down to #sb-wrapper, so the SB
            box absorbs the difference between this column's natural height and
            the hexagon's: it shrinks when this column would be the taller one,
            grows when it would be shorter. The grid gives this element a
            definite height to divide up, which is what makes the chain resolve. */}
        <div
          id="picker-layout"
          data-demo-section=""
          // @container/editor: the reflow stages below key on this card's own
          // width, not the viewport, so the Figma plugin and the presentation -
          // which render the picker at widths the page never takes - get the
          // same rules. See wiki/notes/plan-narrow-widths.md.
          className="panel-frame @container/editor flex flex-col border border-border rounded-lg p-2.5"
        >
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
            at every width from 1100px down to the 800px breakpoint where they
            stop being columns at all. Below ~1000px both settle at 715px, the
            hexagon having reached the natural size of its fixed-width card, and
            the box bottoms out at 143px - comfortably above the 96px floor. So
            the floor is a guard now rather than the binding constraint, and it
            stays for the case where something above it grows. */}
        <div
          id="sb-wrapper"
          // No overflow clip. The SB box's handle is meant to hang over the
          // top edge when brightness is at 100 - it marks a point, and half a
          // ring reads as a rendering fault rather than as "as bright as it
          // goes". Nothing else in here overflows: min-w-0 is what keeps the
          // flex children honest, and it is still on.
          //
          // Below a 230px card the swatch cannot keep a column of its own: it
          // and the hue strip are fixed-width, so every px they take comes off
          // the SB box, which stops being usable at about 120px wide (card 226,
          // measured). Stacking the swatch as a band on top hands its 50px and
          // the gap back to the box. Column here, so the box + strip row below
          // is still the flex child that takes the slack.
          className="flex flex-1 min-h-24 gap-3 min-w-0 @max-[230px]/editor:flex-col"
          // Overrides flex-1's `flex-basis: 0%`. Inline because the value is a
          // layout constant shared with the note above, not a magic number.
          style={{ flexBasis: SB_BOX_DEFAULT_HEIGHT }}
        >
          {/* Stacked, the swatch is a short band across the top rather than a
              tall block - full width, and its own height so it does not eat
              the box's. */}
          <PreviewSwatch hex={hex} className="@max-[230px]/editor:h-8 @max-[230px]/editor:w-full" />
          {/* The box and its hue strip stay a row in both layouts; this wrapper
              is what the swatch moves above. Unwrapped in the wide layout it
              costs nothing: flex-1 and the same gap put all three where they
              were. */}
          <div className="flex flex-1 min-w-0 gap-3">
            <SBBox
              hue={hsb.h}
              saturation={hsb.s}
              brightness={hsb.b}
              onChange={handleSbBoxChange}
              blMode={blMode}
            />
            <HSlider
              hue={hsb.h}
              onChange={handleHSliderChange}
            />
          </div>
        </div>

        {/* The slider banks, one flat block of the panel rather than two cards:
            the models are the same colour read three ways, and a card each made
            them look like three tools. The toolbar is the plugin's - which
            blocks show, and whether tracks blend - plus the hex readout. It
            used to sit in a card of its own under the sliders, with a second
            swatch beside it; the swatch at the top is the swatch.

            The toolbar is one row while it fits and two below a 296px card: the
            three selectors are 48px each and the readout is 92px, so the row's
            own minimum is 306px (measured) and below that the readout leaves
            the card. 296 rather than 306 because the two-column layout holds
            this card at 298px of content from 800px of viewport all the way to
            about 950px - a threshold above that would split the toolbar across
            that whole band of desktop widths to save an overflow that is 8px at
            its worst. So one-column widths 363-372 keep the old few-px spill,
            and everything narrower reflows. Split, the readout and the blend
            toggle take the upper row and the selectors the lower. The
            readout was stepper-wide to line up with the number fields below;
            on a row of its own there is nothing to line up with, so it takes
            the width instead of trailing a gap.

            A grid rather than a flex row because the split is an order change,
            not a wrap: wide, the columns are selectors / blend / readout with
            the readout at the right end; narrow, `order` puts blend and the
            readout on the first row and the selectors span both columns
            underneath. */}
        <div className="flex flex-col gap-3" id="slider-banks">
          <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 @max-[296px]/editor:grid-cols-[auto_1fr]">
            <ToggleGroup
              multiple
              value={groups}
              onValueChange={(v) => setGroups(SLIDER_GROUPS.filter((g) => (v as SliderGroup[]).includes(g)))}
              aria-label="Slider groups"
              className="@max-[296px]/editor:order-3 @max-[296px]/editor:col-span-2"
            >
              {SLIDER_GROUPS.map((g) => (
                <Tooltip key={g}>
                  <TooltipTrigger render={<ToggleGroupItem value={g} id={`slider-group-${g.toLowerCase()}`} className="w-12">{g}</ToggleGroupItem>} />
                  <TooltipContent className={TOOLBAR_TIP_CLASS}>{GROUP_TIP[g]}</TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
            <ToggleGroup
              multiple
              value={blend ? ['blend'] : []}
              onValueChange={(v) => setBlend(v.length > 0)}
              className="@max-[296px]/editor:order-1"
            >
              {/*
                Controlled, unlike every other tooltip here, because this one
                describes a state the trigger changes. base-ui closes a tooltip
                when its trigger is pressed and will not reopen while the
                pointer has not left - so clicking swapped the label to one
                nobody could see without moving away and coming back. Only the
                pointer leaving or focus going closes it now; the press cannot.
              */}
              <Tooltip
                open={blendTipOpen}
                onOpenChange={(next) => { if (next) setBlendTipOpen(true); }}
              >
                <TooltipTrigger
                  render={
                    <ToggleGroupItem
                      value="blend"
                      className="px-2"
                      id="blend-toggle"
                      // Not on touch - see utils/hoverTips.
                      onPointerEnter={(e) => { if (tipFromPointer(e)) setBlendTipOpen(true); }}
                      onPointerLeave={() => setBlendTipOpen(false)}
                      onFocus={(e) => { if (tipFromFocus(e.currentTarget)) setBlendTipOpen(true); }}
                      onBlur={() => setBlendTipOpen(false)}
                      // The label is the action, the tooltip below is the
                      // state: blend off draws each channel's own ramp, which
                      // is the source colour, and blend on draws the colour a
                      // drag would land on, which is the mix.
                      aria-label={blend ? 'Show source colors' : 'Show mixed colors'}
                    >
                      <BlendIcon filled={blend} />
                    </ToggleGroupItem>
                  }
                />
                <TooltipContent className={TOOLBAR_TIP_CLASS}>{blend ? 'Mixed Colors' : 'Source Colors'}</TooltipContent>
              </Tooltip>
            </ToggleGroup>
            <div className="w-[92px] justify-self-end @max-[296px]/editor:order-2 @max-[296px]/editor:w-full">
              <HexInput
                hex={hex}
                onChange={handleHexInput}
              />
            </div>
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

        {/* The HTML colour row: search, nearest name, show-on-hex. Flat in the
            panel under a rule, the same rule the slider blocks draw between
            themselves - it was boxed in a "Hex and HTML Colors" card, which
            made one row of controls look like a section to open. */}
        <hr className="m-0 border-0 border-t border-input" />
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

      {/* Swatches: Recent and Saved, out of the Hexagon card and into a panel
          of their own across both tracks, where a row holds 24. See
          wiki/notes/decision-swatches-panel.md. */}
      <div className="min-[800px]:col-span-2 panel-frame border border-border rounded-lg p-2.5">
        <SwatchLibrary lib={swatches} layout="panel" collapsed play={{ active: play?.section ?? null, onToggle: togglePlay }} />
      </div>

      {/* Equations panel. Spanning both tracks is what makes it match the width
          of the row above; nothing measures anything. */}
      <div className="min-[800px]:col-span-2 panel-frame border border-border rounded-lg p-2.5">
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
      {demoOpen && (
        <Suspense fallback={null}>
          <DemoRunner
            from={demoFrom}
            cursorFrom={demoCursorFrom}
            host={demoHost}
            onRestore={restoreDemo}
            onExit={() => setDemoOpen(false)}
          />
        </Suspense>
      )}
      {scriptName() && (
        <Suspense fallback={null}>
          <ScriptRunner
            host={demoHost}
            demoOpen={demoOpen}
            onDemo={(cursorFrom) => startDemo(null, cursorFrom ?? null)}
            onColor={(target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); }}
          />
        </Suspense>
      )}
      {(scriptName() || presentName() || presentOpen) && (
        <Suspense fallback={null}>
          <WebcamPip webcam={presentCamera} />
        </Suspense>
      )}
      {/* Two ways in, and they mount the same component differently. The URL
          parameter is a tool: full transport, nothing playing, because a link
          cannot satisfy the gesture rule. The About panel's entry is the
          shipped walkthrough: the reduced transport, already playing, on the
          elements the click started. On the Vite dev server the URL is also the
          authoring tool (notes, clip editor); a build never mounts that half. */}
      {presentName() && (
        <Suspense fallback={null}>
          <PresentationMode
            name={presentName() as string}
            host={demoHost}
            demoOpen={demoOpen}
            mode={import.meta.env.DEV ? 'dev' : 'production'}
            transport="full"
            onDemo={(cursorFrom) => startDemo(null, cursorFrom ?? null)}
            onColor={(target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); }}
          />
        </Suspense>
      )}
      {!presentName() && presentOpen && (
        <Suspense fallback={null}>
          <PresentationMode
            name={CURRENT_CUT}
            host={demoHost}
            demoOpen={demoOpen}
            voice={presentVoice}
            mode="production"
            transport="reduced"
            onDemo={(cursorFrom) => startDemo(null, cursorFrom ?? null)}
            onColor={(target) => { if (colorAnimActiveRef.current) colorAnimActiveRef.current = 'stop'; animateToHsb(target); }}
          />
        </Suspense>
      )}
      <AboutPanel
        open={aboutOpen}
        onClose={markAboutSeen}
        onWatchDemo={() => {
          // The panel flies out of the card the press was on, so the two read
          // as one thing rather than as a swap.
          const card = document.querySelector('[data-testid="about-panel"]')?.getBoundingClientRect();
          markAboutSeen();
          startDemo(card ? { x: card.left + card.width / 2, y: card.top + card.height / 2 } : null);
        }}
        onPresentation={startPresentation}
      />
      <SettingsPanel
        open={settingsOpen}
        onAbout={() => { setSettingsOpen(false); setAboutOpen(true); }}
        onClose={() => setSettingsOpen(false)}
        muted={effectiveMuted}
        onToggleMute={() => setMuted(m => !m)}
        colorFx={colorFx}
        onToggleColorFx={() => setColorFx(v => !v)}
        highlights={highlights}
        onToggleHighlights={() => setHighlights(v => !v)}
      />
    </div>
  );
}
