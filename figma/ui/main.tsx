/**
 * Figma plugin UI.
 *
 * Deliberately thin. It renders the app's real <ColorHexagon>, so anything you
 * change in src/components/ColorHexagon.tsx shows up here on the next
 * `bun run build:figma` - there is no second copy of the picker.
 *
 * What this file owns, and nothing more:
 *   1. The colour state ColorHexagon expects as a controlled component,
 *      mirroring the HSB-canonical + rgbOverride pattern from ColorPicker.
 *   2. The bridge to the plugin sandbox: push every colour change to the
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
  rgbToHsl,
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
  type ColorSpace,
} from '../../src/utils/sliderGradients';
import { HSB_TWEEN_MS, hsbAtProgress } from '../../src/utils/colorTween';
import ColorSlider from '../../src/components/ColorSlider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Ban, Brush, PaintBucket } from 'lucide-react';
import ColorHexagon from '../../src/components/ColorHexagon';
// figma.css imports the app's index.css, so this is the only stylesheet entry.
import './figma.css';

function post(msg: Record<string, unknown>) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

type PaintTarget = 'fill' | 'stroke' | 'none';

/**
 * Which slider blocks are on show. Multi-select rather than tabs: these are
 * four views of one colour, and comparing two models side by side is the point
 * of the app - a tab strip could only ever show one at a time.
 */
const SLIDER_GROUPS = ['RGB', 'HSB', 'HSL', 'A'] as const;
type SliderGroup = (typeof SLIDER_GROUPS)[number];

/** How long after the last sign of an edit the frame poll keeps running. */
const HOT_MS = 2000;

const CHECKER =
  'repeating-conic-gradient(rgba(128,128,128,.45) 0% 25%, transparent 0% 50%) 0 0/10px 10px';

/** Checkerboard under a transparent-to-colour ramp, so alpha reads as alpha. */
function alphaGradient(rgb: RGB) {
  return `linear-gradient(to right, transparent, rgb(${rgb.r},${rgb.g},${rgb.b})),${CHECKER}`;
}

/**
 * The ring handle's core: the colour at its actual alpha over a checkerboard,
 * so the handle itself shows the transparency rather than only marking where
 * on the track you are. A flat swatch would look opaque at every value.
 */
function alphaSwatch(rgb: RGB, alpha: number) {
  const c = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha / 100})`;
  return `linear-gradient(${c},${c}),${CHECKER}`;
}

function PluginApp() {
  const [hsb, setHsb] = useState<HSB>({ h: 0, s: 100, b: 100 });
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [selectionCount, setSelectionCount] = useState(0);
  const [alpha, setAlpha] = useState(100);
  const [target, setTarget] = useState<PaintTarget>('fill');

  // hsbToRgb(rgbToHsb(rgb)) is lossy at low saturation/brightness, so an exact
  // RGB coming from outside (a selection, a hex field) is stashed here and read
  // in preference to the derived value. Same contract as ColorPicker: any
  // HSB-driven interaction must null it first or stale RGB leaks through.
  const rgbOverride = useRef<RGB | null>(null);
  // The hex we just adopted *from* a selection. Without this, selecting a layer
  // seeds the picker from its fill, which changes `hex`, which fires the
  // live-apply effect and repaints the layer with the colour it already had -
  // a wasted write and a junk undo entry.
  // Set by the picker's own change handlers. Painting keys off this rather than
  // off the colour changing, because the colour also changes when we seed from
  // a selection - and applying then meant that selecting or pasting a layer
  // silently repainted it with whatever was already in the picker.
  const userEditRef = useRef(false);
  // Read inside the apply effect so switching target does not itself trigger a
  // paint - that is a mode change, and it re-seeds from the new target instead.
  const targetRef = useRef<PaintTarget>('fill');

  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  // Reading rgbOverride.current during render is intentional - same pattern as
  // ColorPicker ("HSB is canonical, RGB has an override ref" in CLAUDE.md).
  // eslint-disable-next-line react-hooks/refs
  const rgb = rgbOverride.current || rgbFromHsb;
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Live-apply. No button: picking a colour *is* the action - but only picking.
  const isHsl = blMode === 'lightness';

  // Opens on what the panel showed before this control existed: one HS* block
  // plus alpha. Which of HSB/HSL follows the Bright/Light switch, so the
  // sliders agree with the hexagon on first paint.
  const [groups, setGroups] = useState<SliderGroup[]>(() => [isHsl ? 'HSL' : 'HSB', 'A']);
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
  // The last-sent guard is a second line of defence against that. Figma clamps
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
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
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
    let queued: { count: number; hex?: string; opacity?: number } | null = null;
    let frame = 0;
    const flush = () => {
      frame = 0;
      const msg = queued;
      queued = null;
      if (msg) applySelection(msg);
    };
    const applySelection = (msg: { count: number; hex?: string; opacity?: number }) => {
        setSelectionCount(msg.count);
        if (msg.hex) {
          const next = hexToRgb(msg.hex);
          if (next) {
            // Snap. A tween left running from a marker click would keep writing
            // its own frames over the incoming value and read as stutter.
            if (animRef.current !== null) {
              cancelAnimationFrame(animRef.current);
              animRef.current = null;
            }
            rgbOverride.current = next;
            setAlpha(Math.round((msg.opacity ?? 1) * 100));
            setHsb(rgbToHsb(next.r, next.g, next.b));
          }
        }
    };
    /**
     * The frame clock for following Figma's own colour picker.
     *
     * The sandbox cannot run this: it is a JavaScript VM with no display, so
     * it has no setInterval and no frames to hang a loop on. This iframe is a
     * real browser context, so the asking happens here, on
     * requestAnimationFrame - the display's actual refresh rate rather than a
     * number someone picked. On a 120Hz screen it follows at 120Hz.
     *
     * It runs only while an edit is in flight. The sandbox says when one
     * starts (documentchange is late, but it is a reliable "something is
     * happening"), and every colour that comes back extends the window; a
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
      const msg = event.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === 'wake') {
        wake();
        return;
      }
      if (msg.type !== 'selection') return;
      // An incoming colour means the edit is still going: keep asking.
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
  }, []);

  const onAlphaChange = useCallback((v: number) => {
    userEditRef.current = true;
    setAlpha(v);
  }, []);

  const onHsbChange = useCallback((next: Partial<HSB>) => {
    userEditRef.current = true;
    rgbOverride.current = null;
    setHsb((prev) => ({ ...prev, ...next }));
  }, []);

  const onHueChange = useCallback((h: number) => {
    userEditRef.current = true;
    rgbOverride.current = null;
    setHsb((prev) => ({ ...prev, h }));
  }, []);

  const onRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    userEditRef.current = true;
    setHsb((prev) => {
      const current = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const next = { ...current, [channel]: value };
      rgbOverride.current = next;
      return rgbToHsb(next.r, next.g, next.b);
    });
  }, []);

  // Clicking the 100/50/0 bar markers or a vertex letter goes through
  // onAnimateToHsb. Without it ColorHexagon early-returns and those are dead
  // controls. Duration, easing, hue wrap and rounding come from
  // utils/colorTween - the same module ColorPicker's animateToHsb uses - so
  // the plugin cannot drift from the app's feel.
  const animRef = useRef<number | null>(null);
  const onAnimateToHsb = useCallback((target: HSB) => {
    userEditRef.current = true;
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    rgbOverride.current = null;
    setHsb((from) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / HSB_TWEEN_MS);
        userEditRef.current = true;
        setHsb(hsbAtProgress(from, target, t));
        if (t < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
          // Close the undo group here too: on click-to-animate the pointerup
          // commit already fired before the tween wrote anything.
          post({ type: 'commit' });
        }
      };
      animRef.current = requestAnimationFrame(step);
      return from;
    });
  }, []);

  useEffect(() => () => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
  }, []);

  const onHslChange = useCallback((channel: 'h' | 's' | 'l', value: number) => {
    userEditRef.current = true;
    rgbOverride.current = null;
    setHsb((prev) => {
      const current = hsbToRgb(prev.h, prev.s, prev.b);
      const currentHsl = rgbToHsl(current.r, current.g, current.b);
      const nextHsl = { ...currentHsl, [channel]: value };
      const nextRgb = hslToRgb(nextHsl.h, nextHsl.s, nextHsl.l);
      return rgbToHsb(nextRgb.r, nextRgb.g, nextRgb.b);
    });
  }, []);

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
        iconActions
        bare
        collapsedSections
        sectionVariant="flush"
        blBar={false}
        blConnector={false}
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
                // render later, so a colour change in the same tick would still
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
            <ToggleGroup
              multiple
              value={groups}
              onValueChange={(v) => setGroups(v as SliderGroup[])}
              className="self-start h-7"
            >
              {SLIDER_GROUPS.map((g) => (
                <ToggleGroupItem key={g} value={g} className="px-2.5 text-xs">
                  {g}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/*
              A rule between blocks, drawn by the block below rather than as a
              separate element: the blocks are conditional, so a standalone <hr>
              would need to know which sibling is currently first. :first-child
              already knows - React renders nothing at all for a block that is
              off, so the first one on screen is the first one in the DOM.

              One block per model, never a blend of two. HSL's hue and saturation
              are not HSB's - the same colour has a different S in each - so a
              block reads and writes entirely within its own model. Showing both
              at once is fine, and is why this is a toggle group: each stays
              self-consistent, and edits round-trip through the shared colour.
            */}
            <div className="flex flex-col">
            {groups.includes('RGB') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3">
                <ColorSlider
                  label={'R'}
                  value={rgb.r}
                  max={255}
                  suffix={''}
                  gradient={redGradient(rgb.g, rgb.b)}
                  onChange={(v) => onRgbChange('r', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'G'}
                  value={rgb.g}
                  max={255}
                  suffix={''}
                  gradient={greenGradient(rgb.r, rgb.b)}
                  onChange={(v) => onRgbChange('g', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'B'}
                  value={rgb.b}
                  max={255}
                  suffix={''}
                  gradient={blueGradient(rgb.r, rgb.g)}
                  onChange={(v) => onRgbChange('b', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
              </div>
            )}

            {groups.includes('HSB') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3">
                <ColorSlider
                  label={'H'}
                  value={Math.round(hsb.h)}
                  max={360}
                  suffix={'°'}
                  wrap
                  gradient={hueGradient(hsb.s, hsb.b, colorSpace)}
                  onChange={(v) => onHsbChange({ h: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'S'}
                  value={Math.round(hsb.s)}
                  max={100}
                  suffix={'%'}
                  gradient={saturationGradient(hsb.h, hsb.b, colorSpace)}
                  onChange={(v) => onHsbChange({ s: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'B'}
                  value={Math.round(hsb.b)}
                  max={100}
                  suffix={'%'}
                  gradient={brightnessGradient(hsb.h, hsb.s, colorSpace)}
                  onChange={(v) => onHsbChange({ b: v })}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
              </div>
            )}

            {groups.includes('HSL') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3">
                <ColorSlider
                  label={'H'}
                  value={Math.round(hsl.h)}
                  max={360}
                  suffix={'°'}
                  wrap
                  gradient={hslHueGradient(hsl.s, hsl.l, colorSpace)}
                  onChange={(v) => onHslChange('h', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'S'}
                  value={Math.round(hsl.s)}
                  max={100}
                  suffix={'%'}
                  gradient={hslSaturationGradient(hsl.h, hsl.l, colorSpace)}
                  onChange={(v) => onHslChange('s', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
                <ColorSlider
                  label={'L'}
                  value={Math.round(hsl.l)}
                  max={100}
                  suffix={'%'}
                  gradient={lightnessGradient(hsl.h, hsl.s, colorSpace)}
                  onChange={(v) => onHslChange('l', v)}
                  stepper="value"
                  round
                  handle="ring"
                  handleFill={hex}
                />
              </div>
            )}

            {groups.includes('A') && (
              <div className="flex flex-col gap-1 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3">
                <ColorSlider
                  label={'A'}
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
 * content gets taller as the panel gets wider - measured at 453/524/595/701 for
 * widths 340/420/500/620, i.e. a straight line at ~0.887.
 *
 * Only used as the gain of a feedback loop, never to predict an absolute size.
 * At the measured value the loop lands on target in a single frame; it still
 * converges anywhere from roughly 0.5x to 2x that, just over a few frames.
 * Below about half it oscillates instead - so if the layout changes enough to
 * move this slope, re-measure it rather than guess.
 */
const HEIGHT_PER_WIDTH = 0.887;

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
    const startW = window.innerWidth;
    const startH = window.innerHeight;
    const fromLeft = side === 'w' || side === 'sw';

    const move = (ev: PointerEvent) => {
      let width: number;
      if (side === 's') {
        const targetH = startH + (ev.screenY - originY);
        width = window.innerWidth + (targetH - window.innerHeight) / HEIGHT_PER_WIDTH;
      } else {
        // Corners included: horizontal only, same as their edge. Height follows
        // width anyway, so a diagonal drag still grows the panel in both
        // directions - the corner cursor is honest without needing to fold the
        // vertical delta in as a second driver for the same one output.
        const dx = ev.screenX - originX;
        width = fromLeft ? startW - dx : startW + dx;
      }
      post({ type: 'resizeWidth', width: Math.round(width), fromLeft });
    };
    const up = (ev: PointerEvent) => {
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
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
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Color Taylor plugin crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <pre className="figma-error">
        {this.state.error.message}
        {'\n\n'}
        {this.state.error.stack?.split('\n').slice(1, 6).join('\n')}
      </pre>
    );
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Anything that escapes React entirely (a throw before mount) still needs to be
// readable in the panel.
window.addEventListener('error', (e) => {
  if (document.querySelector('.figma-error')) return;
  const pre = document.createElement('pre');
  pre.className = 'figma-error';
  pre.textContent = String(e.message);
  document.body.appendChild(pre);
});

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <PluginApp />
    </ErrorBoundary>
  </StrictMode>,
);
