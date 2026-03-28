import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/colorConversions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '../hooks/useTheme';
import {
  HEX_SIZE, SIZE, CENTER, RADIUS, PI, DIRS,
  BL_BAR_X, BL_BAR_TOP, BL_BAR_HEIGHT, BL_ARROW_SIZE,
  hexEdgeDist, hexPoints, colorAtPoint, getOrder,
} from './hex/hexConstants';
import HexCanvas from './hex/HexCanvas';
import BrightnessBar from './hex/BrightnessBar';
import ColorLabels from './hex/ColorLabels';
import HueHandle from './hex/HueHandle';
import BrightnessHandle from './hex/BrightnessHandle';

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb, blMode, onBlModeChange }) {
  const { isDark } = useTheme();
  const [vectorMode, setVectorMode] = useState('rgb');
  const [dragMode, setDragMode] = useState('free');
  const initialHex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), []);
  const [recentColors, setRecentColors] = useState([initialHex]);
  const [selectedRecentIdx, setSelectedRecentIdx] = useState(0);
  const lastHex = useRef(initialHex);
  const skipNextRecent = useRef(false);
  const draggingBL = useRef(false);
  const svgRef = useRef(null);
  const draggingHue = useRef(false);
  const draggingDot = useRef(null);
  const draggingFree = useRef(false);
  const hexPointerDown = useRef(null);
  const blPointerDown = useRef(null);

  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;

  const getSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const getHsbFromCanvas = useCallback((svgX, svgY) => {
    const c = colorAtPoint(svgX, svgY, brightness);
    if (svgX < 0 || svgX >= HEX_SIZE || svgY < 0 || svgY >= HEX_SIZE) return null;
    const dx = svgX - CENTER;
    const dy = svgY - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return null;
    return rgbToHsb(c.r, c.g, c.b);
  }, [brightness]);

  const hueFromMouse = useCallback((e) => {
    const { x, y } = getSvgCoords(e);
    let angle = Math.atan2(-(y - CENTER), x - CENTER) * (180 / PI);
    if (angle < 0) angle += 360;
    onHueChange(Math.round(angle));
  }, [onHueChange, getSvgCoords]);

  // Vector chain
  const order = useMemo(() => getOrder(vectorMode, rgb), [vectorMode, rgb.r, rgb.g, rgb.b]);
  const scale = RADIUS / 255;
  const { points, dotNames } = useMemo(() => {
    const p0 = { x: CENTER, y: CENTER };
    const pts = [p0];
    const names = ['origin'];
    let current = p0;
    for (const ch of order) {
      const dir = DIRS[ch];
      const value = rgb[ch];
      current = {
        x: current.x + value * scale * dir.x,
        y: current.y + value * scale * dir.y,
      };
      pts.push(current);
      names.push(ch === 'r' ? 'red' : ch === 'g' ? 'green' : 'blue');
    }
    return { points: pts, dotNames: names };
  }, [order, rgb.r, rgb.g, rgb.b, scale]);

  const dotColors = useMemo(() => points.map((p) => {
    const c = colorAtPoint(p.x, p.y, brightness);
    return rgbToHex(c.r, c.g, c.b);
  }), [points, brightness]);

  const { hueRad, hueEnd, hueLabel } = useMemo(() => {
    const rad = (hue * PI) / 180;
    return {
      hueRad: rad,
      hueEnd: {
        x: CENTER + RADIUS * Math.cos(rad),
        y: CENTER - RADIUS * Math.sin(rad),
      },
      hueLabel: {
        x: CENTER + (RADIUS + 28) * Math.cos(rad),
        y: CENTER - (RADIUS + 28) * Math.sin(rad),
      },
    };
  }, [hue]);

  const showHueLine = saturation > 0;

  // Track recent colors — add to history when color settles for 500ms
  const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (skipNextRecent.current) {
        skipNextRecent.current = false;
        lastHex.current = currentHex;
        return;
      }
      if (currentHex !== lastHex.current) {
        lastHex.current = currentHex;
        setRecentColors((prev) => {
          const filtered = prev.filter((c) => c !== currentHex);
          return [currentHex, ...filtered].slice(0, 8);
        });
        setSelectedRecentIdx(0);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [currentHex]);

  const addToRecent = useCallback((hex) => {
    skipNextRecent.current = true;
    lastHex.current = hex;
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex);
      return [hex, ...filtered].slice(0, 8);
    });
    setSelectedRecentIdx(0);
  }, []);

  // Drag handlers
  const handleDotDrag = useCallback((e) => {
    if (draggingDot.current && onRgbChange) {
      const { index, channel, lockedRgb, lockedOrder } = draggingDot.current;
      const { x, y } = getSvgCoords(e);
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
  }, [getSvgCoords, onRgbChange, onHsbChange, points, scale, getHsbFromCanvas]);

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
    } else {
      // Convert target lightness to HSB via RGB for tweening
      const currentHsl = rgbToHsl(...Object.values(hsbToRgb(hue, saturation, brightness)));
      const targetRgb = hslToRgb(currentHsl.h, currentHsl.s, targetValue);
      const targetHsb = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
      onAnimateToHsb(targetHsb);
    }
  }, [blMode, onAnimateToHsb, hue, saturation, brightness]);

  const handleHexSurfaceDrag = useCallback((e) => {
    if (!hexPointerDown.current || !onHsbChange) return;
    const { x, y } = getSvgCoords(e);
    const picked = getHsbFromCanvas(x, y);
    if (picked) onHsbChange(picked);
  }, [getSvgCoords, getHsbFromCanvas, onHsbChange]);

  // Global mouse listeners
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
      if (hexPointerDown.current) {
        const pd = hexPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) pd.isDragging = true;
        }
        if (pd.isDragging) handleHexSurfaceDrag(e);
      }
      if (blPointerDown.current) {
        const pd = blPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) pd.isDragging = true;
        }
        if (pd.isDragging) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) applyBLValue(val);
        }
      }
    };
    const onMouseUp = (e) => {
      if (hexPointerDown.current && !hexPointerDown.current.isDragging) {
        const elapsed = Date.now() - hexPointerDown.current.time;
        if (elapsed <= clickMaxDuration && onAnimateToHsb) {
          const { x, y } = getSvgCoords(e);
          const picked = getHsbFromCanvas(x, y);
          if (picked) {
            const targetRgb = hsbToRgb(picked.h, picked.s, picked.b);
            addToRecent(rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b));
            onAnimateToHsb(picked);
          }
        }
      }
      if (blPointerDown.current && !blPointerDown.current.isDragging) {
        const elapsed = Date.now() - blPointerDown.current.time;
        if (elapsed <= clickMaxDuration) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) animateBLToValue(val);
        }
      }
      clearAll();
    };
    const onMouseLeave = () => clearAll();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [hueFromMouse, handleDotDrag, handleHexSurfaceDrag, getBLValueFromClientY, applyBLValue, animateBLToValue, getSvgCoords, getHsbFromCanvas, onAnimateToHsb, onHsbChange, addToRecent]);

  const handleHueDragStart = (e) => {
    e.preventDefault();
    draggingHue.current = true;
    hueFromMouse(e);
  };

  const handleDotMouseDown = (e, dotIndex) => {
    if (dotIndex === 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragMode === 'free') {
      draggingFree.current = true;
    } else {
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
    const { x, y } = getSvgCoords(e);
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return;
    hexPointerDown.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now(),
      isDragging: false,
    };
  }, [getSvgCoords]);

  const handleColorLabelClick = useCallback((deg) => {
    if (!onAnimateToHsb) return;
    const targetRgb = hsbToRgb(deg, 100, brightness);
    addToRecent(rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b));
    onAnimateToHsb({ h: deg, s: 100, b: brightness });
  }, [onAnimateToHsb, brightness, addToRecent]);

  // Brightness limit hex
  const limitHex = useMemo(() => {
    const limitScale = blMode === 'brightness'
      ? brightness / 100
      : 1 - Math.abs(2 * (hsl?.l ?? 50) / 100 - 1);
    const limitRadius = RADIUS * Math.min(limitScale, 1);
    const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
    const arrowY = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
    const arrowTipX = BL_BAR_X - BL_ARROW_SIZE - 2;
    const dx = CENTER - arrowTipX;
    const dy = CENTER - arrowY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, limitRadius);
    return {
      limitScale,
      limitRadius,
      perimX: CENTER - (dx / dist) * edgeDist,
      perimY: CENTER - (dy / dist) * edgeDist,
      arrowTipX,
      arrowY,
    };
  }, [blMode, brightness, hsl?.l]);

  return (
    <div id="color-hexagon" className="flex flex-col items-center gap-1 border border-input rounded-lg p-3">
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
        <Tabs value={blMode} onValueChange={onBlModeChange}>
          <TabsList>
            <TabsTrigger value="brightness" className="w-16">Bright</TabsTrigger>
            <TabsTrigger value="lightness" className="w-16">Light</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative" style={{ width: SIZE, height: HEX_SIZE, marginLeft: -20 }}>
        <HexCanvas brightness={brightness} />
        <svg
          id="hex-svg"
          ref={svgRef}
          width={SIZE}
          height={HEX_SIZE}
          role="img"
          aria-label="Color hexagon with RGB vector visualization"
          className="absolute inset-0"
          onMouseDown={handleHexMouseDown}
        >
          <circle id="hex-circumscribe" cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--input)" strokeWidth={1.5} />
          <polygon id="hex-outline" points={hexPoints(CENTER, CENTER, RADIUS)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* Brightness limit hex + connector */}
          {limitHex.limitScale < 1 && (
            <polygon
              id="hex-brightness-limit"
              points={hexPoints(CENTER, CENTER, limitHex.limitRadius)}
              fill="none" stroke="rgba(128,128,128,0.5)" strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round"
            />
          )}
          <line
            x1={limitHex.arrowTipX} y1={limitHex.arrowY} x2={limitHex.perimX} y2={limitHex.perimY}
            stroke="rgba(128,128,128,0.5)" strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round"
          />

          {/* Hue line */}
          {showHueLine && (
            <line id="hue-line" x1={CENTER} y1={CENTER} x2={hueEnd.x} y2={hueEnd.y}
              stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="4 4"
            />
          )}

          {/* Vector lines */}
          <polyline id="rgb-vectors" points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="white" strokeWidth={1.5} strokeLinejoin="round"
          />

          {/* Dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const isDraggable = i > 0;
            return (
              <circle
                key={i} id={`rgb-dot-${dotNames[i]}`} cx={p.x} cy={p.y}
                r={isLast ? 8 : 5} fill={dotColors[i]} stroke="white" strokeWidth={2}
                className={isDraggable ? 'cursor-pointer' : ''}
                style={isLast ? { filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3))' } : undefined}
                onMouseDown={isDraggable ? (e) => handleDotMouseDown(e, i) : undefined}
              />
            );
          })}

          <BrightnessBar
            hue={hue} saturation={saturation} brightness={brightness} hsl={hsl}
            blMode={blMode} blPointerDown={blPointerDown} draggingBL={draggingBL}
            animateBLToValue={animateBLToValue}
          />
        </svg>

        <ColorLabels onColorClick={handleColorLabelClick} />
        {showHueLine && <HueHandle hue={hue} hueLabel={hueLabel} onMouseDown={handleHueDragStart} />}
        <BrightnessHandle
          hue={hue}
          saturation={saturation}
          brightness={brightness}
          hsl={hsl}
          blMode={blMode}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            draggingBL.current = true;
          }}
        />
      </div>

      {/* Recent Colors */}
      <div className="w-full mt-2">
        <span className="text-xs font-semibold text-muted-foreground">Recent Colors</span>
        <div className="flex gap-1.5 mt-1">
          {Array.from({ length: 8 }, (_, i) => {
            const color = recentColors[i];
            return (
              <button
                key={i}
                className="rounded-md cursor-pointer shrink-0 transition-shadow duration-200 ease-in-out"
                style={{
                  width: 48,
                  height: 64,
                  backgroundColor: color || 'transparent',
                  boxShadow: i === selectedRecentIdx && color ? '0 0 0 2px white' : 'none',
                  border: i === selectedRecentIdx && color ? '2px solid transparent' : '1px solid var(--input)',
                }}
                disabled={!color}
                aria-label={color ? `Select ${color}` : 'Empty slot'}
                onClick={() => {
                  if (color && onAnimateToHsb) {
                    skipNextRecent.current = true;
                    setSelectedRecentIdx(i);
                    const parsed = rgbToHsb(
                      parseInt(color.slice(1, 3), 16),
                      parseInt(color.slice(3, 5), 16),
                      parseInt(color.slice(5, 7), 16),
                    );
                    onAnimateToHsb(parsed);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
