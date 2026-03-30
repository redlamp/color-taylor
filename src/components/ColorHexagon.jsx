import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/colorConversions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '../hooks/useTheme';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import CollapsibleSection from './CollapsibleSection';
import NAMED_COLORS from '../utils/namedColors';
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

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb, blMode, onBlModeChange, colorSpace, onColorSpaceChange, hoverMatchRgb, showHtmlOnHex, onHoverHtmlColor }) {
  const { isDark } = useTheme();
  const [vectorMode, setVectorMode] = useState('rgb');
  const [dragMode, setDragMode] = useState('free');
  const initialHex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), []);
  const [recentColors, setRecentColors] = useState([
    '#0decaf', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#808080', '#000000',
  ]);
  const [selectedRecentIdx, setSelectedRecentIdx] = useState(null);
  const lastHex = useRef(initialHex);
  const skipNextRecent = useRef(false);
  const draggingBL = useRef(false);
  const svgRef = useRef(null);
  const draggingHue = useRef(false);
  const draggingDot = useRef(null);
  const draggingFree = useRef(false);
  const hexPointerDown = useRef(null);
  const startingBrightness = useRef(null); // brightness at drag start for rubber-band
  const blPointerDown = useRef(null);
  const [hoveredDot, setHoveredDot] = useState(null); // index of hovered dot
  const [isHexDragging, setIsHexDragging] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null); // { x, y, hex, name }

  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;

  const getSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const getHsbFromPosition = useCallback((svgX, svgY, clampOnly = false) => {
    const dx = svgX - CENTER;
    const dy = svgY - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);

    // For initial clicks, reject if outside hex; for drags (clampOnly), clamp instead
    if (!clampOnly && dist > edgeDist) return null;

    let h = (angle * 180) / PI;
    if (h < 0) h += 360;
    const s = Math.round(Math.min((dist / edgeDist) * 100, 100));

    // Rubber-band brightness: expand if outside limit, snap back if inside
    const base = startingBrightness.current ?? brightness;
    const limitEdgeDist = hexEdgeDist(angle, RADIUS * base / 100);
    let b;
    if (dist <= limitEdgeDist) {
      b = base;
    } else {
      b = Math.min(100, Math.round((dist / edgeDist) * 100));
    }
    return { h: Math.round(h), s, b };
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

  const hoverDot = useMemo(() => {
    if (!hoverMatchRgb) return null;
    const hsb = rgbToHsb(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b);
    const rad = (hsb.h * PI) / 180;
    const edgeDist = hexEdgeDist(rad, RADIUS);
    const dist = (hsb.s / 100) * edgeDist;
    return {
      x: CENTER + dist * Math.cos(rad),
      y: CENTER - dist * Math.sin(rad),
      hex: rgbToHex(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b),
    };
  }, [hoverMatchRgb]);

  const showHueLine = saturation > 0;

  // Named color markers on hex
  const htmlColorMarkers = useMemo(() => {
    if (!showHtmlOnHex) return [];
    return NAMED_COLORS.map((c) => {
      const hsb = rgbToHsb(c.r, c.g, c.b);
      // Only show colors within ±15 brightness of current
      if (Math.abs(hsb.b - brightness) > 15) return null;
      const rad = (hsb.h * PI) / 180;
      // Position at where it would be at the color's own brightness level
      const colorLimitRadius = RADIUS * hsb.b / 100;
      const edgeDist = hexEdgeDist(rad, colorLimitRadius);
      const dist = (hsb.s / 100) * edgeDist;
      return {
        x: CENTER + dist * Math.cos(rad),
        y: CENTER - dist * Math.sin(rad),
        hex: rgbToHex(c.r, c.g, c.b),
        name: c.name,
      };
    }).filter(Boolean);
  }, [showHtmlOnHex, brightness]);

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
          return [currentHex, ...filtered].slice(0, 12);
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
      return [hex, ...filtered].slice(0, 12);
    });
    setSelectedRecentIdx(0);
  }, []);

  // Solve for multiple channel values given a target 2D position
  const solveChannels = useCallback((targetX, targetY, channelKeys) => {
    const dx = targetX - CENTER;
    const dy = targetY - CENTER;
    const n = channelKeys.length;

    if (n === 1) {
      const dir = DIRS[channelKeys[0]];
      const proj = dx * dir.x + dy * dir.y;
      return { [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(proj / scale))) };
    }

    if (n === 2) {
      // Solve 2x2 linear system: dx = a*d1x + b*d2x, dy = a*d1y + b*d2y
      const d1 = DIRS[channelKeys[0]], d2 = DIRS[channelKeys[1]];
      const det = d1.x * d2.y - d1.y * d2.x;
      if (Math.abs(det) < 0.0001) return null;
      const a = (dx * d2.y - dy * d2.x) / det / scale;
      const b = (d1.x * dy - d1.y * dx) / det / scale;
      return {
        [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(a))),
        [channelKeys[1]]: Math.max(0, Math.min(255, Math.round(b))),
      };
    }

    // n >= 3: underdetermined, use geometric H+S approach
    return null;
  }, [scale]);

  // Drag handlers
  const handleDotDrag = useCallback((e) => {
    if (draggingDot.current && onRgbChange) {
      const { index, channel, lockedRgb, lockedOrder } = draggingDot.current;
      const isLast = index === points.length - 1;

      // Free mode: adjust all channels up to this dot
      if (dragMode === 'free' && !draggingDot.current.relative) {
        const { x, y } = getSvgCoords(e);

        // Last dot (all 3 channels): set color from hex position
        if (isLast && onHsbChange) {
          startingBrightness.current = startingBrightness.current ?? brightness;
          const picked = getHsbFromPosition(x, y, true);
          if (picked) onHsbChange(picked);
          return;
        }

        // Solve for channels 0..index-1
        const channelKeys = order.slice(0, index);
        const solved = solveChannels(x, y, channelKeys);
        if (solved) {
          for (const [ch, val] of Object.entries(solved)) {
            onRgbChange(ch, val);
          }
          return;
        }
      }

      // Channel mode or relative segment drag
      const { x, y } = getSvgCoords(e);
      const { startValue, startProjection, relative: isRelative } = draggingDot.current;
      const useRgb = dragMode === 'channel' ? lockedRgb : rgb;
      const useOrder = dragMode === 'channel' ? lockedOrder : order;
      let prev = { x: CENTER, y: CENTER };
      for (let i = 0; i < index - 1; i++) {
        const ch = useOrder[i];
        const dir = DIRS[ch];
        prev = {
          x: prev.x + useRgb[ch] * scale * dir.x,
          y: prev.y + useRgb[ch] * scale * dir.y,
        };
      }
      const dir = DIRS[channel];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const currentProjection = dx * dir.x + dy * dir.y;
      let value;
      if (isRelative) {
        const delta = (currentProjection - startProjection) / scale;
        value = Math.max(0, Math.min(255, Math.round(startValue + delta)));
      } else {
        value = Math.max(0, Math.min(255, Math.round(currentProjection / scale)));
      }
      onRgbChange(channel, value);
    }
    if (draggingFree.current && onHsbChange) {
      const { x, y } = getSvgCoords(e);
      const picked = getHsbFromPosition(x, y, true);
      if (picked) onHsbChange(picked);
    }
  }, [getSvgCoords, onRgbChange, onHsbChange, points, scale, getHsbFromPosition]);

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
    const picked = getHsbFromPosition(x, y, true);
    if (picked) onHsbChange(picked);
  }, [getSvgCoords, getHsbFromPosition, onHsbChange]);

  // Global mouse listeners
  useEffect(() => {
    const clearAll = () => {
      draggingHue.current = false;
      draggingDot.current = null;
      draggingFree.current = false;
      draggingBL.current = false;
      hexPointerDown.current = null;
      blPointerDown.current = null;
      startingBrightness.current = null;
      setHoveredDot(null);
      setIsHexDragging(false);
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
        const picked = getHsbFromPosition(x, y);
        if (picked) onHsbChange(picked);
      }
      if (hexPointerDown.current) {
        const pd = hexPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
            setIsHexDragging(true);
          }
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
          const picked = getHsbFromPosition(x, y);
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
  }, [hueFromMouse, handleDotDrag, handleHexSurfaceDrag, getBLValueFromClientY, applyBLValue, animateBLToValue, getSvgCoords, getHsbFromPosition, onAnimateToHsb, onHsbChange, addToRecent]);

  // Non-passive wheel listener to prevent page scroll
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const step = Math.abs(e.deltaY) > 50 ? 2 : 1;
      const delta = e.deltaY > 0 ? -step : step;
      if (blMode === 'brightness') {
        const target = Math.max(0, Math.min(100, brightness + delta));
        onHsbChange({ b: target });
      } else if (onHslChange) {
        const currentL = hsl?.l ?? 50;
        const target = Math.max(0, Math.min(100, currentL + delta));
        if (target >= 99) {
          onHsbChange({ h: hue, s: 0, b: 100 });
        } else if (target <= 1) {
          onHsbChange({ h: hue, s: saturation, b: 0 });
        } else {
          onHslChange('l', target);
        }
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [blMode, brightness, hsl?.l, hue, saturation, onHsbChange, onHslChange]);

  const handleHueDragStart = (e) => {
    e.preventDefault();
    draggingHue.current = true;
    hueFromMouse(e);
  };

  const handleDotMouseDown = (e, dotIndex, relative = false) => {
    if (dotIndex === 0) return;
    e.preventDefault();
    e.stopPropagation();
    setHoveredDot(dotIndex);
    const channel = order[dotIndex - 1];
    const { x, y } = getSvgCoords(e);
    let prev = { x: CENTER, y: CENTER };
    for (let i = 0; i < dotIndex - 1; i++) {
      const ch = order[i];
      const dir = DIRS[ch];
      prev = {
        x: prev.x + rgb[ch] * scale * dir.x,
        y: prev.y + rgb[ch] * scale * dir.y,
      };
    }
    const dir = DIRS[channel];
    const startProjection = (x - prev.x) * dir.x + (y - prev.y) * dir.y;
    draggingDot.current = {
      index: dotIndex,
      channel,
      lockedRgb: { ...rgb },
      lockedOrder: [...order],
      startValue: rgb[channel],
      startProjection,
      relative,
    };
  };

  const handleHexMouseDown = useCallback((e) => {
    const { x, y } = getSvgCoords(e);
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return;
    startingBrightness.current = brightness;
    hexPointerDown.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now(),
      isDragging: false,
    };
  }, [getSvgCoords, brightness, dragMode]);

  const handleColorLabelClick = useCallback((deg) => {
    if (!onAnimateToHsb) return;
    let target;
    if (blMode === 'brightness') {
      target = { h: deg, s: 100, b: 100 };
    } else {
      const targetRgb = hslToRgb(deg, 100, 50);
      target = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    }
    const rgb = hsbToRgb(target.h, target.s, target.b);
    addToRecent(rgbToHex(rgb.r, rgb.g, rgb.b));
    onAnimateToHsb(target);
  }, [onAnimateToHsb, blMode, addToRecent]);

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
      <div className="flex items-end gap-3">
        {/* Segment Order tab - hidden for now, may bring back later
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">Segment Order</span>
          <Tabs value={vectorMode} onValueChange={setVectorMode}>
            <TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="rgb" className="w-16">RGB</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Red, Green, Blue</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <TabsTrigger value="desc" className="w-16">
                      <svg width="14" height="12" viewBox="0 0 14 12" className="fill-current">
                        <polygon points="0,0 0,12 14,12" />
                      </svg>
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Big to Small</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <TabsTrigger value="asc" className="w-16">
                      <svg width="14" height="12" viewBox="0 0 14 12" className="fill-current">
                        <polygon points="0,12 14,12 14,0" />
                      </svg>
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Small to Big</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </div>
        */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">Handles</span>
          <Tabs value={dragMode} onValueChange={setDragMode}>
            <TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="free" className="w-16">Free</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Set color</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="channel" className="w-16">Channel</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Set a color channel</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </div>
        {/* Color Space tab - hidden for now, may bring back later
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">Color Space</span>
          <Tabs value={colorSpace} onValueChange={onColorSpaceChange}>
            <TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="srgb" className="w-16">sRGB</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Standard RGB (gamma corrected)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="linear" className="w-16">Linear</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">Linear RGB (physically accurate)</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </div>
        */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">Luminance</span>
          <Tabs value={blMode} onValueChange={onBlModeChange}>
            <TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="brightness" className="w-16">Bright</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSB</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TabsTrigger value="lightness" className="w-16">Light</TabsTrigger></span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSL</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="relative" style={{ width: SIZE, height: HEX_SIZE, marginLeft: -20 }}>
        <HexCanvas brightness={brightness} colorSpace={colorSpace} />
        <svg
          id="hex-svg"
          ref={svgRef}
          width={SIZE}
          height={HEX_SIZE}
          role="img"
          aria-label="Color hexagon with RGB vector visualization"
          className="absolute inset-0 z-[5]"
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

          {/* HTML named color markers */}
          {htmlColorMarkers.map((m) => (
            <circle
              key={m.name}
              cx={m.x}
              cy={m.y}
              r={4}
              fill={m.hex}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
              className="cursor-pointer"
              onMouseEnter={() => { setHoveredMarker(m); onHoverHtmlColor?.(m); }}
              onMouseLeave={() => { setHoveredMarker(null); onHoverHtmlColor?.(null); }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAnimateToHsb) {
                  const parsed = rgbToHsb(
                    parseInt(m.hex.slice(1, 3), 16),
                    parseInt(m.hex.slice(3, 5), 16),
                    parseInt(m.hex.slice(5, 7), 16),
                  );
                  addToRecent(m.hex);
                  onAnimateToHsb(parsed);
                }
              }}
            />
          ))}

          {/* Hue line */}
          {showHueLine && (
            <line id="hue-line" x1={CENTER} y1={CENTER} x2={hueEnd.x} y2={hueEnd.y}
              stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="4 4"
            />
          )}

          {/* Vector line segments */}
          {points.slice(1).map((p, i) => {
            const prev = points[i];
            const ch = order[i];
            const chValue = rgb[ch];
            // Hide zero-value segments during hex surface drag
            if (isHexDragging && chValue === 0 && ch !== 'r') return null;
            const bright = brightness > 50;
            const baseColor = bright
              ? (ch === 'r' ? 'rgba(220,50,50,0.8)' : ch === 'g' ? 'rgba(50,180,50,0.8)' : 'rgba(50,50,220,0.8)')
              : (ch === 'r' ? 'rgba(255,120,120,0.8)' : ch === 'g' ? 'rgba(120,230,120,0.8)' : 'rgba(120,120,255,0.8)');
            const hoverColor = bright
              ? (ch === 'r' ? 'rgba(240,90,90,1)' : ch === 'g' ? 'rgba(90,200,90,1)' : 'rgba(90,90,240,1)')
              : (ch === 'r' ? 'rgba(255,160,160,1)' : ch === 'g' ? 'rgba(160,255,160,1)' : 'rgba(160,160,255,1)');
            const isHighlighted = hoveredDot !== null && (
              dragMode === 'free'
                ? true
                : hoveredDot === i + 1
            );
            const dotIndex = i + 1;
            return (
              <g key={i}>
                {/* Invisible wider hit area for easier clicking */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke="transparent"
                  strokeWidth={12}
                  strokeLinecap="round"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDot(dotIndex)}
                  onMouseLeave={() => {
                    if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
                  }}
                  onMouseDown={(e) => handleDotMouseDown(e, dotIndex, true)}
                />
                {/* Visible segment */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke={isHighlighted ? hoverColor : baseColor}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeLinecap="round"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const isDraggable = i > 0;
            const ch = i > 0 ? order[i - 1] : null;
            // Hide zero-value dots during hex surface drag (except origin and red)
            if (isHexDragging && ch && ch !== 'r' && rgb[ch] === 0) return null;
            const bright = brightness > 50;
            const baseRing = !ch ? 'white' : bright
              ? (ch === 'r' ? 'rgba(220,50,50,0.9)' : ch === 'g' ? 'rgba(50,180,50,0.9)' : 'rgba(50,50,220,0.9)')
              : (ch === 'r' ? 'rgba(255,120,120,0.9)' : ch === 'g' ? 'rgba(120,230,120,0.9)' : 'rgba(120,120,255,0.9)');
            const hoverRing = !ch ? 'white' : bright
              ? (ch === 'r' ? 'rgba(240,90,90,1)' : ch === 'g' ? 'rgba(90,200,90,1)' : 'rgba(90,90,240,1)')
              : (ch === 'r' ? 'rgba(255,160,160,1)' : ch === 'g' ? 'rgba(160,255,160,1)' : 'rgba(160,160,255,1)');
            const isHighlighted = isDraggable && hoveredDot !== null && (
              dragMode === 'free'
                ? true
                : hoveredDot === i
            );
            const ringColor = isDraggable
              ? (isHighlighted ? hoverRing : baseRing)
              : 'white';
            const isOrigin = i === 0;
            return (
              <circle
                key={i} id={`rgb-dot-${dotNames[i]}`} cx={p.x} cy={p.y}
                r={isOrigin ? 3 : isLast ? 8 : 5}
                fill={isOrigin ? '#ff0000' : dotColors[i]}
                stroke={isOrigin ? 'none' : ringColor}
                strokeWidth={isOrigin ? 0 : isHighlighted ? 3 : 2}
                className={isDraggable ? 'cursor-pointer' : ''}
                style={isLast ? { filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3))' } : undefined}
                onMouseDown={isDraggable ? (e) => handleDotMouseDown(e, i) : undefined}
                onMouseEnter={isDraggable ? () => setHoveredDot(i) : undefined}
                onMouseLeave={isDraggable ? () => {
                  if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
                } : undefined}
              />
            );
          })}

          {/* Hover preview dot for named color match */}
          {hoverDot && (
            <circle
              cx={hoverDot.x}
              cy={hoverDot.y}
              r={10}
              fill={hoverDot.hex}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="3 3"
              className="pointer-events-none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
            />
          )}

          <BrightnessBar
            hue={hue} saturation={saturation} brightness={brightness} hsl={hsl}
            blMode={blMode} blPointerDown={blPointerDown} draggingBL={draggingBL}
            animateBLToValue={animateBLToValue} colorSpace={colorSpace}
          />
        </svg>

        <ColorLabels onColorClick={handleColorLabelClick} />

        {/* HTML color marker tooltip */}
        {hoveredMarker && (() => {
          const mr = parseInt(hoveredMarker.hex.slice(1, 3), 16);
          const mg = parseInt(hoveredMarker.hex.slice(3, 5), 16);
          const mb = parseInt(hoveredMarker.hex.slice(5, 7), 16);
          const tc = (mr * 0.299 + mg * 0.587 + mb * 0.114) > 150 ? '#000' : '#fff';
          return (
            <div
              className="absolute z-[9] -translate-x-1/2 pointer-events-none"
              style={{ left: hoveredMarker.x, top: hoveredMarker.y - 14 }}
            >
              <div
                className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-md -translate-y-full"
                style={{ backgroundColor: hoveredMarker.hex, color: tc }}
              >
                {hoveredMarker.name}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `5px solid ${hoveredMarker.hex}`,
                  }}
                />
              </div>
            </div>
          );
        })()}
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

      {/* Recent Colors + Named Color Match */}
      <div className="w-full mt-2">
        <CollapsibleSection id="recent-colors" title="Recent Colors">
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 12 }, (_, i) => {
              const color = recentColors[i];
              return (
                <button
                  key={i}
                  className="rounded-md cursor-pointer shrink-0 transition-shadow duration-200 ease-in-out"
                  style={{
                    width: 50,
                    height: 70,
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
        </CollapsibleSection>
      </div>
    </div>
  );
}
