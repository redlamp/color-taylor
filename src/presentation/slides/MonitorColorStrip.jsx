import { useRef, useEffect, useCallback } from 'react';
import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';

// --- Palette definitions (easy to swap/modify) ---

function hueSpectrum(n) {
  return Array.from({ length: n }, (_, i) => {
    const h = Math.round((i / n) * 360);
    const { r, g, b } = hsbToRgb(h, 100, 100);
    return rgbToHex(r, g, b);
  });
}

// Mac System 7 16-color palette (screenshot order: top row L→R, bottom row L→R)
const MAC_16 = [
  '#000000', '#404040', '#808080', '#C0C0C0',
  '#FFFFFF', '#90713A', '#562C05', '#006412',
  '#02ABEA', '#0000D4', '#4700A5', '#F20884',
  '#DD0806', '#FF6502', '#FBFA00', '#1FB714',
];

export const PALETTES = {
  bw:        ['#000000', '#FFFFFF'],
  c16:       MAC_16,
  c256:      hueSpectrum(48),
  thousands: hueSpectrum(128),
  millions:  hueSpectrum(256),
};

// --- Color math helpers ---

function parseHex(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a, b, t) {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// --- Transition builder ---
// Maps each source color to a range of target positions.
// "Anchor" cells (the first in each group) keep the source's width
// and shrink to 1. Non-anchors expand from 0 to 1.
// The visual effect: each source block "splits" into multiple target blocks.

function buildTransition(from, to) {
  const n = from.length;
  const m = to.length;
  const expanding = m >= n;
  const small = expanding ? from : to;
  const large = expanding ? to : from;
  const sn = small.length;
  const ln = large.length;

  const frames = [];
  for (let i = 0; i < sn; i++) {
    const startIdx = Math.round(i * ln / sn);
    const endIdx = Math.round((i + 1) * ln / sn);
    const count = endIdx - startIdx;

    for (let j = startIdx; j < endIdx; j++) {
      const isAnchor = (j === startIdx);
      frames.push({
        startColor: expanding ? small[i] : large[j],
        endColor:   expanding ? large[j] : small[i],
        startFlex:  expanding ? (isAnchor ? count : 0) : 1,
        endFlex:    expanding ? 1 : (isAnchor ? count : 0),
      });
    }
  }
  return frames;
}

// --- Component ---

export default function MonitorColorStrip({ mode, height = 32, duration = 1500 }) {
  const canvasRef = useRef(null);
  const prevMode = useRef(mode);
  const animRef = useRef(null);
  const currentPalette = useRef(PALETTES[mode]);

  const drawPalette = useCallback((palette) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cellW = w / palette.length;
    ctx.clearRect(0, 0, w, h);
    palette.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(i * cellW), 0, Math.ceil(cellW) + 1, h);
    });
  }, []);

  const drawFrame = useCallback((frames, t) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const et = easeInOut(t);

    let totalFlex = 0;
    const cells = frames.map(f => {
      const flex = Math.max(0, f.startFlex + (f.endFlex - f.startFlex) * et);
      totalFlex += flex;
      return { color: lerpColor(f.startColor, f.endColor, et), flex };
    });

    ctx.clearRect(0, 0, w, h);
    if (totalFlex === 0) return;
    let x = 0;
    for (const cell of cells) {
      if (cell.flex <= 0) continue;
      const cellW = (cell.flex / totalFlex) * w;
      if (cellW < 0.3) continue;
      ctx.fillStyle = cell.color;
      ctx.fillRect(Math.floor(x), 0, Math.ceil(cellW) + 1, h);
      x += cellW;
    }
  }, []);

  // Resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      if (!animRef.current) {
        drawPalette(currentPalette.current);
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawPalette]);

  // Transition on mode change
  useEffect(() => {
    if (mode === prevMode.current) return;

    const from = PALETTES[prevMode.current];
    const to = PALETTES[mode];
    const frames = buildTransition(from, to);
    prevMode.current = mode;
    currentPalette.current = to;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      drawFrame(frames, t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        drawPalette(to);
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode, duration, drawFrame, drawPalette]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height, display: 'block' }}
    />
  );
}
