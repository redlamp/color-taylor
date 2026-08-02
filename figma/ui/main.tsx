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
import type { ColorSpace } from '../../src/utils/sliderGradients';
import { HSB_TWEEN_MS, hsbAtProgress } from '../../src/utils/colorTween';
import ColorSlider from '../../src/components/ColorSlider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ColorHexagon from '../../src/components/ColorHexagon';
// figma.css imports the app's index.css, so this is the only stylesheet entry.
import './figma.css';

function post(msg: Record<string, unknown>) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

type PaintTarget = 'fill' | 'stroke';

/** Checkerboard under a transparent-to-colour ramp, so alpha reads as alpha. */
function alphaGradient(rgb: RGB) {
  const solid = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  return (
    `linear-gradient(to right, transparent, ${solid}),` +
    'repeating-conic-gradient(rgba(128,128,128,.45) 0% 25%, transparent 0% 50%) 0 0/10px 10px'
  );
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
  const seededKeyRef = useRef<string | null>(null);
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

  // Live-apply. No button: picking a colour *is* the action.
  const paintKey = `${hex}|${alpha}`;
  useEffect(() => {
    if (selectionCount === 0) return;
    if (seededKeyRef.current === paintKey) {
      seededKeyRef.current = null;
      return;
    }
    post({ type: 'apply', hex, opacity: alpha / 100, target: targetRef.current });
  }, [paintKey, hex, alpha, selectionCount]);

  // Switching Fill/Stroke re-reads the selection through the new target rather
  // than painting it, so you see what is already there before changing it.
  useEffect(() => {
    targetRef.current = target;
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
    const onMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === 'selection') {
        setSelectionCount(msg.count);
        if (msg.hex) {
          const next = hexToRgb(msg.hex);
          if (next) {
            const a = Math.round((msg.opacity ?? 1) * 100);
            seededKeyRef.current = `${rgbToHex(next.r, next.g, next.b)}|${a}`;
            rgbOverride.current = next;
            setAlpha(a);
            setHsb(rgbToHsb(next.r, next.g, next.b));
          }
        }
      }
    };
    window.addEventListener('message', onMessage);
    post({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onHsbChange = useCallback((next: Partial<HSB>) => {
    rgbOverride.current = null;
    setHsb((prev) => ({ ...prev, ...next }));
  }, []);

  const onHueChange = useCallback((h: number) => {
    rgbOverride.current = null;
    setHsb((prev) => ({ ...prev, h }));
  }, []);

  const onRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
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
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    rgbOverride.current = null;
    setHsb((from) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / HSB_TWEEN_MS);
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
        muted
        headerLeft={
          // Mirrors the Bright/Light group opposite: tabs with a caption
          // underneath, same classes so the two read as a matched pair.
          <div className="inline-flex flex-col items-center gap-0.5">
            <Tabs value={target} onValueChange={(v) => setTarget(v as PaintTarget)}>
              <TabsList>
                <TabsTrigger value="fill" className="w-14">Fill</TabsTrigger>
                <TabsTrigger value="stroke" className="w-14">Stroke</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[10px] text-muted-foreground">
              Selected: {selectionCount}
            </span>
          </div>
        }
        belowStage={
          <div className="px-1">
            <ColorSlider
              label="A"
              value={alpha}
              max={100}
              suffix="%"
              gradient={alphaGradient(rgb)}
              onChange={setAlpha}
              hideStepper
            />
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
