import { useRef, useEffect, useCallback, useState } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex } from '../utils/colorConversions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const HEX_SIZE = 640;
const BL_BAR_WIDTH = 24;
const BL_BAR_GAP = 6;
const BL_ARROW_SIZE = 8;
const BL_LABEL_SPACE = 30;
const SIZE = HEX_SIZE + BL_BAR_GAP + BL_BAR_WIDTH + BL_ARROW_SIZE + BL_LABEL_SPACE;
const CENTER = HEX_SIZE / 2;
const RADIUS = 250;
const BL_BAR_X = HEX_SIZE + BL_BAR_GAP;
const BL_BAR_TOP = CENTER - RADIUS;
const BL_BAR_HEIGHT = RADIUS * 2;
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

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb }) {
  const [vectorMode, setVectorMode] = useState('rgb');
  const [dragMode, setDragMode] = useState('free');
  const [blMode, setBlMode] = useState('brightness'); // 'brightness' | 'lightness'
  const draggingBL = useRef(false);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;
  const draggingHue = useRef(false);
  const draggingDot = useRef(null); // { index, channel, lockedRgb }
  const draggingFree = useRef(false);
  const hexPointerDown = useRef(null); // { clientX, clientY, time, isDragging }
  const blPointerDown = useRef(null); // { clientX, clientY, time, isDragging }

  const getSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const getHsbFromCanvas = useCallback((svgX, svgY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const px = Math.round(Math.max(0, Math.min(svgX, HEX_SIZE - 1)));
    const py = Math.round(Math.max(0, Math.min(svgY, HEX_SIZE - 1)));
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    if (pixel[3] === 0) return null; // transparent, outside hex
    return rgbToHsb(pixel[0], pixel[1], pixel[2]);
  }, []);

  const hueFromMouse = useCallback((e) => {
    const { x, y } = getSvgCoords(e);
    let angle = Math.atan2(-(y - CENTER), x - CENTER) * (180 / PI);
    if (angle < 0) angle += 360;
    onHueChange(Math.round(angle));
  }, [onHueChange, getSvgCoords]);

  // Build vector chain (needed for dot drag calculations too)
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

  const handleDotDrag = useCallback((e) => {
    if (draggingDot.current && onRgbChange) {
      const { index, channel, lockedRgb, lockedOrder } = draggingDot.current;
      const { x, y } = getSvgCoords(e);
      // Rebuild the preceding point from locked RGB values
      let prev = { x: CENTER, y: CENTER };
      for (let i = 0; i < index - 1; i++) {
        const ch = lockedOrder[i];
        const dir = DIRS[ch];
        prev = {
          x: prev.x + lockedRgb[ch] * scale * dir.x,
          y: prev.y + lockedRgb[ch] * scale * dir.y,
        };
      }
      const dir = DIRS[channel];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const projection = dx * dir.x + dy * dir.y;
      const value = Math.max(0, Math.min(255, Math.round(projection / scale)));
      onRgbChange(channel, value);
    }
    if (draggingFree.current && onHsbChange) {
      const { x, y } = getSvgCoords(e);
      const picked = getHsbFromCanvas(x, y);
      if (picked) onHsbChange(picked);
    }
  }, [getSvgCoords, onRgbChange, onHsbChange, points, scale]);

  const getBLValueFromClientY = useCallback((clientY) => {
    if (!svgRef.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgY = clientY - svgRect.top;
    const y = Math.max(0, Math.min(svgY - BL_BAR_TOP, BL_BAR_HEIGHT));
    return Math.round((1 - y / BL_BAR_HEIGHT) * 100);
  }, []);

  const applyBLValue = useCallback((value) => {
    if (blMode === 'brightness') {
      onHsbChange({ b: value });
    } else if (onHslChange) {
      onHslChange('l', value);
    }
  }, [blMode, onHsbChange, onHslChange]);

  const animateBLToValue = useCallback((targetValue) => {
    if (!onAnimateToHsb) return;
    if (blMode === 'brightness') {
      onAnimateToHsb({ h: hue, s: saturation, b: targetValue });
    } else if (onHslChange) {
      // For lightness, just snap (tween only works with HSB)
      onHslChange('l', targetValue);
    }
  }, [blMode, onAnimateToHsb, onHslChange, hue, saturation]);

  const handleHexSurfaceDrag = useCallback((e) => {
    if (!hexPointerDown.current || !onHsbChange) return;
    const { x, y } = getSvgCoords(e);
    const picked = getHsbFromCanvas(x, y);
    if (picked) onHsbChange(picked);
  }, [getSvgCoords, getHsbFromCanvas, onHsbChange]);

  useEffect(() => {
    const clearAll = () => {
      draggingHue.current = false;
      draggingDot.current = null;
      draggingFree.current = false;
      draggingBL.current = false;
      hexPointerDown.current = null;
      blPointerDown.current = null;
    };
    const onMouseMove = (e) => {
      if (draggingHue.current) hueFromMouse(e);
      if (draggingDot.current) handleDotDrag(e);
      if (draggingBL.current) {
        const val = getBLValueFromClientY(e.clientY);
        if (val !== null) applyBLValue(val);
      }
      if (draggingFree.current) {
        const { x, y } = getSvgCoords(e);
        const picked = getHsbFromCanvas(x, y);
        if (picked) onHsbChange(picked);
      }
      // Hex surface: check drag threshold
      if (hexPointerDown.current) {
        const pd = hexPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
          }
        }
        if (pd.isDragging) {
          handleHexSurfaceDrag(e);
        }
      }
      // BL bar: check drag threshold
      if (blPointerDown.current) {
        const pd = blPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
          }
        }
        if (pd.isDragging) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) applyBLValue(val);
        }
      }
    };
    const onMouseUp = (e) => {
      // Hex surface: if not dragging and fast click, tween
      if (hexPointerDown.current && !hexPointerDown.current.isDragging) {
        const elapsed = Date.now() - hexPointerDown.current.time;
        if (elapsed <= clickMaxDuration && onAnimateToHsb) {
          const { x, y } = getSvgCoords(e);
          const picked = getHsbFromCanvas(x, y);
          if (picked) onAnimateToHsb(picked);
        }
      }
      // BL bar: if not dragging and fast click, tween
      if (blPointerDown.current && !blPointerDown.current.isDragging) {
        const elapsed = Date.now() - blPointerDown.current.time;
        if (elapsed <= clickMaxDuration) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) animateBLToValue(val);
        }
      }
      clearAll();
    };
    const onMouseLeave = () => {
      clearAll();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [hueFromMouse, handleDotDrag, handleHexSurfaceDrag, getBLValueFromClientY, applyBLValue, animateBLToValue, getSvgCoords, getHsbFromCanvas, onAnimateToHsb, onHsbChange]);

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

  const handleDotMouseDown = (e, dotIndex) => {
    if (dotIndex === 0) return; // origin not draggable
    e.preventDefault();
    e.stopPropagation();
    if (dragMode === 'free') {
      // Immediate drag in free mode (dots are explicit handles)
      draggingFree.current = true;
    } else {
      // Immediate drag in channel mode (dots are explicit handles)
      const channel = order[dotIndex - 1];
      draggingDot.current = {
        index: dotIndex,
        channel,
        lockedRgb: { ...rgb },
        lockedOrder: [...order],
      };
    }
  };

  const handleHexMouseDown = useCallback((e) => {
    // Only start tracking on the hex surface, not on dots/hue handle
    const { x, y } = getSvgCoords(e);
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return; // outside hex
    hexPointerDown.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now(),
      isDragging: false,
    };
  }, [getSvgCoords]);

  const handleColorLabelClick = useCallback((deg) => {
    if (!onAnimateToHsb) return;
    onAnimateToHsb({ h: deg, s: 100, b: brightness });
  }, [onAnimateToHsb, brightness]);

  return (
    <div id="color-hexagon" className="flex flex-col items-center gap-2 border border-input rounded-lg p-3 h-full justify-center">
      <h2 className="text-lg font-semibold tracking-tight text-foreground self-start">Color Hexagon</h2>
      <div className="flex items-center gap-3">
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
        <Tabs value={dragMode} onValueChange={setDragMode}>
          <TabsList>
            <TabsTrigger value="free" className="w-16">Free</TabsTrigger>
            <TabsTrigger value="channel" className="w-16">Channel</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={blMode} onValueChange={setBlMode}>
          <TabsList>
            <TabsTrigger value="brightness" className="w-16">Bright</TabsTrigger>
            <TabsTrigger value="lightness" className="w-16">Light</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative" style={{ width: SIZE, height: HEX_SIZE }}>
        <canvas
          id="hex-canvas"
          ref={canvasRef}
          width={HEX_SIZE}
          height={HEX_SIZE}
          className="absolute inset-0 rounded-sm"
        />
        <svg
          id="hex-svg"
          ref={svgRef}
          width={SIZE}
          height={HEX_SIZE}
          className="absolute inset-0"
          onMouseDown={handleHexMouseDown}
        >
          {/* Circumscribing circle */}
          <circle
            id="hex-circumscribe"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--input)"
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

          {/* Brightness/Lightness limit hexagon + connector line */}
          {(() => {
            const limitScale = blMode === 'brightness'
              ? brightness / 100
              : 1 - Math.abs(2 * (hsl?.l ?? 50) / 100 - 1);
            const limitRadius = RADIUS * Math.min(limitScale, 1);
            const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
            const arrowY = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
            const arrowTipX = BL_BAR_X - BL_ARROW_SIZE - 2;
            // Direction from arrow tip to center
            const dx = CENTER - arrowTipX;
            const dy = CENTER - arrowY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(-dy, dx); // math convention for hexEdgeDist
            const edgeDist = hexEdgeDist(angle, limitRadius);
            // Point on limit hex perimeter along the line from arrow to center
            const perimX = CENTER - (dx / dist) * edgeDist;
            const perimY = CENTER - (dy / dist) * edgeDist;
            const strokeColor = 'rgba(128,128,128,0.5)';
            return (
              <>
                {limitScale < 1 && (
                  <polygon
                    id="hex-brightness-limit"
                    points={hexPoints(CENTER, CENTER, limitRadius)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={arrowTipX}
                  y1={arrowY}
                  x2={perimX}
                  y2={perimY}
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeDasharray="1 4"
                  strokeLinecap="round"
                />
              </>
            );
          })()}

          {/* Major color labels moved to HTML overlay below */}

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
              {/* Hue handle pill rendered as HTML overlay below */}
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
            const isDraggable = i > 0;
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
                className={isDraggable ? 'cursor-pointer' : ''}
                style={isLast ? {
                  filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3)) drop-shadow(inset 0 0 0 1px rgba(0,0,0,0.3))',
                } : undefined}
                onMouseDown={isDraggable ? (e) => handleDotMouseDown(e, i) : undefined}
              />
            );
          })}

          {/* Brightness/Lightness vertical slider */}
          <defs>
            <linearGradient id="bl-gradient" x1="0" y1="0" x2="0" y2="1">
              {blMode === 'brightness' ? (
                <>
                  <stop offset="0%" stopColor={rgbToHex(...Object.values(hsbToRgb(hue, saturation, 100)))} />
                  <stop offset="100%" stopColor="#000" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="50%" stopColor={rgbToHex(...Object.values(hsbToRgb(hue, 100, 100)))} />
                  <stop offset="100%" stopColor="#000" />
                </>
              )}
            </linearGradient>
          </defs>
          <rect
            id="bl-bar"
            x={BL_BAR_X}
            y={BL_BAR_TOP}
            width={BL_BAR_WIDTH}
            height={BL_BAR_HEIGHT}
            fill="url(#bl-gradient)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            className="cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              blPointerDown.current = {
                clientX: e.clientX,
                clientY: e.clientY,
                time: Date.now(),
                isDragging: false,
              };
            }}
          />
          {/* Arrow indicator on the left of the bar */}
          {(() => {
            const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
            const arrowY = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
            return (
              <polygon
                id="bl-bar-arrow"
                points={`${BL_BAR_X - 2},${arrowY} ${BL_BAR_X - BL_ARROW_SIZE - 2},${arrowY - 5} ${BL_BAR_X - BL_ARROW_SIZE - 2},${arrowY + 5}`}
                fill="var(--foreground)"
                className="cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  draggingBL.current = true;
                }}
              />
            );
          })()}

          {/* BL bar markers: top (100), mid (50), bottom (0) */}
          {[
            { label: '100', value: 100, y: BL_BAR_TOP },
            { label: '50', value: 50, y: BL_BAR_TOP + BL_BAR_HEIGHT / 2 },
            { label: '0', value: 0, y: BL_BAR_TOP + BL_BAR_HEIGHT },
          ].map(({ label, value, y }) => (
            <g
              key={value}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                animateBLToValue(value);
              }}
            >
              <line
                x1={BL_BAR_X + BL_BAR_WIDTH}
                y1={y}
                x2={BL_BAR_X + BL_BAR_WIDTH + 4}
                y2={y}
                stroke="var(--foreground)"
                strokeWidth={1}
                opacity={0.5}
              />
              <text
                x={BL_BAR_X + BL_BAR_WIDTH + 8}
                y={y}
                dominantBaseline="central"
                className="text-xs font-mono select-none"
                fill="var(--muted-foreground)"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>

        {/* Major color labels as HTML overlays */}
        {[
          { label: 'R', name: 'Red', deg: 0, color: '#ff0000', lightColor: '#e00000' },
          { label: 'Y', name: 'Yellow', deg: 60, color: '#ffff00', lightColor: '#cca800' },
          { label: 'G', name: 'Green', deg: 120, color: '#00ff00', lightColor: '#00b300' },
          { label: 'C', name: 'Cyan', deg: 180, color: '#00ffff', lightColor: '#00a3a3' },
          { label: 'B', name: 'Blue', deg: 240, color: '#0000ff', lightColor: '#0000e0' },
          { label: 'M', name: 'Magenta', deg: 300, color: '#ff00ff', lightColor: '#d000d0' },
        ].map(({ label, name, deg, color, lightColor }) => {
          const isDark = document.documentElement.classList.contains('dark');
          const displayColor = isDark ? color : lightColor;
          const rad = (deg * PI) / 180;
          const offset = RADIUS + 20;
          const x = CENTER + offset * Math.cos(rad);
          const y = CENTER - offset * Math.sin(rad);
          const textColor = (deg > 30 && deg < 200) ? '#000' : '#fff';
          return (
            <div
              key={label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center w-8 h-6 text-xs font-bold select-none cursor-pointer rounded-full"
                    style={{
                      color: displayColor,
                      backgroundColor: 'var(--background)',
                    }}
                    onClick={() => handleColorLabelClick(deg)}
                  >
                    {label}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-xs font-semibold border-0"
                  style={{
                    '--tooltip-bg': displayColor,
                    backgroundColor: displayColor,
                    color: textColor,
                  }}
                >
                  {name}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* Draggable hue handle pill - above color labels */}
        {showHueLine && (
          <div
            id="hue-handle"
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-7 rounded-full cursor-pointer select-none shadow-md"
            style={{
              left: hueLabel.x,
              top: hueLabel.y,
              backgroundColor: rgbToHex(...Object.values(hsbToRgb(hue, 100, 100))),
              border: '2px solid var(--background)',
            }}
            onMouseDown={handleHueDragStart}
          >
            <span
              className="text-sm font-mono font-semibold pointer-events-none"
              style={{ color: hue > 30 && hue < 200 ? '#000' : '#fff' }}
            >
              {hue}°
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
