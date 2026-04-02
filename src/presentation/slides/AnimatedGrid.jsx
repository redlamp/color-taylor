import { useState, useRef, useEffect } from 'react';
import { rgbToHex } from '../../utils/colorConversions';

// ── Palette data ────────────────────────────────────────────────────

const MAC_16 = [
  ['#000000', '#404040', '#808080', '#C0C0C0', '#90713A', '#562C05', '#006412', '#1FB714'],
  ['#02ABEA', '#0000D4', '#4600A5', '#F20884', '#DD0907', '#FF6403', '#FBF305', '#FFFFFF'],
];

function generate256() {
  const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const colors = [];
  for (const r of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
    for (const g of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
      for (const b of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
        colors.push(hex(r, g, b));
  for (let i = 0; i < 40; i++) {
    const v = Math.round(255 - (i / 39) * 255);
    colors.push(hex(v, v, v));
  }
  const grid = [];
  for (let r = 0; r < 8; r++) grid.push(colors.slice(r * 32, (r + 1) * 32));
  return grid;
}

function generateThousands(count = 64) {
  const make = (fn) => Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return fn(v);
  });
  return [
    make(v => rgbToHex(v, 0, 0)),
    make(v => rgbToHex(0, v, 0)),
    make(v => rgbToHex(0, 0, v)),
    make(v => rgbToHex(v, v, v)),
  ];
}

const GRID_256 = generate256();
const THOUSANDS = generateThousands(64);

// ── Layout generators ───────────────────────────────────────────────
// Each cell: { id, color, x, y, w, h } — all in 0–1 normalized coords.
// IDs use the hex color; duplicates get a suffix so only the first
// occurrence of each color matches across layouts.

function assignIds(cells) {
  const seen = {};
  return cells.map(c => {
    const key = c.color.toLowerCase();
    const n = seen[key] || 0;
    seen[key] = n + 1;
    return { ...c, id: n === 0 ? key : `${key}:${n}` };
  });
}

function getLayout(mode, swatchColor) {
  switch (mode) {
    case 'bw':
      return assignIds([
        { color: '#000000', x: 0, y: 0, w: 0.5, h: 1 },
        { color: '#FFFFFF', x: 0.5, y: 0, w: 0.5, h: 1 },
      ]);

    case 'c16':
      return assignIds(MAC_16.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / 8, y: ri / 2, w: 1 / 8, h: 1 / 2,
        }))
      ));

    case 'c256':
      return assignIds(GRID_256.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / 32, y: ri / 8, w: 1 / 32, h: 1 / 8,
        }))
      ));

    case 'thousands':
      return assignIds(THOUSANDS.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / row.length, y: ri / 4, w: 1 / row.length, h: 1 / 4,
        }))
      ));

    // Single cell filling the panel — used for static↔interactive transitions
    case 'swatch':
      return assignIds([
        { color: swatchColor || '#ff0000', x: 0, y: 0, w: 1, h: 1 },
      ]);

    default:
      return [];
  }
}

// ── Animated grid component ─────────────────────────────────────────

const FADE_DUR = '0.6s';
const STAGGER_MAX = 0.5; // seconds — max delay for the stagger wave
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material standard — quick start, smooth decel
// All cell tweens: width/x first (400ms), then height/y (600ms after 400ms delay)
const MOVE_TRANS = `left 0.4s ${EASE}, width 0.4s ${EASE}, top 0.6s ${EASE} 0.4s, height 0.6s ${EASE} 0.4s, background-color 1s ${EASE}`;
const MOVE_TOTAL_MS = 1000; // 400ms + 600ms
const FADEOUT_TRANS = `opacity 0.6s ${EASE}`;

// Per-cell staggered fade: delay proportional to hex integer value
// #000000 = 0 delay, #FFFFFF = STAGGER_MAX delay
function staggeredFade(hexColor) {
  const raw = hexColor.replace('#', '').replace(/:.*/, ''); // strip dup suffix
  const n = parseInt(raw, 16) || 0;
  const delay = (n / 0xFFFFFF) * STAGGER_MAX;
  return `opacity ${FADE_DUR} ${EASE} ${delay.toFixed(3)}s`;
}

// ── Nearest-neighbor color matching ─────────────────────────────────

function parseRgb(hex) {
  const raw = hex.replace('#', '').replace(/:.*/, '');
  const n = parseInt(raw, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDist(a, b) {
  const [r1, g1, b1] = parseRgb(a);
  const [r2, g2, b2] = parseRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const MAX_MATCH_DIST = 80; // max RGB distance for nearest-neighbor pairing

// Build transition pairs: exact matches, nearest-neighbor matches, and unmatched
function buildPairs(fromLayout, toLayout) {
  const fromMap = new Map(fromLayout.map(c => [c.id, c]));
  const toMap = new Map(toLayout.map(c => [c.id, c]));

  const pairs = [];      // { key, from, to }
  const usedTo = new Set();

  // 1. Exact ID matches
  for (const [id, from] of fromMap) {
    const to = toMap.get(id);
    if (to) {
      pairs.push({ key: id, from, to });
      usedTo.add(id);
    }
  }

  // 2. Nearest-neighbor matches for unmatched source cells
  const unmatchedFrom = fromLayout.filter(c => !toMap.has(c.id));
  const unmatchedTo = toLayout.filter(c => !fromMap.has(c.id) && !usedTo.has(c.id));

  // Build candidates sorted by distance (greedy closest-first)
  const candidates = [];
  for (const from of unmatchedFrom) {
    for (const to of unmatchedTo) {
      candidates.push({ from, to, dist: colorDist(from.color, to.color) });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);

  const pairedFrom = new Set();
  const pairedTo = new Set();
  for (const c of candidates) {
    if (pairedFrom.has(c.from.id) || pairedTo.has(c.to.id)) continue;
    if (c.dist > MAX_MATCH_DIST) continue;
    pairs.push({ key: `near:${c.from.id}`, from: c.from, to: c.to });
    pairedFrom.add(c.from.id);
    pairedTo.add(c.to.id);
  }

  // 3. Remaining unmatched
  const removed = unmatchedFrom.filter(c => !pairedFrom.has(c.id));
  const added = unmatchedTo.filter(c => !pairedTo.has(c.id));

  return { pairs, removed, added };
}

// ── Component ───────────────────────────────────────────────────────

export default function AnimatedGrid({ mode, swatchColor, enterColor }) {
  const [cells, setCells] = useState(() =>
    getLayout(mode, swatchColor).map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' }))
  );
  const prevMode = useRef(mode);
  const latestSwatch = useRef(swatchColor);
  latestSwatch.current = swatchColor; // always tracks the latest color
  const timers = useRef([]);

  useEffect(() => {
    if (mode === prevMode.current) return;

    const fromMode = prevMode.current;
    const enteringSwatch = mode === 'swatch';
    const leavingSwatch = fromMode === 'swatch';

    // Entering swatch: use enterColor (e.g. #ff0000) so the correct grid cell expands
    // Leaving swatch: use the current slider color so it shrinks to the right position
    const fromColor = leavingSwatch ? latestSwatch.current : swatchColor;
    const toColor = enteringSwatch ? (enterColor || swatchColor) : swatchColor;

    const fromLayout = getLayout(fromMode, fromColor);
    const toLayout = getLayout(mode, toColor);
    prevMode.current = mode;

    const { pairs, removed, added } = buildPairs(fromLayout, toLayout);
    const matchedKeys = new Set(pairs.map(p => p.key));
    const removedKeys = new Set(removed.map(c => c.id));
    const addedKeys = new Set(added.map(c => c.id));

    // Clear previous timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Step 1: Set start positions — matched + removed visible (z:2), new hidden (z:1)
    setCells([
      ...pairs.map(p => ({
        id: p.key, color: p.from.color, x: p.from.x, y: p.from.y, w: p.from.w, h: p.from.h,
        opacity: 1, z: 2, transition: 'none',
      })),
      ...removed.map(c => ({
        id: c.id, color: c.color, x: c.x, y: c.y, w: c.w, h: c.h,
        opacity: 1, z: 2, transition: 'none',
      })),
      ...added.map(c => ({
        id: c.id, color: c.color, x: c.x, y: c.y, w: c.w, h: c.h,
        opacity: 0, z: 1, transition: 'none',
      })),
    ]);

    // Step 2: After paint — matched tween to target, removed fade out
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const pairMap = new Map(pairs.map(p => [p.key, p.to]));

        setCells(prev => prev.map(cell => {
          if (matchedKeys.has(cell.id)) {
            const to = pairMap.get(cell.id);
            return { ...cell, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, transition: MOVE_TRANS };
          }
          if (removedKeys.has(cell.id)) {
            return { ...cell, opacity: 0, transition: FADEOUT_TRANS };
          }
          return cell; // added cells stay hidden
        }));

        // Step 3: New cells start fading in at 50% of matched cell tween
        const overlapMs = MOVE_TOTAL_MS * 0.7;
        timers.current.push(setTimeout(() => {
          setCells(prev => prev.map(cell => {
            if (addedKeys.has(cell.id)) {
              return { ...cell, opacity: 1, transition: staggeredFade(cell.color) };
            }
            return cell;
          }));

          // Clean up after stagger + fade completes
          const cleanupMs = (STAGGER_MAX + parseFloat(FADE_DUR) + 0.1) * 1000;
          timers.current.push(setTimeout(() => {
            setCells(toLayout.map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' })));
          }, cleanupMs));
        }, overlapMs));
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      timers.current.forEach(clearTimeout);
    };
  }, [mode]);

  // Reactively update swatch color when sliders change
  useEffect(() => {
    if (mode !== 'swatch' || !swatchColor) return;
    setCells(prev => prev.map(cell => ({
      ...cell,
      color: swatchColor,
    })));
  }, [swatchColor, mode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {cells.map(cell => (
        <div
          key={cell.id}
          style={{
            position: 'absolute',
            left: `${cell.x * 100}%`,
            top: `${cell.y * 100}%`,
            width: `${cell.w * 100}%`,
            height: `${cell.h * 100}%`,
            backgroundColor: cell.color,
            opacity: cell.opacity,
            zIndex: cell.z,
            transition: cell.transition,
          }}
        />
      ))}
    </div>
  );
}
