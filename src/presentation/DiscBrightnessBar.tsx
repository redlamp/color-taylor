import { useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { hsbToRgb, rgbToHex } from '../utils/colorConversions';

/**
 * The deck's brightness bar, shared by the wheel and the hexagon.
 *
 * Both shapes used to bring their own - HsbCircle drew one, ColorHexagon has
 * one built in - which made them different controls at different sizes on
 * consecutive slides. Worse, ColorHexagon's sits inside its own box, so it ate
 * into the width available for the hexagon and left the ring smaller than the
 * wheel it is meant to be corrected into.
 *
 * Lifted out here, the shapes are only shapes, they get the same width to fill,
 * and the control does not change under the reader when the slide does.
 */
export const BAR_W = 20;
export const BAR_GAP = 16;
export const BAR_TICKS = 4;
/** Total horizontal cost of the bar, for whoever is budgeting the width. */
export const BAR_CHROME = BAR_GAP + BAR_W + BAR_TICKS;

const ARROW = 8;

interface Props {
  hue: number;
  saturation: number;
  brightness: number;
  height: number;
  onChange: (brightness: number) => void;
}

export default function DiscBrightnessBar({ hue, saturation, brightness, height, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);

  const fullSat = hsbToRgb(hue, saturation, 100);
  const fullSatHex = rgbToHex(fullSat.r, fullSat.g, fullSat.b);
  const arrowY = (1 - brightness / 100) * height;

  const set = useCallback((clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const y = (clientY - rect.top) * (height / rect.height);
    onChange(Math.round(Math.max(0, Math.min(100, (1 - y / height) * 100))));
  }, [height, onChange]);

  // Window-level, so a drag that leaves the 20px-wide track still tracks the
  // pointer rather than stopping the moment it slips sideways.
  useEffect(() => {
    const onMove = (e: PointerEvent) => { if (dragging.current) set(e.clientY); };
    const stop = () => { dragging.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [set]);

  const start = (e: ReactPointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    set(e.clientY);
  };

  return (
    <svg
      ref={svgRef}
      width={ARROW + 2 + BAR_W + BAR_TICKS}
      height={height}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="disc-b-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fullSatHex} />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>

      <rect
        x={ARROW + 2} y={0} width={BAR_W} height={height}
        fill="url(#disc-b-gradient)"
        stroke="rgba(255,255,255,0.1)" strokeWidth={1}
        style={{ cursor: 'pointer' }}
        onPointerDown={start}
      />

      {/* Points at the track from outside it, so it never covers the gradient. */}
      <polygon
        points={`${ARROW},${arrowY} ${0},${arrowY - 5} ${0},${arrowY + 5}`}
        fill="white"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))', pointerEvents: 'none' }}
      />

      {[0, height / 2, height].map((y, i) => (
        <line
          key={i}
          x1={ARROW + 2 + BAR_W} y1={y} x2={ARROW + 2 + BAR_W + BAR_TICKS} y2={y}
          stroke="rgba(255,255,255,0.4)" strokeWidth={1}
        />
      ))}
    </svg>
  );
}
