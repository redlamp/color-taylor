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
import ColorHexagon from '../../src/components/ColorHexagon';
// figma.css imports the app's index.css, so this is the only stylesheet entry.
import './figma.css';

function post(msg: Record<string, unknown>) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

function PluginApp() {
  const [hsb, setHsb] = useState<HSB>({ h: 0, s: 100, b: 100 });
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [selectionCount, setSelectionCount] = useState(0);

  // hsbToRgb(rgbToHsb(rgb)) is lossy at low saturation/brightness, so an exact
  // RGB coming from outside (a selection, a hex field) is stashed here and read
  // in preference to the derived value. Same contract as ColorPicker: any
  // HSB-driven interaction must null it first or stale RGB leaks through.
  const rgbOverride = useRef<RGB | null>(null);
  // The hex we just adopted *from* a selection. Without this, selecting a layer
  // seeds the picker from its fill, which changes `hex`, which fires the
  // live-apply effect and repaints the layer with the colour it already had -
  // a wasted write and a junk undo entry.
  const seededHexRef = useRef<string | null>(null);

  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  // Reading rgbOverride.current during render is intentional - same pattern as
  // ColorPicker ("HSB is canonical, RGB has an override ref" in CLAUDE.md).
  // eslint-disable-next-line react-hooks/refs
  const rgb = rgbOverride.current || rgbFromHsb;
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  // Live-apply. No button: picking a colour *is* the action.
  useEffect(() => {
    if (selectionCount === 0) return;
    if (seededHexRef.current === hex) {
      seededHexRef.current = null;
      return;
    }
    post({ type: 'apply', hex });
  }, [hex, selectionCount]);

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
            seededHexRef.current = rgbToHex(next.r, next.g, next.b);
            rgbOverride.current = next;
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
    <div className="figma-root">
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
        muted
      />
      <p className="figma-status">
        {selectionCount === 0
          ? 'Select a layer to paint it'
          : `Painting ${selectionCount} layer${selectionCount === 1 ? '' : 's'}`}
      </p>
      <ResizeGrip />
    </div>
  );
}

/**
 * The sandbox owns the window size, so stream drag deltas to it. Without this
 * the panel is a fixed rectangle and the hexagon can never grow.
 */
function ResizeGrip() {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) =>
      post({ type: 'resize', width: Math.round(ev.clientX + 8), height: Math.round(ev.clientY + 8) });
    const up = (ev: PointerEvent) => {
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };
  return <div className="figma-grip" title="Resize" onPointerDown={onPointerDown} />;
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
