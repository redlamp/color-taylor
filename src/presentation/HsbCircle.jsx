import { useMemo, useRef, useCallback, useEffect } from 'react';
import { hsbToRgb, rgbToHex } from '../utils/colorConversions';

// HSB color wheel with brightness bar.
// Supports shape='circle' or shape='hexagon' with CSS clip-path morph.
// Red faces east (0° = right). Hue increases counter-clockwise.
// Hexagon mode shows linked RGB chain segments like the main app.

const PI = Math.PI;
const SQRT3_2 = Math.sqrt(3) / 2;

// RGB channel directions on the hex grid (same as main app)
const DIRS = {
  r: { x: 1, y: 0 },
  g: { x: -0.5, y: -SQRT3_2 },
  b: { x: -0.5, y: SQRT3_2 },
};

// 48-point polygon for smooth circle and clean hexagon morph.
// Circle = 48 evenly spaced points on circumference (nearly perfect circle).
// Hexagon = 48 points along 6 straight edges (8 per edge).
const N_PTS = 48;
function makeClipPath(shape) {
  const pts = [];
  if (shape === 'hexagon') {
    // 6 edges, 8 points per edge (48 total). Vertices at 0°,60°,120°,...
    for (let edge = 0; edge < 6; edge++) {
      const a1 = edge * 60;
      const a2 = (edge + 1) * 60;
      for (let j = 0; j < 8; j++) {
        const t = j / 8;
        const angle = (a1 + t * (a2 - a1)) * PI / 180;
        // Hex edge distance at this angle
        const sectorAngle = (angle % (PI / 3));
        const d = 50 * (SQRT3_2 / Math.cos(sectorAngle - PI / 6));
        pts.push(`${(50 + d * Math.cos(angle)).toFixed(2)}% ${(50 - d * Math.sin(angle)).toFixed(2)}%`);
      }
    }
  } else {
    for (let i = 0; i < N_PTS; i++) {
      const angle = i * (2 * PI / N_PTS);
      pts.push(`${(50 + 50 * Math.cos(angle)).toFixed(2)}% ${(50 - 50 * Math.sin(angle)).toFixed(2)}%`);
    }
  }
  return `polygon(${pts.join(', ')})`;
}

const CIRCLE_CLIP = makeClipPath('circle');
const HEX_CLIP = makeClipPath('hexagon');

function hexEdgeDist(angle) {
  let a = ((angle % (2 * PI)) + 2 * PI) % (2 * PI);
  const sectorAngle = a % (PI / 3);
  return SQRT3_2 / Math.cos(sectorAngle - PI / 6);
}

export default function HsbCircle({ size = 280, hue, saturation, brightness, onHsbChange, shape = 'circle' }) {
  const barWidth = 20;
  const barGap = 16;
  const arrowSize = 8;
  const radius = size / 2;
  const totalW = size + barGap + barWidth + arrowSize + 4;
  const isHex = shape === 'hexagon';

  const svgRef = useRef(null);
  const draggingWheel = useRef(false);
  const draggingBar = useRef(false);

  const rgb = useMemo(() => hsbToRgb(hue, saturation, brightness), [hue, saturation, brightness]);
  const fullSatRgb = useMemo(() => hsbToRgb(hue, saturation, 100), [hue, saturation]);
  const fullSatHex = useMemo(() => rgbToHex(fullSatRgb.r, fullSatRgb.g, fullSatRgb.b), [fullSatRgb]);

  // Selected color dot position
  const hueRad = hue * PI / 180;
  const maxDist = isHex ? radius * hexEdgeDist(hueRad) : radius - 8;
  const dist = (saturation / 100) * maxDist;
  const dotX = radius + Math.cos(hueRad) * dist;
  const dotY = radius - Math.sin(hueRad) * dist;

  // Linked RGB chain: center → +R → +G → +B (like main app)
  const scale = radius / 255;
  const chainPoints = useMemo(() => {
    const order = ['r', 'g', 'b'];
    const pts = [{ x: radius, y: radius }]; // origin = center
    let cur = { x: radius, y: radius };
    for (const ch of order) {
      const dir = DIRS[ch];
      const value = rgb[ch];
      cur = {
        x: cur.x + value * scale * dir.x,
        y: cur.y + value * scale * dir.y,
      };
      pts.push(cur);
    }
    return pts;
  }, [rgb.r, rgb.g, rgb.b, radius, scale]);

  // Colors at each chain dot position (sample the wheel)
  const chainColors = useMemo(() => {
    return chainPoints.map(p => {
      const dx = p.x - radius;
      const dy = -(p.y - radius);
      const angle = Math.atan2(dy, dx);
      let h = angle * 180 / PI;
      if (h < 0) h += 360;
      const d = Math.sqrt(dx * dx + dy * dy);
      const maxD = isHex ? radius * hexEdgeDist(angle) : radius;
      const s = Math.min(100, (d / maxD) * 100);
      const { r, g, b } = hsbToRgb(h, s, brightness);
      return rgbToHex(r, g, b);
    });
  }, [chainPoints, brightness, radius, isHex]);

  // Brightness bar
  const barX = size + barGap;
  const barH = size;
  const arrowY = (1 - brightness / 100) * barH;

  // Mouse handling
  const svgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (totalW / rect.width),
      y: (e.clientY - rect.top) * (size / rect.height),
    };
  }, [totalW, size]);

  const handleWheelDrag = useCallback((e) => {
    const pt = svgPoint(e);
    if (!pt) return;
    const dx = pt.x - radius;
    const dy = -(pt.y - radius);
    let h = Math.atan2(dy, dx) * 180 / PI;
    if (h < 0) h += 360;
    const d = Math.sqrt(dx * dx + dy * dy);
    const maxD = isHex ? radius * hexEdgeDist(h * PI / 180) : radius - 8;
    const s = Math.min(100, (d / maxD) * 100);
    onHsbChange?.({ h: Math.round(h), s: Math.round(s) });
  }, [svgPoint, radius, isHex, onHsbChange]);

  const handleBarDrag = useCallback((e) => {
    const pt = svgPoint(e);
    if (!pt) return;
    const b = Math.round(Math.max(0, Math.min(100, (1 - pt.y / barH) * 100)));
    onHsbChange?.({ b });
  }, [svgPoint, barH, onHsbChange]);

  useEffect(() => {
    const onMove = (e) => {
      if (draggingWheel.current) handleWheelDrag(e);
      else if (draggingBar.current) handleBarDrag(e);
    };
    const onUp = () => {
      draggingWheel.current = false;
      draggingBar.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [handleWheelDrag, handleBarDrag]);

  const clipPath = isHex ? HEX_CLIP : CIRCLE_CLIP;
  const channelMeta = [
    { ch: 'r', color: '#FF4444', hoverColor: '#FF6666' },
    { ch: 'g', color: '#44DD44', hoverColor: '#66FF66' },
    { ch: 'b', color: '#6688FF', hoverColor: '#88AAFF' },
  ];

  return (
    <svg
      ref={svgRef}
      width={totalW}
      height={size}
      viewBox={`0 0 ${totalW} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="hsb-b-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fullSatHex} />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>

      {/* Hue/Saturation wheel — clip-path morphs between circle and hexagon */}
      <foreignObject x={0} y={0} width={size} height={size}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: size,
            height: size,
            clipPath,
            transition: 'clip-path 0.8s ease-in-out',
            background: `
              radial-gradient(circle, white 0%, transparent ${isHex ? '55%' : '70%'}),
              conic-gradient(from 90deg at 50% 50%,
                hsl(0,100%,50%), hsl(330,100%,50%), hsl(300,100%,50%),
                hsl(270,100%,50%), hsl(240,100%,50%), hsl(210,100%,50%),
                hsl(180,100%,50%), hsl(150,100%,50%), hsl(120,100%,50%),
                hsl(90,100%,50%), hsl(60,100%,50%), hsl(30,100%,50%),
                hsl(0,100%,50%)
              )`,
            cursor: 'crosshair',
          }}
        />
      </foreignObject>

      {/* Brightness overlay */}
      <foreignObject x={0} y={0} width={size} height={size}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: size, height: size,
            clipPath, transition: 'clip-path 0.8s ease-in-out',
            backgroundColor: 'black', opacity: 1 - brightness / 100,
            pointerEvents: 'none',
          }}
        />
      </foreignObject>

      {/* Hit area */}
      <foreignObject x={0} y={0} width={size} height={size}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: size, height: size,
            clipPath, transition: 'clip-path 0.8s ease-in-out',
            cursor: 'crosshair',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            draggingWheel.current = true;
            handleWheelDrag(e);
          }}
        />
      </foreignObject>

      {/* Linked RGB chain segments — visible in hexagon mode */}
      <g style={{ opacity: isHex ? 0.9 : 0, transition: 'opacity 0.6s ease-out 0.3s' }}>
        {channelMeta.map(({ ch, color }, i) => {
          const from = chainPoints[i];
          const to = chainPoints[i + 1];
          if (!from || !to) return null;
          const value = rgb[ch];
          const isZero = value === 0;
          const ringR = isZero ? 3.5 : 7;
          return (
            <g key={ch}>
              {/* Segment line */}
              {!isZero && (
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={3} strokeLinecap="round"
                />
              )}
              {/* Ring at endpoint — shrinks to half when value is 0 */}
              <circle
                cx={to.x} cy={to.y} r={7}
                fill={isZero ? 'transparent' : chainColors[i + 1]}
                stroke={color} strokeWidth={2.5}
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
                  transform: isZero ? 'scale(0.5)' : 'scale(1)',
                  transformOrigin: `${to.x}px ${to.y}px`,
                  transition: 'transform 0.2s ease-out, fill 0.2s ease-out',
                }}
              />
            </g>
          );
        })}
        {/* Origin dot (small, white) */}
        <circle cx={chainPoints[0].x} cy={chainPoints[0].y} r={3} fill="white" opacity={0.7} />
      </g>

      {/* Selected color dot (white ring) — visible when segments are hidden */}
      <circle
        cx={dotX} cy={dotY} r={8}
        fill="none" stroke="white" strokeWidth={2.5}
        style={{
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
          pointerEvents: 'none',
          opacity: isHex ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      {/* Brightness bar */}
      <rect
        x={barX} y={0} width={barWidth} height={barH}
        fill="url(#hsb-b-gradient)"
        stroke="rgba(255,255,255,0.1)" strokeWidth={1}
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => {
          e.preventDefault();
          draggingBar.current = true;
          handleBarDrag(e);
        }}
      />

      {/* Triangle indicator */}
      <polygon
        points={`${barX - 2},${arrowY} ${barX - arrowSize - 2},${arrowY - 5} ${barX - arrowSize - 2},${arrowY + 5}`}
        fill="white"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))', pointerEvents: 'none' }}
      />

      {/* Bar tick marks */}
      {[0, barH / 2, barH].map((y, i) => (
        <line key={i}
          x1={barX + barWidth} y1={y} x2={barX + barWidth + 4} y2={y}
          stroke="rgba(255,255,255,0.4)" strokeWidth={1}
        />
      ))}
    </svg>
  );
}
