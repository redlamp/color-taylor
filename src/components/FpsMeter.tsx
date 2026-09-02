import { useEffect, useRef } from 'react';

/**
 * A frame-rate meter, on when the URL carries `?fps` - `localhost:5173/?fps#/`.
 *
 * Deliberately not a setting: a localStorage key would need a reset-all owner
 * (see CLAUDE.md) for something only ever switched on to diagnose a drag that
 * feels slow. The query string survives the hash router and works on the
 * deployed site too.
 *
 * It must not be the thing it measures. Frame timing is kept in a ring buffer
 * and written straight into the DOM four times a second through a ref, so the
 * meter never causes a React render of its own - a meter that re-rendered the
 * app every frame would read low and be right about it.
 *
 * What it shows, over a rolling ~2 s window:
 *   fps   frames per second
 *   p95   the frame time 95% of frames beat, in ms - the number a drag feels
 *   max   the worst frame in the window
 *   >32   frames that took more than two 60 Hz ticks, i.e. visible hitches
 */
const WINDOW = 120;

export function fpsEnabled(): boolean {
  try { return new URLSearchParams(window.location.search).has('fps'); } catch { return false; }
}

export default function FpsMeter() {
  const el = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!fpsEnabled()) return;
    const dts = new Float64Array(WINDOW);
    let head = 0, filled = 0, last = performance.now(), lastPaint = last, raf = 0;

    const tick = (now: number) => {
      dts[head] = now - last;
      head = (head + 1) % WINDOW;
      if (filled < WINDOW) filled++;
      last = now;

      if (now - lastPaint > 250 && el.current) {
        lastPaint = now;
        const sorted = Array.from(dts.subarray(0, filled)).sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const fps = filled / (sum / 1000);
        const p95 = sorted[Math.min(filled - 1, Math.floor(filled * 0.95))];
        const max = sorted[filled - 1];
        const long = sorted.filter((d) => d > 32).length;
        el.current.textContent =
          `${fps.toFixed(0).padStart(3)} fps  p95 ${p95.toFixed(1).padStart(5)} ms  max ${max.toFixed(1).padStart(5)} ms  >32: ${long}`;
        el.current.style.color = fps >= 55 ? '#7CE38B' : fps >= 40 ? '#F2B94B' : '#FF6B6B';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!fpsEnabled()) return null;
  return (
    <div
      ref={el}
      aria-hidden
      style={{
        position: 'fixed', top: 6, left: 8, zIndex: 9999, pointerEvents: 'none',
        font: '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre',
        color: '#7CE38B', background: 'rgba(0,0,0,0.55)', padding: '3px 7px', borderRadius: 4,
      }}
    >
      … fps
    </div>
  );
}
