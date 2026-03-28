import { useRef, useEffect, useCallback, useState } from 'react';
import { hsbToRgb, rgbToHex } from '../utils/colorConversions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 160;
const SQRT3_2 = Math.sqrt(3) / 2;
const PI = Math.PI;

const DIRS = {
  r: { x: 1, y: 0 },
  g: { x: -0.5, y: -SQRT3_2 },
  b: { x: -0.5, y: SQRT3_2 },
};

function hexEdgeDist(angle, r) {
  let a = ((angle % (2 * PI)) + 2 * PI) % (2 * PI);
  const sectorAngle = a % (PI / 3);
  return (r * SQRT3_2) / Math.cos(sectorAngle - PI / 6);
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * (PI / 3);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  }).join(' ');
}

function colorAtPoint(px, py, brightness) {
  const dx = px - CENTER;
  const dy = py - CENTER;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx);
  const edgeDist = hexEdgeDist(angle, RADIUS);
  let h = (angle * 180) / PI;
  if (h < 0) h += 360;
  const s = Math.min((dist / edgeDist) * 100, 100);
  return hsbToRgb(h, s, brightness);
}

function getOrder(mode, rgb) {
  const channels = [
    { key: 'r', value: rgb.r },
    { key: 'g', value: rgb.g },
    { key: 'b', value: rgb.b },
  ];
  if (mode === 'asc') {
    return channels.sort((a, b) => a.value - b.value).map((c) => c.key);
  }
  if (mode === 'desc') {
    return channels.sort((a, b) => b.value - a.value).map((c) => c.key);
  }
  return ['r', 'g', 'b'];
}

export default function ColorHexagon({ rgb, hue, brightness, saturation, onHueChange }) {
  const [vectorMode, setVectorMode] = useState('rgb');
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const draggingHue = useRef(false);

  const hueFromMouse = useCallback((e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - CENTER;
    const dy = my - CENTER;
    let angle = Math.atan2(-dy, dx) * (180 / PI);
    if (angle < 0) angle += 360;
    onHueChange(Math.round(angle));
  }, [onHueChange]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (draggingHue.current) hueFromMouse(e);
    };
    const onMouseUp = () => {
      draggingHue.current = false;
    };
    const onMouseLeave = () => {
      draggingHue.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [hueFromMouse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(SIZE, SIZE);
    const data = imageData.data;

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const dx = px - CENTER;
        const dy = py - CENTER;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > RADIUS) continue;

        const angle = Math.atan2(-dy, dx);
        const edgeDist = hexEdgeDist(angle, RADIUS);

        if (dist > edgeDist) continue;

        let h = (angle * 180) / PI;
        if (h < 0) h += 360;
        const s = (dist / edgeDist) * 100;
        const color = hsbToRgb(h, s, brightness);

        const idx = (py * SIZE + px) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [brightness]);

  // Build vector chain based on mode
  const order = getOrder(vectorMode, rgb);
  const scale = RADIUS / 255;
  const p0 = { x: CENTER, y: CENTER };
  const points = [p0];
  const dotNames = ['origin'];
  let current = p0;
  for (const ch of order) {
    const dir = DIRS[ch];
    const value = rgb[ch];
    current = {
      x: current.x + value * scale * dir.x,
      y: current.y + value * scale * dir.y,
    };
    points.push(current);
    dotNames.push(ch === 'r' ? 'red' : ch === 'g' ? 'green' : 'blue');
  }

  const dotColors = points.map((p) => {
    const c = colorAtPoint(p.x, p.y, brightness);
    return rgbToHex(c.r, c.g, c.b);
  });

  const hueRad = (hue * PI) / 180;
  const hueEnd = {
    x: CENTER + RADIUS * Math.cos(hueRad),
    y: CENTER - RADIUS * Math.sin(hueRad),
  };

  const labelOffset = RADIUS + 28;
  const hueLabel = {
    x: CENTER + labelOffset * Math.cos(hueRad),
    y: CENTER - labelOffset * Math.sin(hueRad),
  };

  const showHueLine = saturation > 0;

  const handleHueDragStart = (e) => {
    e.preventDefault();
    draggingHue.current = true;
    hueFromMouse(e);
  };

  return (
    <div id="color-hexagon" className="flex flex-col items-center gap-1">
      <Tabs value={vectorMode} onValueChange={setVectorMode}>
        <TabsList>
          <TabsTrigger value="rgb" className="w-16">RGB</TabsTrigger>
          <TabsTrigger value="desc" className="w-16">
            <svg width="14" height="12" viewBox="0 0 14 12" className="fill-current">
              <polygon points="0,0 0,12 14,12" />
            </svg>
          </TabsTrigger>
          <TabsTrigger value="asc" className="w-16">
            <svg width="14" height="12" viewBox="0 0 14 12" className="fill-current">
              <polygon points="0,12 14,12 14,0" />
            </svg>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <canvas
          id="hex-canvas"
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 rounded-sm"
        />
        <svg
          id="hex-svg"
          ref={svgRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0"
        >
          {/* Circumscribing circle */}
          <circle
            id="hex-circumscribe"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
          />

          {/* Hexagon outline */}
          <polygon
            id="hex-outline"
            points={hexPoints(CENTER, CENTER, RADIUS)}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />

          {/* Major color labels at vertices */}
          {[
            { label: 'R', deg: 0, color: '#ff0000' },
            { label: 'Y', deg: 60, color: '#ffff00' },
            { label: 'G', deg: 120, color: '#00ff00' },
            { label: 'C', deg: 180, color: '#00ffff' },
            { label: 'B', deg: 240, color: '#0000ff' },
            { label: 'M', deg: 300, color: '#ff00ff' },
          ].map(({ label, deg, color }) => {
            const rad = (deg * PI) / 180;
            const offset = RADIUS + 16;
            const cx = CENTER + offset * Math.cos(rad);
            const cy = CENTER - offset * Math.sin(rad);
            return (
              <text
                key={label}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-bold select-none pointer-events-none"
                fill={color}
              >
                {label}
              </text>
            );
          })}

          {/* Hue dotted line from center to circle edge + draggable label */}
          {showHueLine && (
            <>
              <line
                id="hue-line"
                x1={CENTER}
                y1={CENTER}
                x2={hueEnd.x}
                y2={hueEnd.y}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* Draggable hue handle pill */}
              <g
                id="hue-handle"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleHueDragStart}
              >
                <rect
                  x={hueLabel.x - 24}
                  y={hueLabel.y - 14}
                  width={48}
                  height={28}
                  rx={14}
                  fill={rgbToHex(...Object.values(hsbToRgb(hue, 100, 100)))}
                  stroke="var(--background)"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
                />
                <text
                  id="hue-label"
                  x={hueLabel.x}
                  y={hueLabel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={hue > 30 && hue < 200 ? '#000' : '#fff'}
                  className="text-sm font-mono font-semibold select-none pointer-events-none"
                >
                  {hue}°
                </text>
              </g>
            </>
          )}

          {/* RGB vector lines */}
          <polyline
            id="rgb-vectors"
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* Dots colored to match hex underneath, white border */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <circle
                key={i}
                id={`rgb-dot-${dotNames[i]}`}
                cx={p.x}
                cy={p.y}
                r={isLast ? 8 : 5}
                fill={dotColors[i]}
                stroke="white"
                strokeWidth={2}
                style={isLast ? {
                  filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3)) drop-shadow(inset 0 0 0 1px rgba(0,0,0,0.3))',
                } : undefined}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
