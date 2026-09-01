/**
 * Figma plugin UI.
 *
 * Deliberately thin. It renders the app's real <ColorHexagon>, so anything you
 * change in src/components/ColorHexagon.tsx shows up here on the next
 * `bun run build:figma` - there is no second copy of the picker.
 *
 * What this file owns, and nothing more:
 *   1. The color state ColorHexagon expects as a controlled component,
 *      mirroring the HSB-canonical + rgbOverride pattern from ColorPicker.
 *   2. The bridge to the plugin sandbox: push every color change to the
 *      selection, pull the selection's fill back in.
 */
import {
  Component,
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  hsbToRgb,
  rgbToHsb,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  type HSB,
  type RGB,
} from '../../src/utils/colorConversions';
import {
  brightnessGradient,
  hueGradient,
  saturationGradient,
  hslHueGradient,
  hslSaturationGradient,
  lightnessGradient,
  redGradient,
  greenGradient,
  blueGradient,
  redChannelGradient,
  greenChannelGradient,
  blueChannelGradient,
  type ColorSpace,
} from '../../src/utils/sliderGradients';
import { HSB_TWEEN_MS, easeInOutQuad } from '../../src/utils/colorTween';
import { useColorState } from '../../src/hooks/useColorState';
import ColorSlider from '../../src/components/ColorSlider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BlendIcon from './lite/BlendIcon';
import { Ban, Brush, PaintBucket } from 'lucide-react';
import ColorHexagon from '../../src/components/ColorHexagon';
// The bridge protocol, shared with code.js - the one place the two halves of
// the plugin are kept from drifting apart.
import type {
  PaintTarget,
  SandboxToUiMessage,
  SelectionMessage,
  UiToSandboxMessage,
} from '../messages';
// figma.css imports the app's index.css, so this is the only stylesheet entry.
import './figma.css';

function post(msg: UiToSandboxMessage) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

/**
 * Which slider blocks are on show. Multi-select rather than tabs: these are
 * four views of one color, and comparing two models side by side is the point
 * of the app - a tab strip could only ever show one at a time.
 */
const SLIDER_GROUPS = ['RGB', 'HSB', 'HSL', 'A'] as const;
type SliderGroup = (typeof SLIDER_GROUPS)[number];

/** How long after the last sign of an edit the frame poll keeps running. */
const HOT_MS = 2000;

const CHECKER =
  'repeating-conic-gradient(rgba(128,128,128,.45) 0% 25%, transparent 0% 50%) 0 0/10px 10px';

/** Checkerboard under a transparent-to-color ramp, so alpha reads as alpha. */
function alphaGradient(rgb: RGB) {
  return `linear-gradient(to right, transparent, rgb(${rgb.r},${rgb.g},${rgb.b})),${CHECKER}`;
}

/**
 * The ring handle's core: the color at its actual alpha over a checkerboard,
 * so the handle itself shows the transparency rather than only marking where
 * on the track you are. A flat swatch would look opaque at every value.
 */
function alphaSwatch(rgb: RGB, alpha: number) {
  const c = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha / 100})`;
  return `linear-gradient(${c},${c}),${CHECKER}`;
}

/**
 * The panel's scroll position, drawn in the right-hand padding.
 *
 * Its own element rather than the browser's, because a real scrollbar takes
 * layout width - see figma.css. Geometry is read straight off body, which is
 * the scroll container.
 */
// Insets of the track within the fixed element, matching figma.css. The bottom
// one is larger so the south-east resize grip stays clear.
const TRACK_TOP = 4;
const TRACK_BOTTOM = 16;

function scrollMetrics() {
  const el = document.body;
  const view = el.clientHeight;
  const total = el.scrollHeight;
  const track = Math.max(0, view - TRACK_TOP - TRACK_BOTTOM);
  const height = Math.min(track, Math.max(24, (view / total) * track));
  return { el, view, total, track, height, scrollable: total - view };
}

function ScrollIndicator() {
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const measure = () => {
      const m = scrollMetrics();
      if (m.scrollable <= 2) {
        setBar(null);
        return;
      }
      const top = TRACK_TOP + ((m.track - m.height) * m.el.scrollTop) / m.scrollable;
      setBar({ top, height: m.height });
    };
    measure();
    document.addEventListener('scroll', measure, { passive: true, capture: true });
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      document.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  /** Drag the thumb: pointer travel over the free track maps to scroll range. */
  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const m = scrollMetrics();
    const span = m.track - m.height;
    const startY = e.clientY;
    const startTop = m.el.scrollTop;
    setDragging(true);

    const move = (ev: PointerEvent) => {
      if (span <= 0) return;
      m.el.scrollTop = startTop + ((ev.clientY - startY) / span) * m.scrollable;
    };
    const up = (ev: PointerEvent) => {
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      setDragging(false);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  /** Pressing the track jumps, centring the thumb where you pressed. */
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = scrollMetrics();
    const span = m.track - m.height;
    if (span <= 0) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top - TRACK_TOP - m.height / 2;
    m.el.scrollTop = (Math.max(0, Math.min(span, y)) / span) * m.scrollable;
  };

  if (!bar) return null;
  return (
    <div className="figma-scrollbar" onPointerDown={onTrackDown}>
      <div
        className="figma-scrollbar-thumb"
        data-dragging={dragging || undefined}
        style={{ top: bar.top, height: bar.height }}
        onPointerDown={onThumbDown}
      />
    </div>
  );
}

function PluginApp() {
  // #4F95FF, matching the app's default and the branding. Only ever seen with
  // nothing selected - any selection seeds the picker from its own fill.
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [selectionCount, setSelectionCount] = useState(0);
  const [alpha, setAlpha] = useState(100);
  const [target, setTarget] = useState<PaintTarget>('fill');

  /*
   * The colour state is the app's own hook - decision-hsb-canonical-rgb-override
   * implemented once rather than mirrored here. What the plugin adds on top:
   * every user-driven write flags userEditRef so the live-apply effect can tell
   * a pick from a seed, and a click-to-animate tweens alpha on the same clock
   * as the colour and closes Figma's undo group when it lands.
   */
  const userEditRef = useRef(false);
  const alphaTween = useRef<{ from: number; to: number } | null>(null);
  const {
    hsb, setHsb, rgb, hsl,
    rgbOverride,
    setHsbClear, setRgbChannel, setHslChannel, animateToHsb: tweenTo, cancelTween,
  } = useColorState({
    initial: { h: 216, s: 69, b: 100 },
    onEdit: () => { userEditRef.current = true; },
    onTweenFrame: (_next, t) => {
      userEditRef.current = true;
      // Same clock and same easing as the colour, so the two arrive together.
      const a = alphaTween.current;
      if (a) setAlpha(Math.round(a.from + (a.to - a.from) * easeInOutQuad(t)));
    },
    onTweenEnd: () => {
      alphaTween.current = null;
      // Close the undo group here too: on click-to-animate the pointerup
      // commit already fired before the tween wrote anything.
      post({ type: 'commit' });
    },
  });
  // Painting keys off userEditRef rather than off the colour changing, because
  // the colour also changes when we seed from a selection - and applying then
  // meant that selecting or pasting a layer silently repainted it with
  // whatever was already in the picker.
  // Read inside the apply effect so switching target does not itself trigger a
  // paint - that is a mode change, and it re-seeds from the new target instead.
  const targetRef = useRef<PaintTarget>('fill');

  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Live-apply. No button: picking a color *is* the action - but only picking.
  const isHsl = blMode === 'lightness';

  // Opens on what the panel showed before this control existed: one HS* block
  // plus alpha. Which of HSB/HSL follows the Bright/Light switch, so the
  // sliders agree with the hexagon on first paint.
  const [groups, setGroups] = useState<SliderGroup[]>(() => [isHsl ? 'HSL' : 'HSB', 'A']);

  /**
   * Whether the R/G/B tracks show the color they would actually produce, or a
   * flat ramp for the channel on its own.
   *
   * Blended is the default and the more useful of the two - the track answers
   * "what do I get if I drag here". The flat ramp answers "how much of this
   * channel is there", which is what you want when reading a value rather than
   * choosing one. Only meaningful while the RGB block is on show, so the
   * control disables rather than disappears: a slot that empties as you toggle
   * groups is more distracting than one that grays out.
   */
  const [blendTracks, setBlendTracks] = useState(true);
  /**
   * A handle's core. On a flat ramp it has to be the color that ramp actually
   * shows at that point, or the handle is the one thing on the row still
   * wearing the mixed color - a black-to-red track with a yellow dot on it.
   *
   * Alpha is the exception and keeps the source color either way: its track is
   * transparent-to-current by definition, so there is no channel to isolate.
   */
  const asHex = (c: RGB) => rgbToHex(c.r, c.g, c.b);
  const rgbFill = (channel: 'r' | 'g' | 'b') =>
    blendTracks
      ? hex
      : `rgb(${channel === 'r' ? rgb.r : 0},${channel === 'g' ? rgb.g : 0},${channel === 'b' ? rgb.b : 0})`;
  const paintKey = `${hex}|${alpha}`;
  useEffect(() => {
    if (!userEditRef.current) return;
    userEditRef.current = false;
    if (selectionCount === 0 || targetRef.current === 'none') return;
    post({ type: 'apply', hex, opacity: alpha / 100, target: targetRef.current });
  }, [paintKey, hex, alpha, selectionCount]);

  // Switching Fill/Stroke re-reads the selection through the new target rather
  // than painting it, so you see what is already there before changing it.
  useEffect(() => {
    post({ type: 'target', target });
  }, [target]);

  // The single source of the window's height. Nothing else sets it, which is
  // why dead space below the content cannot happen.
  //
  // Measuring only works because nothing in the layout is height:100%; if it
  // were, content height would follow window height and this would oscillate.
  // The last-sent guard is a second line of defense against that. Figma clamps
  // the result to what fits on screen, so a very tall panel scrolls instead.
  const rootRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      // The root element's own laid-out height. Not documentElement.scrollHeight:
      // that is floored at the viewport height, so it would report the window
      // back to us and the panel could never shrink.
      const h = Math.ceil(el.offsetHeight);
      if (h === lastHeightRef.current) return;
      lastHeightRef.current = h;
      post({ type: 'autosize', height: h });
    };
    /*
     * Whether the scrollbar should actually be drawn.
     *
     * Content height and window height are never in step for the frame or two
     * it takes an autosize to round-trip through the sandbox - grow the
     * content and it overflows until Figma grants the new height. That is a
     * real overflow, so `auto` faithfully draws a scrollbar for it, which is
     * why one kept flashing during width drags and section toggles with
     * everything perfectly visible either side.
     *
     * So wait for it to settle before believing it. Anything transient never
     * survives the delay; a genuine clamp does, every time.
     */
    let settle: number | undefined;
    const syncOverflow = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const over = Math.ceil(el.offsetHeight) - window.innerHeight > 2;
        document.documentElement.toggleAttribute('data-overflow', over);
      }, 250);
    };

    measure();
    syncOverflow();
    const observer = new ResizeObserver(() => {
      measure();
      syncOverflow();
    });
    observer.observe(el);
    window.addEventListener('resize', syncOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncOverflow);
      window.clearTimeout(settle);
    };
  }, []);

  // One undo entry per gesture rather than per frame of a drag.
  useEffect(() => {
    const commit = () => post({ type: 'commit' });
    window.addEventListener('pointerup', commit);
    return () => window.removeEventListener('pointerup', commit);
  }, []);

  // Figma stamps `figma-dark` on <html> (themeColors: true in code.js); the
  // app's tokens key off `dark`. Mirror one onto the other and keep watching,
  // since the user can flip Figma's theme while the plugin is open.
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => html.classList.toggle('dark', html.classList.contains('figma-dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Figma can emit document changes faster than the hexagon can repaint, so
    // keep only the newest and apply it once per frame.
    let queued: SelectionMessage | null = null;
    let frame = 0;
    const flush = () => {
      frame = 0;
      const msg = queued;
      queued = null;
      if (msg) applySelection(msg);
    };
    const applySelection = (msg: SelectionMessage) => {
        setSelectionCount(msg.count);
        if (msg.hex) {
          const next = hexToRgb(msg.hex);
          if (next) {
            // Snap. A tween left running from a marker click would keep writing
            // its own frames over the incoming value and read as stutter.
            cancelTween();
            // Through the raw setter on purpose: a seed is not a user edit,
            // and the typed writers would flag it as one.
            rgbOverride.current = next;
            setAlpha(Math.round((msg.opacity ?? 1) * 100));
            setHsb(rgbToHsb(next.r, next.g, next.b));
          }
        }
    };
    /**
     * The frame clock for following Figma's own color picker.
     *
     * The sandbox cannot run this: it is a JavaScript VM with no display, so
     * it has no setInterval and no frames to hang a loop on. This iframe is a
     * real browser context, so the asking happens here, on
     * requestAnimationFrame - the display's actual refresh rate rather than a
     * number someone picked. On a 120Hz screen it follows at 120Hz.
     *
     * It runs only while an edit is in flight. The sandbox says when one
     * starts (documentchange is late, but it is a reliable "something is
     * happening"), and every color that comes back extends the window; a
     * couple of seconds of quiet and the loop stops. rAF also stands down on
     * its own when the panel is not being painted, which no interval would.
     */
    let hotUntil = 0;
    let pumpId: number | null = null;
    const pump = () => {
      if (performance.now() > hotUntil) {
        pumpId = null;
        return;
      }
      post({ type: 'poll' });
      pumpId = requestAnimationFrame(pump);
    };
    const wake = () => {
      hotUntil = performance.now() + HOT_MS;
      if (pumpId === null) pumpId = requestAnimationFrame(pump);
    };

    const onMessage = (event: MessageEvent) => {
      const msg: SandboxToUiMessage | undefined = event.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === 'wake') {
        wake();
        return;
      }
      if (msg.type !== 'selection') return;
      // An incoming color means the edit is still going: keep asking.
      if (msg.hex) wake();
      queued = msg;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    window.addEventListener('message', onMessage);
    post({ type: 'ready' });
    return () => {
      window.removeEventListener('message', onMessage);
      if (frame) cancelAnimationFrame(frame);
      if (pumpId !== null) cancelAnimationFrame(pumpId);
    };
    // Hook-provided refs and setters are stable; listed to satisfy exhaustive-deps.
  }, [cancelTween, rgbOverride, setHsb]);

  const onAlphaChange = useCallback((v: number) => {
    userEditRef.current = true;
    setAlpha(v);
  }, []);

  /**
   * A swatch's opacity, waiting for the tween that is about to start.
   *
   * ColorHexagon calls onAlphaRestore immediately before onAnimateToHsb, in
   * the same tick, so the color tween can pick the opacity up and carry both
   * on one clock. Setting alpha directly here instead would snap it to the
   * destination while the color was still a second away from arriving.
   */
  const pendingAlpha = useRef<number | null>(null);
  const onAlphaRestore = useCallback((v: number) => {
    pendingAlpha.current = v;
  }, []);

  const onHsbChange = useCallback((next: Partial<HSB>) => setHsbClear((prev) => ({ ...prev, ...next })), [setHsbClear]);
  const onHueChange = useCallback((h: number) => setHsbClear((prev) => ({ ...prev, h })), [setHsbClear]);
  const onRgbChange = setRgbChannel;

  // Clicking the 100/50/0 bar markers or a vertex letter goes through
  // onAnimateToHsb. Without it ColorHexagon early-returns and those are dead
  // controls. Duration, easing, hue wrap and rounding come from
  // utils/colorTween - the same module ColorPicker's animateToHsb uses - so
  // the plugin cannot drift from the app's feel.
  const onAnimateToHsb = useCallback((target: HSB) => {
    userEditRef.current = true;
    const alphaTo = pendingAlpha.current;
    pendingAlpha.current = null;
    // Captured through setState rather than a ref, the same way the colour's
    // own start value is: React holds the current alpha, and reading it back
    // here cannot go stale.
    if (alphaTo !== null) setAlpha((cur) => { alphaTween.current = { from: cur, to: alphaTo }; return cur; });
    else alphaTween.current = null;
    tweenTo(target);
  }, [tweenTo]);

  const onHslChange = setHslChannel;

  return (
    <>
      <div className="figma-root" ref={rootRef}>
        <ColorHexagon
        rgb={rgb}
        hue={hsb.h}
        brightness={hsb.b}
        saturation={hsb.s}
        hsl={hsl}
        onHueChange={onHueChange}
        onRgbChange={onRgbChange}
        onHsbChange={onHsbChange}
        onHslChange={onHslChange}
        onAnimateToHsb={onAnimateToHsb}
        blMode={blMode}
        onBlModeChange={setBlMode}
        colorSpace={colorSpace}
        onColorSpaceChange={setColorSpace}
        bare
        collapsedSections
        sectionVariant="flush"
        alpha={alpha}
        onAlphaRestore={onAlphaRestore}
        wheelAdjusts={false}
        blBar={false}
        satBar={false}
        stemRange={[2, 4]}
        muted
        headerLeft={
          // Mirrors the Bright/Light group opposite: tabs with a caption
          // underneath, same classes so the two read as a matched pair.
          <div className="inline-flex flex-col items-center gap-0.5">
            <Tabs
              value={target}
              onValueChange={(v) => {
                // Synchronously, not via the effect below: the effect lands a
                // render later, so a color change in the same tick would still
                // paint through the old target.
                targetRef.current = v as PaintTarget;
                setTarget(v as PaintTarget);
              }}
            >
              <TabsList>
                <TabsTrigger value="fill" className="w-9" aria-label="Fill">
                  <PaintBucket className="!size-3.5" />
                </TabsTrigger>
                <TabsTrigger value="stroke" className="w-9" aria-label="Stroke">
                  <Brush className="!size-3.5" />
                </TabsTrigger>
                {/* Browse without painting. The paste problem is fixed at
                    source - selecting never applies now - but an explicit off
                    is still worth having while picking against a reference. */}
                <TabsTrigger value="none" className="w-9" aria-label="Do not apply">
                  <Ban className="!size-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[10px] text-muted-foreground">
              Selected: {selectionCount}
            </span>
          </div>
        }
        belowStage={
          <div className="flex flex-col gap-3 px-1">
            <div className="flex items-center justify-between gap-2">
              <ToggleGroup
                multiple
                value={groups}
                onValueChange={(v) => setGroups(v as SliderGroup[])}
                className="h-7"
              >
                {SLIDER_GROUPS.map((g) => (
                  <ToggleGroupItem key={g} value={g} className="px-2.5 text-xs">
                    {g}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <ToggleGroup
                multiple
                value={blendTracks ? ['blend'] : []}
                onValueChange={(v) => setBlendTracks(v.length > 0)}
                className="h-7"
              >
                <ToggleGroupItem
                  value="blend"
                  className="px-2"
                  aria-label={blendTracks ? 'Show flat channel ramps' : 'Show blended tracks'}
                >
                  <BlendIcon filled={blendTracks} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/*
              A rule between blocks, drawn by the block below rather than as a
              separate element: the blocks are conditional, so a standalone <hr>
              would need to know which sibling is currently first. :first-child
              already knows - React renders nothing at all for a block that is
              off, so the first one on screen is the first one in the DOM.

              One block per model, never a blend of two. HSL's hue and saturation
              are not HSB's - the same color has a different S in each - so a
              block reads and writes entirely within its own model. Showing both
              at once is fine, and is why this is a toggle group: each stays
              self-consistent, and edits round-trip through the shared color.
            */}
            <div className="flex flex-col">
            {groups.includes('RGB') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3" role="group" aria-label="RGB">
                <ColorSlider
                  label={'R'}
                  group='rgb'
                  value={rgb.r}
                  max={255}
                  suffix={''}
                  gradient={blendTracks ? redGradient(rgb.g, rgb.b) : redChannelGradient}
                  onChange={(v) => onRgbChange('r', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={rgbFill('r')}
                />
                <ColorSlider
                  label={'G'}
                  group='rgb'
                  value={rgb.g}
                  max={255}
                  suffix={''}
                  gradient={blendTracks ? greenGradient(rgb.r, rgb.b) : greenChannelGradient}
                  onChange={(v) => onRgbChange('g', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={rgbFill('g')}
                />
                <ColorSlider
                  label={'B'}
                  group='rgb'
                  value={rgb.b}
                  max={255}
                  suffix={''}
                  gradient={blendTracks ? blueGradient(rgb.r, rgb.g) : blueChannelGradient}
                  onChange={(v) => onRgbChange('b', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={rgbFill('b')}
                />
              </div>
            )}

            {groups.includes('HSB') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3" role="group" aria-label="HSB">
                <ColorSlider
                  label={'H'}
                  group='hsb'
                  value={Math.round(hsb.h)}
                  max={360}
                  suffix={'°'}
                  wrap
                  gradient={hueGradient(blendTracks ? hsb.s : 100, blendTracks ? hsb.b : 100, colorSpace)}
                  onChange={(v) => onHsbChange({ h: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hsbToRgb(hsb.h, 100, 100))}
                />
                <ColorSlider
                  label={'S'}
                  group='hsb'
                  value={Math.round(hsb.s)}
                  max={100}
                  suffix={'%'}
                  gradient={saturationGradient(hsb.h, blendTracks ? hsb.b : 100, colorSpace)}
                  onChange={(v) => onHsbChange({ s: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hsbToRgb(hsb.h, hsb.s, 100))}
                />
                <ColorSlider
                  label={'B'}
                  group='hsb'
                  value={Math.round(hsb.b)}
                  max={100}
                  suffix={'%'}
                  gradient={brightnessGradient(hsb.h, blendTracks ? hsb.s : 100, colorSpace)}
                  onChange={(v) => onHsbChange({ b: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hsbToRgb(hsb.h, 100, hsb.b))}
                />
              </div>
            )}

            {groups.includes('HSL') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3" role="group" aria-label="HSL">
                <ColorSlider
                  label={'H'}
                  group='hsl'
                  value={Math.round(hsl.h)}
                  max={360}
                  suffix={'°'}
                  wrap
                  gradient={hslHueGradient(blendTracks ? hsl.s : 100, blendTracks ? hsl.l : 50, colorSpace)}
                  onChange={(v) => onHslChange('h', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hslToRgb(hsl.h, 100, 50))}
                />
                <ColorSlider
                  label={'S'}
                  group='hsl'
                  value={Math.round(hsl.s)}
                  max={100}
                  suffix={'%'}
                  gradient={hslSaturationGradient(hsl.h, blendTracks ? hsl.l : 50, colorSpace)}
                  onChange={(v) => onHslChange('s', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hslToRgb(hsl.h, hsl.s, 50))}
                />
                <ColorSlider
                  label={'L'}
                  group='hsl'
                  value={Math.round(hsl.l)}
                  max={100}
                  suffix={'%'}
                  gradient={lightnessGradient(hsl.h, blendTracks ? hsl.s : 100, colorSpace)}
                  onChange={(v) => onHslChange('l', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={blendTracks ? hex : asHex(hslToRgb(hsl.h, 100, hsl.l))}
                />
              </div>
            )}

            {groups.includes('A') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3" role="group" aria-label="Alpha">
                <ColorSlider
                  label={'A'}
                  group='alpha'
                  value={alpha}
                  max={100}
                  suffix={'%'}
                  gradient={alphaGradient(rgb)}
                  onChange={onAlphaChange}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={alphaSwatch(rgb, alpha)}
                />
              </div>
            )}
            </div>
          </div>
        }
        />
      </div>
      <ScrollIndicator />
      <ResizeEdge side="w" />
      <ResizeEdge side="e" />
      <ResizeEdge side="s" />
      <ResizeEdge side="sw" />
      <ResizeEdge side="se" />
    </>
  );
}

/**
 * Content height per pixel of panel width. The hexagon holds its ratio, so the
 * content gets taller as the panel gets wider.
 *
 * Re-measured 2026-08-18 against the built ui.html: 651/690/767/844 for widths
 * 300/340/420/500, a straight line at ~0.96. The previous figure (0.887, from
 * 453/524/595/701) had gone stale the same way DEFAULT_H in code.js had - the
 * app grew after it was taken and nothing here re-derives itself.
 *
 * Used open-loop: the south edge divides its pointer travel by this to get the
 * width that produces that height change, anchored to the width at
 * pointerdown. It was previously the gain of a feedback loop, which tolerated
 * a wrong value by converging over several frames - at the cost of visible
 * hunting whenever a resize had not landed before the next frame measured.
 *
 * Open-loop cannot hunt, but it also cannot self-correct: an inaccurate slope
 * here now shows as the bottom edge drifting away from the cursor over a long
 * drag rather than as jitter. So re-measure it when the layout changes, rather
 * than guessing.
 */
const HEIGHT_PER_WIDTH = 0.96;

/**
 * Invisible resize strips - no widget, just the cursor, the way a normal app
 * panel edge behaves.
 *
 * East and west set the width directly. South sets it indirectly: height is
 * always the content's, and the content's height is a function of the width, so
 * dragging the bottom edge means solving that function backwards. Each frame
 * nudges the width by the remaining height error rather than predicting a
 * width outright, so the loop converges on the pointer even if the gain is off.
 *
 * The west edge also moves the window; that lives in the sandbox, which probes
 * whether it can position accurately before trying.
 */
type Side = 'w' | 'e' | 's' | 'sw' | 'se';

function ResizeEdge({ side }: { side: Side }) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const originX = e.screenX;
    const originY = e.screenY;
    // The width at pointerdown is the only thing read from the window all
    // drag: every edge is a delta from here. Height is not needed at all now
    // that south is open-loop.
    const startW = window.innerWidth;
    const fromLeft = side === 'w' || side === 'sw';

    /*
     * One update per animation frame, from the newest pointer position, and
     * every edge computes its width open-loop from the pointer delta alone.
     *
     * South used to solve backwards through a feedback loop - "nudge the width
     * by whatever height error is left" - reading window.innerWidth and
     * innerHeight each time. Those only change once a resize has round-tripped
     * to the sandbox and back, which is not guaranteed within one frame, so a
     * frame that ran before the previous resize landed measured the same error
     * again and asked for the same correction again. The window overshot and
     * hunted. rAF throttling alone reduced that but could not fix it: the loop
     * needs the resize to have *landed*, not merely a frame to have passed.
     *
     * Open-loop removes the question. Height is a straight line in width
     * (HEIGHT_PER_WIDTH), so the width that produces a given height change is
     * just the height change divided by the slope. Anchoring to the width at
     * pointerdown means the content's own height at that moment is the
     * intercept, so collapsed sections need no special handling - it drops out.
     * Nothing is read back mid-drag, so nothing can lag, and south now behaves
     * exactly like east and west: one subtraction from the start value.
     */
    let latest: { x: number; y: number } | null = null;
    let frame = 0;

    const flush = () => {
      frame = 0;
      if (!latest) return;
      let width: number;
      if (side === 's') {
        // Pointer travel is the height change we want; divide by the slope to
        // get the width that produces it.
        width = startW + (latest.y - originY) / HEIGHT_PER_WIDTH;
      } else {
        // Corners included: horizontal only, same as their edge. Height follows
        // width anyway, so a diagonal drag still grows the panel in both
        // directions - the corner cursor is honest without needing to fold the
        // vertical delta in as a second driver for the same one output.
        const dx = latest.x - originX;
        width = fromLeft ? startW - dx : startW + dx;
      }
      post({ type: 'resizeWidth', width: Math.round(width), fromLeft });
    };

    const move = (ev: PointerEvent) => {
      latest = { x: ev.screenX, y: ev.screenY };
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const up = (ev: PointerEvent) => {
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      // Land on the last position rather than dropping whatever arrived after
      // the final frame, then close the drag.
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      flush();
      post({ type: 'resizeEnd' });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  return <div className={`figma-edge figma-edge-${side}`} onPointerDown={onPointerDown} />;
}

/**
 * Without this a startup throw unmounts the tree and the panel is just black,
 * which is indistinguishable from "the plugin didn't load" and impossible to
 * debug without opening Figma's console. React surfaces effect errors here too.
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; retried: boolean }
> {
  state = { error: null as Error | null, retried: false };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Color Taylor plugin crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    // Retry is worth offering once and only once.
    //
    // Clearing the error re-renders the tree from scratch, which fixes a
    // transient fault and does nothing at all for a persistent one - the same
    // render throws again and lands straight back here. Offering the button a
    // second time would just look like the plugin was stuck in a loop, so after
    // a retry that did not hold, it goes away and the copy says the thing that
    // always works.
    const canRetry = !this.state.retried;

    // Figma's review guidelines rule out using developer error messages to
    // communicate with end users. The message and stack still go to
    // console.error above, which is where anyone debugging this will look.
    return (
      <div className="figma-error" role="alert">
        <p className="figma-error-title">The color picker stopped responding.</p>
        <p className="figma-error-body">
          Your saved and recent colors are safe.{' '}
          {canRetry ? 'Try again, or close and reopen the plugin.' : 'Close and reopen the plugin to continue.'}
        </p>
        {canRetry && (
          <button type="button" onClick={() => this.setState({ error: null, retried: true })}>
            Try again
          </button>
        )}
      </div>
    );
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// A throw before mount never reaches the ErrorBoundary, so the panel would sit
// blank. Same treatment: the detail goes to the console, the panel gets prose.
// There is no retry here - nothing has mounted to retry into.
window.addEventListener('error', (e) => {
  console.error('Color Taylor plugin failed to start:', e.error ?? e.message);
  if (document.querySelector('.figma-error')) return;
  const box = document.createElement('div');
  box.className = 'figma-error';
  box.setAttribute('role', 'alert');
  const title = document.createElement('p');
  title.className = 'figma-error-title';
  title.textContent = 'The color picker could not start.';
  const body = document.createElement('p');
  body.className = 'figma-error-body';
  body.textContent = 'Close and reopen the plugin. If it keeps happening, reinstall it.';
  box.append(title, body);
  document.body.appendChild(box);
});

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <PluginApp />
    </ErrorBoundary>
  </StrictMode>,
);
